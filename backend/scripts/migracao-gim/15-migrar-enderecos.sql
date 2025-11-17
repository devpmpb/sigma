-- ============================================================================
-- SCRIPT DE MIGRAÇÃO - ENDEREÇOS GIM → SIGMA (PostgreSQL)
-- ============================================================================
--
-- OBJETIVO: Migrar endereços do GIM para o SIGMA
--
-- IMPORTANTE:
-- 1. Este script é para PostgreSQL (banco SIGMA)
-- 2. Os logradouros do SIGMA já estão cadastrados (via seed)
-- 3. Bairros ainda não foram importados (será feito depois)
-- 4. Faremos mapeamento por NOME entre logradouros GIM e SIGMA
-- 5. No GIM, Pessoa tem campo codEndereco que aponta direto para Endereco (relação 1:1)
-- 6. Precisamos ter staging_gim.pessoas_csv já importada (do script 01-migrar-pessoas.sql)
--
-- COMO EXECUTAR:
-- 1. Coloque Endereco.csv e Logradouro.csv em C:\Users\marce\Downloads\
-- 2. Execute no DBeaver ou psql conectado ao banco SIGMA (PostgreSQL)
-- 3. OU use o pgAdmin do PostgreSQL (não o SQL Server Management Studio)
--
-- Autor: Claude Code
-- Data: 2025-01-13
-- ============================================================================

-- ============================================================================
-- PASSO 1: CRIAR E IMPORTAR TABELA DE LOGRADOUROS DO GIM
-- ============================================================================

-- Criar tabela temporária para importar CSV
DROP TABLE IF EXISTS staging_gim.logradouro_csv CASCADE;
CREATE TEMP TABLE temp_logradouros (
    codLogradouro TEXT,
    codTipoLogradouro TEXT,
    codCidade TEXT,
    nome TEXT
);

