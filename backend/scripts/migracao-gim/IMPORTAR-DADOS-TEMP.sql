-- ============================================================================
-- SCRIPT DE IMPORTAÇÃO PARCIAL - VERSÃO C:\temp
-- ============================================================================
--
-- ANTES DE EXECUTAR:
-- 1. Crie a pasta C:\temp\
-- 2. Copie para lá:
--    - Pessoa.csv
--    - PropriedadeRural.csv
--    - Endereco.csv
--
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

CREATE TABLE staging_gim.propriedade_csv (
    cod_propriedade BIGINT,
    matricula VARCHAR(50),
    area VARCHAR(20), -- Texto primeiro, converter depois
    numero VARCHAR(20),
    denominacao VARCHAR(100),
    perimetro INTEGER,
    endereco VARCHAR(100),
    itr VARCHAR(50),
    incra VARCHAR(50),
    observacao TEXT,
    situacao VARCHAR(30)
);

CREATE TABLE staging_gim.endereco_csv (
    cod_endereco BIGINT,
    cod_logradouro BIGINT,
    cod_bairro BIGINT,
    numero VARCHAR(50), -- Aumentado para aceitar textos maiores
    apto VARCHAR(20),
    sala VARCHAR(20),
    complemento VARCHAR(100),
    cep VARCHAR(20),
    loteamento VARCHAR(100)
);

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

-- IMPORTAR CSVs de C:\temp
-- NULL_STRING '' trata a palavra "NULL" como nulo
COPY staging_gim.pessoa_csv
FROM 'C:\temp\Pessoa.csv'
WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8', NULL 'NULL');

COPY staging_gim.propriedade_csv
FROM 'C:\temp\PropriedadeRural.csv'
WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8', NULL 'NULL');

COPY staging_gim.endereco_csv
FROM 'C:\temp\Endereco.csv'
WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8', NULL 'NULL');

-- Verificar importação
SELECT 'Pessoas' as tabela, COUNT(*) as registros FROM staging_gim.pessoa_csv
UNION ALL
SELECT 'Propriedades', COUNT(*) FROM staging_gim.propriedade_csv
UNION ALL
SELECT 'Endereços', COUNT(*) FROM staging_gim.endereco_csv;

-- ============================================================================
-- MIGRAR PESSOAS FÍSICAS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_pessoa_id INTEGER;
    v_cpf_limpo VARCHAR(11);
