-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 10: PROGRAMAS DE BENEFÍCIOS
-- ============================================================================
--
-- ARQUIVOS NECESSÁRIOS:
-- - C:\Users\marce\OneDrive\Desktop\Programa.csv
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
-- PASSO 1: CRIAR TABELA DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.programas_gim CASCADE;
CREATE TABLE staging_gim.programas_gim (
    cod_programa BIGINT,
    data_criacao TIMESTAMP,
    sumula TEXT,
    descricao TEXT,
    encerrado VARCHAR(10),
    enquadramento_unico VARCHAR(10),
    area_p VARCHAR(20),
    area_g_max VARCHAR(20),
    qtde_p VARCHAR(20),
    valor_p VARCHAR(20),
    qtde_g VARCHAR(20),
    qtde_g_max VARCHAR(20),
    valor_g VARCHAR(20),
    cod_unidade BIGINT,
    periodicidade VARCHAR(20),
    nao_baseado_area VARCHAR(10),
    liberado_arrendatarios VARCHAR(10),
    liberado_arrendatarios_nr VARCHAR(10)
);

-- Tabela de mapeamento
DROP TABLE IF EXISTS staging_gim.map_programas CASCADE;
CREATE TABLE staging_gim.map_programas (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER NOT NULL,
    nome_programa TEXT,
    migrado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PASSO 2: IMPORTAR CSV
-- ============================================================================

COPY staging_gim.programas_gim
FROM 'C:\Users\marce\OneDrive\Desktop\Programa.csv'
WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8');

-- Verificar importação
DO $$
DECLARE
    v_total_programas INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_programas FROM staging_gim.programas_gim;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTAÇÃO CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Programas importados: %', v_total_programas;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 3: FUNÇÃO PARA CONVERTER VALORES DECIMAIS
-- ============================================================================

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
-- PASSO 4: MIGRAR PROGRAMAS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_programa_id INTEGER;
    v_ativo BOOLEAN;
    v_tipo_programa VARCHAR := 'SUBSIDIO';
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRANDO PROGRAMAS';
    RAISE NOTICE '========================================';

    FOR rec IN (
        SELECT * FROM staging_gim.programas_gim
        WHERE cod_programa IS NOT NULL
        ORDER BY cod_programa
    ) LOOP
        BEGIN
            -- Determinar se está ativo (inverter "encerrado")
            v_ativo := CASE
                WHEN UPPER(TRIM(rec.encerrado)) = 'TRUE' THEN false
                WHEN UPPER(TRIM(rec.encerrado)) = 'FALSE' THEN true
                ELSE true  -- Default: ativo
            END;

            -- Determinar tipo (todos parecem ser subsídio, mas pode ajustar)
            v_tipo_programa := 'SUBSIDIO';

            -- Inserir programa
            INSERT INTO "Programa" (
                nome,
                descricao,
                "leiNumero",
                "tipoPrograma",
                secretaria,
                ativo,
                "createdAt",
                "updatedAt"
            ) VALUES (
                COALESCE(NULLIF(TRIM(rec.sumula), ''), 'Programa ' || rec.cod_programa),
                NULLIF(TRIM(rec.descricao), ''),
                NULL,  -- GIM não tem campo leiNumero
                v_tipo_programa::"TipoPrograma",
                'AGRICULTURA'::"TipoPerfil",  -- Todos parecem ser agricultura
                v_ativo,
                COALESCE(rec.data_criacao, NOW()),
                NOW()
            )
            RETURNING id INTO v_programa_id;

            -- Registrar mapeamento
            INSERT INTO staging_gim.map_programas (id_gim, id_sigma, nome_programa)
            VALUES (rec.cod_programa, v_programa_id, rec.sumula);

            v_count := v_count + 1;

            -- Log de progresso a cada 10 registros
            IF v_count % 10 = 0 THEN
                RAISE NOTICE 'Processados % programas...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('PROGRAMA', rec.cod_programa, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Programas migrados: %', v_count;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- PASSO 5: CRIAR REGRAS DE NEGÓCIO (OPCIONAL - BASEADO NOS CAMPOS DO GIM)
-- ============================================================================

/*
NOTA: O GIM tem campos fixos (area_p, valor_p, etc) mas o SIGMA usa RegrasNegocio dinâmicas.
Este passo é OPCIONAL - só execute se quiser migrar as regras automaticamente.
Caso contrário, configure as regras manualmente no frontend do SIGMA.

DO $$
DECLARE
    rec RECORD;
    v_programa_id INTEGER;
BEGIN
    RAISE NOTICE 'Criando regras de negócio...';

    FOR rec IN (
        SELECT * FROM staging_gim.programas_gim
        WHERE cod_programa IS NOT NULL
          AND valor_p IS NOT NULL
          AND TRIM(valor_p) != ''
          AND TRIM(valor_p) != '0'
    ) LOOP
        BEGIN
            -- Buscar programa no mapeamento
            SELECT id_sigma INTO v_programa_id
            FROM staging_gim.map_programas
            WHERE id_gim = rec.cod_programa;

            IF v_programa_id IS NULL THEN
                CONTINUE;
            END IF;

            -- Criar regra para pequeno produtor
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
                    'enquadramento', 'PEQUENO'
                ),
                converter_decimal_br(rec.valor_p),
                jsonb_build_object(
                    'quantidade_maxima', converter_decimal_br(rec.qtde_p)
                ),
                NOW(),
                NOW()
            );

            -- Criar regra para grande produtor (se existir)
            IF rec.valor_g IS NOT NULL AND TRIM(rec.valor_g) != '' AND TRIM(rec.valor_g) != '0' THEN
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
                        'area_maxima', converter_decimal_br(rec.area_g_max),
                        'enquadramento', 'GRANDE'
                    ),
                    converter_decimal_br(rec.valor_g),
                    jsonb_build_object(
                        'quantidade_maxima', converter_decimal_br(rec.qtde_g_max)
                    ),
                    NOW(),
                    NOW()
                );
            END IF;

        EXCEPTION WHEN OTHERS THEN
            NULL;  -- Ignora erros nas regras
        END;
    END LOOP;

    RAISE NOTICE 'Regras de negócio criadas!';
END $$;
*/

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_programas INTEGER;
    v_programas_ativos INTEGER;
    v_programas_encerrados INTEGER;
    v_total_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_programas FROM "Programa";
    SELECT COUNT(*) INTO v_programas_ativos FROM "Programa" WHERE ativo = true;
    SELECT COUNT(*) INTO v_programas_encerrados FROM "Programa" WHERE ativo = false;
    SELECT COUNT(*) INTO v_total_erros FROM staging_gim.log_erros WHERE etapa = 'PROGRAMA';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO FINAL - PROGRAMAS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de programas no SIGMA: %', v_total_programas;
    RAISE NOTICE '  - Ativos: %', v_programas_ativos;
    RAISE NOTICE '  - Encerrados: %', v_programas_encerrados;
    RAISE NOTICE 'Total de erros: %', v_total_erros;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Ver programas migrados
SELECT
    id,
    nome,
    "tipoPrograma",
    ativo,
    "createdAt"
FROM "Programa"
ORDER BY id;

-- Ver distribuição por tipo
SELECT
    "tipoPrograma",
    COUNT(*) as quantidade,
    COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
    COUNT(CASE WHEN ativo = false THEN 1 END) as encerrados
FROM "Programa"
GROUP BY "tipoPrograma";

-- Ver mapeamento GIM → SIGMA
SELECT
    mp.id_gim as cod_programa_gim,
    mp.id_sigma as id_programa_sigma,
    p.nome,
    p.ativo
FROM staging_gim.map_programas mp
INNER JOIN "Programa" p ON p.id = mp.id_sigma
ORDER BY mp.id_gim;

-- Ver erros
SELECT * FROM staging_gim.log_erros WHERE etapa = 'PROGRAMA';

-- ============================================================================
-- OBSERVAÇÕES FINAIS
-- ============================================================================

/*
IMPORTANTE:

1. Programas foram migrados com informações básicas (nome, descrição, ativo)
2. As REGRAS DE NEGÓCIO (área, valor) estão comentadas no PASSO 5
3. Você pode configurar as regras manualmente no frontend (mais flexível)
4. Ou descomentar o PASSO 5 para migração automática das regras

PRÓXIMOS PASSOS:

1. Validar programas migrados
2. Configurar regras de negócio (manual ou automático)
3. Migrar relações programa x ramo de atividade (09-migrar-ramos-atividade.sql)
4. Re-migrar subsídios (já que agora tem os programas mapeados)
*/
