-- ============================================================================
-- SCRIPT DE ATUALIZAÇÃO - isProdutor
-- ============================================================================
--
-- OBJETIVO: Marcar pessoas como produtores com base nos dados do GIM
--
-- CRITÉRIOS:
-- isProdutor = TRUE se a pessoa aparece em:
-- 1. Bloco (como produtor)
-- 2. Area (como responsável)
-- 3. Arrendamento (como arrendatário)
-- 4. Subsidio (como produtor/beneficiário)
--
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_total_produtores INTEGER := 0;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ATUALIZANDO CAMPO isProdutor';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';

    -- Marcar como produtor com base em registros do staging
    UPDATE "Pessoa" p
    SET
        "isProdutor" = TRUE,
        "updatedAt" = NOW()
    WHERE p.id IN (
        -- Pessoas que aparecem em staging_gim.bloco_csv como produtor
        SELECT DISTINCT mp.id_sigma
        FROM staging_gim.bloco_csv b
        INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = b.codProdutor
        WHERE mp.id_sigma IS NOT NULL

        UNION

        -- Pessoas que aparecem em staging_gim.area_csv
        SELECT DISTINCT mp.id_sigma
        FROM staging_gim.area_csv a
        INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = a.cod_pessoa
        WHERE mp.id_sigma IS NOT NULL

        UNION

        -- Pessoas que aparecem em staging_gim.arrendamento_csv como arrendatário
        SELECT DISTINCT mp.id_sigma
        FROM staging_gim.arrendamento_csv arr
        INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = arr.codArrendatario
        WHERE mp.id_sigma IS NOT NULL

        UNION

        -- Pessoas que aparecem em staging_gim.subsidio_csv como produtor/beneficiário
        SELECT DISTINCT mp.id_sigma
        FROM staging_gim.subsidio_csv s
        INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = s.codProdutor
        WHERE mp.id_sigma IS NOT NULL
    )
    AND p."isProdutor" = FALSE; -- Só atualiza quem ainda não é produtor

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Pessoas marcadas como produtores: %', v_count;
    RAISE NOTICE '';

    -- Estatísticas finais
    SELECT COUNT(*) INTO v_total_produtores FROM "Pessoa" WHERE "isProdutor" = TRUE;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'ESTATÍSTICAS FINAIS';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total de produtores (isProdutor=true): %', v_total_produtores;
    RAISE NOTICE 'Percentual de produtores: %.2f%%',
        (v_total_produtores::DECIMAL / NULLIF((SELECT COUNT(*) FROM "Pessoa"), 0) * 100);
    RAISE NOTICE '';

    -- Detalhamento por fonte
    RAISE NOTICE 'Detalhamento por fonte:';
    RAISE NOTICE '- Produtores com blocos: %', (
        SELECT COUNT(DISTINCT mp.id_sigma)
        FROM staging_gim.bloco_csv b
        INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = b.codProdutor
        WHERE mp.id_sigma IS NOT NULL
    );
    RAISE NOTICE '- Produtores com áreas: %', (
        SELECT COUNT(DISTINCT mp.id_sigma)
        FROM staging_gim.area_csv a
        INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = a.cod_pessoa
        WHERE mp.id_sigma IS NOT NULL
    );
    RAISE NOTICE '- Arrendatários: %', (
        SELECT COUNT(DISTINCT mp.id_sigma)
        FROM staging_gim.arrendamento_csv arr
        INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = arr.codArrendatario
        WHERE mp.id_sigma IS NOT NULL
    );
    RAISE NOTICE '- Beneficiários de subsídios: %', (
        SELECT COUNT(DISTINCT mp.id_sigma)
        FROM staging_gim.subsidio_csv s
        INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = s.codProdutor
        WHERE mp.id_sigma IS NOT NULL
    );
    RAISE NOTICE '';

END $$;

-- ============================================================================
-- QUERY DE VALIDAÇÃO - Produtores por município
-- ============================================================================

SELECT
    'Pato Bragado' as municipio,
    COUNT(*) as total_produtores,
    COUNT(*) FILTER (WHERE tipoPessoa = 'FISICA') as produtores_fisicos,
    COUNT(*) FILTER (WHERE tipoPessoa = 'JURIDICA') as produtores_juridicos
FROM "Pessoa"
WHERE "isProdutor" = TRUE;
