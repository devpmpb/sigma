-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 3: TRANSFERÊNCIAS DE PROPRIEDADE
-- ============================================================================
--
-- IMPORTANTE:
-- 1. Execute APÓS a migração de Pessoas e Propriedades
-- 2. Requer staging_gim.map_pessoas e staging_gim.map_propriedades populadas
-- 3. Usa os arquivos CSV:
--    - movimentotransferencia.csv
--    - movimentosituacao.csv
--
-- LÓGICA:
-- - Cruza dados de transferência com movimentos de situação
-- - Para cada transferência, busca a situação da propriedade na data
-- - Se não encontrar situação, assume PRÓPRIA como padrão
--
-- Autor: Claude Code
-- Data: 2025-01-17
-- ============================================================================

-- ============================================================================
-- TABELAS DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.transferencias_gim CASCADE;
CREATE TABLE staging_gim.transferencias_gim (
    cod_movimento_transferencia BIGINT PRIMARY KEY,
    cod_propriedade BIGINT,
    cod_proprietario BIGINT,          -- Proprietário anterior
    cod_novo_proprietario BIGINT,      -- Novo proprietário
    data TIMESTAMP,
    motivo TEXT,
    responsavel VARCHAR(100)
);

DROP TABLE IF EXISTS staging_gim.movimentos_situacao_gim CASCADE;
CREATE TABLE staging_gim.movimentos_situacao_gim (
    cod_movimento_situacao BIGINT PRIMARY KEY,
    cod_propriedade BIGINT,
    data TIMESTAMP,
    de VARCHAR(50),                    -- Situação anterior (PRÓPRIA, CONDOMÍNIO, USUFRUTO)
    para VARCHAR(50),                  -- Nova situação
    tipo VARCHAR(20),                  -- AUTOMÁTICO ou MANUAL
    motivo TEXT,
    responsavel VARCHAR(100)
);

-- ============================================================================
-- INSTRUÇÕES PARA CARREGAR DADOS
-- ============================================================================

/*
Carregar os CSVs no PostgreSQL:

1. No pgAdmin, clique com botão direito na tabela → Import/Export
2. Ou execute via COPY:

COPY staging_gim.transferencias_gim(
    cod_movimento_transferencia,
    cod_propriedade,
    cod_proprietario,
    cod_novo_proprietario,
    data,
    motivo,
    responsavel
)
FROM 'C:/csvs/movimentotransferencia.csv'
DELIMITER ';'
CSV HEADER
ENCODING 'UTF8';

COPY staging_gim.movimentos_situacao_gim(
    cod_movimento_situacao,
    cod_propriedade,
    data,
    de,
    para,
    tipo,
    motivo,
    responsavel
)
FROM 'C:/csvs/movimentosituacao.csv'
DELIMITER ';'
CSV HEADER
ENCODING 'UTF8';
*/

-- ============================================================================
-- FUNÇÃO AUXILIAR: Buscar situação da propriedade após transferência
-- ============================================================================

CREATE OR REPLACE FUNCTION staging_gim.buscar_situacao_pos_transferencia(
    p_cod_propriedade BIGINT,
    p_data_transferencia TIMESTAMP
) RETURNS "SituacaoPropriedade" AS $$
DECLARE
    v_situacao TEXT;
BEGIN
    -- Buscar último movimento de situação <= data da transferência
    SELECT UPPER(TRIM(para))
    INTO v_situacao
    FROM staging_gim.movimentos_situacao_gim
    WHERE cod_propriedade = p_cod_propriedade
      AND data <= p_data_transferencia
    ORDER BY data DESC, cod_movimento_situacao DESC
    LIMIT 1;

    -- Converter para ENUM
    IF v_situacao IS NULL THEN
        RETURN 'PROPRIA'::"SituacaoPropriedade";
    ELSIF v_situacao LIKE '%CONDOM%' THEN
        RETURN 'CONDOMINIO'::"SituacaoPropriedade";
    ELSIF v_situacao LIKE '%USUFRUTO%' THEN
        RETURN 'USUFRUTO'::"SituacaoPropriedade";
    ELSE
        RETURN 'PROPRIA'::"SituacaoPropriedade";
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASSO 1: MIGRAR TRANSFERÊNCIAS DE PROPRIEDADE
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_ignorados INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_propriedade_id INTEGER;
    v_proprietario_anterior_id INTEGER;
    v_proprietario_novo_id INTEGER;
    v_situacao_propriedade "SituacaoPropriedade";
    v_data_transferencia DATE;
    v_observacoes TEXT;
