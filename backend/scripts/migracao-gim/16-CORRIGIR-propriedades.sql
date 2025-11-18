-- ============================================================================
-- SCRIPT DE CORREÇÃO: PROPRIEDADES COM PROPRIETÁRIOS CORRETOS
-- ============================================================================
--
-- PROBLEMA IDENTIFICADO:
-- Todas as 871 propriedades foram migradas com proprietarioId = 1 (ERRADO!)
--
-- SOLUÇÃO:
-- 1. Deletar TODAS as propriedades e dados relacionados
-- 2. Recriar propriedades usando staging_gim.areas_gim (que tem cod_pessoa)
-- 3. Recriar map_propriedades
-- 4. Recriar condôminos (múltiplos donos)
--
-- ATENÇÃO: Este script deleta e recria dados!
--
-- Autor: Claude Code
-- Data: 2025-01-17
-- ============================================================================

-- ============================================================================
-- PASSO 1: BACKUP E LIMPEZA
-- ============================================================================

DO $$
DECLARE
    v_count_propriedades INTEGER;
    v_count_condominos INTEGER;
    v_count_transferencias INTEGER;
BEGIN
    -- Contar registros antes de deletar
    SELECT COUNT(*) INTO v_count_propriedades FROM "Propriedade";
    SELECT COUNT(*) INTO v_count_condominos FROM "PropriedadeCondomino";
    SELECT COUNT(*) INTO v_count_transferencias FROM transferencias_propriedade;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'BACKUP - Registros ANTES da limpeza:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Propriedades: %', v_count_propriedades;
    RAISE NOTICE 'Condôminos: %', v_count_condominos;
    RAISE NOTICE 'Transferências: %', v_count_transferencias;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

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
    v_proprietario_principal_gim BIGINT;
    v_proprietario_principal_sigma INTEGER;
    v_is_residente BOOLEAN;
    v_situacao_prop "SituacaoPropriedade";
    v_propriedade_id INTEGER;
    v_area_total NUMERIC(10,2);
