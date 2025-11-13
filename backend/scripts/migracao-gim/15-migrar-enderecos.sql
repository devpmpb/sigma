-- ============================================================================
-- SCRIPT DE MIGRAÇÃO - ENDEREÇOS GIM → SIGMA
-- ============================================================================
--
-- OBJETIVO: Migrar endereços do GIM para o SIGMA
--
-- IMPORTANTE:
-- 1. Os logradouros do SIGMA já estão cadastrados (via seed)
-- 2. Bairros ainda não foram importados (será feito depois)
-- 3. Faremos mapeamento por NOME entre logradouros GIM e SIGMA
-- 4. Endereços sem logradouro mapeado ficarão com logradouroId NULL (para ajuste manual)
--
-- COMO EXECUTAR:
-- 1. Coloque Endereco.csv e Logradouro.csv em C:\Users\marce\Downloads\
-- 2. Execute no pgAdmin: psql -U postgres -d sigma -f 15-migrar-enderecos.sql
--
-- Autor: Claude Code
-- Data: 2025-01-13
-- ============================================================================

-- ============================================================================
-- PASSO 1: IMPORTAR CSVs PARA STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.enderecos_csv CASCADE;
CREATE TABLE staging_gim.enderecos_csv (
    codEndereco BIGINT,
    codLogradouro BIGINT,
    codBairro BIGINT,
    numero VARCHAR(20),
    apto VARCHAR(20),
    sala VARCHAR(20),
    complemento VARCHAR(200),
    cep VARCHAR(20),
    loteamento VARCHAR(100)
);

DROP TABLE IF EXISTS staging_gim.logradouros_csv CASCADE;
CREATE TABLE staging_gim.logradouros_csv (
    codLogradouro BIGINT,
    codTipoLogradouro INT,
    codCidade BIGINT,
    nome VARCHAR(200)
);

-- Importar Endereco.csv
\COPY staging_gim.enderecos_csv FROM 'C:\Users\marce\Downloads\Endereco.csv' WITH (FORMAT CSV, HEADER true, DELIMITER ';', ENCODING 'UTF8');

-- Importar Logradouro.csv
\COPY staging_gim.logradouros_csv FROM 'C:\Users\marce\Downloads\Logradouro.csv' WITH (FORMAT CSV, HEADER true, DELIMITER ';', ENCODING 'UTF8');

