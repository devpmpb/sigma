-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 5: ÁREA EFETIVA (Cálculo a partir de Area.csv)
-- ============================================================================
--
-- IMPORTANTE:
-- 1. Execute APÓS a migração de Pessoas, Propriedades e Arrendamentos
-- 2. Requer staging_gim.map_pessoas populada
-- 3. Usa os arquivos CSV:
--    - Area.csv (vínculos pessoa-propriedade do GIM)
--
-- LÓGICA:
-- - GIM: Tabela Area = 1 registro por vínculo pessoa-propriedade
-- - SIGMA: AreaEfetiva = 1 registro consolidado por pessoa/ano
-- - Cálculo: areaPropria + areaArrendadaRecebida - areaArrendadaCedida
--
-- DOCUMENTAÇÃO COMPLETA:
-- Ver: backend/scripts/migracao-gim/ANALISE-AREA-EFETIVA.md
--
-- Autor: Claude Code
-- Data: 2025-01-17
-- ============================================================================

-- ============================================================================
-- TABELAS DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.areas_gim CASCADE;
CREATE TABLE staging_gim.areas_gim (
    cod_area BIGINT PRIMARY KEY,
    cod_propriedade BIGINT,
    cod_pessoa BIGINT,
    residente VARCHAR(10),             -- true/false como string
    area NUMERIC(10,2),                -- Área do vínculo pessoa-propriedade
    situacao VARCHAR(30)               -- ARRENDADA, NORMAL, NULL
);

-- ============================================================================
-- INSTRUÇÕES PARA CARREGAR DADOS
-- ============================================================================

/*
Carregar o CSV no PostgreSQL:

1. IMPORTANTE: Substituir vírgulas por pontos nos valores decimais da coluna 'area'
2. No pgAdmin, clique com botão direito na tabela → Import/Export
3. Ou execute via COPY:

COPY staging_gim.areas_gim(
    cod_area,
    cod_propriedade,
    cod_pessoa,
    residente,
    area,
    situacao
)
FROM 'C:/csvs/Area.csv'
DELIMITER ';'
CSV HEADER
ENCODING 'UTF8';

-- CORRIGIR VALORES DECIMAIS (vírgula → ponto)
-- Se o CSV tiver vírgula como separador decimal, execute:
UPDATE staging_gim.areas_gim
SET area = REPLACE(area::TEXT, ',', '.')::NUMERIC(10,2)
WHERE area::TEXT LIKE '%,%';
*/

-- ============================================================================
-- PASSO 1: CALCULAR E MIGRAR ÁREA EFETIVA POR PESSOA
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_ignorados INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_pessoa_id INTEGER;
    v_ano_atual INTEGER := EXTRACT(YEAR FROM NOW());
    v_area_propria NUMERIC(10,2);
    v_area_arrendada_recebida NUMERIC(10,2);
    v_area_arrendada_cedida NUMERIC(10,2);
    v_area_efetiva NUMERIC(10,2);
