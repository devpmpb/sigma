-- ============================================================================
-- SCRIPT DE MAPEAMENTO - OUTROS LOGRADOUROS (OUTRAS CIDADES/ESTADOS)
-- ============================================================================
--
-- Logradouros que são de outras cidades/estados/países:
-- 36 - Fátima, 42 - Arsenio Backes, 82 - Centro, 86 - Amazonas
-- 108 - Brasil, 114 - Mato Grosso, 131 - Rio Grande do Sul
-- 135 - Marechal Deodoro, 141 - Iguiporã
--
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Criando logradouros tipo OUTROS...';

    -- Criar logradouros no SIGMA (apenas se não existir)
    INSERT INTO "Logradouro" (tipo, descricao, "createdAt", "updatedAt")
    SELECT
        'OUTROS'::"TipoLogradouro",
        TRIM(nome),
        NOW(),
        NOW()
    FROM staging_gim.logradouro_csv
    WHERE codLogradouro IN (36, 42, 82, 86, 108, 114, 131, 135, 141)
      AND NOT EXISTS (
          SELECT 1 FROM "Logradouro" l
          WHERE l.descricao = TRIM(staging_gim.logradouro_csv.nome)
      );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Criados % novos logradouros tipo OUTROS', v_count;

    -- Mapear para staging_gim.map_logradouros
    INSERT INTO staging_gim.map_logradouros (id_gim, id_sigma, nome_gim, nome_sigma, metodo_mapeamento)
    SELECT
        lg.codLogradouro,
        l.id,
        TRIM(lg.nome),
        l.descricao,
        'MANUAL'
    FROM staging_gim.logradouro_csv lg
    INNER JOIN "Logradouro" l ON TRIM(lg.nome) = l.descricao
    WHERE lg.codLogradouro IN (36, 42, 82, 86, 108, 114, 131, 135, 141)
    ON CONFLICT (id_gim) DO UPDATE SET
        id_sigma = EXCLUDED.id_sigma,
        nome_sigma = EXCLUDED.nome_sigma,
        metodo_mapeamento = EXCLUDED.metodo_mapeamento;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Mapeados % logradouros', v_count;

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
      AND ml.id_gim IN (36, 42, 82, 86, 108, 114, 131, 135, 141);

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Atualizados % endereços', v_count;
    RAISE NOTICE '';

    -- Relatório
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO FINAL';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de logradouros mapeados: %', (SELECT COUNT(*) FROM staging_gim.map_logradouros);
    RAISE NOTICE 'Endereços com logradouro: %', (SELECT COUNT(*) FROM "Endereco" WHERE "logradouroId" IS NOT NULL);
    RAISE NOTICE 'Endereços sem logradouro: %', (SELECT COUNT(*) FROM "Endereco" WHERE "logradouroId" IS NULL);
    RAISE NOTICE '';

END $$;
