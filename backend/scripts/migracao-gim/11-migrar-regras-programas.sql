-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 11: REGRAS DE NEGÓCIO DOS PROGRAMAS
-- ============================================================================
--
-- IMPORTANTE: Este script migra os campos fixos do GIM (area_p, valor_p, etc)
-- para o modelo flexível RegrasNegocio do SIGMA
--
-- PRÉ-REQUISITO: Programas já devem estar migrados (10-migrar-programas.sql)
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
-- PASSO 1: VERIFICAR SE PROGRAMAS FORAM MIGRADOS
-- ============================================================================

DO $$
DECLARE
    v_total_programas INTEGER;
    v_total_staging INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_programas FROM "Programa";
    SELECT COUNT(*) INTO v_total_staging FROM staging_gim.programas_gim;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICAÇÃO DE PRÉ-REQUISITOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Programas no SIGMA: %', v_total_programas;
    RAISE NOTICE 'Programas no staging GIM: %', v_total_staging;

    IF v_total_programas = 0 THEN
        RAISE EXCEPTION 'ERRO: Nenhum programa encontrado! Execute primeiro 10-migrar-programas.sql';
    END IF;

    IF v_total_staging = 0 THEN
        RAISE EXCEPTION 'ERRO: Dados staging não encontrados! Execute primeiro 10-migrar-programas.sql';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 2: FUNÇÃO PARA CONVERTER DECIMAIS
-- ============================================================================

