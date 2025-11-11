-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 9: RAMOS DE ATIVIDADE + RELAÇÃO COM PROGRAMAS
-- ============================================================================
--
-- ARQUIVOS NECESSÁRIOS:
-- - C:\Users\marce\OneDrive\Desktop\ramoatividade.csv
-- - C:\Users\marce\OneDrive\Desktop\programaramoatividade.csv
--
-- PRÉ-REQUISITOS:
-- - Tabelas RamoAtividade e ProgramaRamoAtividade devem existir
-- - Programas já devem estar migrados (para mapeamento)
--
-- COMO EXECUTAR:
-- 1. Rodar migration: npx prisma migrate dev (se ainda não rodou)
-- 2. Abrir pgAdmin → Query Tool
-- 3. Executar este script completo (F5)
--
-- Autor: Claude Code
-- Data: 2025-01-10
-- ============================================================================

-- ============================================================================
-- PASSO 1: CRIAR TABELAS DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.ramoatividade_gim CASCADE;
CREATE TABLE staging_gim.ramoatividade_gim (
    cod_ramo_atividade BIGINT,
    nome VARCHAR(100),
    descricao TEXT
);

DROP TABLE IF EXISTS staging_gim.programaramoatividade_gim CASCADE;
CREATE TABLE staging_gim.programaramoatividade_gim (
    cod_programa BIGINT,
    cod_ramo_atividade BIGINT
);

