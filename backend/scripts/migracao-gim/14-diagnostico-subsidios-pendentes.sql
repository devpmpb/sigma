-- ============================================================================
-- SCRIPT DE DIAGNÓSTICO - INVESTIGAR SUBSÍDIOS PENDENTES E VALORES ZERADOS
-- ============================================================================
--
-- PROBLEMAS A INVESTIGAR:
-- 1. Por que 16.512 subsídios ainda estão no programa genérico?
-- 2. Por que 4.000+ subsídios têm valor zerado?
--
-- COMO EXECUTAR:
-- 1. Abra o pgAdmin
-- 2. Tools → Query Tool
-- 3. Cole este script COMPLETO
-- 4. Execute (F5)
--
-- Autor: Claude Code
-- Data: 2025-01-12
-- ============================================================================

DO $$
DECLARE
    v_programa_generico_id INTEGER;
    v_subsidios_sem_programa INTEGER;
    v_subsidios_programa_invalido INTEGER;
    v_subsidios_zerados_com_valor_origem INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNÓSTICO DE SUBSÍDIOS PENDENTES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Buscar ID do programa genérico
    SELECT id INTO v_programa_generico_id
    FROM "Programa"
    WHERE nome ILIKE '%Migrado do GIM%'
    LIMIT 1;

    RAISE NOTICE 'Programa genérico ID: %', v_programa_generico_id;
    RAISE NOTICE '';

    -- ========================================
    -- INVESTIGAÇÃO 1: Por que não remapearam?
    -- ========================================
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'INVESTIGAÇÃO 1: SUBSÍDIOS NÃO REMAPEADOS';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE '';

    -- Contar subsídios onde cod_programa é NULL no staging
    SELECT COUNT(*) INTO v_subsidios_sem_programa
    FROM staging_gim.subsidios_gim sg
    INNER JOIN staging_gim.map_subsidios ms ON ms.id_gim = sg.cod_subsidio
    INNER JOIN "SolicitacaoBeneficio" sb ON sb.id = ms.id_sigma
    WHERE sb."programaId" = v_programa_generico_id
      AND sg.cod_programa IS NULL;

    RAISE NOTICE 'Subsídios com cod_programa NULL: %', v_subsidios_sem_programa;

    -- Contar subsídios onde cod_programa não está na tabela de mapeamento
    SELECT COUNT(*) INTO v_subsidios_programa_invalido
    FROM staging_gim.subsidios_gim sg
    INNER JOIN staging_gim.map_subsidios ms ON ms.id_gim = sg.cod_subsidio
    INNER JOIN "SolicitacaoBeneficio" sb ON sb.id = ms.id_sigma
    WHERE sb."programaId" = v_programa_generico_id
      AND sg.cod_programa IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM staging_gim.map_programas mp
          WHERE mp.id_gim = sg.cod_programa
      );

    RAISE NOTICE 'Subsídios com cod_programa não mapeado: %', v_subsidios_programa_invalido;
    RAISE NOTICE '';

    -- ========================================
    -- INVESTIGAÇÃO 2: Valores zerados
    -- ========================================
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'INVESTIGAÇÃO 2: VALORES ZERADOS';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE '';

    -- Contar quantos subsídios zerados TÊM valor no staging
    SELECT COUNT(*) INTO v_subsidios_zerados_com_valor_origem
    FROM staging_gim.subsidios_gim sg
    INNER JOIN staging_gim.map_subsidios ms ON ms.id_gim = sg.cod_subsidio
    INNER JOIN "SolicitacaoBeneficio" sb ON sb.id = ms.id_sigma
    WHERE sb."valorCalculado" = 0
      AND sg.valor IS NOT NULL
      AND TRIM(sg.valor) != ''
      AND TRIM(sg.valor) != '0'
      AND TRIM(sg.valor) != '0,00';

    RAISE NOTICE 'Subsídios com valor=0 no SIGMA mas COM valor no GIM: %', v_subsidios_zerados_com_valor_origem;
    RAISE NOTICE '';

    -- ========================================
    -- RELATÓRIO DE DIAGNÓSTICO
    -- ========================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMO DO DIAGNÓSTICO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Total de subsídios no programa genérico: 16.512';
    RAISE NOTICE '  - Com cod_programa NULL/vazio: %', v_subsidios_sem_programa;
    RAISE NOTICE '  - Com cod_programa não mapeado: %', v_subsidios_programa_invalido;
    RAISE NOTICE '';
    RAISE NOTICE 'Total de subsídios com valor zerado: 4.000+';
    RAISE NOTICE '  - Têm valor no staging (erro de conversão): %', v_subsidios_zerados_com_valor_origem;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DETALHADAS PARA ANÁLISE
