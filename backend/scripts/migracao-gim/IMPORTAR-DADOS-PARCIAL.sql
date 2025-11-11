-- ============================================================================
-- SCRIPT DE IMPORTAÇÃO PARCIAL - DADOS DO GIM JÁ EXPORTADOS
-- ============================================================================
--
-- ARQUIVOS NECESSÁRIOS (na pasta c:\Users\marce\Downloads\):
-- - Pessoa.csv
-- - PropriedadeRural.csv
-- - Endereco.csv
--
-- O QUE ESTE SCRIPT FAZ:
-- 1. Importa Pessoas (PF + PJ) dos CSVs
-- 2. Importa Propriedades
-- 3. Importa Endereços (parcialmente - falta mapear logradouros)
--
-- O QUE FALTA (para amanhã):
-- - Telefones
-- - Tabela Area (proprietários das propriedades)
-- - Arrendamentos
-- - Subsídios
--
-- Autor: Claude Code
-- Data: 2025-01-07
-- ============================================================================

-- ============================================================================
-- PASSO 1: CRIAR TABELAS STAGING PARA IMPORTAR CSVs
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS staging_gim;

-- Limpar tabelas se já existirem
DROP TABLE IF EXISTS staging_gim.pessoa_csv CASCADE;
DROP TABLE IF EXISTS staging_gim.propriedade_csv CASCADE;
DROP TABLE IF EXISTS staging_gim.endereco_csv CASCADE;
DROP TABLE IF EXISTS staging_gim.map_pessoas CASCADE;
DROP TABLE IF EXISTS staging_gim.map_propriedades CASCADE;
DROP TABLE IF EXISTS staging_gim.log_erros CASCADE;

-- Tabela para Pessoa.csv
CREATE TABLE staging_gim.pessoa_csv (
    cod_pessoa BIGINT,
    nome VARCHAR(100),
    cod_endereco BIGINT,
    email VARCHAR(100),
    tipo VARCHAR(100),
    dt_nascimento TIMESTAMP,
    nome_pai VARCHAR(100),
    nome_mae VARCHAR(100),
    sexo VARCHAR(10),
    cod_cor_pele INTEGER,
    cod_pais INTEGER,
    dt_entrada_brasil TIMESTAMP,
    numero_rg VARCHAR(10),
    cod_estado_rg INTEGER,
    orgao_rg VARCHAR(20),
    dt_emissao_rg TIMESTAMP,
    numero_titulo VARCHAR(20),
    zona VARCHAR(10),
    secao VARCHAR(10),
    numero_cpf VARCHAR(15),
    estado_civil VARCHAR(20),
    cod_conjuge BIGINT,
    escolaridade VARCHAR(30),
    profissao VARCHAR(50),
    estuda VARCHAR(10),
    imagem BYTEA,
    numero_ctps VARCHAR(10),
    serie VARCHAR(10),
    cod_estado_ctps INTEGER,
    dt_emissao_ctps TIMESTAMP,
    cod_end_local_trabalho BIGINT,
    num_cns VARCHAR(15),
    falecida VARCHAR(5),
    data_falecimento TIMESTAMP,
    cnpj VARCHAR(14),
    razao_social VARCHAR(100)
);

-- Tabela para PropriedadeRural.csv
CREATE TABLE staging_gim.propriedade_csv (
    cod_propriedade BIGINT,
    matricula VARCHAR(50),
    area NUMERIC(10,2),
    numero VARCHAR(20),
    denominacao VARCHAR(100),
    perimetro INTEGER,
    endereco VARCHAR(100),
    itr VARCHAR(50),
    incra VARCHAR(50),
    observacao TEXT,
    situacao VARCHAR(30)
);

-- Tabela para Endereco.csv
CREATE TABLE staging_gim.endereco_csv (
    cod_endereco BIGINT,
    cod_logradouro BIGINT,
    cod_bairro BIGINT,
    numero VARCHAR(10),
    apto VARCHAR(10),
    sala VARCHAR(10),
    complemento VARCHAR(50),
    cep VARCHAR(10),
    loteamento VARCHAR(100)
);