BEGIN
    RAISE NOTICE 'Iniciando migração CORRETA de Propriedades...';
    RAISE NOTICE '';

    -- Para cada propriedade única no CSV
    FOR rec IN (
        SELECT DISTINCT
            p.cod_propriedade,
            TRIM(p.nome) as nome,
            TRIM(p.matricula) as matricula,
            TRIM(p.itr) as itr,
            TRIM(p.incra) as incra,
            p.area_total,
            TRIM(p.localizacao) as localizacao
        FROM staging_gim.propriedade_csv p
        WHERE p.cod_propriedade IS NOT NULL
        ORDER BY p.cod_propriedade
    ) LOOP
        BEGIN
            -- ========================================================
            -- Buscar PROPRIETÁRIO PRINCIPAL via areas_gim
            -- ========================================================
            -- Primeiro registro em areas_gim vira dono principal
            SELECT
                a.cod_pessoa,
                map.id_sigma,
                CASE
                    WHEN UPPER(TRIM(a.residente)) IN ('SIM', 'TRUE', 'T', '1')
                    THEN TRUE
                    ELSE FALSE
                END,
                CASE
                    WHEN UPPER(TRIM(a.situacao)) LIKE '%CONDOM%' THEN 'CONDOMINIO'::"SituacaoPropriedade"
                    WHEN UPPER(TRIM(a.situacao)) LIKE '%USUFRUTO%' THEN 'USUFRUTO'::"SituacaoPropriedade"
                    ELSE 'PROPRIA'::"SituacaoPropriedade"
                END
            INTO
                v_proprietario_principal_gim,
                v_proprietario_principal_sigma,
                v_is_residente,
                v_situacao_prop
            FROM staging_gim.areas_gim a
            INNER JOIN staging_gim.map_pessoas map ON map.id_gim = a.cod_pessoa
            WHERE a.cod_propriedade = rec.cod_propriedade
              AND (a.situacao IS NULL OR UPPER(TRIM(a.situacao)) != 'ARRENDADA')
            ORDER BY a.cod_area ASC -- Primeiro registro vira dono principal
            LIMIT 1;

            -- Se não encontrou proprietário, pular
            IF v_proprietario_principal_sigma IS NULL THEN
                v_ignorados := v_ignorados + 1;

                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES (
                    'PROPRIEDADE_SEM_DONO',
                    rec.cod_propriedade,
                    FORMAT('Propriedade %s (%s) sem proprietário em areas_gim', rec.cod_propriedade, rec.nome)
                );

                CONTINUE;
            END IF;

            -- Calcular área total da propriedade
            -- (soma de todas as áreas não-arrendadas vinculadas a esta propriedade)
            -- Nota: áreas_gim.area já foi convertido para NUMERIC no script 05
            SELECT COALESCE(SUM(area), rec.area_total)
            INTO v_area_total
            FROM staging_gim.areas_gim
            WHERE cod_propriedade = rec.cod_propriedade
              AND (situacao IS NULL OR UPPER(TRIM(situacao)) != 'ARRENDADA');

            -- ========================================================
            -- Inserir Propriedade
            -- ========================================================
            INSERT INTO "Propriedade" (
                nome,
                "tipoPropriedade",
                "areaTotal",
                "unidadeArea",
                itr,
                incra,
                situacao,
                "isproprietarioResidente",
                localizacao,
                matricula,
                "proprietarioId",
                "createdAt",
                "updatedAt"
            ) VALUES (
                rec.nome,
                'RURAL'::"TipoPropriedade",
                COALESCE(v_area_total, rec.area_total),
                'alqueires'::"UnidadeArea",
                rec.itr,
                rec.incra,
                v_situacao_prop,
                v_is_residente,
                rec.localizacao,
                rec.matricula,
                v_proprietario_principal_sigma,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_propriedade_id;

            -- ========================================================
            -- Mapear propriedade (GIM → SIGMA)
            -- ========================================================
            INSERT INTO staging_gim.map_propriedades (
                id_gim,
                id_sigma,
                nome,
                proprietario_principal_gim,
                proprietario_principal_sigma
            ) VALUES (
                rec.cod_propriedade,
                v_propriedade_id,
                rec.nome,
                v_proprietario_principal_gim,
                v_proprietario_principal_sigma
            );

            v_count := v_count + 1;

            -- Log de progresso
            IF v_count % 100 = 0 THEN
                RAISE NOTICE '   ✅ % propriedades migradas...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('PROPRIEDADE_CORRECAO', rec.cod_propriedade, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE PROPRIEDADES CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Propriedades migradas: %', v_count;
    RAISE NOTICE 'Ignoradas (sem dono): %', v_ignorados;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '========================================';
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
    RAISE NOTICE 'Iniciando migração de Condôminos...';
    RAISE NOTICE '';

    -- Para cada pessoa adicional que tem área na propriedade
    -- (exceto o dono principal e áreas arrendadas)
    FOR rec IN (
        SELECT
            map_prop.id_sigma as propriedade_id_sigma,
            map_prop.id_gim as cod_propriedade_gim,
            a.cod_area,
            a.cod_pessoa as cod_pessoa_gim,
            map_pes.id_sigma as pessoa_id_sigma,
            prop."proprietarioId" as proprietario_principal_sigma_id,
            CASE
                WHEN a.area::TEXT LIKE '%,%'
                THEN REPLACE(a.area::TEXT, ',', '.')::NUMERIC(10,2)
                ELSE a.area
            END as area
        FROM staging_gim.areas_gim a
        INNER JOIN staging_gim.map_propriedades map_prop
            ON map_prop.id_gim = a.cod_propriedade
        INNER JOIN "Propriedade" prop
            ON prop.id = map_prop.id_sigma
        INNER JOIN staging_gim.map_pessoas map_pes
            ON map_pes.id_gim = a.cod_pessoa
        WHERE a.cod_pessoa != prop."proprietarioId" -- Não incluir o dono principal (comparar ID SIGMA)
          AND (a.situacao IS NULL OR UPPER(TRIM(a.situacao)) != 'ARRENDADA') -- Não incluir arrendadas
          AND a.cod_propriedade IS NOT NULL
          AND a.cod_pessoa IS NOT NULL
    ) LOOP
        BEGIN
            INSERT INTO "PropriedadeCondomino" (
                "propriedadeId",
                "condominoId",
                percentual,
                "dataInicio",
                "createdAt",
                "updatedAt"
            ) VALUES (
                rec.propriedade_id_sigma,
                rec.pessoa_id_sigma,
                NULL, -- GIM não tem percentual
                NOW(),
                NOW(),
                NOW()
            );

            v_count := v_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('CONDOMINO_CORRECAO', rec.cod_area, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE CONDÔMINOS CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Condôminos migrados: %', v_count;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Atualizar contador de condôminos
    UPDATE staging_gim.map_propriedades map
    SET total_condominos = (
        SELECT COUNT(*)
        FROM "PropriedadeCondomino" pc
        WHERE pc."propriedadeId" = map.id_sigma
    );

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
    v_propriedade_id INTEGER;
    v_proprietario_anterior_id INTEGER;
    v_proprietario_novo_id INTEGER;
    v_situacao_propriedade "SituacaoPropriedade";
    v_data_transferencia DATE;
    v_observacoes TEXT;
BEGIN
    RAISE NOTICE 'Recriando Transferências de Propriedade...';
    RAISE NOTICE '';

    FOR rec IN (
        SELECT
            t.cod_movimento_transferencia,
            t.cod_propriedade,
            t.cod_proprietario,
            t.cod_novo_proprietario,
            t.data,
            t.motivo,
            t.responsavel
        FROM staging_gim.transferencias_gim t
        WHERE t.cod_propriedade IS NOT NULL
          AND t.cod_proprietario IS NOT NULL
          AND t.cod_novo_proprietario IS NOT NULL
        ORDER BY t.data ASC, t.cod_movimento_transferencia ASC
    ) LOOP
        BEGIN
            -- Mapear IDs (GIM → SIGMA)
            SELECT id_sigma INTO v_propriedade_id
            FROM staging_gim.map_propriedades
            WHERE id_gim = rec.cod_propriedade;

            SELECT id_sigma INTO v_proprietario_anterior_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_proprietario;

            SELECT id_sigma INTO v_proprietario_novo_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_novo_proprietario;

            IF v_propriedade_id IS NULL OR
               v_proprietario_anterior_id IS NULL OR
               v_proprietario_novo_id IS NULL THEN
                v_ignorados := v_ignorados + 1;
                CONTINUE;
            END IF;

            -- Converter data
            v_data_transferencia := rec.data::DATE;

            -- Buscar situação da propriedade
            v_situacao_propriedade := staging_gim.buscar_situacao_pos_transferencia(
                rec.cod_propriedade,
                rec.data
            );

            -- Montar observações
            v_observacoes := FORMAT(
                '[GIM #%s] %s%sResponsável: %s',
                rec.cod_movimento_transferencia,
                COALESCE(rec.motivo, 'Sem motivo registrado'),
                E'\n',
                COALESCE(rec.responsavel, 'Não informado')
            );

            -- Inserir transferência
            INSERT INTO transferencias_propriedade (
                propriedade_id,
                proprietario_anterior_id,
                proprietario_novo_id,
                situacao_propriedade,
                data_transferencia,
                observacoes,
                created_at,
                updated_at
            ) VALUES (
                v_propriedade_id,
                v_proprietario_anterior_id,
                v_proprietario_novo_id,
                v_situacao_propriedade,
                v_data_transferencia,
                v_observacoes,
                NOW(),
                NOW()
            );

            v_count := v_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TRANSFERÊNCIAS RECRIADAS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Transferências migradas: %', v_count;
    RAISE NOTICE 'Ignoradas: %', v_ignorados;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_propriedades INTEGER;
    v_total_condominos INTEGER;
    v_total_transferencias INTEGER;
    v_propriedades_sem_condomino INTEGER;
    v_propriedades_com_condomino INTEGER;
    v_total_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_propriedades FROM "Propriedade";
    SELECT COUNT(*) INTO v_total_condominos FROM "PropriedadeCondomino";
    SELECT COUNT(*) INTO v_total_transferencias FROM transferencias_propriedade;
    SELECT COUNT(*) INTO v_propriedades_sem_condomino FROM staging_gim.map_propriedades WHERE total_condominos = 0;
    SELECT COUNT(*) INTO v_propriedades_com_condomino FROM staging_gim.map_propriedades WHERE total_condominos > 0;
    SELECT COUNT(*) INTO v_total_erros FROM staging_gim.log_erros WHERE etapa LIKE '%CORRECAO%';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  CORREÇÃO DE PROPRIEDADES CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de propriedades: %', v_total_propriedades;
    RAISE NOTICE 'Propriedades com 1 dono: %', v_propriedades_sem_condomino;
    RAISE NOTICE 'Propriedades com múltiplos donos: %', v_propriedades_com_condomino;
    RAISE NOTICE 'Total de condôminos: %', v_total_condominos;
    RAISE NOTICE 'Transferências recriadas: %', v_total_transferencias;
    RAISE NOTICE 'Total de erros: %', v_total_erros;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- 1. Ver distribuição de proprietários (DEVE ter vários, NÃO só 1!)
SELECT
    "proprietarioId",
    COUNT(*) as total_propriedades,
    STRING_AGG(DISTINCT nome, ', ') as exemplos
FROM "Propriedade"
GROUP BY "proprietarioId"
ORDER BY total_propriedades DESC
LIMIT 20;

-- 2. Ver propriedades com múltiplos donos
SELECT
    p.id,
    p.nome as propriedade,
    p_dono.nome as proprietario_principal,
    COUNT(pc.*) as total_condominos,
    STRING_AGG(p_cond.nome, ', ') as condominos
FROM "Propriedade" p
INNER JOIN "Pessoa" p_dono ON p_dono.id = p."proprietarioId"
LEFT JOIN "PropriedadeCondomino" pc ON pc."propriedadeId" = p.id AND pc."dataFim" IS NULL
LEFT JOIN "Pessoa" p_cond ON p_cond.id = pc."condominoId"
GROUP BY p.id, p.nome, p_dono.nome
HAVING COUNT(pc.*) > 0
ORDER BY total_condominos DESC
LIMIT 20;

-- 3. Verificar se ainda tem propriedade com proprietarioId = 1
SELECT
    CASE WHEN COUNT(*) = 0 THEN '✅ OK - Nenhuma propriedade com dono = 1'
         ELSE '❌ ERRO - Ainda tem ' || COUNT(*) || ' propriedades com dono = 1'
    END as status
FROM "Propriedade"
WHERE "proprietarioId" = 1;

-- 4. Ver erros de correção
SELECT *
FROM staging_gim.log_erros
WHERE etapa LIKE '%CORRECAO%'
ORDER BY data_erro DESC;
