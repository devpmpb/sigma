-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 4: ARRENDAMENTOS
-- ============================================================================
--
-- IMPORTANTE:
-- 1. Execute APÓS a migração de Pessoas e Propriedades
-- 2. Requer staging_gim.map_pessoas e staging_gim.map_propriedades populadas
-- 3. Requer staging_gim.areas_gim_completa (criada na migração de propriedades)
-- 4. Usa o arquivo CSV: arrendamento.csv
--
-- LÓGICA:
-- - GIM: Arrendamento referencia codArea (que vincula pessoa+propriedade)
-- - SIGMA: Arrendamento precisa de propriedadeId + proprietarioId + arrendatarioId
-- - Buscar propriedade e proprietário via tabela areas_gim_completa
--
-- Autor: Claude Code
-- Data: 2025-01-17
-- ============================================================================

-- ============================================================================
-- TABELAS DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.arrendamentos_gim CASCADE;
CREATE TABLE staging_gim.arrendamentos_gim (
    cod_arrendamento BIGINT PRIMARY KEY,
    cod_area BIGINT,                   -- Referência à tabela Area (propriedade + pessoa)
    cod_arrendatario BIGINT,           -- Quem está arrendando a terra
    area NUMERIC(10,2),                -- Área arrendada (pode ter vírgula no CSV)
    residente VARCHAR(10),             -- true/false como string
    situacao VARCHAR(30),              -- CANCELADO, VENCIDO, ATIVO
    observacao TEXT,
    data_inicial TIMESTAMP,
    data_final TIMESTAMP
);

-- ============================================================================
-- INSTRUÇÕES PARA CARREGAR DADOS
-- ============================================================================

/*
Carregar o CSV no PostgreSQL:

1. IMPORTANTE: Substituir vírgulas por pontos nos valores decimais da coluna 'area'
2. No pgAdmin, clique com botão direito na tabela → Import/Export
3. Ou execute via COPY:

COPY staging_gim.arrendamentos_gim(
    cod_arrendamento,
    cod_area,
    cod_arrendatario,
    area,
    residente,
    situacao,
    observacao,
    data_inicial,
    data_final
)
FROM 'C:/csvs/arrendamento.csv'
DELIMITER ';'
CSV HEADER
ENCODING 'UTF8';

-- CORRIGIR VALORES DECIMAIS (vírgula → ponto)
-- Se o CSV tiver vírgula como separador decimal, execute:
UPDATE staging_gim.arrendamentos_gim
SET area = REPLACE(area::TEXT, ',', '.')::NUMERIC(10,2)
WHERE area::TEXT LIKE '%,%';
*/

-- ============================================================================
-- PASSO 1: MIGRAR ARRENDAMENTOS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_ignorados INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_propriedade_id INTEGER;
    v_proprietario_id INTEGER;
    v_arrendatario_id INTEGER;
    v_area_arrendada NUMERIC(10,2);
    v_residente BOOLEAN;
    v_status VARCHAR(50);
    v_cod_propriedade_gim BIGINT;
BEGIN
    RAISE NOTICE 'Iniciando migração de Arrendamentos...';
    RAISE NOTICE '';

    FOR rec IN (
        SELECT
            arr.cod_arrendamento,
            arr.cod_area,
            arr.cod_arrendatario,
            arr.area,
            arr.residente,
            arr.situacao,
            arr.observacao,
            arr.data_inicial,
            arr.data_final
        FROM staging_gim.arrendamentos_gim arr
        WHERE arr.cod_area IS NOT NULL
          AND arr.cod_arrendatario IS NOT NULL
        ORDER BY arr.data_inicial ASC, arr.cod_arrendamento ASC
    ) LOOP
        BEGIN
            -- ========================================================
            -- 1. Buscar propriedade via codArea (tabela areas_gim_completa)
            -- ========================================================
            SELECT cod_propriedade, cod_pessoa
            INTO v_cod_propriedade_gim, v_proprietario_id
            FROM staging_gim.areas_gim_completa
            WHERE cod_area = rec.cod_area
            LIMIT 1;

            IF v_cod_propriedade_gim IS NULL THEN
                v_ignorados := v_ignorados + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES (
                    'ARRENDAMENTO_AREA_NAO_ENCONTRADA',
                    rec.cod_arrendamento,
                    FORMAT('codArea %s não encontrada na tabela areas_gim_completa', rec.cod_area)
                );
                CONTINUE;
            END IF;

            -- ========================================================
            -- 2. Mapear IDs (GIM → SIGMA)
            -- ========================================================

            -- Propriedade
            SELECT id_sigma INTO v_propriedade_id
            FROM staging_gim.map_propriedades
            WHERE id_gim = v_cod_propriedade_gim;

            -- Proprietário (dono da propriedade via areas_gim_completa)
            SELECT id_sigma INTO v_proprietario_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = v_proprietario_id;

            -- Arrendatário
            SELECT id_sigma INTO v_arrendatario_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_arrendatario;

            -- Verificar se todos os IDs foram encontrados
            IF v_propriedade_id IS NULL OR
               v_proprietario_id IS NULL OR
               v_arrendatario_id IS NULL THEN

                v_ignorados := v_ignorados + 1;

                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES (
                    'ARRENDAMENTO_IDS_NAO_ENCONTRADOS',
                    rec.cod_arrendamento,
                    FORMAT(
                        'Propriedade GIM=%s→SIGMA=%s, Proprietario SIGMA=%s, Arrendatario GIM=%s→SIGMA=%s',
                        v_cod_propriedade_gim, COALESCE(v_propriedade_id::TEXT, 'NULL'),
                        COALESCE(v_proprietario_id::TEXT, 'NULL'),
                        rec.cod_arrendatario, COALESCE(v_arrendatario_id::TEXT, 'NULL')
                    )
                );
                CONTINUE;
            END IF;

            -- ========================================================
            -- 3. Converter campos
            -- ========================================================

            -- Área (converter vírgula em ponto se necessário)
            v_area_arrendada := CASE
                WHEN rec.area::TEXT LIKE '%,%'
                THEN REPLACE(rec.area::TEXT, ',', '.')::NUMERIC(10,2)
                ELSE rec.area
            END;

            -- Residente (converter string para boolean)
            v_residente := CASE
                WHEN LOWER(TRIM(rec.residente)) IN ('true', 't', 'sim', 's', '1')
                THEN TRUE
                ELSE FALSE
            END;

            -- Status (normalizar)
            v_status := CASE
                WHEN UPPER(TRIM(rec.situacao)) = 'CANCELADO' THEN 'cancelado'
                WHEN UPPER(TRIM(rec.situacao)) = 'VENCIDO' THEN 'vencido'
                WHEN UPPER(TRIM(rec.situacao)) = 'ATIVO' THEN 'ativo'
                ELSE 'cancelado' -- Padrão
            END;

            -- ========================================================
            -- 4. Inserir Arrendamento
            -- ========================================================
            INSERT INTO "Arrendamento" (
                "propriedadeId",
                "proprietarioId",
                "arrendatarioId",
                "areaArrendada",
                "dataInicio",
                "dataFim",
                status,
                residente,
                "createdAt",
                "updatedAt"
            ) VALUES (
                v_propriedade_id,
                v_proprietario_id,
                v_arrendatario_id,
                v_area_arrendada,
                rec.data_inicial::DATE,
                rec.data_final::DATE,
                v_status,
                v_residente,
                NOW(),
                NOW()
            );

            v_count := v_count + 1;

            -- Log de progresso
            IF v_count % 50 = 0 THEN
                RAISE NOTICE '   ✅ % arrendamentos migrados...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES (
                'ARRENDAMENTO',
                rec.cod_arrendamento,
                SQLERRM
            );
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE ARRENDAMENTOS CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Arrendamentos migrados: %', v_count;
    RAISE NOTICE 'Ignorados (IDs não encontrados): %', v_ignorados;
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
    COUNT(*) as total_arrendamentos