CREATE OR REPLACE FUNCTION converter_decimal_br(valor_texto VARCHAR)
RETURNS NUMERIC AS $$
BEGIN
    RETURN REPLACE(COALESCE(valor_texto, '0'), ',', '.')::NUMERIC;
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASSO 3: CRIAR REGRAS DE NEGÓCIO PARA PROGRAMAS
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_programa_id INTEGER;
    v_count_pequeno INTEGER := 0;
    v_count_grande INTEGER := 0;
    v_count_unico INTEGER := 0;
    v_errors INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CRIANDO REGRAS DE NEGÓCIO';
    RAISE NOTICE '========================================';

    -- Limpar regras existentes (se re-executar o script)
    DELETE FROM "RegrasNegocio" WHERE "programaId" IN (
        SELECT id_sigma FROM staging_gim.map_programas
    );

    FOR rec IN (
        SELECT * FROM staging_gim.programas_gim
        WHERE cod_programa IS NOT NULL
        ORDER BY cod_programa
    ) LOOP
        BEGIN
            -- Buscar programa no mapeamento
            SELECT id_sigma INTO v_programa_id
            FROM staging_gim.map_programas
            WHERE id_gim = rec.cod_programa;

            IF v_programa_id IS NULL THEN
                RAISE NOTICE 'Programa % não encontrado no mapeamento', rec.cod_programa;
                CONTINUE;
            END IF;

            -- Verificar se tem enquadramento único (todos recebem o mesmo)
            IF UPPER(TRIM(rec.enquadramento_unico)) = 'TRUE' THEN
                -- REGRA ÚNICA (não diferencia pequeno/grande)
                IF rec.qtde_g IS NOT NULL AND TRIM(rec.qtde_g) != '' AND converter_decimal_br(rec.qtde_g) > 0 THEN
                    INSERT INTO "RegrasNegocio" (
                        "programaId",
                        "tipoRegra",
                        parametro,
                        "valorBeneficio",
                        "limiteBeneficio",
                        "createdAt",
                        "updatedAt"
                    ) VALUES (
                        v_programa_id,
                        'enquadramento_unico',
                        jsonb_build_object(
                            'tipo', 'UNICO',
                            'descricao', 'Programa com enquadramento único - todos produtores recebem o mesmo valor'
                        ),
                        converter_decimal_br(rec.valor_g),
                        jsonb_build_object(
                            'quantidade_maxima', converter_decimal_br(rec.qtde_g),
                            'quantidade_maxima_grande', converter_decimal_br(rec.qtde_g_max)
                        ),
                        NOW(),
                        NOW()
                    );

                    v_count_unico := v_count_unico + 1;
                END IF;

            ELSE
                -- TEM DIFERENCIAÇÃO PEQUENO/GRANDE PRODUTOR

                -- REGRA PARA PEQUENO PRODUTOR
                IF rec.valor_p IS NOT NULL AND TRIM(rec.valor_p) != '' AND converter_decimal_br(rec.valor_p) > 0 THEN
                    INSERT INTO "RegrasNegocio" (
                        "programaId",
                        "tipoRegra",
                        parametro,
                        "valorBeneficio",
                        "limiteBeneficio",
                        "createdAt",
                        "updatedAt"
                    ) VALUES (
                        v_programa_id,
                        'area_efetiva',
                        jsonb_build_object(
                            'area_maxima', converter_decimal_br(rec.area_p),
                            'enquadramento', 'PEQUENO',
                            'descricao', 'Pequeno produtor - área efetiva até ' || rec.area_p || ' alqueires'
                        ),
                        converter_decimal_br(rec.valor_p),
                        jsonb_build_object(
                            'quantidade_maxima', converter_decimal_br(rec.qtde_p),
                            'periodicidade_meses', COALESCE(converter_decimal_br(rec.periodicidade)::INTEGER, 12)
                        ),
                        NOW(),
                        NOW()
                    );

                    v_count_pequeno := v_count_pequeno + 1;
                END IF;

                -- REGRA PARA GRANDE PRODUTOR
                IF rec.valor_g IS NOT NULL AND TRIM(rec.valor_g) != '' AND converter_decimal_br(rec.valor_g) > 0 THEN
                    INSERT INTO "RegrasNegocio" (
                        "programaId",
                        "tipoRegra",
                        parametro,
                        "valorBeneficio",
                        "limiteBeneficio",
                        "createdAt",
                        "updatedAt"
                    ) VALUES (
                        v_programa_id,
                        'area_efetiva',
                        jsonb_build_object(
                            'area_minima', converter_decimal_br(rec.area_p),
                            'area_maxima', CASE
                                WHEN rec.area_g_max IS NOT NULL AND TRIM(rec.area_g_max) != '' AND TRIM(rec.area_g_max) != '0'
                                THEN converter_decimal_br(rec.area_g_max)
                                ELSE NULL
                            END,
                            'enquadramento', 'GRANDE',
                            'descricao', 'Grande produtor - área efetiva acima de ' || rec.area_p || ' alqueires'
                        ),
                        converter_decimal_br(rec.valor_g),
                        jsonb_build_object(
                            'quantidade_maxima', converter_decimal_br(rec.qtde_g),
                            'quantidade_maxima_absoluta', CASE
                                WHEN rec.qtde_g_max IS NOT NULL AND TRIM(rec.qtde_g_max) != '' AND TRIM(rec.qtde_g_max) != '0'
                                THEN converter_decimal_br(rec.qtde_g_max)
                                ELSE NULL
                            END,
                            'periodicidade_meses', COALESCE(converter_decimal_br(rec.periodicidade)::INTEGER, 12)
                        ),
                        NOW(),
                        NOW()
                    );

                    v_count_grande := v_count_grande + 1;
                END IF;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('REGRA_NEGOCIO', rec.cod_programa, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Regras criadas:';
    RAISE NOTICE '  - Pequeno Produtor: %', v_count_pequeno;
    RAISE NOTICE '  - Grande Produtor: %', v_count_grande;
    RAISE NOTICE '  - Enquadramento Único: %', v_count_unico;
    RAISE NOTICE '  - Erros: %', v_errors;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_regras INTEGER;
    v_programas_com_regras INTEGER;
    v_programas_sem_regras INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_regras FROM "RegrasNegocio";

    SELECT COUNT(DISTINCT "programaId") INTO v_programas_com_regras
    FROM "RegrasNegocio";

    SELECT COUNT(*) INTO v_programas_sem_regras
    FROM "Programa" p
    WHERE NOT EXISTS (
        SELECT 1 FROM "RegrasNegocio" r WHERE r."programaId" = p.id
    );

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO FINAL - REGRAS DE NEGÓCIO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de regras criadas: %', v_total_regras;
    RAISE NOTICE 'Programas com regras: %', v_programas_com_regras;
    RAISE NOTICE 'Programas sem regras: %', v_programas_sem_regras;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Ver regras por programa
SELECT
    p.id,
    p.nome as programa,
    COUNT(r.id) as qtd_regras,
    STRING_AGG(
        r."tipoRegra" || ': R$ ' || r."valorBeneficio"::TEXT,
        ', '
    ) as regras
FROM "Programa" p
LEFT JOIN "RegrasNegocio" r ON r."programaId" = p.id
GROUP BY p.id, p.nome
ORDER BY p.id;

-- Ver detalhes de uma regra específica
SELECT
    p.nome as programa,
    r."tipoRegra",
    r.parametro,
    r."valorBeneficio",
    r."limiteBeneficio"
FROM "RegrasNegocio" r
INNER JOIN "Programa" p ON p.id = r."programaId"
ORDER BY p.nome, r.id
LIMIT 20;

-- Ver programas sem regras
SELECT
    p.id,
    p.nome,
    p."tipoPrograma",
    p.ativo
FROM "Programa" p
WHERE NOT EXISTS (
    SELECT 1 FROM "RegrasNegocio" r WHERE r."programaId" = p.id
)
ORDER BY p.id;

-- Ver distribuição de tipos de regras
SELECT
    "tipoRegra",
    COUNT(*) as quantidade,
    AVG("valorBeneficio") as valor_medio,
    MIN("valorBeneficio") as valor_minimo,
    MAX("valorBeneficio") as valor_maximo
FROM "RegrasNegocio"
GROUP BY "tipoRegra";

-- Exemplo: Ver regras do programa de Adubo Orgânico
SELECT
    p.nome as programa,
    r."tipoRegra",
    r.parametro->>'enquadramento' as enquadramento,
    r.parametro->>'area_maxima' as area_maxima,
    r."valorBeneficio" as valor,
    r."limiteBeneficio"->>'quantidade_maxima' as qtd_maxima
FROM "RegrasNegocio" r
INNER JOIN "Programa" p ON p.id = r."programaId"
WHERE p.nome ILIKE '%adubo%'
ORDER BY r.id;

-- ============================================================================
-- OBSERVAÇÕES FINAIS
-- ============================================================================

/*
ESTRUTURA DAS REGRAS CRIADAS:

1. REGRA PARA PEQUENO PRODUTOR:
   - tipoRegra: 'area_efetiva'
   - parametro: {
       area_maxima: 14.52,
       enquadramento: 'PEQUENO'
     }
   - valorBeneficio: 0.07
   - limiteBeneficio: {
       quantidade_maxima: 2066.11,
       periodicidade_meses: 24
     }

2. REGRA PARA GRANDE PRODUTOR:
   - tipoRegra: 'area_efetiva'
   - parametro: {
       area_minima: 14.52,
       area_maxima: null (sem limite),
       enquadramento: 'GRANDE'
     }
   - valorBeneficio: 0.05
   - limiteBeneficio: {
       quantidade_maxima: 2066.11,
       quantidade_maxima_absoluta: 15000
     }

3. REGRA DE ENQUADRAMENTO ÚNICO:
   - tipoRegra: 'enquadramento_unico'
   - parametro: { tipo: 'UNICO' }
   - valorBeneficio: X
   - limiteBeneficio: { quantidade_maxima: Y }

PRÓXIMOS PASSOS:

1. Validar regras criadas
2. Testar cálculo de benefícios no backend
3. Ajustar frontend para usar RegrasNegocio
4. (Opcional) Adicionar regras customizadas manualmente
*/
