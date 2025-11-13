-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- TELEFONES + SUBSÍDIOS - VERSÃO SIMPLES (MESMO MÉTODO DAS MIGRAÇÕES ANTERIORES)
-- ============================================================================
--
-- ARQUIVOS NECESSÁRIOS:
-- - C:\Users\marce\OneDrive\Desktop\telefone.csv
-- - C:\Users\marce\OneDrive\Desktop\subsidio.csv
--
-- COMO EXECUTAR:
-- 1. Abra o pgAdmin
-- 2. Tools → Query Tool
-- 3. Cole este script COMPLETO
-- 4. Execute (F5)
--
-- Autor: Claude Code
-- Data: 2025-01-10
-- ============================================================================

-- ============================================================================
-- PASSO 1: CRIAR TABELAS DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.telefones_gim CASCADE;
CREATE TABLE staging_gim.telefones_gim (
    cod_telefone BIGINT,
    cod_pessoa BIGINT,
    ddd VARCHAR(3),
    numero VARCHAR(20),
    ramal VARCHAR(10),
    tipo VARCHAR(20)
);

DROP TABLE IF EXISTS staging_gim.subsidios_gim CASCADE;
CREATE TABLE staging_gim.subsidios_gim (
    cod_subsidio BIGINT,
    dt_liberacao TIMESTAMP,
    quantidade VARCHAR(20),  -- Temporariamente VARCHAR para aceitar vírgulas
    valor VARCHAR(20),        -- Temporariamente VARCHAR para aceitar vírgulas
    observacao TEXT,
    enquadramento VARCHAR(50),
    cod_produtor BIGINT,
    cod_programa BIGINT,
    situacao VARCHAR(30)
);

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
-- PASSO 2: IMPORTAR CSVs
-- ============================================================================

-- Importar telefone.csv
COPY staging_gim.telefones_gim
FROM 'C:\Users\marce\OneDrive\Desktop\telefone.csv'
WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8');

-- Importar subsidio.csv
COPY staging_gim.subsidios_gim
FROM 'C:\Users\marce\OneDrive\Desktop\subsidio.csv'
WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8');

-- Verificar importação
DO $$
DECLARE
    v_total_telefones INTEGER;
    v_total_subsidios INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_telefones FROM staging_gim.telefones_gim;
    SELECT COUNT(*) INTO v_total_subsidios FROM staging_gim.subsidios_gim;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTAÇÃO CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Telefones importados: %', v_total_telefones;
    RAISE NOTICE 'Subsídios importados: %', v_total_subsidios;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 3: CRIAR FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para formatar telefone (apenas número com DDD, sem tipo)