BEGIN
    RAISE NOTICE 'Iniciando migração de Área Efetiva...';
    RAISE NOTICE 'Ano de referência: %', v_ano_atual;
    RAISE NOTICE '';

    -- Para cada pessoa que tem área no GIM
    FOR rec IN (
        SELECT DISTINCT
            a.cod_pessoa
        FROM staging_gim.areas_gim a
        WHERE a.cod_pessoa IS NOT NULL
        ORDER BY a.cod_pessoa
    ) LOOP
        BEGIN
            -- Mapear ID (GIM → SIGMA)
            SELECT id_sigma INTO v_pessoa_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_pessoa;

            IF v_pessoa_id IS NULL THEN
                v_ignorados := v_ignorados + 1;
                CONTINUE;
            END IF;

            -- ========================================================
            -- CALCULAR ÁREA PRÓPRIA
            -- ========================================================
            -- Soma de todas as áreas onde situacao != 'ARRENDADA'
            -- (área própria = terra que a pessoa possui, não cedeu)
            SELECT COALESCE(SUM(area), 0)
            INTO v_area_propria
            FROM staging_gim.areas_gim
            WHERE cod_pessoa = rec.cod_pessoa
              AND (situacao IS NULL OR UPPER(TRIM(situacao)) != 'ARRENDADA');

            -- ========================================================
            -- CALCULAR ÁREA ARRENDADA RECEBIDA
            -- ========================================================
            -- Área que a pessoa RECEBEU via arrendamento
            -- (está na tabela Arrendamento como arrendatarioId)
            SELECT COALESCE(SUM("areaArrendada"), 0)
            INTO v_area_arrendada_recebida
            FROM "Arrendamento"
            WHERE "arrendatarioId" = v_pessoa_id
              AND (status = 'ativo' OR "dataFim" IS NULL OR "dataFim" > NOW());

            -- ========================================================
            -- CALCULAR ÁREA ARRENDADA CEDIDA
            -- ========================================================
            -- Área que a pessoa CEDEU via arrendamento
            -- (está na tabela Arrendamento como proprietarioId)
            SELECT COALESCE(SUM("areaArrendada"), 0)
            INTO v_area_arrendada_cedida
            FROM "Arrendamento"
            WHERE "proprietarioId" = v_pessoa_id
              AND (status = 'ativo' OR "dataFim" IS NULL OR "dataFim" > NOW());

            -- ========================================================
            -- CALCULAR ÁREA EFETIVA
            -- ========================================================
            v_area_efetiva := v_area_propria + v_area_arrendada_recebida - v_area_arrendada_cedida;

            -- ========================================================
            -- INSERIR OU ATUALIZAR ÁREA EFETIVA
            -- ========================================================
            -- Usar UPSERT (INSERT ... ON CONFLICT)
            INSERT INTO "AreaEfetiva" (
                id,
                "anoReferencia",
                "areaPropria",
                "areaArrendadaRecebida",
                "areaArrendadaCedida",
                "areaEfetiva",
                "updatedAt"
            ) VALUES (
                v_pessoa_id,
                v_ano_atual,
                v_area_propria,
                v_area_arrendada_recebida,
                v_area_arrendada_cedida,
                v_area_efetiva,
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                "anoReferencia" = EXCLUDED."anoReferencia",
                "areaPropria" = EXCLUDED."areaPropria",
                "areaArrendadaRecebida" = EXCLUDED."areaArrendadaRecebida",
                "areaArrendadaCedida" = EXCLUDED."areaArrendadaCedida",
                "areaEfetiva" = EXCLUDED."areaEfetiva",
                "updatedAt" = NOW();

            v_count := v_count + 1;

            -- Log de progresso
            IF v_count % 50 = 0 THEN
                RAISE NOTICE '   ✅ % áreas efetivas calculadas...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES (
                'AREA_EFETIVA',
                rec.cod_pessoa,
                SQLERRM
            );
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE ÁREA EFETIVA CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Áreas efetivas calculadas: %', v_count;
    RAISE NOTICE 'Ignorados (pessoa não encontrada): %', v_ignorados;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- 1. Comparar totais
SELECT
    'GIM - Pessoas com área' as origem,
    COUNT(DISTINCT cod_pessoa) as total_pessoas
FROM staging_gim.areas_gim
UNION ALL
SELECT
    'SIGMA - AreaEfetiva' as origem,
    COUNT(*) as total_pessoas
FROM "AreaEfetiva";

-- 2. Ver áreas efetivas calculadas (primeiras 20)
SELECT
    p.nome as pessoa,
    ae."anoReferencia",
    ae."areaPropria",
    ae."areaArrendadaRecebida",
    ae."areaArrendadaCedida",
    ae."areaEfetiva",
    ae."atividadeProdutiva"
FROM "AreaEfetiva" ae
INNER JOIN "Pessoa" p ON p.id = ae.id
ORDER BY ae."areaEfetiva" DESC
LIMIT 20;

-- 3. Ver erros de migração
SELECT *
FROM staging_gim.log_erros
WHERE etapa LIKE 'AREA_EFETIVA%'
ORDER BY data_erro DESC;

-- 4. Distribuição de área efetiva
WITH faixas AS (
    SELECT
        CASE
            WHEN "areaEfetiva" = 0 THEN '0 (sem área)'
            WHEN "areaEfetiva" > 0 AND "areaEfetiva" <= 5 THEN '0-5 alqueires'
            WHEN "areaEfetiva" > 5 AND "areaEfetiva" <= 10 THEN '5-10 alqueires'
            WHEN "areaEfetiva" > 10 AND "areaEfetiva" <= 20 THEN '10-20 alqueires'
            WHEN "areaEfetiva" > 20 AND "areaEfetiva" <= 50 THEN '20-50 alqueires'
            ELSE '50+ alqueires'
        END as faixa,
        CASE
            WHEN "areaEfetiva" = 0 THEN 1
            WHEN "areaEfetiva" > 0 AND "areaEfetiva" <= 5 THEN 2
            WHEN "areaEfetiva" > 5 AND "areaEfetiva" <= 10 THEN 3
            WHEN "areaEfetiva" > 10 AND "areaEfetiva" <= 20 THEN 4
            WHEN "areaEfetiva" > 20 AND "areaEfetiva" <= 50 THEN 5
            ELSE 6
        END as ordem,
        "areaEfetiva"
    FROM "AreaEfetiva"
)
SELECT
    faixa,
    COUNT(*) as total_pessoas,
    ROUND(AVG("areaEfetiva"), 2) as media_area