BEGIN
    RAISE NOTICE 'Iniciando migração de Transferências de Propriedade...';
    RAISE NOTICE '';

    FOR rec IN (
        SELECT
            t.cod_movimento_transferencia,
            t.cod_propriedade,
            t.cod_proprietario,
            t.cod_novo_proprietario,
            t.data,
            t.motivo,
            t.responsavel
        FROM staging_gim.transferencias_gim t
        WHERE t.cod_propriedade IS NOT NULL
          AND t.cod_proprietario IS NOT NULL
          AND t.cod_novo_proprietario IS NOT NULL
        ORDER BY t.data ASC, t.cod_movimento_transferencia ASC
    ) LOOP
        BEGIN
            -- Mapear IDs (GIM → SIGMA)
            SELECT id_sigma INTO v_propriedade_id
            FROM staging_gim.map_propriedades
            WHERE id_gim = rec.cod_propriedade;

            SELECT id_sigma INTO v_proprietario_anterior_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_proprietario;

            SELECT id_sigma INTO v_proprietario_novo_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_novo_proprietario;

            -- Verificar se todos os IDs foram encontrados
            IF v_propriedade_id IS NULL OR
               v_proprietario_anterior_id IS NULL OR
               v_proprietario_novo_id IS NULL THEN

                v_ignorados := v_ignorados + 1;

                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES (
                    'TRANSFERENCIA_IDS_NAO_ENCONTRADOS',
                    rec.cod_movimento_transferencia,
                    FORMAT(
                        'Propriedade GIM=%s→SIGMA=%s, PropAnt GIM=%s→SIGMA=%s, PropNovo GIM=%s→SIGMA=%s',
                        rec.cod_propriedade, COALESCE(v_propriedade_id::TEXT, 'NULL'),
                        rec.cod_proprietario, COALESCE(v_proprietario_anterior_id::TEXT, 'NULL'),
                        rec.cod_novo_proprietario, COALESCE(v_proprietario_novo_id::TEXT, 'NULL')
                    )
                );

                CONTINUE;
            END IF;

            -- Converter data
            v_data_transferencia := rec.data::DATE;

            -- Buscar situação da propriedade após transferência
            v_situacao_propriedade := staging_gim.buscar_situacao_pos_transferencia(
                rec.cod_propriedade,
                rec.data
            );

            -- Montar observações
            v_observacoes := FORMAT(
                '[GIM #%s] %s%sResponsável: %s',
                rec.cod_movimento_transferencia,
                COALESCE(rec.motivo, 'Sem motivo registrado'),
                E'\n',
                COALESCE(rec.responsavel, 'Não informado')
            );

            -- Inserir transferência
            INSERT INTO transferencias_propriedade (
                propriedade_id,
                proprietario_anterior_id,
                proprietario_novo_id,
                situacao_propriedade,
                data_transferencia,
                observacoes,
                created_at,
                updated_at
            ) VALUES (
                v_propriedade_id,
                v_proprietario_anterior_id,
                v_proprietario_novo_id,
                v_situacao_propriedade,
                v_data_transferencia,
                v_observacoes,
                NOW(),
                NOW()
            );

            v_count := v_count + 1;

            -- Log de progresso
            IF v_count % 50 = 0 THEN
                RAISE NOTICE '   ✅ % transferências migradas...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES (
                'TRANSFERENCIA',
                rec.cod_movimento_transferencia,
                SQLERRM
            );
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE TRANSFERÊNCIAS CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Transferências migradas: %', v_count;
    RAISE NOTICE 'Ignoradas (IDs não encontrados): %', v_ignorados;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- 1. Comparar totais
SELECT
    'GIM' as origem,
    COUNT(*) as total_transferencias
FROM staging_gim.transferencias_gim
UNION ALL
SELECT
    'SIGMA' as origem,
    COUNT(*) as total_transferencias
FROM transferencias_propriedade;

-- 2. Ver transferências migradas (primeiras 20)
SELECT
    tp.id,
    p.nome as propriedade,
    p_ant.nome as proprietario_anterior,
    p_novo.nome as proprietario_novo,
    tp.situacao_propriedade,
    tp.data_transferencia,
    LEFT(tp.observacoes, 100) as observacoes_resumo
FROM transferencias_propriedade tp
INNER JOIN "Propriedade" p ON p.id = tp.propriedade_id
INNER JOIN "Pessoa" p_ant ON p_ant.id = tp.proprietario_anterior_id
INNER JOIN "Pessoa" p_novo ON p_novo.id = tp.proprietario_novo_id
ORDER BY tp.data_transferencia DESC
LIMIT 20;

-- 3. Ver erros de migração
SELECT *
FROM staging_gim.log_erros
WHERE etapa LIKE 'TRANSFERENCIA%'
ORDER BY data_erro DESC;

-- 4. Distribuição por situação
SELECT
    situacao_propriedade,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transferencias_propriedade), 2) as percentual
FROM transferencias_propriedade
GROUP BY situacao_propriedade
ORDER BY total DESC;

-- 5. Transferências por ano
SELECT
    EXTRACT(YEAR FROM data_transferencia) as ano,
    COUNT(*) as total_transferencias
FROM transferencias_propriedade
GROUP BY EXTRACT(YEAR FROM data_transferencia)
ORDER BY ano;

-- 6. Propriedades com mais transferências
SELECT
    p.nome as propriedade,
    COUNT(*) as total_transferencias,
    MIN(tp.data_transferencia) as primeira_transferencia,
    MAX(tp.data_transferencia) as ultima_transferencia
FROM transferencias_propriedade tp
INNER JOIN "Propriedade" p ON p.id = tp.propriedade_id
GROUP BY p.id, p.nome
HAVING COUNT(*) > 1
ORDER BY total_transferencias DESC
LIMIT 10;

-- ============================================================================
-- LIMPEZA (Opcional - descomentar se quiser remover dados de staging)
-- ============================================================================

/*
DROP TABLE IF EXISTS staging_gim.transferencias_gim CASCADE;
DROP TABLE IF EXISTS staging_gim.movimentos_situacao_gim CASCADE;
DROP FUNCTION IF EXISTS staging_gim.buscar_situacao_pos_transferencia(BIGINT, TIMESTAMP);
*/
