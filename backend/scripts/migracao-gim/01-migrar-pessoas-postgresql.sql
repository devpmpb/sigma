-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 1: PESSOAS (Pessoa Física + Pessoa Jurídica + Endereços)
-- ============================================================================
--
-- IMPORTANTE:
-- 1. Este script assume que você já exportou os dados do GIM para CSVs
-- 2. Ou está usando ferramentas de ETL (como Pentaho, Airbyte, etc)
-- 3. Ajuste os paths dos arquivos CSV conforme necessário
--
-- Arquivos CSV necessários (exportar do GIM):
-- - pessoas_gim.csv (tabela Pessoa)
-- - telefones_gim.csv (tabela Telefone)
-- - enderecos_gim.csv (tabela Endereco)
-- - blocos_gim.csv (tabela Bloco)
-- - areas_gim.csv (tabela Area)
-- - arrendamentos_gim.csv (tabela Arrendamento)
-- - subsidios_gim.csv (tabela Subsidio)
--
-- Autor: Claude Code
-- Data: 2025-01-06
-- ============================================================================

-- ============================================================================
-- CONFIGURAÇÃO INICIAL
-- ============================================================================

-- Criar schema temporário para staging
CREATE SCHEMA IF NOT EXISTS staging_gim;

-- Tabela temporária para dados do GIM
DROP TABLE IF EXISTS staging_gim.pessoas_gim CASCADE;
CREATE TABLE staging_gim.pessoas_gim (
    cod_pessoa BIGINT PRIMARY KEY,
    nome VARCHAR(100),
    numero_cpf VARCHAR(15),
    cnpj VARCHAR(14),
    email VARCHAR(100),
    numero_rg VARCHAR(10),
    dt_nascimento DATE,
    razao_social VARCHAR(100)
);

DROP TABLE IF EXISTS staging_gim.telefones_gim CASCADE;
CREATE TABLE staging_gim.telefones_gim (
    cod_telefone BIGINT PRIMARY KEY,
    cod_pessoa BIGINT,
    numero VARCHAR(20)
);

DROP TABLE IF EXISTS staging_gim.enderecos_gim CASCADE;
CREATE TABLE staging_gim.enderecos_gim (
    cod_endereco BIGINT PRIMARY KEY,
    cod_pessoa BIGINT,
    numero VARCHAR(10),
    complemento VARCHAR(50)
);

-- Tabelas para identificar produtores
DROP TABLE IF EXISTS staging_gim.blocos_gim CASCADE;
CREATE TABLE staging_gim.blocos_gim (
    cod_bloco BIGINT PRIMARY KEY,
    cod_produtor BIGINT
);

DROP TABLE IF EXISTS staging_gim.areas_gim CASCADE;
CREATE TABLE staging_gim.areas_gim (
    cod_area BIGINT PRIMARY KEY,
    cod_pessoa BIGINT
);

DROP TABLE IF EXISTS staging_gim.arrendamentos_gim CASCADE;
CREATE TABLE staging_gim.arrendamentos_gim (
    cod_arrendamento BIGINT PRIMARY KEY,
    cod_arrendatario BIGINT
);

DROP TABLE IF EXISTS staging_gim.subsidios_gim CASCADE;
CREATE TABLE staging_gim.subsidios_gim (
    cod_subsidio BIGINT PRIMARY KEY,
    cod_produtor BIGINT
);