FROM faixas
GROUP BY faixa, ordem
ORDER BY ordem;

-- 5. Pessoas com área cedida (arrendaram para outros)
SELECT
    p.nome as pessoa,
    ae."areaPropria",
    ae."areaArrendadaCedida",
    ae."areaEfetiva",
    ROUND((ae."areaArrendadaCedida" / NULLIF(ae."areaPropria", 0)) * 100, 2) as percentual_cedido
FROM "AreaEfetiva" ae
INNER JOIN "Pessoa" p ON p.id = ae.id
WHERE ae."areaArrendadaCedida" > 0
ORDER BY ae."areaArrendadaCedida" DESC
LIMIT 20;

-- 6. Pessoas com área recebida (arrendaram de outros)
SELECT
    p.nome as pessoa,
    ae."areaPropria",
    ae."areaArrendadaRecebida",
    ae."areaEfetiva"
FROM "AreaEfetiva" ae
INNER JOIN "Pessoa" p ON p.id = ae.id
WHERE ae."areaArrendadaRecebida" > 0
ORDER BY ae."areaArrendadaRecebida" DESC
LIMIT 20;

-- 7. Validar cálculo (conferir se área efetiva está correta)
SELECT
    p.nome,
    ae."areaPropria",
    ae."areaArrendadaRecebida",
    ae."areaArrendadaCedida",
    ae."areaEfetiva",
    (ae."areaPropria" + ae."areaArrendadaRecebida" - ae."areaArrendadaCedida") as area_calculada,
    ae."areaEfetiva" - (ae."areaPropria" + ae."areaArrendadaRecebida" - ae."areaArrendadaCedida") as diferenca
FROM "AreaEfetiva" ae
INNER JOIN "Pessoa" p ON p.id = ae.id
WHERE ABS(ae."areaEfetiva" - (ae."areaPropria" + ae."areaArrendadaRecebida" - ae."areaArrendadaCedida")) > 0.01
ORDER BY ABS(ae."areaEfetiva" - (ae."areaPropria" + ae."areaArrendadaRecebida" - ae."areaArrendadaCedida")) DESC;

-- 8. Estatísticas gerais
SELECT
    COUNT(*) as total_pessoas_com_area,
    ROUND(AVG("areaEfetiva"), 2) as media_area_efetiva,
    ROUND(MIN("areaEfetiva"), 2) as menor_area,
    ROUND(MAX("areaEfetiva"), 2) as maior_area,
    ROUND(SUM("areaEfetiva"), 2) as soma_total_area
FROM "AreaEfetiva";

-- 9. Comparar com dados do GIM (auditoria)
-- Soma total de área no GIM vs SIGMA
SELECT
    'GIM - Total área' as origem,
    ROUND(SUM(
        CASE
            WHEN area::TEXT LIKE '%,%'
            THEN REPLACE(area::TEXT, ',', '.')::NUMERIC(10,2)
            ELSE area
        END
    ), 2) as total_area
FROM staging_gim.areas_gim
UNION ALL
SELECT
    'SIGMA - Total área própria' as origem,
    ROUND(SUM("areaPropria"), 2) as total_area
FROM "AreaEfetiva";

-- ============================================================================
-- QUERY DE AUDITORIA SEMANAL (usar em cron job)
-- ============================================================================

-- Detectar inconsistências entre AreaEfetiva e dados reais
-- Esta query deve retornar 0 registros se tudo estiver sincronizado
SELECT
    p.nome,
    ae."areaPropria" as area_propria_registrada,

    -- Calcular área própria real (soma das propriedades)
    COALESCE((
        SELECT SUM(prop."areaTotal")
        FROM "Propriedade" prop
        WHERE prop."proprietarioId" = p.id
    ), 0) as area_propria_calculada,

    -- Diferença
    ae."areaPropria" - COALESCE((
        SELECT SUM(prop."areaTotal")
        FROM "Propriedade" prop
        WHERE prop."proprietarioId" = p.id
    ), 0) as diferenca

FROM "Pessoa" p
INNER JOIN "AreaEfetiva" ae ON ae.id = p.id
WHERE ABS(
    ae."areaPropria" - COALESCE((
        SELECT SUM(prop."areaTotal")
        FROM "Propriedade" prop
        WHERE prop."proprietarioId" = p.id
    ), 0)
) > 0.01
ORDER BY ABS(
    ae."areaPropria" - COALESCE((
        SELECT SUM(prop."areaTotal")
        FROM "Propriedade" prop
        WHERE prop."proprietarioId" = p.id
    ), 0)
) DESC;

-- ============================================================================
-- LIMPEZA (Opcional - descomentar se quiser remover dados de staging)
-- ============================================================================

/*
DROP TABLE IF EXISTS staging_gim.areas_gim CASCADE;
*/
