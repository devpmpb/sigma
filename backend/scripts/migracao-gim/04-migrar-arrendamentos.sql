-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 4: ARRENDAMENTOS (CORRIGIDO)
-- ============================================================================
--
-- CORREÇÕES:
-- - Usa tabela areas_gim para descobrir propriedade e proprietário
-- - arrendamento.codArea → Area.codArea → Area.codPropriedade + Area.codPessoa
-- - Corrige nomes de colunas para o schema SIGMA
--
-- PRÉ-REQUISITOS:
-- 1. Script 01 executado (pessoas e propriedades migradas)
-- 2. staging_gim.areas_gim populada (Area.csv carregado)
-- 3. staging_gim.map_pessoas e map_propriedades populadas
--
-- Autor: Claude (corrigido)
-- Data: 2025-01-27
-- ============================================================================

-- ============================================================================
-- PASSO 1: CRIAR TABELA DE STAGING PARA ARRENDAMENTOS
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.arrendamentos_gim CASCADE;
CREATE TABLE staging_gim.arrendamentos_gim (
    cod_arrendamento BIGINT PRIMARY KEY,
    cod_area BIGINT,                   -- Referência à tabela Area!
    cod_arrendatario BIGINT,           -- Quem está recebendo a terra
    area NUMERIC(10,2),                -- Área arrendada
    residente VARCHAR(10),             -- true/false como string
    situacao VARCHAR(30),              -- CANCELADO, VENCIDO, ATIVO
    observacao TEXT,
    data_inicial TIMESTAMP,
    data_final TIMESTAMP
);

-- ============================================================================
-- PASSO 2: CARREGAR CSV
-- ============================================================================

COPY staging_gim.arrendamentos_gim(
    cod_arrendamento,
    cod_area,
    cod_arrendatario,
    area,
    residente,
    situacao,
    observacao,
    data_inicial,
    data_final
)
FROM 'C:/csvs/arrendamento.csv'
DELIMITER ';'
CSV HEADER
ENCODING 'UTF8';

-- Verificar carga
SELECT COUNT(*) as total_arrendamentos FROM staging_gim.arrendamentos_gim;

-- Corrigir vírgulas decimais se necessário
UPDATE staging_gim.arrendamentos_gim
SET area = REPLACE(area::TEXT, ',', '.')::NUMERIC(10,2)
WHERE area::TEXT LIKE '%,%';

-- ============================================================================
-- PASSO 3: VERIFICAR TABELA AREAS_GIM
-- ============================================================================

-- Verificar se areas_gim existe e tem dados
SELECT COUNT(*) as total_areas FROM staging_gim.areas_gim;

-- Se não existir ou estiver vazia, carregar Area.csv:
/*
DROP TABLE IF EXISTS staging_gim.areas_gim CASCADE;
CREATE TABLE staging_gim.areas_gim (
    cod_area BIGINT PRIMARY KEY,
    cod_propriedade BIGINT,
    cod_pessoa BIGINT,
    residente VARCHAR(10),
    area NUMERIC(10,2),
    situacao VARCHAR(30)
);

COPY staging_gim.areas_gim(cod_area, cod_propriedade, cod_pessoa, residente, area, situacao)
FROM 'C:/csvs/Area.csv' DELIMITER ';' CSV HEADER ENCODING 'UTF8';

UPDATE staging_gim.areas_gim
SET area = REPLACE(area::TEXT, ',', '.')::NUMERIC(10,2)
WHERE area::TEXT LIKE '%,%';
*/

-- ============================================================================
-- PASSO 4: LIMPAR DADOS ANTERIORES
-- ============================================================================

DELETE FROM staging_gim.log_erros WHERE etapa LIKE 'ARRENDAMENTO%';
DELETE FROM "Arrendamento";