-- Tabela para controle de mapeamento de IDs (GIM → SIGMA)
DROP TABLE IF EXISTS staging_gim.map_pessoas CASCADE;
CREATE TABLE staging_gim.map_pessoas (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER NOT NULL,
    tipo_pessoa VARCHAR(10), -- 'PF' ou 'PJ'
    cpf_cnpj VARCHAR(18),
    nome VARCHAR(200),
    migrado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela para log de erros
DROP TABLE IF EXISTS staging_gim.log_erros CASCADE;
CREATE TABLE staging_gim.log_erros (
    id SERIAL PRIMARY KEY,
    etapa VARCHAR(100),
    id_gim BIGINT,
    cpf_cnpj VARCHAR(18),
    erro TEXT,
    data_erro TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INSTRUÇÕES PARA CARREGAR DADOS (escolha uma opção)
-- ============================================================================

/*
OPÇÃO 1: Carregar de arquivos CSV (ajuste os paths)

COPY staging_gim.pessoas_gim FROM '/path/to/pessoas_gim.csv' DELIMITER ',' CSV HEADER;
COPY staging_gim.telefones_gim FROM '/path/to/telefones_gim.csv' DELIMITER ',' CSV HEADER;
COPY staging_gim.enderecos_gim FROM '/path/to/enderecos_gim.csv' DELIMITER ',' CSV HEADER;
COPY staging_gim.blocos_gim FROM '/path/to/blocos_gim.csv' DELIMITER ',' CSV HEADER;
COPY staging_gim.areas_gim FROM '/path/to/areas_gim.csv' DELIMITER ',' CSV HEADER;
COPY staging_gim.arrendamentos_gim FROM '/path/to/arrendamentos_gim.csv' DELIMITER ',' CSV HEADER;
COPY staging_gim.subsidios_gim FROM '/path/to/subsidios_gim.csv' DELIMITER ',' CSV HEADER;

OPÇÃO 2: Usar dblink para conectar ao SQL Server (requer extensão)

CREATE EXTENSION IF NOT EXISTS dblink;

-- Exemplo de query via dblink:
INSERT INTO staging_gim.pessoas_gim
SELECT * FROM dblink('sqlserver_connection_string',
    'SELECT codPessoa, nome, numeroCPF, CNPJ, email, numeroRG, dtNascimento, razaoSocial FROM Pessoa')
    AS t(cod_pessoa BIGINT, nome VARCHAR(100), ...);

OPÇÃO 3: Usar ferramenta de ETL externa (DBeaver, Pentaho, Airbyte, etc)
*/

-- ============================================================================
-- PASSO 1: MIGRAR PESSOAS FÍSICAS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
BEGIN
    RAISE NOTICE 'Iniciando migração de Pessoas Físicas...';

    -- Inserir em Pessoa (tabela base)
    FOR rec IN (
        SELECT
            p.cod_pessoa,
            TRIM(p.nome) as nome,
            REGEXP_REPLACE(TRIM(p.numero_cpf), '[^0-9]', '', 'g') as cpf_limpo,
            TRIM(p.email) as email,
            TRIM(p.numero_rg) as rg,
            p.dt_nascimento,
            -- Pegar primeiro telefone
            (SELECT TRIM(t.numero)
             FROM staging_gim.telefones_gim t
             WHERE t.cod_pessoa = p.cod_pessoa
             LIMIT 1) as telefone,
            -- Verificar se é produtor
            CASE
                WHEN EXISTS (SELECT 1 FROM staging_gim.blocos_gim b WHERE b.cod_produtor = p.cod_pessoa)
                    OR EXISTS (SELECT 1 FROM staging_gim.areas_gim a WHERE a.cod_pessoa = p.cod_pessoa)
                    OR EXISTS (SELECT 1 FROM staging_gim.arrendamentos_gim arr WHERE arr.cod_arrendatario = p.cod_pessoa)
                    OR EXISTS (SELECT 1 FROM staging_gim.subsidios_gim s WHERE s.cod_produtor = p.cod_pessoa)
                THEN TRUE
                ELSE FALSE
            END as is_produtor
        FROM staging_gim.pessoas_gim p
        WHERE p.numero_cpf IS NOT NULL
            AND TRIM(p.numero_cpf) != ''
            AND p.cnpj IS NULL
            AND LENGTH(REGEXP_REPLACE(TRIM(p.numero_cpf), '[^0-9]', '', 'g')) = 11
    ) LOOP
        BEGIN
            -- Inserir Pessoa
            INSERT INTO "Pessoa" (
                "tipoPessoa",
                nome,
                "cpfCnpj",
                telefone,
                email,
                ativo,
                "isProdutor",
                "createdAt",
                "updatedAt"
            ) VALUES (
                'FISICA',
                rec.nome,
                rec.cpf_limpo,
                rec.telefone,
                rec.email,
                TRUE,
                rec.is_produtor,
                NOW(),
                NOW()
            )
            ON CONFLICT ("cpfCnpj") DO NOTHING
            RETURNING id INTO v_count;

            -- Se inseriu com sucesso
            IF v_count IS NOT NULL THEN
                -- Inserir PessoaFisica
                INSERT INTO "PessoaFisica" (id, rg, "dataNascimento")
                VALUES (v_count, rec.rg, rec.dt_nascimento)
                ON CONFLICT (id) DO NOTHING;

                -- Mapear IDs
                INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
                VALUES (rec.cod_pessoa, v_count, 'PF', rec.cpf_limpo, rec.nome);

                v_count := v_count + 1;
            ELSE
                -- Já existe, pegar ID
                SELECT id INTO v_count FROM "Pessoa" WHERE "cpfCnpj" = rec.cpf_limpo;

                INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
                VALUES (rec.cod_pessoa, v_count, 'PF', rec.cpf_limpo, rec.nome)
                ON CONFLICT (id_gim) DO NOTHING;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, cpf_cnpj, erro)
            VALUES ('PESSOA_FISICA', rec.cod_pessoa, rec.cpf_limpo, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Pessoas Físicas processadas: %, Erros: %', v_count, v_errors;
END $$;

-- ============================================================================
-- PASSO 2: MIGRAR PESSOAS JURÍDICAS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
BEGIN
    RAISE NOTICE 'Iniciando migração de Pessoas Jurídicas...';

    FOR rec IN (
        SELECT
            p.cod_pessoa,
            COALESCE(TRIM(p.razao_social), TRIM(p.nome)) as razao_social,
            TRIM(p.nome) as nome_fantasia,
            REGEXP_REPLACE(TRIM(p.cnpj), '[^0-9]', '', 'g') as cnpj_limpo,
            TRIM(p.email) as email,
            (SELECT TRIM(t.numero)
             FROM staging_gim.telefones_gim t
             WHERE t.cod_pessoa = p.cod_pessoa
             LIMIT 1) as telefone,
            CASE
                WHEN EXISTS (SELECT 1 FROM staging_gim.blocos_gim b WHERE b.cod_produtor = p.cod_pessoa)
                    OR EXISTS (SELECT 1 FROM staging_gim.areas_gim a WHERE a.cod_pessoa = p.cod_pessoa)
                    OR EXISTS (SELECT 1 FROM staging_gim.arrendamentos_gim arr WHERE arr.cod_arrendatario = p.cod_pessoa)
                    OR EXISTS (SELECT 1 FROM staging_gim.subsidios_gim s WHERE s.cod_produtor = p.cod_pessoa)
                THEN TRUE
                ELSE FALSE
            END as is_produtor
        FROM staging_gim.pessoas_gim p
        WHERE p.cnpj IS NOT NULL
            AND TRIM(p.cnpj) != ''
            AND LENGTH(REGEXP_REPLACE(TRIM(p.cnpj), '[^0-9]', '', 'g')) = 14
    ) LOOP
        BEGIN
            INSERT INTO "Pessoa" (
                "tipoPessoa",
                nome,
                "cpfCnpj",
                telefone,
                email,
                ativo,
                "isProdutor",
                "createdAt",
                "updatedAt"
            ) VALUES (
                'JURIDICA',
                rec.razao_social,
                rec.cnpj_limpo,
                rec.telefone,
                rec.email,
                TRUE,
                rec.is_produtor,
                NOW(),
                NOW()
            )
            ON CONFLICT ("cpfCnpj") DO NOTHING
            RETURNING id INTO v_count;

            IF v_count IS NOT NULL THEN
                INSERT INTO "PessoaJuridica" (id, "nomeFantasia")
                VALUES (v_count, rec.nome_fantasia)
                ON CONFLICT (id) DO NOTHING;

                INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
                VALUES (rec.cod_pessoa, v_count, 'PJ', rec.cnpj_limpo, rec.razao_social);

                v_count := v_count + 1;
            ELSE
                SELECT id INTO v_count FROM "Pessoa" WHERE "cpfCnpj" = rec.cnpj_limpo;

                INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
                VALUES (rec.cod_pessoa, v_count, 'PJ', rec.cnpj_limpo, rec.razao_social)
                ON CONFLICT (id_gim) DO NOTHING;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, cpf_cnpj, erro)
            VALUES ('PESSOA_JURIDICA', rec.cod_pessoa, rec.cnpj_limpo, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Pessoas Jurídicas processadas: %, Erros: %', v_count, v_errors;
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_pf INTEGER;
    v_total_pj INTEGER;
    v_total_produtores INTEGER;
    v_total_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_pf FROM staging_gim.map_pessoas WHERE tipo_pessoa = 'PF';
    SELECT COUNT(*) INTO v_total_pj FROM staging_gim.map_pessoas WHERE tipo_pessoa = 'PJ';
    SELECT COUNT(*) INTO v_total_produtores FROM "Pessoa" WHERE "isProdutor" = TRUE;
    SELECT COUNT(*) INTO v_total_erros FROM staging_gim.log_erros;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE PESSOAS CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Pessoas Físicas migradas: %', v_total_pf;
    RAISE NOTICE 'Pessoas Jurídicas migradas: %', v_total_pj;
    RAISE NOTICE 'Total de Pessoas: %', v_total_pf + v_total_pj;
    RAISE NOTICE 'Produtores Rurais (isProdutor=true): %', v_total_produtores;
    RAISE NOTICE 'Total de erros: %', v_total_erros;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Ver mapeamento criado
SELECT
    tipo_pessoa,
    COUNT(*) as quantidade
FROM staging_gim.map_pessoas
GROUP BY tipo_pessoa;

-- Ver erros (se houver)
SELECT * FROM staging_gim.log_erros ORDER BY data_erro DESC;

-- Comparar totais
SELECT
    'GIM' as origem,
    COUNT(*) as total_pessoas,
    COUNT(CASE WHEN numero_cpf IS NOT NULL THEN 1 END) as pessoas_fisicas,
    COUNT(CASE WHEN cnpj IS NOT NULL THEN 1 END) as pessoas_juridicas
FROM staging_gim.pessoas_gim
UNION ALL
SELECT
    'SIGMA' as origem,
    COUNT(*) as total_pessoas,
    COUNT(CASE WHEN "tipoPessoa" = 'FISICA' THEN 1 END) as pessoas_fisicas,
    COUNT(CASE WHEN "tipoPessoa" = 'JURIDICA' THEN 1 END) as pessoas_juridicas
FROM "Pessoa";

-- Ver produtores identificados
SELECT
    'Total produtores no SIGMA' as descricao,
    COUNT(*) as quantidade
FROM "Pessoa"
WHERE "isProdutor" = TRUE;
