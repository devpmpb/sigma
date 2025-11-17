-- ============================================================================
-- SCRIPT DE MAPEAMENTO - LOGRADOUROS ESPECIAIS GIM → SIGMA
-- ============================================================================
--
-- OBJETIVO: Mapear logradouros do GIM que não foram mapeados automaticamente
--
-- CASOS:
-- 1. Paraguai (códigos 104 e 124) → Logradouro "Paraguai" tipo OUTROS
-- 2. Rio de Janeiro (código 59) → Logradouro "Rio de Janeiro" tipo OUTROS
-- 3. Linhas rurais (KM-05, São Francisco, etc.) → Logradouro "Área Rural de Pato Bragado"
--
-- ============================================================================

-- Buscar IDs dos logradouros especiais
DO $$
DECLARE
    id_paraguai INTEGER;
    id_rio_janeiro INTEGER;
    id_area_rural INTEGER;
BEGIN
    -- Buscar ID do logradouro "Paraguai"
    SELECT id INTO id_paraguai FROM "Logradouro" WHERE descricao = 'Paraguai' AND tipo = 'OUTROS';

    -- Buscar ID do logradouro "Rio de Janeiro"
    SELECT id INTO id_rio_janeiro FROM "Logradouro" WHERE descricao = 'Rio de Janeiro' AND tipo = 'OUTROS';

    -- Buscar ID do logradouro "Área Rural de Pato Bragado"
    SELECT id INTO id_area_rural FROM "Logradouro" WHERE descricao = 'Área Rural de Pato Bragado';

    RAISE NOTICE 'IDs encontrados:';
    RAISE NOTICE 'Paraguai: %', id_paraguai;
    RAISE NOTICE 'Rio de Janeiro: %', id_rio_janeiro;
    RAISE NOTICE 'Área Rural: %', id_area_rural;
    RAISE NOTICE '';

    -- Mapear Paraguai (códigos 104 e 124)
    INSERT INTO staging_gim.map_logradouros (id_gim, id_sigma, nome_gim, nome_sigma, metodo_mapeamento)
    VALUES
        (104, id_paraguai, 'Paraguai', 'Paraguai', 'MANUAL'),
        (124, id_paraguai, 'PARAGUAI', 'Paraguai', 'MANUAL')
    ON CONFLICT (id_gim) DO UPDATE SET
        id_sigma = EXCLUDED.id_sigma,
        nome_sigma = EXCLUDED.nome_sigma,
        metodo_mapeamento = EXCLUDED.metodo_mapeamento;

    RAISE NOTICE 'Paraguai mapeado (códigos 104 e 124)';

    -- Mapear Rio de Janeiro (código 59)
    INSERT INTO staging_gim.map_logradouros (id_gim, id_sigma, nome_gim, nome_sigma, metodo_mapeamento)
    VALUES (59, id_rio_janeiro, 'Rio de Janeiro', 'Rio de Janeiro', 'MANUAL')
    ON CONFLICT (id_gim) DO UPDATE SET
        id_sigma = EXCLUDED.id_sigma,
        nome_sigma = EXCLUDED.nome_sigma,
        metodo_mapeamento = EXCLUDED.metodo_mapeamento;

    RAISE NOTICE 'Rio de Janeiro mapeado (código 59)';

    -- Mapear todas as linhas rurais para "Área Rural de Pato Bragado"
    INSERT INTO staging_gim.map_logradouros (id_gim, id_sigma, nome_gim, nome_sigma, metodo_mapeamento)
    SELECT
        lg.codLogradouro,
        id_area_rural,
        lg.nome,
        'Área Rural de Pato Bragado',
        'MANUAL'
    FROM staging_gim.logradouro_csv lg
    WHERE lg.codLogradouro IN (
        5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 32, -- Linhas KM
        94, 123, 142, 144, 146 -- Outras linhas
    )
    ON CONFLICT (id_gim) DO UPDATE SET
        id_sigma = EXCLUDED.id_sigma,
        nome_sigma = EXCLUDED.nome_sigma,
        metodo_mapeamento = EXCLUDED.metodo_mapeamento;

    RAISE NOTICE 'Linhas rurais mapeadas para Área Rural de Pato Bragado';
    RAISE NOTICE '';

    -- Atualizar endereços que estavam sem logradouro
    UPDATE "Endereco" e
    SET "logradouroId" = ml.id_sigma,
        "updatedAt" = NOW()
    FROM staging_gim.endereco_csv ec
    INNER JOIN staging_gim.pessoa_csv p ON p.cod_endereco = ec.cod_endereco
    INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = p.cod_pessoa
    INNER JOIN staging_gim.map_logradouros ml ON ml.id_gim = ec.cod_logradouro
    WHERE e."pessoaId" = mp.id_sigma
      AND e."logradouroId" IS NULL
      AND ml.metodo_mapeamento = 'MANUAL';

    RAISE NOTICE 'Endereços atualizados com novos mapeamentos';
    RAISE NOTICE '';

    -- Relatório final
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO DE MAPEAMENTO ESPECIAL';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    RAISE NOTICE 'Total de logradouros mapeados: %', (SELECT COUNT(*) FROM staging_gim.map_logradouros);
    RAISE NOTICE 'Mapeamentos manuais: %', (SELECT COUNT(*) FROM staging_gim.map_logradouros WHERE metodo_mapeamento = 'MANUAL');
    RAISE NOTICE 'Endereços com logradouro: %', (SELECT COUNT(*) FROM "Endereco" WHERE "logradouroId" IS NOT NULL);
    RAISE NOTICE 'Endereços sem logradouro: %', (SELECT COUNT(*) FROM "Endereco" WHERE "logradouroId" IS NULL);
    RAISE NOTICE '';

END $$;

-- ============================================================================
-- QUERY PARA VER LOGRADOUROS NÃO MAPEADOS RESTANTES
-- ============================================================================

SELECT DISTINCT
    lg.codLogradouro,
    lg.nome as nome_gim,
    COUNT(e.cod_endereco) as qtd_enderecos_afetados
FROM staging_gim.endereco_csv e
INNER JOIN staging_gim.logradouro_csv lg ON lg.codLogradouro = e.cod_logradouro
WHERE NOT EXISTS (
    SELECT 1 FROM staging_gim.map_logradouros ml
    WHERE ml.id_gim = lg.codLogradouro
)
GROUP BY lg.codLogradouro, lg.nome
ORDER BY COUNT(e.cod_endereco) DESC
LIMIT 20;