-- Tabelas de controle
CREATE TABLE staging_gim.map_pessoas (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER NOT NULL,
    tipo_pessoa VARCHAR(10),
    cpf_cnpj VARCHAR(18),
    nome VARCHAR(200),
    migrado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE staging_gim.map_propriedades (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER NOT NULL,
    nome VARCHAR(200),
    migrado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE staging_gim.log_erros (
    id SERIAL PRIMARY KEY,
    etapa VARCHAR(100),
    id_gim BIGINT,
    cpf_cnpj VARCHAR(18),
    erro TEXT,
    data_erro TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PASSO 2: IMPORTAR CSVs PARA STAGING
-- ============================================================================

-- IMPORTANTE: Ajuste o caminho se necessário
-- No Windows, use caminho completo tipo: 'C:\Users\marce\Downloads\Pessoa.csv'

\echo 'Importando Pessoa.csv...'
\COPY staging_gim.pessoa_csv FROM 'C:\Users\marce\Downloads\Pessoa.csv' WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8');

\echo 'Importando PropriedadeRural.csv...'
\COPY staging_gim.propriedade_csv FROM 'C:\Users\marce\Downloads\PropriedadeRural.csv' WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8');

\echo 'Importando Endereco.csv...'
\COPY staging_gim.endereco_csv FROM 'C:\Users\marce\Downloads\Endereco.csv' WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8');

-- Ver quantos registros foram importados
SELECT 'Pessoas importadas', COUNT(*) FROM staging_gim.pessoa_csv
UNION ALL
SELECT 'Propriedades importadas', COUNT(*) FROM staging_gim.propriedade_csv
UNION ALL
SELECT 'Endereços importados', COUNT(*) FROM staging_gim.endereco_csv;

-- ============================================================================
-- PASSO 3: MIGRAR PESSOAS FÍSICAS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_pessoa_id INTEGER;
    v_cpf_limpo VARCHAR(11);
BEGIN
    RAISE NOTICE 'Iniciando migração de Pessoas Físicas...';

    FOR rec IN (
        SELECT
            p.cod_pessoa,
            TRIM(p.nome) as nome,
            REGEXP_REPLACE(TRIM(p.numero_cpf), '[^0-9]', '', 'g') as cpf_limpo,
            TRIM(p.email) as email,
            TRIM(p.numero_rg) as rg,
            p.dt_nascimento::DATE as dt_nascimento
        FROM staging_gim.pessoa_csv p
        WHERE p.numero_cpf IS NOT NULL
            AND TRIM(p.numero_cpf) != ''
            AND p.numero_cpf != 'NULL'
            AND (p.cnpj IS NULL OR TRIM(p.cnpj) = '' OR p.cnpj = 'NULL')
            -- Validar CPF (11 dígitos)
            AND LENGTH(REGEXP_REPLACE(TRIM(p.numero_cpf), '[^0-9]', '', 'g')) = 11
    ) LOOP
        BEGIN
            v_cpf_limpo := rec.cpf_limpo;

            -- Inserir Pessoa
            INSERT INTO "Pessoa" (
                "tipoPessoa",
                nome,
                "cpfCnpj",
                email,
                ativo,
                "isProdutor",
                "createdAt",
                "updatedAt"
            ) VALUES (
                'FISICA',
                rec.nome,
                v_cpf_limpo,
                rec.email,
                TRUE,
                FALSE, -- Será atualizado quando importar Bloco, Area, etc
                NOW(),
                NOW()
            )
            ON CONFLICT ("cpfCnpj") DO NOTHING
            RETURNING id INTO v_pessoa_id;

            -- Se inseriu com sucesso
            IF v_pessoa_id IS NOT NULL THEN
                -- Inserir PessoaFisica
                INSERT INTO "PessoaFisica" (id, rg, "dataNascimento")
                VALUES (v_pessoa_id, rec.rg, rec.dt_nascimento)
                ON CONFLICT (id) DO NOTHING;

                -- Mapear ID
                INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
                VALUES (rec.cod_pessoa, v_pessoa_id, 'PF', v_cpf_limpo, rec.nome);

                v_count := v_count + 1;
            ELSE
                -- Já existe, pegar ID
                SELECT id INTO v_pessoa_id FROM "Pessoa" WHERE "cpfCnpj" = v_cpf_limpo;

                INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
                VALUES (rec.cod_pessoa, v_pessoa_id, 'PF', v_cpf_limpo, rec.nome)
                ON CONFLICT (id_gim) DO NOTHING;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, cpf_cnpj, erro)
            VALUES ('PESSOA_FISICA', rec.cod_pessoa, rec.cpf_limpo, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Pessoas Físicas: % inseridas, % erros', v_count, v_errors;
END $$;

-- ============================================================================
-- PASSO 4: MIGRAR PESSOAS JURÍDICAS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_pessoa_id INTEGER;
    v_cnpj_limpo VARCHAR(14);
BEGIN
    RAISE NOTICE 'Iniciando migração de Pessoas Jurídicas...';

    FOR rec IN (
        SELECT
            p.cod_pessoa,
            COALESCE(TRIM(p.razao_social), TRIM(p.nome)) as razao_social,
            TRIM(p.nome) as nome_fantasia,
            REGEXP_REPLACE(TRIM(p.cnpj), '[^0-9]', '', 'g') as cnpj_limpo,
            TRIM(p.email) as email
        FROM staging_gim.pessoa_csv p
        WHERE p.cnpj IS NOT NULL
            AND TRIM(p.cnpj) != ''
            AND p.cnpj != 'NULL'
            AND LENGTH(REGEXP_REPLACE(TRIM(p.cnpj), '[^0-9]', '', 'g')) = 14
    ) LOOP
        BEGIN
            v_cnpj_limpo := rec.cnpj_limpo;

            INSERT INTO "Pessoa" (
                "tipoPessoa",
                nome,
                "cpfCnpj",
                email,
                ativo,
                "isProdutor",
                "createdAt",
                "updatedAt"
            ) VALUES (
                'JURIDICA',
                rec.razao_social,
                v_cnpj_limpo,
                rec.email,
                TRUE,
                FALSE,
                NOW(),
                NOW()
            )
            ON CONFLICT ("cpfCnpj") DO NOTHING
            RETURNING id INTO v_pessoa_id;

            IF v_pessoa_id IS NOT NULL THEN
                INSERT INTO "PessoaJuridica" (id, "nomeFantasia")
                VALUES (v_pessoa_id, rec.nome_fantasia)
                ON CONFLICT (id) DO NOTHING;

                INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
                VALUES (rec.cod_pessoa, v_pessoa_id, 'PJ', v_cnpj_limpo, rec.razao_social);

                v_count := v_count + 1;
            ELSE
                SELECT id INTO v_pessoa_id FROM "Pessoa" WHERE "cpfCnpj" = v_cnpj_limpo;

                INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
                VALUES (rec.cod_pessoa, v_pessoa_id, 'PJ', v_cnpj_limpo, rec.razao_social)
                ON CONFLICT (id_gim) DO NOTHING;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, cpf_cnpj, erro)
            VALUES ('PESSOA_JURIDICA', rec.cod_pessoa, rec.cnpj_limpo, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Pessoas Jurídicas: % inseridas, % erros', v_count, v_errors;
END $$;

-- ============================================================================
-- PASSO 5: MIGRAR PROPRIEDADES (SEM PROPRIETÁRIO POR ENQUANTO)
-- ============================================================================
-- NOTA: Precisamos da tabela Area para definir proprietários
-- Por enquanto, vamos criar com proprietário genérico

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_propriedade_id INTEGER;
    v_situacao "SituacaoPropriedade";
    v_primeiro_pessoa_id INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando migração de Propriedades...';

    -- Pegar primeiro pessoa para usar como proprietário temporário
    SELECT id INTO v_primeiro_pessoa_id FROM "Pessoa" LIMIT 1;

    IF v_primeiro_pessoa_id IS NULL THEN
        RAISE EXCEPTION 'Não há pessoas cadastradas! Execute a migração de pessoas primeiro.';
    END IF;

    FOR rec IN (
        SELECT
            p.cod_propriedade,
            COALESCE(TRIM(p.denominacao), 'Propriedade ' || p.cod_propriedade) as nome,
            TRIM(p.matricula) as matricula,
            p.area,
            TRIM(p.itr) as itr,
            TRIM(p.incra) as incra,
            TRIM(p.situacao) as situacao,
            TRIM(p.observacao) as observacao
        FROM staging_gim.propriedade_csv p
        WHERE p.cod_propriedade IS NOT NULL
    ) LOOP
        BEGIN
            -- Mapear situação
            v_situacao := CASE
                WHEN UPPER(rec.situacao) LIKE '%CONDOM%' THEN 'CONDOMINIO'
                WHEN UPPER(rec.situacao) LIKE '%USUFRUTO%' THEN 'USUFRUTO'
                ELSE 'PROPRIA'
            END;

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
                rec.nome,
                'RURAL',
                rec.area,
                'alqueires',
                rec.itr,
                rec.incra,
                v_situacao,
                FALSE, -- Será atualizado quando importar Area
                rec.matricula,
                v_primeiro_pessoa_id, -- TEMPORÁRIO! Atualizar quando importar Area
                NOW(),
                NOW()
            )
            RETURNING id INTO v_propriedade_id;

            -- Mapear propriedade
            INSERT INTO staging_gim.map_propriedades (id_gim, id_sigma, nome)
            VALUES (rec.cod_propriedade, v_propriedade_id, rec.nome);

            v_count := v_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('PROPRIEDADE', rec.cod_propriedade, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Propriedades: % inseridas, % erros', v_count, v_errors;
    RAISE NOTICE 'ATENÇÃO: Proprietários são TEMPORÁRIOS! Atualizar quando importar tabela Area.';
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_pf INTEGER;
    v_total_pj INTEGER;
    v_total_propriedades INTEGER;
    v_total_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_pf FROM staging_gim.map_pessoas WHERE tipo_pessoa = 'PF';
    SELECT COUNT(*) INTO v_total_pj FROM staging_gim.map_pessoas WHERE tipo_pessoa = 'PJ';
    SELECT COUNT(*) INTO v_total_propriedades FROM staging_gim.map_propriedades;
    SELECT COUNT(*) INTO v_total_erros FROM staging_gim.log_erros;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO PARCIAL CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Pessoas Físicas migradas: %', v_total_pf;
    RAISE NOTICE 'Pessoas Jurídicas migradas: %', v_total_pj;
    RAISE NOTICE 'Total de Pessoas: %', v_total_pf + v_total_pj;
    RAISE NOTICE 'Propriedades migradas: %', v_total_propriedades;
    RAISE NOTICE 'Total de erros: %', v_total_erros;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Exportar tabela Area do GIM';
    RAISE NOTICE '2. Exportar tabela Telefone do GIM';
    RAISE NOTICE '3. Executar script complementar';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Ver erros se houver
SELECT * FROM staging_gim.log_erros ORDER BY data_erro DESC;

-- Comparar totais
SELECT
    'CSV Pessoa' as origem,
    COUNT(*) as total
FROM staging_gim.pessoa_csv
UNION ALL
SELECT
    'SIGMA Pessoa' as origem,
    COUNT(*) as total
FROM "Pessoa";

-- Ver propriedades criadas
SELECT
    id,
    nome,
    matricula,
    "areaTotal",
    situacao
FROM "Propriedade"
ORDER BY id
LIMIT 20;

-- Ver pessoas criadas
SELECT
    id,
    "tipoPessoa",
    nome,
    "cpfCnpj",
    email
FROM "Pessoa"
ORDER BY id
LIMIT 20;