-- ============================================================================

-- Ver códigos de programa que não foram mapeados
SELECT
    sg.cod_programa,
    COUNT(*) as quantidade_subsidios,
    STRING_AGG(DISTINCT sg.situacao, ', ') as situacoes
FROM staging_gim.subsidios_gim sg
INNER JOIN staging_gim.map_subsidios ms ON ms.id_gim = sg.cod_subsidio
INNER JOIN "SolicitacaoBeneficio" sb ON sb.id = ms.id_sigma
WHERE sb."programaId" = (SELECT id FROM "Programa" WHERE nome ILIKE '%Migrado do GIM%' LIMIT 1)
  AND sg.cod_programa IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM staging_gim.map_programas mp
      WHERE mp.id_gim = sg.cod_programa
  )
GROUP BY sg.cod_programa
ORDER BY COUNT(*) DESC;

-- Ver amostra de valores zerados no SIGMA que TÊM valor no GIM
SELECT
    ms.id_gim as cod_subsidio_gim,
    ms.id_sigma as id_sigma,
    sg.valor as valor_staging_gim,
    sg.quantidade as quantidade_staging_gim,
    sb."valorCalculado" as valor_sigma,
    sb."quantidadeSolicitada" as quantidade_sigma,
    p.nome as programa
FROM staging_gim.subsidios_gim sg
INNER JOIN staging_gim.map_subsidios ms ON ms.id_gim = sg.cod_subsidio
INNER JOIN "SolicitacaoBeneficio" sb ON sb.id = ms.id_sigma
INNER JOIN "Programa" p ON p.id = sb."programaId"
WHERE sb."valorCalculado" = 0
  AND sg.valor IS NOT NULL
  AND TRIM(sg.valor) != ''
  AND TRIM(sg.valor) != '0'
  AND TRIM(sg.valor) != '0,00'
LIMIT 20;

-- Ver distribuição de valores zerados por programa
SELECT
    p.nome as programa,
    COUNT(*) as qtd_zerados,
    COUNT(CASE WHEN sg.valor IS NOT NULL
               AND TRIM(sg.valor) != ''
               AND TRIM(sg.valor) != '0'
               AND TRIM(sg.valor) != '0,00'
          THEN 1 END) as qtd_com_valor_no_staging
FROM "SolicitacaoBeneficio" sb
INNER JOIN "Programa" p ON p.id = sb."programaId"
LEFT JOIN staging_gim.map_subsidios ms ON ms.id_sigma = sb.id
LEFT JOIN staging_gim.subsidios_gim sg ON sg.cod_subsidio = ms.id_gim
WHERE sb."valorCalculado" = 0
GROUP BY p.id, p.nome
ORDER BY COUNT(*) DESC
LIMIT 15;

-- ============================================================================
-- VERIFICAR INTEGRIDADE DOS DADOS DE MAPEAMENTO
-- ============================================================================

-- Subsídios SIGMA sem mapeamento GIM
SELECT
    'Subsídios no SIGMA sem mapeamento GIM' as tipo,
    COUNT(*) as quantidade
FROM "SolicitacaoBeneficio" sb
WHERE NOT EXISTS (
    SELECT 1 FROM staging_gim.map_subsidios ms
    WHERE ms.id_sigma = sb.id
);

-- Programas ativos sem regras de negócio (CRÍTICO!)
SELECT
    'Programas ativos sem regras de negócio' as tipo,
    COUNT(*) as quantidade
FROM "Programa" p
WHERE p.ativo = true
  AND NOT EXISTS (
      SELECT 1 FROM "RegrasNegocio" r
      WHERE r."programaId" = p.id
  );

-- Todos os programas GIM foram mapeados?
SELECT
    'Programas GIM sem mapeamento SIGMA' as tipo,
    COUNT(*) as quantidade
FROM staging_gim.programas_gim pg
WHERE NOT EXISTS (
    SELECT 1 FROM staging_gim.map_programas mp
    WHERE mp.id_gim = pg.cod_programa
);
