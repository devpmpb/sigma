-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 1: PESSOAS (Pessoa Física + Pessoa Jurídica + Endereços + Telefones)
-- ============================================================================
--
-- IMPORTANTE:
-- 1. Execute este script conectado ao banco SIGMA (PostgreSQL)
-- 2. O banco GIM deve estar acessível via linked server ou dblink
-- 3. Ajuste as conexões conforme seu ambiente
--
-- Autor: Claude Code
-- Data: 2025-01-06
-- ============================================================================

-- ============================================================================
-- CONFIGURAÇÃO INICIAL
-- ============================================================================

-- Criar schema temporário para staging
CREATE SCHEMA IF NOT EXISTS staging_gim;

-- Tabela para controle de mapeamento de IDs (GIM → SIGMA)
DROP TABLE IF EXISTS staging_gim.map_pessoas;
CREATE TABLE staging_gim.map_pessoas (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER NOT NULL,
    tipo_pessoa VARCHAR(10), -- 'PF' ou 'PJ'
    cpf_cnpj VARCHAR(18),
    nome VARCHAR(200),
    migrado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela para log de erros
DROP TABLE IF EXISTS staging_gim.log_erros;
CREATE TABLE staging_gim.log_erros (
    id SERIAL PRIMARY KEY,
    etapa VARCHAR(100),
    id_gim BIGINT,
    erro TEXT,
    data_erro TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PASSO 1: MIGRAR PESSOAS FÍSICAS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando migração de Pessoas Físicas...';

    -- Inserir em Pessoa (tabela base)
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
    )
    SELECT
        'FISICA'::"TipoPessoa",
        TRIM(p.nome),
        -- Limpar CPF (remover pontos, traços e espaços)
        REGEXP_REPLACE(TRIM(p.numeroCPF), '[^0-9]', '', 'g'),
        -- Pegar primeiro telefone da tabela Telefone
        (SELECT TOP 1 TRIM(t.numero)
         FROM [GIM].[dbo].[Telefone] t
         WHERE t.codPessoa = p.codPessoa
         ORDER BY t.codTelefone),
        TRIM(p.email),
        TRUE, -- Consideramos todos ativos por padrão
        -- isProdutor = TRUE se pessoa aparece em Bloco, Area, Arrendamento ou Subsidio
        CASE
            WHEN EXISTS (SELECT 1 FROM [GIM].[dbo].[Bloco] b WHERE b.codProdutor = p.codPessoa)
                OR EXISTS (SELECT 1 FROM [GIM].[dbo].[Area] a WHERE a.codPessoa = p.codPessoa)
                OR EXISTS (SELECT 1 FROM [GIM].[dbo].[Arrendamento] arr WHERE arr.codArrendatario = p.codPessoa)
                OR EXISTS (SELECT 1 FROM [GIM].[dbo].[Subsidio] s WHERE s.codProdutor = p.codPessoa)
            THEN TRUE
            ELSE FALSE
        END,
        COALESCE(p.createdAt, NOW()),
        NOW()
    FROM [GIM].[dbo].[Pessoa] p
    WHERE p.numeroCPF IS NOT NULL
        AND TRIM(p.numeroCPF) != ''
        AND p.CNPJ IS NULL -- Somente pessoas físicas
        -- Validar CPF (11 dígitos após limpeza)
        AND LENGTH(REGEXP_REPLACE(TRIM(p.numeroCPF), '[^0-9]', '', 'g')) = 11
    ON CONFLICT ("cpfCnpj") DO NOTHING; -- Ignora duplicatas

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Pessoas Físicas inseridas na tabela Pessoa: %', v_count;

    -- Inserir detalhes em PessoaFisica
    INSERT INTO "PessoaFisica" (
        id,
        rg,
        "dataNascimento"
    )
    SELECT
        pes_sigma.id,
        TRIM(p.numeroRG),
        p.dtNascimento
    FROM [GIM].[dbo].[Pessoa] p
    INNER JOIN "Pessoa" pes_sigma
        ON pes_sigma."cpfCnpj" = REGEXP_REPLACE(TRIM(p.numeroCPF), '[^0-9]', '', 'g')
    WHERE p.numeroCPF IS NOT NULL
        AND TRIM(p.numeroCPF) != ''
        AND p.CNPJ IS NULL
        AND LENGTH(REGEXP_REPLACE(TRIM(p.numeroCPF), '[^0-9]', '', 'g')) = 11
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Registros inseridos em PessoaFisica: %', v_count;

    -- Popular tabela de mapeamento
    INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
    SELECT
        p.codPessoa,
        pes_sigma.id,
        'PF',
        pes_sigma."cpfCnpj",
        pes_sigma.nome
    FROM [GIM].[dbo].[Pessoa] p
    INNER JOIN "Pessoa" pes_sigma
        ON pes_sigma."cpfCnpj" = REGEXP_REPLACE(TRIM(p.numeroCPF), '[^0-9]', '', 'g')
    WHERE p.numeroCPF IS NOT NULL
        AND TRIM(p.numeroCPF) != ''
        AND p.CNPJ IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Mapeamento PF criado: %', v_count;

EXCEPTION WHEN OTHERS THEN
    INSERT INTO staging_gim.log_erros (etapa, erro)
    VALUES ('PESSOA_FISICA', SQLERRM);
    RAISE NOTICE 'ERRO na migração de Pessoas Físicas: %', SQLERRM;
END $$;

-- ============================================================================
-- PASSO 2: MIGRAR PESSOAS JURÍDICAS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando migração de Pessoas Jurídicas...';

    -- Inserir em Pessoa (tabela base)
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
    )
    SELECT
        'JURIDICA'::"TipoPessoa",
        COALESCE(TRIM(p.razaoSocial), TRIM(p.nome)),
        -- Limpar CNPJ
        REGEXP_REPLACE(TRIM(p.CNPJ), '[^0-9]', '', 'g'),
        -- Pegar primeiro telefone
        (SELECT TOP 1 TRIM(t.numero)
         FROM [GIM].[dbo].[Telefone] t
         WHERE t.codPessoa = p.codPessoa
         ORDER BY t.codTelefone),
        TRIM(p.email),
        TRUE,
        -- isProdutor (mesma lógica)
        CASE
            WHEN EXISTS (SELECT 1 FROM [GIM].[dbo].[Bloco] b WHERE b.codProdutor = p.codPessoa)
                OR EXISTS (SELECT 1 FROM [GIM].[dbo].[Area] a WHERE a.codPessoa = p.codPessoa)
                OR EXISTS (SELECT 1 FROM [GIM].[dbo].[Arrendamento] arr WHERE arr.codArrendatario = p.codPessoa)
                OR EXISTS (SELECT 1 FROM [GIM].[dbo].[Subsidio] s WHERE s.codProdutor = p.codPessoa)
            THEN TRUE
            ELSE FALSE
        END,
        COALESCE(p.createdAt, NOW()),
        NOW()
    FROM [GIM].[dbo].[Pessoa] p
    WHERE p.CNPJ IS NOT NULL
        AND TRIM(p.CNPJ) != ''
        -- Validar CNPJ (14 dígitos)
        AND LENGTH(REGEXP_REPLACE(TRIM(p.CNPJ), '[^0-9]', '', 'g')) = 14
    ON CONFLICT ("cpfCnpj") DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Pessoas Jurídicas inseridas: %', v_count;

    -- Inserir detalhes em PessoaJuridica
    INSERT INTO "PessoaJuridica" (
        id,
        "nomeFantasia",
        "inscricaoEstadual",
        "inscricaoMunicipal",
        "representanteLegal"
    )
    SELECT
        pes_sigma.id,
        TRIM(p.nome), -- Nome fantasia
        NULL, -- GIM não tem inscrição estadual para PJ
        NULL, -- GIM não tem inscrição municipal
        NULL  -- GIM não tem representante legal
    FROM [GIM].[dbo].[Pessoa] p
    INNER JOIN "Pessoa" pes_sigma
        ON pes_sigma."cpfCnpj" = REGEXP_REPLACE(TRIM(p.CNPJ), '[^0-9]', '', 'g')
    WHERE p.CNPJ IS NOT NULL
        AND TRIM(p.CNPJ) != ''
        AND LENGTH(REGEXP_REPLACE(TRIM(p.CNPJ), '[^0-9]', '', 'g')) = 14
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Registros inseridos em PessoaJuridica: %', v_count;

    -- Popular tabela de mapeamento
    INSERT INTO staging_gim.map_pessoas (id_gim, id_sigma, tipo_pessoa, cpf_cnpj, nome)
    SELECT
        p.codPessoa,
        pes_sigma.id,
        'PJ',
        pes_sigma."cpfCnpj",
        pes_sigma.nome
    FROM [GIM].[dbo].[Pessoa] p
    INNER JOIN "Pessoa" pes_sigma
        ON pes_sigma."cpfCnpj" = REGEXP_REPLACE(TRIM(p.CNPJ), '[^0-9]', '', 'g')
    WHERE p.CNPJ IS NOT NULL
        AND TRIM(p.CNPJ) != '';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Mapeamento PJ criado: %', v_count;