BEGIN
    RAISE NOTICE 'Migrando Pessoas Físicas...';

    FOR rec IN (
        SELECT
            p.cod_pessoa,
            TRIM(p.nome) as nome,
            REGEXP_REPLACE(TRIM(COALESCE(p.numero_cpf, '')), '[^0-9]', '', 'g') as cpf_limpo,
            TRIM(p.email) as email,
            TRIM(p.numero_rg) as rg,
            p.dt_nascimento::DATE as dt_nascimento
        FROM staging_gim.pessoa_csv p
        WHERE p.numero_cpf IS NOT NULL
            AND TRIM(p.numero_cpf) != ''
            AND p.numero_cpf != 'NULL'
            AND (p.cnpj IS NULL OR TRIM(p.cnpj) = '' OR p.cnpj = 'NULL')
            AND LENGTH(REGEXP_REPLACE(TRIM(COALESCE(p.numero_cpf, '')), '[^0-9]', '', 'g')) = 11
    ) LOOP
        BEGIN
            v_cpf_limpo := rec.cpf_limpo;

            INSERT INTO "Pessoa" (
                "tipoPessoa", nome, "cpfCnpj", email, ativo, "isProdutor", "createdAt", "updatedAt"
            ) VALUES (
                'FISICA', rec.nome, v_cpf_limpo, rec.email, TRUE, FALSE, NOW(), NOW()
            )
            ON CONFLICT ("cpfCnpj") DO NOTHING
            RETURNING id INTO v_pessoa_id;

            IF v_pessoa_id IS NOT NULL THEN
                INSERT INTO "PessoaFisica" (id, rg, "dataNascimento")
                VALUES (v_pessoa_id, rec.rg, rec.dt_nascimento)
                ON CONFLICT (id) DO NOTHING;

                INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
                VALUES (rec.cod_pessoa, v_pessoa_id, 'PF', v_cpf_limpo, rec.nome);

                v_count := v_count + 1;
            ELSE
                SELECT id INTO v_pessoa_id FROM "Pessoa" WHERE "cpfCnpj" = v_cpf_limpo;
                IF v_pessoa_id IS NOT NULL THEN
                    INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
                    VALUES (rec.cod_pessoa, v_pessoa_id, 'PF', v_cpf_limpo, rec.nome)
                    ON CONFLICT (id_gim) DO NOTHING;
                END IF;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, cpf_cnpj, erro)
            VALUES ('PESSOA_FISICA', rec.cod_pessoa, rec.cpf_limpo, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'PF: % inseridas, % erros', v_count, v_errors;
END $$;

-- ============================================================================
-- MIGRAR PESSOAS JURÍDICAS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_pessoa_id INTEGER;
    v_cnpj_limpo VARCHAR(14);
BEGIN
    RAISE NOTICE 'Migrando Pessoas Jurídicas...';

    FOR rec IN (
        SELECT
            p.cod_pessoa,
            COALESCE(TRIM(p.razao_social), TRIM(p.nome)) as razao_social,
            TRIM(p.nome) as nome_fantasia,
            REGEXP_REPLACE(TRIM(COALESCE(p.cnpj, '')), '[^0-9]', '', 'g') as cnpj_limpo,
            TRIM(p.email) as email
        FROM staging_gim.pessoa_csv p
        WHERE p.cnpj IS NOT NULL
            AND TRIM(p.cnpj) != ''
            AND p.cnpj != 'NULL'
            AND LENGTH(REGEXP_REPLACE(TRIM(COALESCE(p.cnpj, '')), '[^0-9]', '', 'g')) = 14
    ) LOOP
        BEGIN
            v_cnpj_limpo := rec.cnpj_limpo;

            INSERT INTO "Pessoa" (
                "tipoPessoa", nome, "cpfCnpj", email, ativo, "isProdutor", "createdAt", "updatedAt"
            ) VALUES (
                'JURIDICA', rec.razao_social, v_cnpj_limpo, rec.email, TRUE, FALSE, NOW(), NOW()
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
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, cpf_cnpj, erro)
            VALUES ('PESSOA_JURIDICA', rec.cod_pessoa, rec.cnpj_limpo, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'PJ: % inseridas, % erros', v_count, v_errors;
END $$;

-- ============================================================================
-- MIGRAR PROPRIEDADES
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_propriedade_id INTEGER;
    v_situacao "SituacaoPropriedade";
    v_primeiro_pessoa_id INTEGER;
BEGIN
    RAISE NOTICE 'Migrando Propriedades...';

    SELECT id INTO v_primeiro_pessoa_id FROM "Pessoa" LIMIT 1;

    IF v_primeiro_pessoa_id IS NULL THEN
        RAISE EXCEPTION 'Nenhuma pessoa cadastrada!';
    END IF;

    FOR rec IN (
        SELECT
            p.cod_propriedade,
            COALESCE(TRIM(p.denominacao), 'Propriedade ' || p.cod_propriedade) as nome,
            TRIM(p.matricula) as matricula,
            -- Converter vírgula para ponto e transformar em número
            CAST(REPLACE(TRIM(COALESCE(p.area, '0')), ',', '.') AS NUMERIC(10,2)) as area,
            TRIM(p.itr) as itr,
            TRIM(p.incra) as incra,
            TRIM(COALESCE(p.situacao, 'PROPRIA')) as situacao
        FROM staging_gim.propriedade_csv p
        WHERE p.cod_propriedade IS NOT NULL
    ) LOOP
        BEGIN
            v_situacao := CASE
                WHEN UPPER(rec.situacao) LIKE '%CONDOM%' THEN 'CONDOMINIO'
                WHEN UPPER(rec.situacao) LIKE '%USUFRUTO%' THEN 'USUFRUTO'
                ELSE 'PROPRIA'
            END;

            INSERT INTO "Propriedade" (
                nome, "tipoPropriedade", "areaTotal", "unidadeArea",
                itr, incra, situacao, "isproprietarioResidente",
                matricula, "proprietarioId", "createdAt", "updatedAt"
            ) VALUES (
                rec.nome, 'RURAL', rec.area, 'alqueires',
                rec.itr, rec.incra, v_situacao, FALSE,
                rec.matricula, v_primeiro_pessoa_id, NOW(), NOW()
            )
            RETURNING id INTO v_propriedade_id;

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
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_pf INTEGER; v_pj INTEGER; v_prop INTEGER; v_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_pf FROM staging_gim.map_pessoas WHERE tipo_pessoa = 'PF';
    SELECT COUNT(*) INTO v_pj FROM staging_gim.map_pessoas WHERE tipo_pessoa = 'PJ';
    SELECT COUNT(*) INTO v_prop FROM staging_gim.map_propriedades;
    SELECT COUNT(*) INTO v_erros FROM staging_gim.log_erros;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Pessoas Físicas: %', v_pf;
    RAISE NOTICE 'Pessoas Jurídicas: %', v_pj;
    RAISE NOTICE 'Propriedades: %', v_prop;
    RAISE NOTICE 'Erros: %', v_erros;
    RAISE NOTICE '========================================';
END $$;

-- Ver erros
SELECT * FROM staging_gim.log_erros;
