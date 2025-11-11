-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA - VERSÃO PGADMIN
-- Parte 6: SUBSÍDIOS → SOLICITAÇÕES DE BENEFÍCIO
-- ============================================================================
--
-- IMPORTANTE: Este script é otimizado para pgAdmin
-- Use COPY ao invés de \copy
--
-- Autor: Claude Code
-- Data: 2025-01-10
-- ============================================================================

-- ============================================================================
-- TABELAS DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.subsidios_gim CASCADE;
CREATE TABLE staging_gim.subsidios_gim (
    cod_subsidio BIGINT PRIMARY KEY,
    dt_liberacao TIMESTAMP,
    quantidade NUMERIC(10,2),
    valor NUMERIC(10,2),
    observacao TEXT,
    enquadramento VARCHAR(50),
    cod_produtor BIGINT,
    cod_programa BIGINT,
    situacao VARCHAR(30)
);

-- Tabela de mapeamento
DROP TABLE IF EXISTS staging_gim.map_subsidios CASCADE;
CREATE TABLE staging_gim.map_subsidios (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER NOT NULL,
    cod_produtor_gim BIGINT,
    produtor_id_sigma INTEGER,
    cod_programa_gim BIGINT,
    programa_id_sigma INTEGER,
    situacao_gim VARCHAR(30),
    status_sigma VARCHAR(30),
    migrado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- IMPORTAR CSV DO GIM
-- ============================================================================

-- OPÇÃO 1: Usar COPY (requer permissões de superusuário)
-- Descomente a linha abaixo e ajuste o caminho se necessário:

-- COPY staging_gim.subsidios_gim FROM 'C:\Users\marce\OneDrive\Desktop\subsidio.csv' DELIMITER ';' CSV HEADER ENCODING 'UTF8';

-- ============================================================================
-- OPÇÃO 2: IMPORTAR VIA INTERFACE DO PGADMIN (RECOMENDADO)
-- ============================================================================

/*
INSTRUÇÕES PARA IMPORTAR NO PGADMIN:

1. No pgAdmin, expanda a árvore até encontrar:
   Databases → sigma → Schemas → staging_gim → Tables → subsidios_gim

2. Clique com o botão direito em "subsidios_gim" → Import/Export Data

3. Configure a importação:
   ✓ Import/Export: Import
   ✓ Format: csv
   ✓ Filename: C:\Users\marce\OneDrive\Desktop\subsidio.csv
   ✓ Header: Yes (ON)
   ✓ Delimiter: ;
   ✓ Quote: "
   ✓ Escape: "
   ✓ Encoding: UTF8

4. Clique em OK

5. Aguarde a importação completar (pode levar 1-2 minutos para ~11.000 registros)

6. Continue executando o restante deste script
*/

-- ============================================================================
-- VERIFICAR IMPORTAÇÃO
-- ============================================================================

DO $$
DECLARE
    v_total_subsidios INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_subsidios FROM staging_gim.subsidios_gim;

    IF v_total_subsidios = 0 THEN
        RAISE EXCEPTION 'ATENÇÃO: Nenhum subsídio foi importado! Por favor, importe o CSV usando o pgAdmin (botão direito na tabela → Import/Export Data) antes de continuar.';
    ELSE
        RAISE NOTICE 'OK: % subsídios importados com sucesso!', v_total_subsidios;
    END IF;
END $$;

-- ============================================================================
-- ANÁLISE DOS DADOS IMPORTADOS
-- ============================================================================

DO $$
DECLARE
    v_total_subsidios INTEGER;
    v_entregue INTEGER;
    v_cancelado INTEGER;
    v_pendente INTEGER;
    v_valor_total NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_total_subsidios FROM staging_gim.subsidios_gim;
    SELECT COUNT(*) INTO v_entregue FROM staging_gim.subsidios_gim WHERE UPPER(TRIM(situacao)) = 'ENTREGUE';
    SELECT COUNT(*) INTO v_cancelado FROM staging_gim.subsidios_gim WHERE UPPER(TRIM(situacao)) = 'CANCELADO';
    SELECT COUNT(*) INTO v_pendente FROM staging_gim.subsidios_gim WHERE UPPER(TRIM(situacao)) = 'PENDENTE';
    SELECT COALESCE(SUM(valor), 0) INTO v_valor_total FROM staging_gim.subsidios_gim;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'ANÁLISE DOS SUBSÍDIOS IMPORTADOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de subsídios: %', v_total_subsidios;
    RAISE NOTICE 'ENTREGUE: %', v_entregue;
    RAISE NOTICE 'CANCELADO: %', v_cancelado;
    RAISE NOTICE 'PENDENTE: %', v_pendente;
    RAISE NOTICE 'Valor total: R$ %', v_valor_total;
    RAISE NOTICE '========================================';
END $$;

-- Ver distribuição por enquadramento
SELECT
    enquadramento,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total,
    AVG(valor) as valor_medio
FROM staging_gim.subsidios_gim
GROUP BY enquadramento
ORDER BY quantidade DESC;

-- Ver programas mais utilizados
SELECT
    cod_programa,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total
FROM staging_gim.subsidios_gim
GROUP BY cod_programa
ORDER BY quantidade DESC;

-- ============================================================================
-- FUNÇÃO PARA MAPEAR STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION mapear_status_subsidio(situacao_gim VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE
        WHEN UPPER(TRIM(situacao_gim)) = 'ENTREGUE' THEN 'aprovado'
        WHEN UPPER(TRIM(situacao_gim)) = 'CANCELADO' THEN 'cancelado'
        WHEN UPPER(TRIM(situacao_gim)) = 'PENDENTE' THEN 'pendente'
        ELSE 'pendente'  -- Default para valores não mapeados
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO PARA MAPEAR ENQUADRAMENTO PARA CÓDIGO DE PROGRAMA
-- ============================================================================

CREATE OR REPLACE FUNCTION mapear_enquadramento_programa(
    p_enquadramento VARCHAR,
    p_cod_programa_gim BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_programa_id INTEGER;
BEGIN
    -- Tentar buscar programa específico baseado no código do GIM
    v_programa_id := CASE p_cod_programa_gim
        WHEN 1 THEN (SELECT id FROM "Programa" WHERE nome ILIKE '%calcário%' OR nome ILIKE '%insumo%' LIMIT 1)
        WHEN 2 THEN (SELECT id FROM "Programa" WHERE nome ILIKE '%semente%' OR nome ILIKE '%muda%' LIMIT 1)
        WHEN 3 THEN (SELECT id FROM "Programa" WHERE nome ILIKE '%fertilizante%' OR nome ILIKE '%adubo%' LIMIT 1)
        ELSE NULL
    END;

    -- Se não encontrou por código, pegar qualquer programa de subsídio
    IF v_programa_id IS NULL THEN
        SELECT id INTO v_programa_id
        FROM "Programa"
        WHERE "tipoPrograma" = 'SUBSIDIO'
        LIMIT 1;
    END IF;

    RETURN v_programa_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GARANTIR QUE EXISTE PELO MENOS UM PROGRAMA
-- ============================================================================

DO $$
DECLARE
    v_programa_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_programa_count FROM "Programa";

    IF v_programa_count = 0 THEN
        RAISE NOTICE 'ATENÇÃO: Nenhum programa cadastrado. Criando programa padrão...';

        INSERT INTO "Programa" (
            nome,
            descricao,
            "tipoPrograma",
            secretaria,
            ativo,
            "createdAt",
            "updatedAt"
        ) VALUES
        ('Programa de Subsídio Agrícola - Migrado do GIM',
         'Programa genérico para migração de subsídios do sistema GIM',
         'SUBSIDIO',
         'AGRICULTURA',
         true,
         NOW(),
         NOW());

        RAISE NOTICE 'Programa padrão criado com sucesso!';
    END IF;
END $$;

-- ============================================================================
-- MIGRAR SUBSÍDIOS → SOLICITAÇÕES DE BENEFÍCIO
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    v_sem_produtor INTEGER := 0;
    v_sem_programa INTEGER := 0;
    rec RECORD;
    v_produtor_id INTEGER;
    v_programa_id INTEGER;
    v_status_sigma VARCHAR;
    v_solicitacao_id INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando migração de Subsídios...';

    FOR rec IN (
        SELECT * FROM staging_gim.subsidios_gim
        ORDER BY cod_subsidio
    ) LOOP
        BEGIN
            -- Buscar produtor no mapeamento
            v_produtor_id := NULL;
            IF rec.cod_produtor IS NOT NULL THEN
                SELECT id_sigma INTO v_produtor_id
                FROM staging_gim.map_pessoas
                WHERE id_gim = rec.cod_produtor;
            END IF;

            IF v_produtor_id IS NULL THEN
                v_sem_produtor := v_sem_produtor + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('SUBSIDIO_SEM_PRODUTOR', rec.cod_subsidio,
                        'Produtor não encontrado: ' || COALESCE(rec.cod_produtor::TEXT, 'NULL'));
                CONTINUE;
            END IF;

            -- Buscar programa
            v_programa_id := mapear_enquadramento_programa(rec.enquadramento, rec.cod_programa);

            IF v_programa_id IS NULL THEN
                v_sem_programa := v_sem_programa + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('SUBSIDIO_SEM_PROGRAMA', rec.cod_subsidio,
                        'Programa não encontrado para cod_programa: ' || rec.cod_programa);
                CONTINUE;
            END IF;

            -- Mapear status
            v_status_sigma := mapear_status_subsidio(rec.situacao);

            -- Inserir solicitação de benefício
            INSERT INTO "SolicitacaoBeneficio" (
                "pessoaId",
                "programaId",
                "datasolicitacao",
                status,
                observacoes,
                "valorCalculado",
                "quantidadeSolicitada",
                "createdAt",
                "updatedAt"
            ) VALUES (
                v_produtor_id,
                v_programa_id,
                COALESCE(rec.dt_liberacao::DATE, NOW()::DATE),
                v_status_sigma,
                CASE
                    WHEN rec.observacao IS NOT NULL AND TRIM(rec.observacao) != '' THEN
                        'Enquadramento: ' || COALESCE(rec.enquadramento, 'N/A') || E'\n' ||
                        'Observação: ' || rec.observacao
                    ELSE
                        'Enquadramento: ' || COALESCE(rec.enquadramento, 'N/A')
                END,
                rec.valor,
                rec.quantidade,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_solicitacao_id;

            -- Registrar mapeamento
            INSERT INTO staging_gim.map_subsidios (
                id_gim,
                id_sigma,
                cod_produtor_gim,
                produtor_id_sigma,
                cod_programa_gim,
                programa_id_sigma,
                situacao_gim,
                status_sigma
            ) VALUES (
                rec.cod_subsidio,
                v_solicitacao_id,
                rec.cod_produtor,
                v_produtor_id,
                rec.cod_programa,
                v_programa_id,
                rec.situacao,
                v_status_sigma
            );

            v_count := v_count + 1;

            -- Log de progresso a cada 1000 registros
            IF v_count % 1000 = 0 THEN
                RAISE NOTICE 'Processados % subsídios...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('SUBSIDIO', rec.cod_subsidio, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Subsídios migrados: %', v_count;
    RAISE NOTICE 'Sem produtor: %', v_sem_produtor;
    RAISE NOTICE 'Sem programa: %', v_sem_programa;
    RAISE NOTICE 'Outros erros: %', v_errors;
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_subsidios INTEGER;
    v_subsidios_aprovados INTEGER;
    v_subsidios_cancelados INTEGER;
    v_subsidios_pendentes INTEGER;
    v_valor_total NUMERIC;
    v_valor_aprovado NUMERIC;
    v_total_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_subsidios FROM staging_gim.map_subsidios;
    SELECT COUNT(*) INTO v_subsidios_aprovados FROM "SolicitacaoBeneficio" WHERE status = 'aprovado';
    SELECT COUNT(*) INTO v_subsidios_cancelados FROM "SolicitacaoBeneficio" WHERE status = 'cancelado';
    SELECT COUNT(*) INTO v_subsidios_pendentes FROM "SolicitacaoBeneficio" WHERE status = 'pendente';
    SELECT COALESCE(SUM("valorCalculado"), 0) INTO v_valor_total FROM "SolicitacaoBeneficio";
    SELECT COALESCE(SUM("valorCalculado"), 0) INTO v_valor_aprovado FROM "SolicitacaoBeneficio" WHERE status = 'aprovado';
    SELECT COUNT(*) INTO v_total_erros FROM staging_gim.log_erros WHERE etapa LIKE 'SUBSIDIO%';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE SUBSÍDIOS CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de subsídios migrados: %', v_total_subsidios;
    RAISE NOTICE '  - Aprovados: %', v_subsidios_aprovados;
    RAISE NOTICE '  - Cancelados: %', v_subsidios_cancelados;
    RAISE NOTICE '  - Pendentes: %', v_subsidios_pendentes;
    RAISE NOTICE 'Valor total: R$ %', v_valor_total;
    RAISE NOTICE 'Valor aprovado: R$ %', v_valor_aprovado;
    RAISE NOTICE 'Total de erros: %', v_total_erros;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Ver subsídios por status
SELECT
    status,
    COUNT(*) as quantidade,
    SUM("valorCalculado") as valor_total,
    AVG("valorCalculado") as valor_medio
FROM "SolicitacaoBeneficio"
GROUP BY status
ORDER BY quantidade DESC;

-- Ver maiores beneficiários
SELECT
    p.nome,
    p."cpfCnpj",
    COUNT(sb.id) as qtd_subsidios,
    SUM(sb."valorCalculado") as valor_total
FROM "SolicitacaoBeneficio" sb
INNER JOIN "Pessoa" p ON p.id = sb."pessoaId"
GROUP BY p.id, p.nome, p."cpfCnpj"
ORDER BY valor_total DESC
LIMIT 30;

-- Comparar totais GIM vs SIGMA
SELECT
    'GIM' as origem,
    COUNT(*) as total_subsidios,
    SUM(valor) as valor_total,
    COUNT(CASE WHEN UPPER(TRIM(situacao)) = 'ENTREGUE' THEN 1 END) as aprovados,
    COUNT(CASE WHEN UPPER(TRIM(situacao)) = 'CANCELADO' THEN 1 END) as cancelados,
    COUNT(CASE WHEN UPPER(TRIM(situacao)) = 'PENDENTE' THEN 1 END) as pendentes
FROM staging_gim.subsidios_gim
UNION ALL
SELECT
    'SIGMA' as origem,
    COUNT(*) as total_subsidios,
    SUM("valorCalculado") as valor_total,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes
FROM "SolicitacaoBeneficio";

-- Ver erros detalhados
SELECT
    etapa,
    COUNT(*) as quantidade
FROM staging_gim.log_erros
WHERE etapa LIKE 'SUBSIDIO%'
GROUP BY etapa
ORDER BY quantidade DESC;

-- Ver exemplos de subsídios migrados
SELECT
    sb.id,
    p.nome as produtor,
    pg.nome as programa,
    sb."datasolicitacao",
    sb.status,
    sb."valorCalculado",
    sb."quantidadeSolicitada",
    LEFT(sb.observacoes, 50) as observacao_resumida
FROM "SolicitacaoBeneficio" sb
INNER JOIN "Pessoa" p ON p.id = sb."pessoaId"
INNER JOIN "Programa" pg ON pg.id = sb."programaId"
ORDER BY sb.id
LIMIT 20;

-- Ver estatísticas por ano
SELECT
    EXTRACT(YEAR FROM "datasolicitacao") as ano,
    status,
    COUNT(*) as quantidade,
    SUM("valorCalculado") as valor_total
FROM "SolicitacaoBeneficio"
GROUP BY EXTRACT(YEAR FROM "datasolicitacao"), status
ORDER BY ano, status;