EXCEPTION WHEN OTHERS THEN
    INSERT INTO staging_gim.log_erros (etapa, erro)
    VALUES ('PESSOA_JURIDICA', SQLERRM);
    RAISE NOTICE 'ERRO na migração de Pessoas Jurídicas: %', SQLERRM;
END $$;

-- ============================================================================
-- PASSO 3: MIGRAR ENDEREÇOS
-- ============================================================================
-- NOTA: O GIM tem estrutura de endereço diferente (com Cidade/Estado)
-- O SIGMA tem apenas Bairro e Logradouro, sem cidade
-- Vamos adaptar os endereços urbanos

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando migração de Endereços...';

    INSERT INTO "Endereco" (
        "pessoaId",
        "logradouroId",
        numero,
        complemento,
        "bairroId",
        "tipoEndereco",
        principal,
        "createdAt",
        "updatedAt"
    )
    SELECT
        map.id_sigma,
        -- TODO: Mapear logradouro (requer criação prévia no SIGMA)
        NULL,
        e.numero,
        e.complemento,
        -- TODO: Mapear bairro (requer mapeamento GIM → SIGMA)
        NULL,
        'RESIDENCIAL'::"TipoEndereco",
        TRUE, -- Primeiro endereço é principal
        NOW(),
        NOW()
    FROM [GIM].[dbo].[Endereco] e
    INNER JOIN staging_gim.map_pessoas map
        ON map.id_gim = e.codPessoa
    WHERE e.codEndereco IS NOT NULL
    -- Pegar apenas o primeiro endereço de cada pessoa
    AND e.codEndereco = (
        SELECT MIN(e2.codEndereco)
        FROM [GIM].[dbo].[Endereco] e2
        WHERE e2.codPessoa = e.codPessoa
    );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Endereços migrados: %', v_count;