-- ============================================================================
-- PASSO 2: CRIAR TABELA DE MAPEAMENTO LOGRADOUROS GIM → SIGMA
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.map_logradouros;
CREATE TABLE staging_gim.map_logradouros (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER,
    nome_gim VARCHAR(200),
    nome_sigma VARCHAR(200),
    metodo_mapeamento VARCHAR(50), -- 'EXATO', 'SIMILAR', 'MANUAL'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Mapeamento EXATO (nome do GIM contém no SIGMA)
-- Ex: GIM "Continental" → SIGMA "Avenida Continental"
INSERT INTO staging_gim.map_logradouros (id_gim, id_sigma, nome_gim, nome_sigma, metodo_mapeamento)
SELECT DISTINCT
    lg.codLogradouro as id_gim,
    l.id as id_sigma,
    TRIM(lg.nome) as nome_gim,
    l.descricao as nome_sigma,
    'EXATO' as metodo_mapeamento
FROM staging_gim.logradouros_csv lg
INNER JOIN "Logradouro" l ON LOWER(l.descricao) LIKE '%' || LOWER(TRIM(lg.nome)) || '%'
WHERE lg.nome IS NOT NULL
  AND TRIM(lg.nome) != ''
ON CONFLICT (id_gim) DO NOTHING;

-- Mapeamento SIMILAR (usando SOUNDEX ou SIMILARITY - para casos com diferenças pequenas)
-- Exemplo: "Guaratuba" vs "Rua Guaratuba"
INSERT INTO staging_gim.map_logradouros (id_gim, id_sigma, nome_gim, nome_sigma, metodo_mapeamento)
SELECT DISTINCT
    lg.codLogradouro as id_gim,
    l.id as id_sigma,
    TRIM(lg.nome) as nome_gim,
    l.descricao as nome_sigma,
    'SIMILAR' as metodo_mapeamento
FROM staging_gim.logradouros_csv lg
INNER JOIN "Logradouro" l ON SIMILARITY(LOWER(TRIM(lg.nome)), LOWER(l.descricao)) > 0.4
WHERE lg.nome IS NOT NULL
  AND TRIM(lg.nome) != ''
  AND NOT EXISTS (
      SELECT 1 FROM staging_gim.map_logradouros ml
      WHERE ml.id_gim = lg.codLogradouro
  )
ON CONFLICT (id_gim) DO NOTHING;

-- ============================================================================
-- PASSO 3: MIGRAR ENDEREÇOS
-- ============================================================================

DO $$
DECLARE
    v_total_enderecos INTEGER := 0;
    v_com_logradouro INTEGER := 0;
    v_sem_logradouro INTEGER := 0;
    v_duplicados INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INICIANDO MIGRAÇÃO DE ENDEREÇOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Contar total de endereços no CSV
    SELECT COUNT(*) INTO v_total_enderecos FROM staging_gim.enderecos_csv;
    RAISE NOTICE 'Total de endereços no GIM: %', v_total_enderecos;

    -- Inserir endereços
    INSERT INTO "Endereco" (
        "pessoaId",
        "logradouroId",
        "bairroId",
        numero,
        complemento,
        cep,
        "tipoEndereco",
        principal,
        ativo,
        "createdAt",
        "updatedAt"
    )
    SELECT DISTINCT ON (mp.id_sigma, COALESCE(numero_limpo, 'S/N'))
        mp.id_sigma as pessoa_id,
        ml.id_sigma as logradouro_id,
        NULL as bairro_id, -- Será preenchido depois quando importar bairros
        CASE
            WHEN e.numero IS NULL OR TRIM(e.numero) = '' OR UPPER(TRIM(e.numero)) = 'S/N'
            THEN NULL
            ELSE TRIM(e.numero)
        END as numero_limpo,
        CASE
            WHEN e.complemento IS NOT NULL AND TRIM(e.complemento) != '' THEN TRIM(e.complemento)
            WHEN e.apto IS NOT NULL AND TRIM(e.apto) != '' THEN 'Apto ' || TRIM(e.apto)
            WHEN e.sala IS NOT NULL AND TRIM(e.sala) != '' THEN 'Sala ' || TRIM(e.sala)
            WHEN e.loteamento IS NOT NULL AND TRIM(e.loteamento) != '' THEN TRIM(e.loteamento)
            ELSE NULL
        END as complemento_final,
        CASE
            WHEN e.cep IS NOT NULL AND TRIM(e.cep) != ''
            THEN TRIM(e.cep)
            ELSE NULL
        END as cep_limpo,
        'RESIDENCIAL'::"TipoEndereco",
        true as principal, -- Marcar primeiro endereço como principal
        true as ativo,
        NOW(),
        NOW()
    FROM staging_gim.enderecos_csv e
    -- Buscar pessoa correspondente através de Propriedade
    LEFT JOIN staging_gim.propriedades_csv p ON p.codEndereco = e.codEndereco
    LEFT JOIN staging_gim.map_propriedades mpp ON mpp.id_gim = p.codImovel
    LEFT JOIN "Propriedade" prop ON prop.id = mpp.id_sigma
    LEFT JOIN staging_gim.map_pessoas mp ON mp.id_sigma = prop."proprietarioPrincipalId"
    -- Mapear logradouro
    LEFT JOIN staging_gim.map_logradouros ml ON ml.id_gim = e.codLogradouro
    WHERE mp.id_sigma IS NOT NULL -- Só migrar endereços de pessoas já migradas
    ORDER BY mp.id_sigma, COALESCE(numero_limpo, 'S/N'), e.codEndereco; -- DISTINCT ON precisa de ORDER BY

    GET DIAGNOSTICS v_com_logradouro = ROW_COUNT;
    RAISE NOTICE 'Endereços inseridos: %', v_com_logradouro;

    -- Contar quantos não tinham logradouro mapeado
    SELECT COUNT(*) INTO v_sem_logradouro
    FROM staging_gim.enderecos_csv e
    LEFT JOIN staging_gim.map_logradouros ml ON ml.id_gim = e.codLogradouro
    WHERE ml.id_sigma IS NULL AND e.codLogradouro IS NOT NULL;

    RAISE NOTICE 'Endereços sem logradouro mapeado: %', v_sem_logradouro;
    RAISE NOTICE '';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO na migração de endereços: %', SQLERRM;
    INSERT INTO staging_gim.log_erros (etapa, erro)
    VALUES ('MIGRAR_ENDERECOS', SQLERRM);
END $$;

-- ============================================================================
-- PASSO 4: RELATÓRIO DE MAPEAMENTO
-- ============================================================================

DO $$
DECLARE
    v_enderecos_migrados INTEGER;
    v_logradouros_mapeados INTEGER;
    v_logradouros_nao_mapeados INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO DE MIGRAÇÃO DE ENDEREÇOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    SELECT COUNT(*) INTO v_enderecos_migrados FROM "Endereco";
    SELECT COUNT(*) INTO v_logradouros_mapeados FROM staging_gim.map_logradouros;

    SELECT COUNT(DISTINCT e.codLogradouro) INTO v_logradouros_nao_mapeados
    FROM staging_gim.enderecos_csv e
    WHERE e.codLogradouro IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM staging_gim.map_logradouros ml
          WHERE ml.id_gim = e.codLogradouro
      );

    RAISE NOTICE 'Total de endereços no SIGMA: %', v_enderecos_migrados;
    RAISE NOTICE 'Logradouros mapeados GIM→SIGMA: %', v_logradouros_mapeados;
    RAISE NOTICE 'Logradouros SEM mapeamento: %', v_logradouros_nao_mapeados;
    RAISE NOTICE '';

    -- Mostrar logradouros não mapeados (para ajuste manual)
    IF v_logradouros_nao_mapeados > 0 THEN
        RAISE NOTICE 'ATENÇÃO: Alguns logradouros não foram mapeados automaticamente.';
        RAISE NOTICE 'Execute a query abaixo para ver quais são:';
        RAISE NOTICE '';
        RAISE NOTICE 'SELECT DISTINCT lg.codLogradouro, lg.nome, COUNT(*) as qtd_enderecos';
        RAISE NOTICE 'FROM staging_gim.enderecos_csv e';
        RAISE NOTICE 'INNER JOIN staging_gim.logradouros_csv lg ON lg.codLogradouro = e.codLogradouro';
        RAISE NOTICE 'WHERE NOT EXISTS (SELECT 1 FROM staging_gim.map_logradouros ml WHERE ml.id_gim = lg.codLogradouro)';
        RAISE NOTICE 'GROUP BY lg.codLogradouro, lg.nome';
        RAISE NOTICE 'ORDER BY COUNT(*) DESC;';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE ENDEREÇOS CONCLUÍDA';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES ÚTEIS PARA VALIDAÇÃO