CREATE OR REPLACE FUNCTION formatar_telefone_gim(
    p_ddd VARCHAR,
    p_numero VARCHAR,
    p_ramal VARCHAR,
    p_tipo VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_resultado VARCHAR := '';
    v_ddd VARCHAR := TRIM(COALESCE(p_ddd, ''));
    v_numero VARCHAR := REGEXP_REPLACE(TRIM(COALESCE(p_numero, '')), '[^0-9]', '', 'g');
    v_ramal VARCHAR := TRIM(COALESCE(p_ramal, ''));
BEGIN
    IF v_numero = '' THEN RETURN NULL; END IF;

    -- Formata: (DDD) NUMERO ou apenas NUMERO
    IF v_ddd != '' THEN
        v_resultado := '(' || v_ddd || ') ' || v_numero;
    ELSE
        v_resultado := v_numero;
    END IF;

    -- Adiciona ramal se existir
    IF v_ramal != '' THEN
        v_resultado := v_resultado || ' ramal ' || v_ramal;
    END IF;

    -- NÃO adiciona tipo (Celular, Comercial, etc) - apenas o número

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Função para obter telefone principal (prioridade: Celular > Residencial > Comercial)
CREATE OR REPLACE FUNCTION consolidar_telefones_pessoa(p_cod_pessoa BIGINT)
RETURNS VARCHAR AS $$
DECLARE
    v_telefone_principal VARCHAR;
BEGIN
    -- Busca apenas o primeiro telefone pela ordem de prioridade
    SELECT formatar_telefone_gim(ddd, numero, ramal, tipo)
    INTO v_telefone_principal
    FROM staging_gim.telefones_gim
    WHERE cod_pessoa = p_cod_pessoa
      AND numero IS NOT NULL
      AND TRIM(numero) != ''
    ORDER BY
        CASE tipo
            WHEN 'Celular' THEN 1
            WHEN 'Residencial' THEN 2
            WHEN 'Comercial' THEN 3
            ELSE 4
        END,
        cod_telefone
    LIMIT 1;  -- Retorna apenas o telefone principal

    RETURN v_telefone_principal;
END;
$$ LANGUAGE plpgsql;

-- Função para mapear status de subsídio
CREATE OR REPLACE FUNCTION mapear_status_subsidio(situacao_gim VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE
        WHEN UPPER(TRIM(situacao_gim)) = 'ENTREGUE' THEN 'aprovado'
        WHEN UPPER(TRIM(situacao_gim)) = 'CANCELADO' THEN 'cancelado'
        WHEN UPPER(TRIM(situacao_gim)) = 'PENDENTE' THEN 'pendente'
        ELSE 'pendente'
    END;
END;
$$ LANGUAGE plpgsql;

-- Função para mapear programa
CREATE OR REPLACE FUNCTION mapear_enquadramento_programa(
    p_enquadramento VARCHAR,
    p_cod_programa_gim BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_programa_id INTEGER;
BEGIN
    v_programa_id := CASE p_cod_programa_gim
        WHEN 1 THEN (SELECT id FROM "Programa" WHERE nome ILIKE '%calcário%' OR nome ILIKE '%insumo%' LIMIT 1)
        WHEN 2 THEN (SELECT id FROM "Programa" WHERE nome ILIKE '%semente%' OR nome ILIKE '%muda%' LIMIT 1)
        WHEN 3 THEN (SELECT id FROM "Programa" WHERE nome ILIKE '%fertilizante%' OR nome ILIKE '%adubo%' LIMIT 1)
        ELSE NULL
    END;

    IF v_programa_id IS NULL THEN
        SELECT id INTO v_programa_id
        FROM "Programa"
        WHERE "tipoPrograma" = 'SUBSIDIO'
        LIMIT 1;
    END IF;

    RETURN v_programa_id;
END;
$$ LANGUAGE plpgsql;

-- Função para converter vírgula em ponto (formato brasileiro → PostgreSQL)
CREATE OR REPLACE FUNCTION converter_decimal_br(valor_texto VARCHAR)
RETURNS NUMERIC AS $$
BEGIN
    -- Substitui vírgula por ponto e converte para NUMERIC
    RETURN REPLACE(COALESCE(valor_texto, '0'), ',', '.')::NUMERIC;
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASSO 4: GARANTIR QUE EXISTE PROGRAMA
-- ============================================================================

DO $$
DECLARE
    v_programa_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_programa_count FROM "Programa";

    IF v_programa_count = 0 THEN
        RAISE NOTICE 'Criando programa padrão...';

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

        RAISE NOTICE 'Programa padrão criado!';
    END IF;
END $$;

-- ============================================================================
-- PASSO 5: MIGRAR TELEFONES
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_pessoa_id_sigma INTEGER;
    v_telefones_consolidados VARCHAR;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRANDO TELEFONES';
    RAISE NOTICE '========================================';

    FOR rec IN (
        SELECT DISTINCT cod_pessoa
        FROM staging_gim.telefones_gim
        WHERE cod_pessoa IS NOT NULL
    ) LOOP
        BEGIN
            SELECT id_sigma INTO v_pessoa_id_sigma
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_pessoa;

            IF v_pessoa_id_sigma IS NULL THEN
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('TELEFONE_PESSOA_NAO_ENCONTRADA', rec.cod_pessoa,
                        'Pessoa não encontrada no mapeamento');
                v_errors := v_errors + 1;
                CONTINUE;
            END IF;

            v_telefones_consolidados := consolidar_telefones_pessoa(rec.cod_pessoa);

            IF v_telefones_consolidados IS NOT NULL THEN
                UPDATE "Pessoa"
                SET telefone = v_telefones_consolidados,
                    "updatedAt" = NOW()
                WHERE id = v_pessoa_id_sigma;

                v_count := v_count + 1;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('TELEFONE', rec.cod_pessoa, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Telefones atualizados: %', v_count;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- PASSO 6: MIGRAR SUBSÍDIOS
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
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRANDO SUBSÍDIOS';
    RAISE NOTICE '========================================';

    FOR rec IN (
        SELECT * FROM staging_gim.subsidios_gim
        ORDER BY cod_subsidio
    ) LOOP
        BEGIN
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

            v_programa_id := mapear_enquadramento_programa(rec.enquadramento, rec.cod_programa);

            IF v_programa_id IS NULL THEN
                v_sem_programa := v_sem_programa + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('SUBSIDIO_SEM_PROGRAMA', rec.cod_subsidio,
                        'Programa não encontrado para cod_programa: ' || rec.cod_programa);
                CONTINUE;
            END IF;

            v_status_sigma := mapear_status_subsidio(rec.situacao);

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
                converter_decimal_br(rec.valor),        -- Converte vírgula para ponto
                converter_decimal_br(rec.quantidade),   -- Converte vírgula para ponto
                NOW(),
                NOW()
            )
            RETURNING id INTO v_solicitacao_id;

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
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_pessoas_com_tel INTEGER;
    v_total_telefones_gim INTEGER;
    v_erros_telefone INTEGER;
    v_total_subsidios INTEGER;
    v_subsidios_aprovados INTEGER;
    v_subsidios_cancelados INTEGER;
    v_subsidios_pendentes INTEGER;
    v_valor_total NUMERIC;
    v_valor_aprovado NUMERIC;
    v_erros_subsidio INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_telefones_gim FROM staging_gim.telefones_gim;
    SELECT COUNT(*) INTO v_pessoas_com_tel FROM "Pessoa" WHERE telefone IS NOT NULL AND telefone != '';
    SELECT COUNT(*) INTO v_erros_telefone FROM staging_gim.log_erros WHERE etapa LIKE 'TELEFONE%';

    SELECT COUNT(*) INTO v_total_subsidios FROM staging_gim.map_subsidios;
    SELECT COUNT(*) INTO v_subsidios_aprovados FROM "SolicitacaoBeneficio" WHERE status = 'aprovado';
    SELECT COUNT(*) INTO v_subsidios_cancelados FROM "SolicitacaoBeneficio" WHERE status = 'cancelado';
    SELECT COUNT(*) INTO v_subsidios_pendentes FROM "SolicitacaoBeneficio" WHERE status = 'pendente';
    SELECT COALESCE(SUM("valorCalculado"), 0) INTO v_valor_total FROM "SolicitacaoBeneficio";
    SELECT COALESCE(SUM("valorCalculado"), 0) INTO v_valor_aprovado FROM "SolicitacaoBeneficio" WHERE status = 'aprovado';
    SELECT COUNT(*) INTO v_erros_subsidio FROM staging_gim.log_erros WHERE etapa LIKE 'SUBSIDIO%';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO FINAL DA MIGRAÇÃO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'TELEFONES:';
    RAISE NOTICE '  Total no GIM: %', v_total_telefones_gim;
    RAISE NOTICE '  Pessoas com telefone no SIGMA: %', v_pessoas_com_tel;
    RAISE NOTICE '  Erros: %', v_erros_telefone;
    RAISE NOTICE '';
    RAISE NOTICE 'SUBSÍDIOS:';
    RAISE NOTICE '  Total migrados: %', v_total_subsidios;
    RAISE NOTICE '    - Aprovados: %', v_subsidios_aprovados;
    RAISE NOTICE '    - Cancelados: %', v_subsidios_cancelados;
    RAISE NOTICE '    - Pendentes: %', v_subsidios_pendentes;
    RAISE NOTICE '  Valor total: R$ %', v_valor_total;
    RAISE NOTICE '  Valor aprovado: R$ %', v_valor_aprovado;
    RAISE NOTICE '  Erros: %', v_erros_subsidio;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';

    IF v_erros_telefone > 0 OR v_erros_subsidio > 0 THEN
        RAISE NOTICE 'Para ver detalhes dos erros, execute:';
        RAISE NOTICE 'SELECT * FROM staging_gim.log_erros;';
    ELSE
        RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO (OPCIONAL - EXECUTAR DEPOIS)
-- ============================================================================

/*
-- Ver telefones migrados
SELECT id, nome, telefone
FROM "Pessoa"
WHERE telefone IS NOT NULL
LIMIT 20;

-- Ver subsídios por status
SELECT
    status,
    COUNT(*) as quantidade,
    SUM("valorCalculado") as valor_total
FROM "SolicitacaoBeneficio"
GROUP BY status;

-- Ver maiores beneficiários
SELECT
    p.nome,
    COUNT(sb.id) as qtd_subsidios,
    SUM(sb."valorCalculado") as valor_total
FROM "SolicitacaoBeneficio" sb
INNER JOIN "Pessoa" p ON p.id = sb."pessoaId"
GROUP BY p.id, p.nome
ORDER BY valor_total DESC
LIMIT 30;

-- Comparar GIM vs SIGMA
SELECT
    'GIM' as origem,
    COUNT(*) as total,
    SUM(valor) as valor_total
FROM staging_gim.subsidios_gim
UNION ALL
SELECT
    'SIGMA',
    COUNT(*),
    SUM("valorCalculado")
FROM "SolicitacaoBeneficio";
*/