EXCEPTION WHEN OTHERS THEN
    INSERT INTO staging_gim.log_erros (etapa, erro)
    VALUES ('ENDERECOS', SQLERRM);
    RAISE NOTICE 'ERRO na migração de Endereços: %', SQLERRM;
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_pf INTEGER;
    v_total_pj INTEGER;
    v_total_produtores INTEGER;
    v_total_enderecos INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_pf FROM staging_gim.map_pessoas WHERE tipo_pessoa = 'PF';
    SELECT COUNT(*) INTO v_total_pj FROM staging_gim.map_pessoas WHERE tipo_pessoa = 'PJ';
    SELECT COUNT(*) INTO v_total_produtores FROM "Pessoa" WHERE "isProdutor" = TRUE;
    SELECT COUNT(*) INTO v_total_enderecos FROM "Endereco";

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE PESSOAS CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Pessoas Físicas migradas: %', v_total_pf;
    RAISE NOTICE 'Pessoas Jurídicas migradas: %', v_total_pj;
    RAISE NOTICE 'Total de Pessoas: %', v_total_pf + v_total_pj;
    RAISE NOTICE 'Produtores Rurais (isProdutor=true): %', v_total_produtores;
    RAISE NOTICE 'Endereços migrados: %', v_total_enderecos;
    RAISE NOTICE '========================================';

    -- Mostrar erros se houver
    IF EXISTS (SELECT 1 FROM staging_gim.log_erros) THEN
        RAISE NOTICE 'ATENÇÃO: Foram encontrados erros durante a migração:';
        FOR rec IN SELECT * FROM staging_gim.log_erros LOOP
            RAISE NOTICE 'Etapa: %, Erro: %', rec.etapa, rec.erro;
        END LOOP;
    END IF;
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Verificar pessoas sem CPF/CNPJ no GIM (não migradas)
SELECT COUNT(*) as pessoas_sem_documento
FROM [GIM].[dbo].[Pessoa] p
WHERE (p.numeroCPF IS NULL OR TRIM(p.numeroCPF) = '')
  AND (p.CNPJ IS NULL OR TRIM(p.CNPJ) = '');

-- Verificar duplicatas de CPF/CNPJ no GIM
SELECT
    REGEXP_REPLACE(TRIM(COALESCE(numeroCPF, CNPJ)), '[^0-9]', '', 'g') as documento,
    COUNT(*) as quantidade
FROM [GIM].[dbo].[Pessoa]
WHERE COALESCE(numeroCPF, CNPJ) IS NOT NULL
GROUP BY REGEXP_REPLACE(TRIM(COALESCE(numeroCPF, CNPJ)), '[^0-9]', '', 'g')
HAVING COUNT(*) > 1;

-- Verificar produtores identificados
SELECT
    'Bloco' as origem,
    COUNT(DISTINCT codProdutor) as quantidade
FROM [GIM].[dbo].[Bloco]
UNION ALL
SELECT
    'Area' as origem,
    COUNT(DISTINCT codPessoa) as quantidade
FROM [GIM].[dbo].[Area]
UNION ALL
SELECT
    'Arrendamento' as origem,
    COUNT(DISTINCT codArrendatario) as quantidade
FROM [GIM].[dbo].[Arrendamento]
UNION ALL
SELECT
    'Subsidio' as origem,
    COUNT(DISTINCT codProdutor) as quantidade
FROM [GIM].[dbo].[Subsidio];