FROM staging_gim.arrendamentos_gim
UNION ALL
SELECT
    'SIGMA' as origem,
    COUNT(*) as total_arrendamentos
FROM "Arrendamento";

-- 2. Ver arrendamentos migrados (primeiros 20)
SELECT
    a.id,
    prop.nome as propriedade,
    prop_pessoa.nome as proprietario,
    arren_pessoa.nome as arrendatario,
    a."areaArrendada",
    a.residente,
    a.status,
    a."dataInicio",
    a."dataFim"
FROM "Arrendamento" a
INNER JOIN "Propriedade" prop ON prop.id = a."propriedadeId"
INNER JOIN "Pessoa" prop_pessoa ON prop_pessoa.id = a."proprietarioId"
INNER JOIN "Pessoa" arren_pessoa ON arren_pessoa.id = a."arrendatarioId"
ORDER BY a."dataInicio" DESC
LIMIT 20;

-- 3. Ver erros de migração
SELECT *
FROM staging_gim.log_erros
WHERE etapa LIKE 'ARRENDAMENTO%'
ORDER BY data_erro DESC;

-- 4. Distribuição por status
SELECT
    status,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "Arrendamento"), 2) as percentual
FROM "Arrendamento"
GROUP BY status
ORDER BY total DESC;

-- 5. Arrendamentos por ano (início)
SELECT
    EXTRACT(YEAR FROM "dataInicio") as ano,
    COUNT(*) as total_arrendamentos
FROM "Arrendamento"
GROUP BY EXTRACT(YEAR FROM "dataInicio")
ORDER BY ano;

-- 6. Arrendamentos ativos (dataFim no futuro ou NULL)
SELECT COUNT(*) as total_arrendamentos_ativos
FROM "Arrendamento"
WHERE status = 'ativo'
   OR "dataFim" IS NULL
   OR "dataFim" > NOW();

-- 7. Propriedades com mais arrendamentos
SELECT
    prop.nome as propriedade,
    COUNT(*) as total_arrendamentos,
    SUM(a."areaArrendada") as area_total_arrendada
FROM "Arrendamento" a
INNER JOIN "Propriedade" prop ON prop.id = a."propriedadeId"
GROUP BY prop.id, prop.nome
HAVING COUNT(*) > 1
ORDER BY total_arrendamentos DESC
LIMIT 10;

-- 8. Pessoas que mais arrendaram terras
SELECT
    p.nome as arrendatario,
    COUNT(*) as total_arrendamentos,
    SUM(a."areaArrendada") as area_total_arrendada
FROM "Arrendamento" a
INNER JOIN "Pessoa" p ON p.id = a."arrendatarioId"
GROUP BY p.id, p.nome
HAVING COUNT(*) > 1
ORDER BY total_arrendamentos DESC
LIMIT 10;

-- ============================================================================
-- LIMPEZA (Opcional - descomentar se quiser remover dados de staging)
-- ============================================================================

/*
DROP TABLE IF EXISTS staging_gim.arrendamentos_gim CASCADE;
*/
