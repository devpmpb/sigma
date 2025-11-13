-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 2: PROPRIEDADES + MÚLTIPLOS PROPRIETÁRIOS (via tabela Area)
-- ============================================================================
--
-- IMPORTANTE:
-- 1. Execute APÓS a migração de Pessoas (01-migrar-pessoas-postgresql.sql)
-- 2. Requer staging_gim.map_pessoas já populada
--
-- LÓGICA:
-- - GIM: PropriedadeRural + Area (1 propriedade = N proprietários via Area)
-- - SIGMA: Propriedade (1 dono principal) + PropriedadeCondomino (demais)
--
-- REGRA: Primeiro proprietário na tabela Area vira dono principal
--        Demais viram condôminos
--
-- Autor: Claude Code
-- Data: 2025-01-06
-- ============================================================================

-- ============================================================================
-- TABELAS DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.propriedades_gim CASCADE;
CREATE TABLE staging_gim.propriedades_gim (
    cod_propriedade BIGINT PRIMARY KEY,
    nome VARCHAR(100),
    matricula VARCHAR(50),
    itr VARCHAR(50),
    incra VARCHAR(50),
    area_total NUMERIC(10,2),
    localizacao VARCHAR(255)
);

DROP TABLE IF EXISTS staging_gim.areas_gim_completa CASCADE;
CREATE TABLE staging_gim.areas_gim_completa (
    cod_area BIGINT PRIMARY KEY,
    cod_propriedade BIGINT,
    cod_pessoa BIGINT,
    residente VARCHAR(10), -- 'SIM' ou 'NAO'
    area NUMERIC(10,2),
    situacao VARCHAR(30) -- 'PRÓPRIA', 'ARRENDADA', etc
);

