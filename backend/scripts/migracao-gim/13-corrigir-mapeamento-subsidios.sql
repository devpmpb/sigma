-- ============================================================================
-- SCRIPT DE CORREÇÃO - REMAPEAR SUBSÍDIOS PARA PROGRAMAS CORRETOS
-- ============================================================================
--
-- PROBLEMA: 24.768 subsídios caíram no programa genérico porque a função
-- mapear_enquadramento_programa() estava usando lógica errada
--
-- SOLUÇÃO: Usar o mapeamento staging_gim.map_programas (cod_programa GIM → id SIGMA)
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
    v_corrigidos INTEGER := 0;
    v_programa_generico_id INTEGER;
    v_total_a_corrigir INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORREÇÃO DE MAPEAMENTO DE SUBSÍDIOS';
    RAISE NOTICE '========================================';

    -- Buscar ID do programa genérico
    SELECT id INTO v_programa_generico_id
    FROM "Programa"
    WHERE nome ILIKE '%Migrado do GIM%'
    LIMIT 1;

    IF v_programa_generico_id IS NULL THEN
        RAISE EXCEPTION 'Programa genérico não encontrado!';
    END IF;

    -- Contar quantos precisam ser corrigidos
    SELECT COUNT(*) INTO v_total_a_corrigir
    FROM "SolicitacaoBeneficio"
    WHERE "programaId" = v_programa_generico_id;

    RAISE NOTICE 'Programa genérico ID: %', v_programa_generico_id;
    RAISE NOTICE 'Total de subsídios a corrigir: %', v_total_a_corrigir;
    RAISE NOTICE '';

    -- Atualizar os subsídios usando o mapeamento correto
    UPDATE "SolicitacaoBeneficio" sb
    SET "programaId" = mp.id_sigma,
        "updatedAt" = NOW()
    FROM staging_gim.map_subsidios ms
    INNER JOIN staging_gim.map_programas mp ON mp.id_gim = ms.cod_programa_gim
    WHERE sb.id = ms.id_sigma
      AND sb."programaId" = v_programa_generico_id
      AND mp.id_sigma IS NOT NULL;

    GET DIAGNOSTICS v_corrigidos = ROW_COUNT;

    RAISE NOTICE '';
    RAISE NOTICE 'Subsídios remapeados: %', v_corrigidos;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- RELATÓRIO PÓS-CORREÇÃO
-- ============================================================================

DO $$
DECLARE
    v_programa_generico_id INTEGER;
    v_restantes INTEGER;
BEGIN
    SELECT id INTO v_programa_generico_id
    FROM "Programa"
    WHERE nome ILIKE '%Migrado do GIM%'
    LIMIT 1;

    SELECT COUNT(*) INTO v_restantes
    FROM "SolicitacaoBeneficio"
    WHERE "programaId" = v_programa_generico_id;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO PÓS-CORREÇÃO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Subsídios ainda no programa genérico: %', v_restantes;

    IF v_restantes > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Alguns subsídios ainda estão no programa genérico.';
        RAISE NOTICE 'Isso pode ser porque:';
        RAISE NOTICE '1. cod_programa no GIM não foi encontrado na tabela map_programas';
        RAISE NOTICE '2. cod_programa estava NULL ou vazio';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ Todos os subsídios foram remapeados com sucesso!';
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- Ver distribuição atualizada
SELECT
    p.nome as programa,
    COUNT(sb.id) as qtd_beneficios,
    SUM(sb."valorCalculado") as valor_total
FROM "Programa" p
LEFT JOIN "SolicitacaoBeneficio" sb ON sb."programaId" = p.id
GROUP BY p.id, p.nome
HAVING COUNT(sb.id) > 0
ORDER BY COUNT(sb.id) DESC;

-- ============================================================================
-- INVESTIGAR VALORES ZERADOS
-- ============================================================================

-- Ver programas com valores zerados
SELECT
    p.nome as programa,
    COUNT(sb.id) as qtd_com_valor_zero,
    COUNT(CASE WHEN sb."valorCalculado" > 0 THEN 1 END) as qtd_com_valor
FROM "Programa" p
INNER JOIN "SolicitacaoBeneficio" sb ON sb."programaId" = p.id
WHERE sb."valorCalculado" = 0
GROUP BY p.id, p.nome
ORDER BY COUNT(sb.id) DESC;

-- Ver amostra de subsídios com valor zerado (staging)
SELECT
    cod_subsidio,
    cod_programa,
    quantidade,
    valor,
    situacao
FROM staging_gim.subsidios_gim
WHERE cod_programa IN (
    SELECT id_gim FROM staging_gim.map_programas
    WHERE id_sigma IN (
        SELECT DISTINCT "programaId"
        FROM "SolicitacaoBeneficio"
        WHERE "valorCalculado" = 0
    )
)
LIMIT 20;

-- ============================================================================
-- CORREÇÃO DE VALORES ZERADOS (SE NECESSÁRIO)
-- ============================================================================

/*
Se descobrir que os valores no staging_gim.subsidios_gim não estão zerados,
mas a conversão falhou, descomente este bloco:

DO $$
DECLARE
    v_corrigidos INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRIGINDO VALORES ZERADOS';
    RAISE NOTICE '========================================';

    -- Atualizar valores zerados usando dados do staging
    UPDATE "SolicitacaoBeneficio" sb
    SET
        "valorCalculado" = REPLACE(COALESCE(sg.valor, '0'), ',', '.')::NUMERIC,
        "quantidadeSolicitada" = REPLACE(COALESCE(sg.quantidade, '0'), ',', '.')::NUMERIC,
        "updatedAt" = NOW()
    FROM staging_gim.map_subsidios ms
    INNER JOIN staging_gim.subsidios_gim sg ON sg.cod_subsidio = ms.id_gim
    WHERE sb.id = ms.id_sigma
      AND sb."valorCalculado" = 0
      AND sg.valor IS NOT NULL
      AND TRIM(sg.valor) != ''
      AND TRIM(sg.valor) != '0';

    GET DIAGNOSTICS v_corrigidos = ROW_COUNT;

    RAISE NOTICE 'Valores corrigidos: %', v_corrigidos;
    RAISE NOTICE '========================================';
END $$;
*/

-- ============================================================================
-- QUERIES DE VALIDAÇÃO FINAL
-- ============================================================================

-- Distribuição final por programa
SELECT
    p.nome as programa,
    p.ativo,
    COUNT(sb.id) as qtd_beneficios,
    SUM(sb."valorCalculado") as valor_total,
    ROUND(AVG(sb."valorCalculado"), 2) as valor_medio,
    COUNT(CASE WHEN sb."valorCalculado" = 0 THEN 1 END) as qtd_zerados
FROM "Programa" p
LEFT JOIN "SolicitacaoBeneficio" sb ON sb."programaId" = p.id
GROUP BY p.id, p.nome, p.ativo
ORDER BY COUNT(sb.id) DESC;

-- Programas sem benefícios
SELECT
    p.id,
    p.nome,
    p."tipoPrograma",
    p.ativo
FROM "Programa" p
LEFT JOIN "SolicitacaoBeneficio" sb ON sb."programaId" = p.id
WHERE sb.id IS NULL
ORDER BY p.nome;
