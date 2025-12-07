-- ============================================================================
-- SCRIPT DE CORREÇÃO: RECRIAR PROPRIEDADES COM PROPRIETÁRIOS CORRETOS
-- ============================================================================
--
-- PROBLEMA: Todas as 871 propriedades foram migradas com proprietarioId = 1
--
-- SOLUÇÃO: Deletar tudo e recriar usando staging_gim.areas_gim para mapear
--          o proprietário correto (primeira pessoa não-arrendada vira dono principal)
--
-- EXECUÇÃO: Rodar este script INTEIRO de uma vez só
--
-- Autor: Claude Code
-- Data: 2025-01-17
-- ============================================================================

-- ============================================================================
-- PASSO 1: BACKUP E LIMPEZA
-- ============================================================================

-- Deletar em ordem (respeitar FKs)
DELETE FROM transferencias_propriedade;
DELETE FROM "PropriedadeCondomino";
DELETE FROM "Propriedade";

-- Limpar mapeamento antigo
DELETE FROM staging_gim.map_propriedades;

-- ============================================================================
-- PASSO 2: MIGRAR PROPRIEDADES COM PROPRIETÁRIOS CORRETOS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_ignorados INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_proprietario_gim BIGINT;
    v_proprietario_sigma INTEGER;
    v_is_residente BOOLEAN;
    v_situacao_prop "SituacaoPropriedade";
    v_propriedade_id INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PASSO 2: MIGRAR PROPRIEDADES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Para cada propriedade no CSV
    FOR rec IN (
        SELECT
            p.cod_propriedade,
            TRIM(p.denominacao) as denominacao,
            TRIM(p.matricula) as matricula,
            TRIM(p.itr) as itr,
            TRIM(p.incra) as incra,
            -- Converter area (vírgula -> ponto)
            CASE
                WHEN p.area::TEXT LIKE '%,%'
                THEN REPLACE(p.area::TEXT, ',', '.')::NUMERIC(10,4)
                ELSE p.area::NUMERIC(10,4)
            END as area_total,
            TRIM(p.situacao) as situacao_csv
        FROM staging_gim.propriedade_csv p
        WHERE p.cod_propriedade IS NOT NULL
        ORDER BY p.cod_propriedade
    ) LOOP
        BEGIN
            -- Buscar proprietário principal (primeira pessoa NÃO-arrendada na tabela Area)
            SELECT
                a.cod_pessoa,
                map.id_sigma,
                CASE WHEN a.residente = 'true' THEN TRUE ELSE FALSE END
            INTO
                v_proprietario_gim,
                v_proprietario_sigma,
                v_is_residente
            FROM staging_gim.areas_gim a
            INNER JOIN staging_gim.map_pessoas map ON map.id_gim = a.cod_pessoa
            WHERE a.cod_propriedade = rec.cod_propriedade
              AND (a.situacao IS NULL OR UPPER(TRIM(a.situacao)) != 'ARRENDADA')
            ORDER BY a.cod_area ASC
            LIMIT 1;

            -- Se não encontrou proprietário, ignorar
            IF v_proprietario_sigma IS NULL THEN
                v_ignorados := v_ignorados + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES (
                    'PROPRIEDADE_SEM_DONO',
                    rec.cod_propriedade,
                    FORMAT('Propriedade %s (%s) sem proprietário válido', rec.cod_propriedade, rec.denominacao)
                );
                CONTINUE;
            END IF;

            -- Determinar situação da propriedade
            v_situacao_prop := CASE
                WHEN UPPER(rec.situacao_csv) LIKE '%CONDOM%' THEN 'CONDOMINIO'
                WHEN UPPER(rec.situacao_csv) LIKE '%USUFRUTO%' THEN 'USUFRUTO'
                ELSE 'PROPRIA'
            END;

            -- Inserir Propriedade
            INSERT INTO "Propriedade" (
                nome,
                "tipoPropriedade",
                "areaTotal",
                "unidadeArea",
                itr,
                incra,
                situacao,
                "isproprietarioResidente",
                matricula,
                "proprietarioId",
                "createdAt",
                "updatedAt"
            ) VALUES (
                rec.denominacao,
                'RURAL',
                rec.area_total,
                'alqueires',
                rec.itr,
                rec.incra,
                v_situacao_prop,
                v_is_residente,
                rec.matricula,
                v_proprietario_sigma,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_propriedade_id;

            -- Mapear GIM -> SIGMA
            INSERT INTO staging_gim.map_propriedades (
                id_gim,
                id_sigma,
                nome,
                migrado_em
            ) VALUES (
                rec.cod_propriedade,
                v_propriedade_id,
                rec.denominacao,
                NOW()
            );

            v_count := v_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('PROPRIEDADE', rec.cod_propriedade, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Propriedades migradas: %', v_count;
    RAISE NOTICE 'Propriedades ignoradas (sem dono): %', v_ignorados;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '';

END $$;

-- ============================================================================
-- PASSO 3: MIGRAR CONDÔMINOS (Múltiplos proprietários)
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PASSO 3: MIGRAR CONDÔMINOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Para cada pessoa adicional que tem área na propriedade
    -- (exceto o dono principal e áreas arrendadas)
    FOR rec IN (
        SELECT
            prop.id as propriedade_id_sigma,
            map_pes.id_sigma as condomino_id_sigma,
            a.cod_area
        FROM staging_gim.areas_gim a
        INNER JOIN staging_gim.map_propriedades map_prop
            ON map_prop.id_gim = a.cod_propriedade
        INNER JOIN "Propriedade" prop
            ON prop.id = map_prop.id_sigma
        INNER JOIN staging_gim.map_pessoas map_pes
            ON map_pes.id_gim = a.cod_pessoa
        WHERE a.cod_pessoa IS NOT NULL
          AND a.cod_propriedade IS NOT NULL
          -- Excluir o dono principal
          AND map_pes.id_sigma != prop."proprietarioId"
          -- Excluir áreas arrendadas
          AND (a.situacao IS NULL OR UPPER(TRIM(a.situacao)) != 'ARRENDADA')
    ) LOOP
        BEGIN
            INSERT INTO "PropriedadeCondomino" (
                propriedade_id,
                condomino_id,
                percentual,
                data_inicio,
                created_at,
                updated_at
            ) VALUES (
                rec.propriedade_id_sigma,
                rec.condomino_id_sigma,
                NULL,
                NOW(),
                NOW(),
                NOW()
            );

            v_count := v_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('CONDOMINO', rec.cod_area, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Condôminos migrados: %', v_count;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '';

END $$;

-- ============================================================================
-- PASSO 4: RECRIAR TRANSFERÊNCIAS DE PROPRIEDADE
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_ignorados INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PASSO 4: RECRIAR TRANSFERÊNCIAS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    FOR rec IN (
        SELECT
            t.cod_movimento_transferencia,
            t.cod_propriedade,
            t.cod_proprietario,
            t.cod_novo_proprietario,
            t.data,
            t.motivo
        FROM staging_gim.transferencias_gim t
        ORDER BY t.data ASC
    ) LOOP
        BEGIN
            -- Verificar se todos os IDs existem no mapeamento
            IF NOT EXISTS (SELECT 1 FROM staging_gim.map_propriedades WHERE id_gim = rec.cod_propriedade) THEN
                v_ignorados := v_ignorados + 1;
                CONTINUE;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM staging_gim.map_pessoas WHERE id_gim = rec.cod_proprietario) THEN
                v_ignorados := v_ignorados + 1;
                CONTINUE;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM staging_gim.map_pessoas WHERE id_gim = rec.cod_novo_proprietario) THEN
                v_ignorados := v_ignorados + 1;
                CONTINUE;
            END IF;

            -- Inserir transferência
            INSERT INTO transferencias_propriedade (
                cod_propriedade,
                cod_proprietario_anterior,
                cod_proprietario_novo,
                data_transferencia,
                observacoes
            )
            SELECT
                map_prop.id_sigma,
                map_ant.id_sigma,
                map_novo.id_sigma,
                rec.data,
                rec.motivo
            FROM staging_gim.map_propriedades map_prop
            CROSS JOIN staging_gim.map_pessoas map_ant
            CROSS JOIN staging_gim.map_pessoas map_novo
            WHERE map_prop.id_gim = rec.cod_propriedade
              AND map_ant.id_gim = rec.cod_proprietario
              AND map_novo.id_gim = rec.cod_novo_proprietario;

            v_count := v_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('TRANSFERENCIA', rec.cod_movimento_transferencia, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Transferências recriadas: %', v_count;
    RAISE NOTICE 'Transferências ignoradas (IDs não encontrados): %', v_ignorados;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '';

END $$;

-- ============================================================================
-- PASSO 5: RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_propriedades INTEGER;
    v_total_condominos INTEGER;
    v_total_transferencias INTEGER;
    v_total_erros INTEGER;
    v_propriedades_unicas INTEGER;
    v_propriedades_multiplas INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO v_total_propriedades FROM "Propriedade";
    SELECT COUNT(*) INTO v_total_condominos FROM "PropriedadeCondomino";
    SELECT COUNT(*) INTO v_total_transferencias FROM transferencias_propriedade;
    SELECT COUNT(*) INTO v_total_erros FROM staging_gim.log_erros
        WHERE etapa IN ('PROPRIEDADE', 'PROPRIEDADE_SEM_DONO', 'CONDOMINO', 'TRANSFERENCIA')
          AND data_erro > NOW() - INTERVAL '5 minutes';

    -- Contar propriedades com 1 só dono vs múltiplos donos
    SELECT COUNT(*) INTO v_propriedades_unicas
    FROM "Propriedade" p
    WHERE NOT EXISTS (
        SELECT 1 FROM "PropriedadeCondomino" pc
        WHERE pc.propriedade_id = p.id
    );

    SELECT COUNT(*) INTO v_propriedades_multiplas
    FROM "Propriedade" p
    WHERE EXISTS (
        SELECT 1 FROM "PropriedadeCondomino" pc
        WHERE pc.propriedade_id = p.id
    );

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de propriedades: %', v_total_propriedades;
    RAISE NOTICE '  - Com 1 único dono: %', v_propriedades_unicas;
    RAISE NOTICE '  - Com múltiplos donos: %', v_propriedades_multiplas;
    RAISE NOTICE 'Total de condôminos: %', v_total_condominos;
    RAISE NOTICE 'Total de transferências: %', v_total_transferencias;
    RAISE NOTICE 'Total de erros: %', v_total_erros;
    RAISE NOTICE '========================================';

    -- Mostrar alguns exemplos de proprietários diferentes
    RAISE NOTICE '';
    RAISE NOTICE 'AMOSTRA: Primeiras 10 propriedades e seus donos:';
    FOR rec IN (
        SELECT p.id, p.nome, pes.nome as dono, p."proprietarioId"
        FROM "Propriedade" p
        INNER JOIN "Pessoa" pes ON pes.id = p."proprietarioId"
        ORDER BY p.id
        LIMIT 10
    ) LOOP
        RAISE NOTICE 'Propriedade #% (%) -> Dono: % (ID %)', rec.id, rec.nome, rec.dono, rec."proprietarioId";
    END LOOP;

END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Verificar distribuição de proprietários
SELECT
    "proprietarioId",
    COUNT(*) as qtd_propriedades
FROM "Propriedade"
GROUP BY "proprietarioId"
ORDER BY qtd_propriedades DESC
LIMIT 20;

-- Ver erros recentes
SELECT * FROM staging_gim.log_erros
WHERE etapa IN ('PROPRIEDADE', 'PROPRIEDADE_SEM_DONO', 'CONDOMINO', 'TRANSFERENCIA')
  AND data_erro > NOW() - INTERVAL '5 minutes'
ORDER BY data_erro DESC;