DROP TABLE IF EXISTS staging_gim.map_propriedades CASCADE;
CREATE TABLE staging_gim.map_propriedades (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER NOT NULL,
    nome VARCHAR(200),
    proprietario_principal_gim BIGINT,
    proprietario_principal_sigma INTEGER,
    total_condominos INTEGER DEFAULT 0,
    migrado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INSTRUÇÕES PARA CARREGAR DADOS
-- ============================================================================

/*
Exporte do GIM e importe aqui:

-- PropriedadeRural
COPY staging_gim.propriedades_gim FROM '/path/to/propriedades_gim.csv' DELIMITER ',' CSV HEADER;

-- Area (relação pessoa-propriedade)
COPY staging_gim.areas_gim_completa FROM '/path/to/areas_gim.csv' DELIMITER ',' CSV HEADER;

Colunas esperadas nos CSVs:

propriedades_gim.csv:
codPropriedade, nome, matricula, itr, incra, areaTotal, localizacao

areas_gim.csv:
codArea, codPropriedade, codPessoa, residente, area, situacao
*/

-- ============================================================================
-- PASSO 1: MIGRAR PROPRIEDADES com PROPRIETÁRIO PRINCIPAL
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_proprietario_principal_gim BIGINT;
    v_proprietario_principal_sigma INTEGER;
    v_is_residente BOOLEAN;
    v_situacao_prop "SituacaoPropriedade";
    v_propriedade_id INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando migração de Propriedades...';

    FOR rec IN (
        SELECT DISTINCT
            p.cod_propriedade,
            TRIM(p.nome) as nome,
            TRIM(p.matricula) as matricula,
            TRIM(p.itr) as itr,
            TRIM(p.incra) as incra,
            p.area_total,
            TRIM(p.localizacao) as localizacao
        FROM staging_gim.propriedades_gim p
        WHERE p.cod_propriedade IS NOT NULL
    ) LOOP
        BEGIN
            -- Buscar proprietário principal (primeiro da tabela Area)
            SELECT
                a.cod_pessoa,
                map.id_sigma,
                CASE WHEN UPPER(TRIM(a.residente)) = 'SIM' THEN TRUE ELSE FALSE END,
                CASE
                    WHEN UPPER(TRIM(a.situacao)) LIKE '%CONDOM%' THEN 'CONDOMINIO'::text::"SituacaoPropriedade"
                    WHEN UPPER(TRIM(a.situacao)) LIKE '%USUFRUTO%' THEN 'USUFRUTO'::text::"SituacaoPropriedade"
                    ELSE 'PROPRIA'::text::"SituacaoPropriedade"
                END
            INTO
                v_proprietario_principal_gim,
                v_proprietario_principal_sigma,
                v_is_residente,
                v_situacao_prop
            FROM staging_gim.areas_gim_completa a
            INNER JOIN staging_gim.map_pessoas map ON map.id_gim = a.cod_pessoa
            WHERE a.cod_propriedade = rec.cod_propriedade
            ORDER BY a.cod_area ASC -- Primeiro registro vira dono principal
            LIMIT 1;

            -- Se não encontrou proprietário, pular
            IF v_proprietario_principal_sigma IS NULL THEN
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('PROPRIEDADE_SEM_DONO', rec.cod_propriedade, 'Propriedade sem proprietário na tabela Area');
                CONTINUE;
            END IF;

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
                localizacao,
                matricula,
                "proprietarioId",
                "createdAt",
                "updatedAt"
            ) VALUES (
                rec.nome,
                'RURAL',
                rec.area_total,
                'alqueires',
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

            -- Mapear propriedade
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

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('PROPRIEDADE', rec.cod_propriedade, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Propriedades migradas: %, Erros: %', v_count, v_errors;
END $$;

-- ============================================================================
-- PASSO 2: MIGRAR CONDÔMINOS (Demais proprietários da tabela Area)
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_total_condominos INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando migração de Condôminos...';

    FOR rec IN (
        SELECT
            map_prop.id_sigma as propriedade_id_sigma,
            map_prop.proprietario_principal_gim,
            a.cod_area,
            a.cod_pessoa as cod_pessoa_gim,
            map_pes.id_sigma as pessoa_id_sigma,
            a.area
        FROM staging_gim.areas_gim_completa a
        INNER JOIN staging_gim.map_propriedades map_prop
            ON map_prop.id_gim = a.cod_propriedade
        INNER JOIN staging_gim.map_pessoas map_pes
            ON map_pes.id_gim = a.cod_pessoa
        WHERE a.cod_pessoa != map_prop.proprietario_principal_gim -- Não incluir o dono principal
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
            VALUES ('CONDOMINO', rec.cod_area, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Condôminos migrados: %, Erros: %', v_count, v_errors;

    -- Atualizar contador de condôminos
    UPDATE staging_gim.map_propriedades map
    SET total_condominos = (
        SELECT COUNT(*)
        FROM "PropriedadeCondomino" pc
        WHERE pc."propriedadeId" = map.id_sigma
    );

END $$;

-- ============================================================================
-- PASSO 3: MIGRAR TRANSFERÊNCIAS DE PROPRIEDADE (se houver no GIM)
-- ============================================================================

-- NOTA: Verificar se existe tabela MovimentoTransferencia no GIM
-- Se sim, adaptar este script

/*
DROP TABLE IF EXISTS staging_gim.transferencias_gim CASCADE;
CREATE TABLE staging_gim.transferencias_gim (
    cod_movimento BIGINT PRIMARY KEY,
    cod_propriedade BIGINT,
    cod_proprietario_anterior BIGINT,
    cod_proprietario_novo BIGINT,
    data_transferencia DATE,
    observacoes TEXT
);

-- Carregar dados
COPY staging_gim.transferencias_gim FROM '/path/to/transferencias_gim.csv' DELIMITER ',' CSV HEADER;

-- Migrar
DO $$
DECLARE
    v_count INTEGER := 0;
    rec RECORD;
BEGIN
    FOR rec IN (
        SELECT
            map_prop.id_sigma as propriedade_id_sigma,
            map_ant.id_sigma as proprietario_anterior_id,
            map_novo.id_sigma as proprietario_novo_id,
            t.data_transferencia,
            t.observacoes
        FROM staging_gim.transferencias_gim t
        INNER JOIN staging_gim.map_propriedades map_prop ON map_prop.id_gim = t.cod_propriedade
        INNER JOIN staging_gim.map_pessoas map_ant ON map_ant.id_gim = t.cod_proprietario_anterior
        INNER JOIN staging_gim.map_pessoas map_novo ON map_novo.id_gim = t.cod_proprietario_novo
    ) LOOP
        BEGIN
            INSERT INTO "TransferenciaPropriedade" (
                "propriedadeId",
                "proprietarioAnteriorId",
                "proprietarioNovoId",
                "dataTransferencia",
                observacoes,
                "createdAt",
                "updatedAt"
            ) VALUES (
                rec.propriedade_id_sigma,
                rec.proprietario_anterior_id,
                rec.proprietario_novo_id,
                rec.data_transferencia,
                rec.observacoes,
                NOW(),
                NOW()
            );
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Ignorar erros
        END;
    END LOOP;

    RAISE NOTICE 'Transferências migradas: %', v_count;
END $$;
*/

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_propriedades INTEGER;
    v_total_condominos INTEGER;
    v_propriedades_sem_condomino INTEGER;
    v_propriedades_com_condomino INTEGER;
    v_total_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_propriedades FROM staging_gim.map_propriedades;
    SELECT COUNT(*) INTO v_total_condominos FROM "PropriedadeCondomino";
    SELECT COUNT(*) INTO v_propriedades_sem_condomino FROM staging_gim.map_propriedades WHERE total_condominos = 0;
    SELECT COUNT(*) INTO v_propriedades_com_condomino FROM staging_gim.map_propriedades WHERE total_condominos > 0;
    SELECT COUNT(*) INTO v_total_erros FROM staging_gim.log_erros WHERE etapa IN ('PROPRIEDADE', 'CONDOMINO');

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE PROPRIEDADES CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de propriedades migradas: %', v_total_propriedades;
    RAISE NOTICE 'Propriedades com 1 só dono: %', v_propriedades_sem_condomino;
    RAISE NOTICE 'Propriedades com múltiplos donos: %', v_propriedades_com_condomino;
    RAISE NOTICE 'Total de condôminos criados: %', v_total_condominos;
    RAISE NOTICE 'Total de erros: %', v_total_erros;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Ver propriedades com múltiplos donos
SELECT
    p.id,
    p.nome,
    p_dono.nome as proprietario_principal,
    COUNT(pc.*) as total_condominos
FROM "Propriedade" p
INNER JOIN "Pessoa" p_dono ON p_dono.id = p."proprietarioId"
LEFT JOIN "PropriedadeCondomino" pc ON pc."propriedadeId" = p.id AND pc."dataFim" IS NULL
GROUP BY p.id, p.nome, p_dono.nome
HAVING COUNT(pc.*) > 0
ORDER BY total_condominos DESC
LIMIT 20;

-- Comparar totais
SELECT
    'GIM' as origem,
    COUNT(DISTINCT cod_propriedade) as total_propriedades,
    COUNT(*) as total_registros_area
FROM staging_gim.areas_gim_completa
UNION ALL
SELECT
    'SIGMA' as origem,
    COUNT(*) as total_propriedades,
    COUNT(*) + (SELECT COUNT(*) FROM "PropriedadeCondomino") as total_proprietarios
FROM "Propriedade";

-- Ver erros
SELECT * FROM staging_gim.log_erros
WHERE etapa IN ('PROPRIEDADE', 'CONDOMINO')
ORDER BY data_erro DESC;

-- Verificar propriedades sem dono (erro)
SELECT COUNT(*)
FROM staging_gim.propriedades_gim p
WHERE NOT EXISTS (
    SELECT 1 FROM staging_gim.areas_gim_completa a
    WHERE a.cod_propriedade = p.cod_propriedade
);