-- ============================================================================
-- PASSO 5: MIGRAR ARRENDAMENTOS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_ignorados INTEGER := 0;
    v_erros INTEGER := 0;
    rec RECORD;
    v_propriedade_id INTEGER;
    v_proprietario_id INTEGER;
    v_arrendatario_id INTEGER;
    v_cod_propriedade_gim BIGINT;
    v_cod_proprietario_gim BIGINT;
    v_status VARCHAR(20);
    v_residente BOOLEAN;
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'INICIANDO MIGRAÇÃO DE ARRENDAMENTOS';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';

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
        FROM staging_gim.arrendamentos_gim arr
        WHERE arr.cod_area IS NOT NULL
          AND arr.cod_arrendatario IS NOT NULL
        ORDER BY arr.data_inicial ASC, arr.cod_arrendamento ASC
    ) LOOP
        BEGIN
            -- ========================================
            -- 1. Buscar propriedade e proprietário via AREA
            -- ========================================
            SELECT cod_propriedade, cod_pessoa
            INTO v_cod_propriedade_gim, v_cod_proprietario_gim
            FROM staging_gim.areas_gim
            WHERE cod_area = rec.cod_area
            LIMIT 1;

            IF v_cod_propriedade_gim IS NULL THEN
                v_ignorados := v_ignorados + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES (
                    'ARRENDAMENTO_AREA_NAO_ENCONTRADA',
                    rec.cod_arrendamento,
                    FORMAT('codArea %s não encontrada em areas_gim', rec.cod_area)
                );
                CONTINUE;
            END IF;

            -- ========================================
            -- 2. Mapear IDs GIM → SIGMA
            -- ========================================
            
            -- Propriedade
            SELECT id_sigma INTO v_propriedade_id
            FROM staging_gim.map_propriedades
            WHERE id_gim = v_cod_propriedade_gim;

            IF v_propriedade_id IS NULL THEN
                v_ignorados := v_ignorados + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES (
                    'ARRENDAMENTO_PROPRIEDADE_NAO_ENCONTRADA',
                    rec.cod_arrendamento,
                    FORMAT('Propriedade GIM %s não mapeada', v_cod_propriedade_gim)
                );
                CONTINUE;
            END IF;

            -- Proprietário (quem cedeu a terra)
            SELECT id_sigma INTO v_proprietario_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = v_cod_proprietario_gim;

            IF v_proprietario_id IS NULL THEN
                v_ignorados := v_ignorados + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES (
                    'ARRENDAMENTO_PROPRIETARIO_NAO_ENCONTRADO',
                    rec.cod_arrendamento,
                    FORMAT('Proprietário GIM %s não mapeado', v_cod_proprietario_gim)
                );
                CONTINUE;
            END IF;

            -- Arrendatário (quem recebeu a terra)
            SELECT id_sigma INTO v_arrendatario_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_arrendatario;

            IF v_arrendatario_id IS NULL THEN
                v_ignorados := v_ignorados + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES (
                    'ARRENDAMENTO_ARRENDATARIO_NAO_ENCONTRADO',
                    rec.cod_arrendamento,
                    FORMAT('Arrendatário GIM %s não mapeado', rec.cod_arrendatario)
                );
                CONTINUE;
            END IF;

            -- ========================================
            -- 3. Mapear status
            -- ========================================
            v_status := CASE UPPER(TRIM(COALESCE(rec.situacao, '')))
                WHEN 'ATIVO' THEN 'ativo'
                WHEN 'CANCELADO' THEN 'cancelado'
                WHEN 'VENCIDO' THEN 'vencido'
                WHEN '' THEN 
                    -- Se não tem situação, verificar pela data
                    CASE 
                        WHEN rec.data_final IS NULL THEN 'ativo'
                        WHEN rec.data_final > NOW() THEN 'ativo'
                        ELSE 'vencido'
                    END
                ELSE 'ativo'
            END;

            -- Mapear residente
            v_residente := LOWER(TRIM(COALESCE(rec.residente, 'false'))) = 'true';

            -- ========================================
            -- 4. Inserir no SIGMA
            -- ========================================
            INSERT INTO "Arrendamento" (
                "propriedadeId",
                "proprietarioId",
                "arrendatarioId",
                "areaArrendada",
                "dataInicio",
                "dataFim",
                "status",
                "residente",
                "createdAt",
                "updatedAt"
            ) VALUES (
                v_propriedade_id,
                v_proprietario_id,
                v_arrendatario_id,
                rec.area,
                rec.data_inicial,
                rec.data_final,
                v_status,
                v_residente,
                NOW(),
                NOW()
            );

            v_count := v_count + 1;

            -- Log de progresso
            IF v_count % 50 = 0 THEN
                RAISE NOTICE '   ✅ % arrendamentos migrados...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_erros := v_erros + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('ARRENDAMENTO_ERRO', rec.cod_arrendamento, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'RESULTADO DA MIGRAÇÃO DE ARRENDAMENTOS';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Arrendamentos migrados: %', v_count;
    RAISE NOTICE 'Ignorados (IDs não encontrados): %', v_ignorados;
    RAISE NOTICE 'Erros: %', v_erros;
    RAISE NOTICE '==============================================';
END $$;

-- ============================================================================
-- PASSO 6: VALIDAÇÃO
-- ============================================================================

-- 6.1 Comparar totais
SELECT 'GIM (CSV)' as origem, COUNT(*) as total FROM staging_gim.arrendamentos_gim
UNION ALL
SELECT 'SIGMA', COUNT(*) FROM "Arrendamento"
UNION ALL
SELECT 'Ignorados', COUNT(*) FROM staging_gim.log_erros WHERE etapa LIKE 'ARRENDAMENTO%';

-- 6.2 Distribuição por status
SELECT status, COUNT(*) as quantidade
FROM "Arrendamento"
GROUP BY status
ORDER BY quantidade DESC;

-- 6.3 Ver arrendamentos migrados
SELECT 
    a.id,
    prop.nome as propriedade,
    p_dono.nome as proprietario,
    p_arr.nome as arrendatario,
    a."areaArrendada",
    a."dataInicio",
    a."dataFim",
    a.status
FROM "Arrendamento" a
INNER JOIN "Propriedade" prop ON prop.id = a."propriedadeId"
INNER JOIN "Pessoa" p_dono ON p_dono.id = a."proprietarioId"
INNER JOIN "Pessoa" p_arr ON p_arr.id = a."arrendatarioId"
ORDER BY a."dataInicio" DESC
LIMIT 20;

-- 6.4 Ver erros
SELECT etapa, erro, COUNT(*) as qtd
FROM staging_gim.log_erros
WHERE etapa LIKE 'ARRENDAMENTO%'
GROUP BY etapa, erro
ORDER BY qtd DESC
LIMIT 20;

-- 6.5 Arrendamentos ativos (para verificar área efetiva depois)
SELECT 
    p_dono.nome as proprietario_cedeu,
    p_arr.nome as arrendatario_recebeu,
    a."areaArrendada"
FROM "Arrendamento" a
INNER JOIN "Pessoa" p_dono ON p_dono.id = a."proprietarioId"
INNER JOIN "Pessoa" p_arr ON p_arr.id = a."arrendatarioId"
WHERE a.status = 'ativo'
ORDER BY a."areaArrendada" DESC
LIMIT 20;