-- ============================================================================

-- Ver estatísticas de mapeamento de logradouros
SELECT
    metodo_mapeamento,
    COUNT(*) as quantidade
FROM staging_gim.map_logradouros
GROUP BY metodo_mapeamento
ORDER BY COUNT(*) DESC;

-- Ver logradouros não mapeados
SELECT DISTINCT
    lg.codLogradouro,
    lg.nome as nome_gim,
    COUNT(e.codEndereco) as qtd_enderecos_afetados
FROM staging_gim.enderecos_csv e
INNER JOIN staging_gim.logradouros_csv lg ON lg.codLogradouro = e.codLogradouro
WHERE NOT EXISTS (
    SELECT 1 FROM staging_gim.map_logradouros ml
    WHERE ml.id_gim = lg.codLogradouro
)
GROUP BY lg.codLogradouro, lg.nome
ORDER BY COUNT(e.codEndereco) DESC
LIMIT 20;

-- Ver amostra de endereços migrados
SELECT
    p.nome as pessoa,
    l.descricao as logradouro,
    e.numero,
    e.complemento,
    e.cep,
    e."tipoEndereco"
FROM "Endereco" e
INNER JOIN "Pessoa" p ON p.id = e."pessoaId"
LEFT JOIN "Logradouro" l ON l.id = e."logradouroId"
ORDER BY e.id DESC
LIMIT 20;

-- Ver pessoas sem endereço
SELECT
    p.id,
    p.nome,
    p."tipoPessoa",
    p."isProdutor"
FROM "Pessoa" p
WHERE NOT EXISTS (
    SELECT 1 FROM "Endereco" e
    WHERE e."pessoaId" = p.id
)
ORDER BY p.id
LIMIT 20;
