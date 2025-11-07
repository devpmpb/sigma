-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 4: SUBSÍDIOS → SOLICITAÇÕES DE BENEFÍCIO
-- ============================================================================
--
-- ⚠️ IMPORTANTE: ESTE É UM TEMPLATE!
-- Você precisa completar amanhã com os valores de STATUS da tabela Subsidio
--
-- PENDENTE:
-- 1. Mapear valores de `situacao` do GIM para `status` do SIGMA
-- 2. Verificar se há tabela Programa no GIM para migrar
-- 3. Decidir se migra tabela Autorizacao separadamente
--
-- Autor: Claude Code
-- Data: 2025-01-06
-- ============================================================================

-- ============================================================================
-- TABELAS DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.subsidios_gim_completo CASCADE;
CREATE TABLE staging_gim.subsidios_gim_completo (
    cod_subsidio BIGINT PRIMARY KEY,
    cod_produtor BIGINT,
    cod_programa BIGINT,
    dt_liberacao DATE,
    quantidade NUMERIC(10,2),
    valor NUMERIC(10,2),
    situacao VARCHAR(30),         -- ⚠️ VERIFICAR VALORES POSSÍVEIS AMANHÃ
    enquadramento VARCHAR(20),    -- 'P' (pequeno) ou 'G' (grande)
    observacao VARCHAR(255)
);