-- Tabela de mapeamento
DROP TABLE IF EXISTS staging_gim.map_ramos CASCADE;
CREATE TABLE staging_gim.map_ramos (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER NOT NULL,
    nome_ramo VARCHAR(100),
    migrado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PASSO 2: IMPORTAR CSVs
-- ============================================================================

-- Importar ramoatividade.csv
COPY staging_gim.ramoatividade_gim
FROM 'C:\Users\marce\OneDrive\Desktop\ramoatividade.csv'
WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8');

-- Importar programaramoatividade.csv
COPY staging_gim.programaramoatividade_gim
FROM 'C:\Users\marce\OneDrive\Desktop\programaramoatividade.csv'
WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8');

-- Verificar importação
DO $$
DECLARE
    v_total_ramos INTEGER;
    v_total_relacoes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_ramos FROM staging_gim.ramoatividade_gim;
    SELECT COUNT(*) INTO v_total_relacoes FROM staging_gim.programaramoatividade_gim;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTAÇÃO CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Ramos de atividade importados: %', v_total_ramos;
    RAISE NOTICE 'Relações programa x ramo importadas: %', v_total_relacoes;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 3: FUNÇÃO PARA MAPEAR CATEGORIA
-- ============================================================================

CREATE OR REPLACE FUNCTION mapear_categoria_ramo(nome_ramo VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    -- Mapeia nome do ramo para categoria (ENUM AtividadeProdutiva)
    RETURN CASE
        -- Avicultura
        WHEN UPPER(nome_ramo) LIKE '%AVICULTURA%' THEN 'AVICULTURA'

        -- Suinocultura
        WHEN UPPER(nome_ramo) LIKE '%SUINO%' THEN 'SUINOCULTURA'

        -- Bovinocultura / Pecuária
        WHEN UPPER(nome_ramo) LIKE '%BOVINO%' THEN 'PECUARIA'
        WHEN UPPER(nome_ramo) LIKE '%GADO%' THEN 'PECUARIA'
        WHEN UPPER(nome_ramo) LIKE '%OVINO%' THEN 'PECUARIA'
        WHEN UPPER(nome_ramo) LIKE '%PASTAGEM%' THEN 'PECUARIA'

        -- Aquicultura
        WHEN UPPER(nome_ramo) LIKE '%PISCICULTURA%' THEN 'AQUICULTURA'
        WHEN UPPER(nome_ramo) LIKE '%PESCA%' THEN 'AQUICULTURA'

        -- Silvicultura
        WHEN UPPER(nome_ramo) LIKE '%REFLORESTAMENTO%' THEN 'SILVICULTURA'
        WHEN UPPER(nome_ramo) LIKE '%RESERVA LEGAL%' THEN 'SILVICULTURA'

        -- Hortifruti
        WHEN UPPER(nome_ramo) LIKE '%HORTALICA%' THEN 'HORTIFRUTI'
        WHEN UPPER(nome_ramo) LIKE '%HORTA%' THEN 'HORTIFRUTI'

        -- Apicultura (outros)
        WHEN UPPER(nome_ramo) LIKE '%APICULTURA%' THEN 'OUTROS'

        -- Produção agrícola
        WHEN UPPER(nome_ramo) LIKE '%MILHO%' THEN 'AGRICULTURA'
        WHEN UPPER(nome_ramo) LIKE '%SOJA%' THEN 'AGRICULTURA'
        WHEN UPPER(nome_ramo) LIKE '%MANDIOCA%' THEN 'AGRICULTURA'

        -- Exame (serviço - outros)
        WHEN UPPER(nome_ramo) LIKE '%EXAME%' THEN 'OUTROS'
        WHEN UPPER(nome_ramo) LIKE '%ULTRASSON%' THEN 'OUTROS'

        -- Default: agricultura
        ELSE 'AGRICULTURA'
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASSO 4: MIGRAR RAMOS DE ATIVIDADE
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_ramo_id INTEGER;
    v_categoria VARCHAR;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRANDO RAMOS DE ATIVIDADE';
    RAISE NOTICE '========================================';

    FOR rec IN (
        SELECT * FROM staging_gim.ramoatividade_gim
        WHERE cod_ramo_atividade IS NOT NULL
        ORDER BY cod_ramo_atividade
    ) LOOP
        BEGIN
            -- Mapear categoria
            v_categoria := mapear_categoria_ramo(rec.nome);

            -- Inserir ramo
            INSERT INTO "RamoAtividade" (
                nome,
                descricao,
                categoria,
                ativo,
                "createdAt",
                "updatedAt"
            ) VALUES (
                rec.nome,
                NULLIF(TRIM(rec.descricao), ''),
                v_categoria::"AtividadeProdutiva",
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (nome) DO UPDATE
            SET descricao = EXCLUDED.descricao,
                categoria = EXCLUDED.categoria,
                "updatedAt" = NOW()
            RETURNING id INTO v_ramo_id;

            -- Se foi UPDATE, buscar o ID
            IF v_ramo_id IS NULL THEN
                SELECT id INTO v_ramo_id
                FROM "RamoAtividade"
                WHERE nome = rec.nome;
            END IF;

            -- Registrar mapeamento
            INSERT INTO staging_gim.map_ramos (id_gim, id_sigma, nome_ramo)
            VALUES (rec.cod_ramo_atividade, v_ramo_id, rec.nome)
            ON CONFLICT (id_gim) DO UPDATE
            SET id_sigma = EXCLUDED.id_sigma;

            v_count := v_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('RAMO_ATIVIDADE', rec.cod_ramo_atividade, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Ramos migrados: %', v_count;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- PASSO 5: MIGRAR RELAÇÕES PROGRAMA X RAMO
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    v_sem_programa INTEGER := 0;
    v_sem_ramo INTEGER := 0;
    rec RECORD;
    v_programa_id INTEGER;
    v_ramo_id INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRANDO RELAÇÕES PROGRAMA X RAMO';
    RAISE NOTICE '========================================';

    FOR rec IN (
        SELECT DISTINCT * FROM staging_gim.programaramoatividade_gim
        WHERE cod_programa IS NOT NULL
          AND cod_ramo_atividade IS NOT NULL
        ORDER BY cod_programa, cod_ramo_atividade
    ) LOOP
        BEGIN
            -- Buscar programa no mapeamento
            -- NOTA: Se você ainda não migrou Programas, isso vai falhar
            -- Nesse caso, comente esta seção e execute depois

            v_programa_id := NULL;
            BEGIN
                SELECT id_sigma INTO v_programa_id
                FROM staging_gim.map_programas  -- Supondo que existe
                WHERE id_gim = rec.cod_programa;
            EXCEPTION WHEN OTHERS THEN
                -- Tabela map_programas não existe ainda
                v_programa_id := NULL;
            END;

            IF v_programa_id IS NULL THEN
                v_sem_programa := v_sem_programa + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('PROGRAMA_RAMO_SEM_PROGRAMA', rec.cod_programa,
                        'Programa não encontrado: ' || rec.cod_programa);
                CONTINUE;
            END IF;

            -- Buscar ramo no mapeamento
            SELECT id_sigma INTO v_ramo_id
            FROM staging_gim.map_ramos
            WHERE id_gim = rec.cod_ramo_atividade;

            IF v_ramo_id IS NULL THEN
                v_sem_ramo := v_sem_ramo + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('PROGRAMA_RAMO_SEM_RAMO', rec.cod_ramo_atividade,
                        'Ramo não encontrado: ' || rec.cod_ramo_atividade);
                CONTINUE;
            END IF;

            -- Inserir relação
            INSERT INTO "ProgramaRamoAtividade" (
                "programaId",
                "ramoAtividadeId",
                "createdAt"
            ) VALUES (
                v_programa_id,
                v_ramo_id,
                NOW()
            )
            ON CONFLICT ("programaId", "ramoAtividadeId") DO NOTHING;

            v_count := v_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('PROGRAMA_RAMO', rec.cod_programa, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Relações migradas: %', v_count;
    RAISE NOTICE 'Sem programa: %', v_sem_programa;
    RAISE NOTICE 'Sem ramo: %', v_sem_ramo;
    RAISE NOTICE 'Outros erros: %', v_errors;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_ramos INTEGER;
    v_total_relacoes INTEGER;
    v_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_ramos FROM "RamoAtividade";
    SELECT COUNT(*) INTO v_total_relacoes FROM "ProgramaRamoAtividade";
    SELECT COUNT(*) INTO v_erros FROM staging_gim.log_erros
    WHERE etapa LIKE 'RAMO%' OR etapa LIKE 'PROGRAMA_RAMO%';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO FINAL - RAMOS DE ATIVIDADE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de ramos no SIGMA: %', v_total_ramos;
    RAISE NOTICE 'Total de relações programa x ramo: %', v_total_relacoes;
    RAISE NOTICE 'Total de erros: %', v_erros;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Ver ramos migrados
SELECT
    id,
    nome,
    categoria,
    descricao
FROM "RamoAtividade"
ORDER BY categoria, nome;

-- Ver distribuição por categoria
SELECT
    categoria,
    COUNT(*) as quantidade
FROM "RamoAtividade"
GROUP BY categoria
ORDER BY quantidade DESC;

-- Ver programas e seus ramos (se programas já foram migrados)
SELECT
    p.id as programa_id,
    p.nome as programa,
    r.nome as ramo_atividade,
    r.categoria
FROM "ProgramaRamoAtividade" pra
INNER JOIN "Programa" p ON p.id = pra."programaId"
INNER JOIN "RamoAtividade" r ON r.id = pra."ramoAtividadeId"
ORDER BY p.nome, r.categoria, r.nome;

-- Ver erros
SELECT * FROM staging_gim.log_erros
WHERE etapa LIKE 'RAMO%' OR etapa LIKE 'PROGRAMA_RAMO%';

-- ============================================================================
-- OBSERVAÇÕES FINAIS
-- ============================================================================

/*
IMPORTANTE:

1. Se a migração de PROGRAMAS ainda não foi feita, a parte de
   ProgramaRamoAtividade vai falhar (sem problema, execute depois)

2. O mapeamento de categorias é automático baseado no nome
   Verifique se ficou correto executando:
   SELECT nome, categoria FROM "RamoAtividade";

3. Se precisar ajustar alguma categoria manualmente:
   UPDATE "RamoAtividade"
   SET categoria = 'CATEGORIA_CORRETA'
   WHERE nome = 'Nome do Ramo';

4. A tabela staging_gim.map_ramos guarda o mapeamento GIM → SIGMA
   Útil para futuras migrações

PRÓXIMOS PASSOS:

1. Validar dados migrados
2. Migrar Programas (se ainda não fez)
3. Re-executar PASSO 5 deste script (relações programa x ramo)
4. Testar no frontend que só aparecem ramos permitidos por programa
*/
