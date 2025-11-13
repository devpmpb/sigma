-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 3: ARRENDAMENTOS
-- ============================================================================
--
-- IMPORTANTE:
-- 1. Execute APÓS migração de Pessoas e Propriedades
-- 2. Requer staging_gim.map_pessoas e staging_gim.map_propriedades populadas
--
-- ESTRUTURAS:
-- GIM: Arrendamento (codArea, codArrendatario, area, datas)
-- SIGMA: Arrendamento (propriedadeId, arrendatarioId, proprietarioId, area, datas)
--
-- DIFERENÇA: SIGMA exige proprietarioId (dono da terra) além do arrendatário
--
-- Autor: Claude Code
-- Data: 2025-01-06
-- ============================================================================

-- ============================================================================
-- TABELAS DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.arrendamentos_gim_completo CASCADE;
CREATE TABLE staging_gim.arrendamentos_gim_completo (
    cod_arrendamento BIGINT PRIMARY KEY,
    cod_area BIGINT,
    cod_arrendatario BIGINT,
    area NUMERIC(10,2),
    residente VARCHAR(15),
    situacao VARCHAR(30),
    observacao VARCHAR(255),
    data_inicial DATE,
    data_final DATE
);

DROP TABLE IF EXISTS staging_gim.map_arrendamentos CASCADE;
CREATE TABLE staging_gim.map_arrendamentos (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER NOT NULL,
    cod_propriedade_gim BIGINT,
    propriedade_id_sigma INTEGER,
    cod_arrendatario_gim BIGINT,
    arrendatario_id_sigma INTEGER,
    migrado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INSTRUÇÕES PARA CARREGAR DADOS
-- ============================================================================

/*
Exporte do GIM:

SELECT
    codArrendamento,
    codArea,
    codArrendatario,
    area,
    residente,
    situacao,
    observacao,
    dataInicial,
    dataFinal
FROM Arrendamento
WHERE situacao IS NOT NULL

Importe para PostgreSQL:
COPY staging_gim.arrendamentos_gim_completo FROM '/path/to/arrendamentos_gim.csv' DELIMITER ',' CSV HEADER;
*/

-- ============================================================================
-- PASSO 1: MIGRAR ARRENDAMENTOS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_proprietario_id INTEGER;
    v_propriedade_id INTEGER;
    v_arrendatario_id INTEGER;
    v_is_residente BOOLEAN;
    v_status VARCHAR(20);
BEGIN
    RAISE NOTICE 'Iniciando migração de Arrendamentos...';

    FOR rec IN (
        SELECT
            arr.cod_arrendamento,
            arr.cod_area,
            arr.cod_arrendatario,
            arr.area,
            arr.residente,
            arr.situacao,
            arr.observacao,
            arr.data_inicial,
            arr.data_final
        FROM staging_gim.arrendamentos_gim_completo arr
        WHERE arr.cod_arrendamento IS NOT NULL
            AND arr.cod_area IS NOT NULL
            AND arr.cod_arrendatario IS NOT NULL
    ) LOOP
        BEGIN
            -- Buscar propriedade via tabela Area
            SELECT
                map_prop.id_sigma,
                map_prop.proprietario_principal_sigma
            INTO
                v_propriedade_id,
                v_proprietario_id
            FROM staging_gim.areas_gim_completa area_gim
            INNER JOIN staging_gim.map_propriedades map_prop
                ON map_prop.id_gim = area_gim.cod_propriedade
            WHERE area_gim.cod_area = rec.cod_area
            LIMIT 1;

            -- Se não encontrou propriedade, pular
            IF v_propriedade_id IS NULL THEN
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('ARRENDAMENTO_SEM_PROPRIEDADE', rec.cod_arrendamento,
                        'Não foi possível encontrar propriedade para codArea: ' || rec.cod_area);
                CONTINUE;
            END IF;

            -- Buscar arrendatário
            SELECT id_sigma
            INTO v_arrendatario_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_arrendatario;

            IF v_arrendatario_id IS NULL THEN
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('ARRENDAMENTO_SEM_ARRENDATARIO', rec.cod_arrendamento,
                        'Arrendatário não encontrado: ' || rec.cod_arrendatario);
                CONTINUE;
            END IF;

            -- Converter residente
            v_is_residente := CASE
                WHEN UPPER(TRIM(rec.residente)) IN ('SIM', 'S', 'TRUE', '1') THEN TRUE
                ELSE FALSE
            END;

            -- Converter situação para status
            v_status := CASE
                WHEN UPPER(TRIM(rec.situacao)) LIKE '%ATIVO%' THEN 'ativo'
                WHEN UPPER(TRIM(rec.situacao)) LIKE '%CANCEL%' THEN 'cancelado'
                WHEN UPPER(TRIM(rec.situacao)) LIKE '%ENCERR%' THEN 'encerrado'
                WHEN rec.data_final IS NOT NULL AND rec.data_final < CURRENT_DATE THEN 'encerrado'
                ELSE 'ativo'
            END;

            -- Inserir arrendamento
            INSERT INTO "Arrendamento" (
                "propriedadeId",
                "proprietarioId",
                "arrendatarioId",
                "areaArrendada",
                "dataInicio",
                "dataFim",
                status,
                residente,
                "createdAt",
                "updatedAt"
            ) VALUES (
                v_propriedade_id,
                v_proprietario_id,
                v_arrendatario_id,
                rec.area,
                COALESCE(rec.data_inicial, '2000-01-01'::DATE),
                rec.data_final,
                v_status,
                v_is_residente,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_count;

            -- Mapear arrendamento
            INSERT INTO staging_gim.map_arrendamentos (
                id_gim,
                id_sigma,
                cod_propriedade_gim,
                propriedade_id_sigma,
                cod_arrendatario_gim,
                arrendatario_id_sigma
            ) VALUES (
                rec.cod_arrendamento,
                v_count,
                rec.cod_area,
                v_propriedade_id,
                rec.cod_arrendatario,
                v_arrendatario_id
            );

            v_count := v_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('ARRENDAMENTO', rec.cod_arrendamento, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Arrendamentos migrados: %, Erros: %', v_count, v_errors;
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_arrendamentos INTEGER;
    v_arrendamentos_ativos INTEGER;
    v_arrendamentos_encerrados INTEGER;
    v_total_erros INTEGER;
    v_area_total_arrendada NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_total_arrendamentos FROM staging_gim.map_arrendamentos;
    SELECT COUNT(*) INTO v_arrendamentos_ativos FROM "Arrendamento" WHERE status = 'ativo';
    SELECT COUNT(*) INTO v_arrendamentos_encerrados FROM "Arrendamento" WHERE status != 'ativo';
    SELECT COUNT(*) INTO v_total_erros FROM staging_gim.log_erros WHERE etapa LIKE 'ARRENDAMENTO%';
    SELECT COALESCE(SUM("areaArrendada"), 0) INTO v_area_total_arrendada FROM "Arrendamento" WHERE status = 'ativo';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE ARRENDAMENTOS CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de arrendamentos migrados: %', v_total_arrendamentos;
    RAISE NOTICE 'Arrendamentos ativos: %', v_arrendamentos_ativos;
    RAISE NOTICE 'Arrendamentos encerrados/cancelados: %', v_arrendamentos_encerrados;
    RAISE NOTICE 'Área total arrendada (ativa): % alqueires', v_area_total_arrendada;
    RAISE NOTICE 'Total de erros: %', v_total_erros;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Ver arrendamentos por status
SELECT
    status,
    COUNT(*) as quantidade,
    SUM("areaArrendada") as area_total
FROM "Arrendamento"
GROUP BY status
ORDER BY quantidade DESC;

-- Ver maiores arrendatários
SELECT
    p.nome as arrendatario,
    p."cpfCnpj",
    COUNT(a.id) as qtd_arrendamentos,
    SUM(a."areaArrendada") as area_total_arrendada
FROM "Arrendamento" a
INNER JOIN "Pessoa" p ON p.id = a."arrendatarioId"
WHERE a.status = 'ativo'
GROUP BY p.id, p.nome, p."cpfCnpj"
ORDER BY area_total_arrendada DESC
LIMIT 20;

-- Ver arrendamentos por propriedade
SELECT
    prop.nome as propriedade,
    proprietario.nome as proprietario,
    arrendatario.nome as arrendatario,
    a."areaArrendada",
    a."dataInicio",
    a."dataFim",
    a.status
FROM "Arrendamento" a
INNER JOIN "Propriedade" prop ON prop.id = a."propriedadeId"
INNER JOIN "Pessoa" proprietario ON proprietario.id = a."proprietarioId"
INNER JOIN "Pessoa" arrendatario ON arrendatario.id = a."arrendatarioId"
WHERE a.status = 'ativo'
ORDER BY prop.nome, a."dataInicio"
LIMIT 50;

-- Comparar totais
SELECT
    'GIM' as origem,
    COUNT(*) as total_arrendamentos,
    COUNT(CASE WHEN UPPER(situacao) LIKE '%ATIVO%' THEN 1 END) as ativos,
    SUM(area) as area_total
FROM staging_gim.arrendamentos_gim_completo
UNION ALL
SELECT
    'SIGMA' as origem,
    COUNT(*) as total_arrendamentos,
    COUNT(CASE WHEN status = 'ativo' THEN 1 END) as ativos,
    SUM("areaArrendada") as area_total
FROM "Arrendamento";

-- Ver erros
SELECT * FROM staging_gim.log_erros
WHERE etapa LIKE 'ARRENDAMENTO%'
ORDER BY data_erro DESC;

-- Verificar arrendatários que também são produtores
SELECT
    p.nome,
    p."cpfCnpj",
    p."isProdutor",
    COUNT(a.id) as qtd_arrendamentos,
    SUM(a."areaArrendada") as area_arrendada
FROM "Pessoa" p
INNER JOIN "Arrendamento" a ON a."arrendatarioId" = p.id
WHERE a.status = 'ativo'
GROUP BY p.id, p.nome, p."cpfCnpj", p."isProdutor"
ORDER BY area_arrendada DESC
LIMIT 30;