-- Tabela de programas (se existir no GIM)
DROP TABLE IF EXISTS staging_gim.programas_gim CASCADE;
CREATE TABLE staging_gim.programas_gim (
    cod_programa BIGINT PRIMARY KEY,
    nome VARCHAR(200),
    descricao VARCHAR(255),
    lei_numero VARCHAR(50)
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
    migrado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INSTRUÇÕES PARA CARREGAR DADOS
-- ============================================================================

/*
⚠️ EXECUTAR AMANHÃ NO BANCO GIM:

-- 1. Ver valores possíveis de situacao
SELECT DISTINCT situacao, COUNT(*)
FROM Subsidio
GROUP BY situacao
ORDER BY COUNT(*) DESC;

-- 2. Exportar subsídios
SELECT
    codSubsidio as cod_subsidio,
    codProdutor as cod_produtor,
    codPrograma as cod_programa,
    dtLiberacao as dt_liberacao,
    quantidade,
    valor,
    situacao,
    enquadramento,
    observacao
FROM Subsidio;

-- Salvar como: subsidios_gim_completo.csv

-- 3. Exportar programas (se existir)
SELECT
    codPrograma as cod_programa,
    nome,
    descricao,
    leiNumero as lei_numero
FROM Programa;

-- Salvar como: programas_gim.csv

-- 4. Importar no PostgreSQL:
\copy staging_gim.subsidios_gim_completo FROM '/path/subsidios_gim_completo.csv' DELIMITER ',' CSV HEADER;
\copy staging_gim.programas_gim FROM '/path/programas_gim.csv' DELIMITER ',' CSV HEADER;
*/

-- ============================================================================
-- PASSO 1: MIGRAR PROGRAMAS (se necessário)
-- ============================================================================

/*
⚠️ DECISÃO NECESSÁRIA:
- Se GIM tem tabela Programa, migrar para SIGMA
- Se GIM não tem, criar programas manualmente no SIGMA antes

DO $$
DECLARE
    v_count INTEGER := 0;
    rec RECORD;
BEGIN
    RAISE NOTICE 'Migrando Programas...';

    FOR rec IN (
        SELECT * FROM staging_gim.programas_gim
    ) LOOP
        BEGIN
            INSERT INTO "Programa" (
                nome,
                descricao,
                "leiNumero",
                "tipoPrograma",
                secretaria,
                ativo,
                "createdAt",
                "updatedAt"
            ) VALUES (
                rec.nome,
                rec.descricao,
                rec.lei_numero,
                'SUBSIDIO',  -- ⚠️ Ajustar se necessário
                'AGRICULTURA',  -- ⚠️ Ajustar conforme programa
                TRUE,
                NOW(),
                NOW()
            )
            ON CONFLICT (nome) DO NOTHING;  -- ⚠️ Requer unique constraint

            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;

    RAISE NOTICE 'Programas migrados: %', v_count;
END $$;
*/

-- ============================================================================
-- PASSO 2: MAPEAR STATUS (⚠️ COMPLETAR AMANHÃ)
-- ============================================================================

/*
⚠️ COMPLETAR APÓS VER VALORES DISTINTOS DE `situacao`

Exemplo de mapeamento:
GIM                    → SIGMA
'LIBERADO'            → 'aprovado'
'APROVADO'            → 'aprovado'
'CANCELADO'           → 'cancelado'
'PENDENTE'            → 'pendente'
'EM ANÁLISE'          → 'em_analise'
'REPROVADO'           → 'reprovado'

Ajustar a função abaixo:
*/

CREATE OR REPLACE FUNCTION mapear_status_subsidio(situacao_gim VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    -- ⚠️ COMPLETAR AMANHÃ COM VALORES REAIS
    RETURN CASE
        WHEN UPPER(TRIM(situacao_gim)) = 'LIBERADO' THEN 'aprovado'
        WHEN UPPER(TRIM(situacao_gim)) = 'CANCELADO' THEN 'cancelado'
        WHEN UPPER(TRIM(situacao_gim)) = 'PENDENTE' THEN 'pendente'
        -- ⚠️ ADICIONAR MAIS CASOS
        ELSE 'pendente'  -- Default
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASSO 3: MIGRAR SUBSÍDIOS → SOLICITAÇÕES DE BENEFÍCIO
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_produtor_id INTEGER;
    v_programa_id INTEGER;
    v_status_sigma VARCHAR;
    v_solicitacao_id INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando migração de Subsídios...';

    FOR rec IN (
        SELECT * FROM staging_gim.subsidios_gim_completo
        WHERE cod_produtor IS NOT NULL
    ) LOOP
        BEGIN
            -- Buscar produtor no mapeamento
            SELECT id_sigma INTO v_produtor_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_produtor;

            IF v_produtor_id IS NULL THEN
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('SUBSIDIO_SEM_PRODUTOR', rec.cod_subsidio,
                        'Produtor não encontrado: ' || rec.cod_produtor);
                CONTINUE;
            END IF;

            -- Buscar programa
            -- ⚠️ AJUSTAR LÓGICA CONFORME SUA ESTRUTURA
            SELECT id INTO v_programa_id
            FROM "Programa"
            LIMIT 1;  -- ⚠️ TEMPORÁRIO - ajustar mapeamento

            IF v_programa_id IS NULL THEN
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('SUBSIDIO_SEM_PROGRAMA', rec.cod_subsidio, 'Programa não encontrado');
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
                enquadramento,  -- ⚠️ NOVO CAMPO
                "createdAt",
                "updatedAt"
            ) VALUES (
                v_produtor_id,
                v_programa_id,
                COALESCE(rec.dt_liberacao, NOW()),
                v_status_sigma,
                rec.observacao,
                rec.valor,
                rec.quantidade,
                rec.enquadramento,  -- 'P' ou 'G'
                NOW(),
                NOW()
            )
            RETURNING id INTO v_solicitacao_id;

            -- Mapear subsídio
            INSERT INTO staging_gim.map_subsidios (
                id_gim,
                id_sigma,
                cod_produtor_gim,
                produtor_id_sigma,
                cod_programa_gim,
                programa_id_sigma
            ) VALUES (
                rec.cod_subsidio,
                v_solicitacao_id,
                rec.cod_produtor,
                v_produtor_id,
                rec.cod_programa,
                v_programa_id
            );

            v_count := v_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('SUBSIDIO', rec.cod_subsidio, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Subsídios migrados: %, Erros: %', v_count, v_errors;
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_subsidios INTEGER;
    v_subsidios_aprovados INTEGER;
    v_subsidios_cancelados INTEGER;
    v_valor_total NUMERIC;
    v_total_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_subsidios FROM staging_gim.map_subsidios;
    SELECT COUNT(*) INTO v_subsidios_aprovados FROM "SolicitacaoBeneficio" WHERE status = 'aprovado';
    SELECT COUNT(*) INTO v_subsidios_cancelados FROM "SolicitacaoBeneficio" WHERE status = 'cancelado';
    SELECT COALESCE(SUM("valorCalculado"), 0) INTO v_valor_total FROM "SolicitacaoBeneficio";
    SELECT COUNT(*) INTO v_total_erros FROM staging_gim.log_erros WHERE etapa LIKE 'SUBSIDIO%';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE SUBSÍDIOS CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de subsídios migrados: %', v_total_subsidios;
    RAISE NOTICE 'Aprovados: %', v_subsidios_aprovados;
    RAISE NOTICE 'Cancelados: %', v_subsidios_cancelados;
    RAISE NOTICE 'Valor total: R$ %', v_valor_total;
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
    SUM("valorCalculado") as valor_total
FROM "SolicitacaoBeneficio"
GROUP BY status
ORDER BY quantidade DESC;

-- Ver subsídios por enquadramento (P/G)
SELECT
    enquadramento,
    COUNT(*) as quantidade,
    AVG("valorCalculado") as valor_medio,
    SUM("valorCalculado") as valor_total
FROM "SolicitacaoBeneficio"
WHERE enquadramento IS NOT NULL
GROUP BY enquadramento;

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

-- Comparar totais
SELECT
    'GIM' as origem,
    COUNT(*) as total_subsidios,
    SUM(valor) as valor_total
FROM staging_gim.subsidios_gim_completo
UNION ALL
SELECT
    'SIGMA' as origem,
    COUNT(*) as total_subsidios,
    SUM("valorCalculado") as valor_total
FROM "SolicitacaoBeneficio";

-- ============================================================================
-- ⚠️ TAREFAS PENDENTES PARA AMANHÃ
-- ============================================================================

/*
[ ] 1. Executar no GIM: SELECT DISTINCT situacao FROM Subsidio
[ ] 2. Completar função mapear_status_subsidio() com valores reais
[ ] 3. Verificar se existe tabela Programa no GIM
[ ] 4. Decidir se migra Autorizacao separadamente
[ ] 5. Testar script com dados reais
[ ] 6. Validar totais
*/