-- Importar dados dos logradouros do GIM
INSERT INTO temp_logradouros (codLogradouro, codTipoLogradouro, codCidade, nome) VALUES
('1','1','1','Continental'),
('2','2','1','Guaratuba'),
('3','2','1','Florianópolis'),
('4','2','1','Araponga'),
('5','4','1','KM-05'),
('6','4','1','KM-13'),
('7','4','1','Arroio Fundo'),
('8','4','1','Flor do Sertão'),
('9','4','1','São Francisco'),
('10','4','1','Dois Vizinhos'),
('11','4','1','Itapiranga'),
('12','4','1','Barigui'),
('13','4','1','XV de Novembro'),
('14','4','1','Oriental'),
('15','4','1','Cristal'),
('16','4','1','KM-09'),
('17','4','1','Progresso'),
('18','2','1','Tibagi'),
('19','2','1','Itararé'),
('20','2','4','Ponta Grossa'),
('22','4','5','Flor de Maio'),
('23','1','1','Willy Barth'),
('24','2','1','Guaíra'),
('26','2','1','do Poente'),
('27','4','2','Divisa'),
('28','4','4','Vila Ipiranga'),
('29','4','4','Dez de Maio'),
('30','4','7','Mathias Lenz'),
('32','4','1','Km-10'),
('33','2','8','Salgueiro'),
('34','4','10','Sanga Mineira'),
('35','2','1','Paranaguá'),
('36','4','2','Fátima'),
('38','4','2','Felicidade'),
('39','2','1','Londrina'),
('40','2','11','xxx'),
('41','2','12','xx'),
('42','2','2','Arsenio Backes'),
('43','2','3','XV de Novembro'),
('44','2','1','Apucarana'),
('45','2','3','Minas Gerais'),
('46','4','13','Três Passos'),
('47','4','3','Ajuricaba'),
('48','4','14','Fazenda'),
('49','2','3','Dom João VI'),
('50','2','1','Curitiba'),
('51','4','3','Wilhelm'),
('53','1','4','Senador Atilio Fontana'),
('55','2','15','Nossa Senhora de Fatima'),
('56','2','1','Pe. Alouis Mark'),
('57','2','3','Florianopolis'),
('58','4','3','São Roque'),
('59','2','3','Rio de Janeiro'),
('60','2','1','Rolandia'),
('61','2','16','Fazenda'),
('62','2','1','Tancredo Neves'),
('64','2','1','Guarapuava'),
('65','4','3','BNH'),
('66','4','3','São João'),
('67','4','3','Margarida'),
('69','3','3','Ari Branco da Rosa'),
('70','4','3','Santo Angelo'),
('71','4','17','Jaguarandi'),
('72','4','3','Campo Sales - Margarida'),
('73','2','2','Uruguai'),
('75','2','1','Maringá'),
('77','3','3','Novo Horizonte'),
('78','4','3','Flor do Oeste'),
('79','4','5','Flor do Oeste'),
('81','4','3','Curvado'),
('82','2','18','Centro'),
('83','2','3','Tiradentes'),
('84','4','3','Guavira'),
('85','2','8','Minas Gerais'),
('86','2','2','Amazonas'),
('88','2','1','Ponta Grossa'),
('89','1','4','Attilio Fontana'),
('90','2','1','Getúlio Vargas'),
('91','1','19','Prefeito Omar Sabbag'),
('92','2','3','Cabral'),
('93','2','4','Guarani'),
('94','4','1','Porto Britânia'),
('95','2','4','Santos Dumont'),
('96','2','8','Rio de Janeiro'),
('97','2','4','XV de Novembro'),
('98','2','3','Santa Catarina'),
('99','2','4','Largo Chico Mendes'),
('100','2','1','Goiás'),
('102','2','2','Tocantins'),
('103','2','1','Campo Mourão'),
('104','2','21','Paraguai'),
('105','2','1','Das Flores'),
('106','2','22','Pirai'),
('107','1','23','Anita Garibaldi'),
('108','1','15','Brasil'),
('109','2','1','Cascavel'),
('110','2','4','Nossa Senhora do Rocio'),
('111','2','4','Sarandi'),
('113','2','4','Independência'),
('114','2','3','Mato Grosso'),
('115','1','15','Rio Grande do Sul'),
('116','1','24','Angelo Moreira da Fonseca'),
('117','2','8','Castro alves'),
('118','2','1','Hugo Franck'),
('119','4','5','Palmitos'),
('120','2','8','Maranhão'),
('121','2','4','Piratini'),
('122','2','1','Guaira'),
('123','4','1','KM-03'),
('124','2','21','PARAGUAI'),
('125','2','21','PARANÁ'),
('126','2','1','PARANA'),
('127','1','8','Brasil'),
('128','2','4','Almirante Barroso'),
('129','2','3','Amapá'),
('130','1','26','Otavio Tosta'),
('131','2','4','Rio Grande do Sul'),
('132','2','27','Manoel Bento'),
('133','2','19','TEN MUNIZ DE ARAGAO'),
('134','2','4','Joana pressoto'),
('135','2','3','Marechal Deodoro'),
('136','1','28','Tucunaré'),
('137','2','3','Getúlio Vargas'),
('138','2','1','ARTHUR JOÃO THOBER'),
('139','1','1','Continental'),
('140','2','3','Ceara'),
('141','4','3','Iguiporã'),
('142','4','1','FLOR DE MAIO'),
('143','2','3','Presidente Castelo Branco'),
('144','4','1','linha barigui'),
('145','4','3','Porto Mendes'),
('146','4','1','linha km 13'),
('147','1','1','WILLY BARTH'),
('148','2','1','Albino Paulus'),
('149','2','1','DECIO GREEF'),
('150','2','29','Josefina Ferran'),
('151','2','2','Entre Rios do Oeste');

-- Criar tabela definitiva com tipos corretos
CREATE TABLE staging_gim.logradouro_csv (
    codLogradouro BIGINT PRIMARY KEY,
    codTipoLogradouro INT,
    codCidade BIGINT,
    nome VARCHAR(200)
);

-- Transferir dados convertendo tipos
INSERT INTO staging_gim.logradouro_csv
SELECT
    NULLIF(codLogradouro, '')::BIGINT,
    NULLIF(codTipoLogradouro, '')::INT,
    NULLIF(codCidade, '')::BIGINT,
    NULLIF(nome, '')
FROM temp_logradouros
WHERE codLogradouro IS NOT NULL AND TRIM(codLogradouro) != '';

DROP TABLE temp_logradouros;

-- NOTA: A tabela staging_gim.endereco_csv já deve existir do script 01-migrar-pessoas.sql

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

-- Habilitar extensão pg_trgm para função SIMILARITY (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Mapeamento EXATO (nome do GIM contém no SIGMA)
-- Ex: GIM "Continental" → SIGMA "Avenida Continental"
INSERT INTO staging_gim.map_logradouros (id_gim, id_sigma, nome_gim, nome_sigma, metodo_mapeamento)
SELECT DISTINCT
    lg.codLogradouro as id_gim,
    l.id as id_sigma,
    TRIM(REPLACE(lg.nome, '"', '')) as nome_gim,
    l.descricao as nome_sigma,
    'EXATO' as metodo_mapeamento
FROM staging_gim.logradouro_csv lg
INNER JOIN "Logradouro" l ON LOWER(l.descricao) LIKE '%' || LOWER(TRIM(REPLACE(lg.nome, '"', ''))) || '%'
WHERE lg.nome IS NOT NULL
  AND TRIM(REPLACE(lg.nome, '"', '')) != ''
ON CONFLICT (id_gim) DO NOTHING;

-- Mapeamento SIMILAR (usando SIMILARITY - para casos com diferenças pequenas)
-- Exemplo: "Guaratuba" vs "Rua Guaratuba"
INSERT INTO staging_gim.map_logradouros (id_gim, id_sigma, nome_gim, nome_sigma, metodo_mapeamento)
SELECT DISTINCT
    lg.codLogradouro as id_gim,
    l.id as id_sigma,
    TRIM(REPLACE(lg.nome, '"', '')) as nome_gim,
    l.descricao as nome_sigma,
    'SIMILAR' as metodo_mapeamento
FROM staging_gim.logradouro_csv lg
INNER JOIN "Logradouro" l ON SIMILARITY(LOWER(TRIM(REPLACE(lg.nome, '"', ''))), LOWER(l.descricao)) > 0.4
WHERE lg.nome IS NOT NULL
  AND TRIM(REPLACE(lg.nome, '"', '')) != ''
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
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INICIANDO MIGRAÇÃO DE ENDEREÇOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Contar total de endereços no CSV
    SELECT COUNT(*) INTO v_total_enderecos FROM staging_gim.endereco_csv;
    RAISE NOTICE 'Total de endereços no GIM: %', v_total_enderecos;

    -- Inserir endereços
    -- NOTA: No GIM, a tabela Pessoa tem campo cod_endereco que aponta direto para Endereco
    -- IMPORTANTE: CEP não existe na tabela Endereco do SIGMA (está em Logradouro)
    INSERT INTO "Endereco" (
        "pessoaId",
        "logradouroId",
        "bairroId",
        numero,
        complemento,
        "tipoEndereco",
        principal,
        "createdAt",
        "updatedAt"
    )
    SELECT
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
        'RESIDENCIAL'::"TipoEndereco",
        true as principal, -- Marcar todos como principal (1 endereço por pessoa no GIM)
        NOW(),
        NOW()
    FROM staging_gim.endereco_csv e
    -- Buscar pessoa através do campo cod_endereco na tabela Pessoa do GIM
    INNER JOIN staging_gim.pessoa_csv p ON p.cod_endereco = e.cod_endereco
    INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = p.cod_pessoa
    -- Mapear logradouro
    LEFT JOIN staging_gim.map_logradouros ml ON ml.id_gim = e.cod_logradouro
    WHERE mp.id_sigma IS NOT NULL -- Só migrar endereços de pessoas já migradas
    ON CONFLICT DO NOTHING; -- Evitar duplicatas

    GET DIAGNOSTICS v_com_logradouro = ROW_COUNT;
    RAISE NOTICE 'Endereços inseridos: %', v_com_logradouro;

    -- Contar quantos não tinham logradouro mapeado
    SELECT COUNT(*) INTO v_sem_logradouro
    FROM staging_gim.endereco_csv e
    INNER JOIN staging_gim.pessoa_csv p ON p.cod_endereco = e.cod_endereco
    INNER JOIN staging_gim.map_pessoas mp ON mp.id_gim = p.cod_pessoa
    LEFT JOIN staging_gim.map_logradouros ml ON ml.id_gim = e.cod_logradouro
    WHERE ml.id_sigma IS NULL AND e.cod_logradouro IS NOT NULL;

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

    SELECT COUNT(DISTINCT e.cod_logradouro) INTO v_logradouros_nao_mapeados
    FROM staging_gim.endereco_csv e
    WHERE e.cod_logradouro IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM staging_gim.map_logradouros ml
          WHERE ml.id_gim = e.cod_logradouro
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
        RAISE NOTICE 'FROM staging_gim.endereco_csv e';
        RAISE NOTICE 'INNER JOIN staging_gim.logradouro_csv lg ON lg.codLogradouro = e.cod_logradouro';
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
    COUNT(e.cod_endereco) as qtd_enderecos_afetados
FROM staging_gim.endereco_csv e
INNER JOIN staging_gim.logradouro_csv lg ON lg.codLogradouro = e.cod_logradouro
WHERE NOT EXISTS (
    SELECT 1 FROM staging_gim.map_logradouros ml
    WHERE ml.id_gim = lg.codLogradouro
)
GROUP BY lg.codLogradouro, lg.nome
ORDER BY COUNT(e.cod_endereco) DESC
LIMIT 20;

-- Ver amostra de endereços migrados
SELECT
    p.nome as pessoa,
    l.descricao as logradouro,
    e.numero,
    e.complemento,
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
