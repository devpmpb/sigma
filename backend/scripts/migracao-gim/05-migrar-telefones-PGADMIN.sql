-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA - VERSÃO PGADMIN
-- Parte 5: TELEFONES → Adicionar campo telefones na tabela Pessoa
-- ============================================================================
--
-- IMPORTANTE: Este script é otimizado para pgAdmin
-- Use COPY ao invés de \copy
--
-- Autor: Claude Code
-- Data: 2025-01-10
-- ============================================================================

-- ============================================================================
-- TABELAS DE STAGING
-- ============================================================================

DROP TABLE IF EXISTS staging_gim.telefones_gim CASCADE;
CREATE TABLE staging_gim.telefones_gim (
    cod_telefone BIGINT PRIMARY KEY,
    cod_pessoa BIGINT,
    ddd VARCHAR(3),
    numero VARCHAR(20),
    ramal VARCHAR(10),
    tipo VARCHAR(20)
);

-- ============================================================================
-- IMPORTAR CSV DO GIM
-- ============================================================================

-- OPÇÃO 1: Usar COPY (requer permissões de superusuário)
-- Descomente a linha abaixo e ajuste o caminho se necessário:

-- COPY staging_gim.telefones_gim FROM 'C:\Users\marce\OneDrive\Desktop\telefone.csv' DELIMITER ';' CSV HEADER ENCODING 'UTF8';

-- ============================================================================
-- OPÇÃO 2: IMPORTAR VIA INTERFACE DO PGADMIN (RECOMENDADO)
-- ============================================================================

/*
INSTRUÇÕES PARA IMPORTAR NO PGADMIN:

1. No pgAdmin, expanda a árvore até encontrar:
   Databases → sigma → Schemas → staging_gim → Tables → telefones_gim

2. Clique com o botão direito em "telefones_gim" → Import/Export Data

3. Configure a importação:
   ✓ Import/Export: Import
   ✓ Format: csv
   ✓ Filename: C:\Users\marce\OneDrive\Desktop\telefone.csv
   ✓ Header: Yes (ON)
   ✓ Delimiter: ;
   ✓ Quote: "
   ✓ Escape: "
   ✓ Encoding: UTF8

4. Clique em OK

5. Aguarde a importação completar

6. Continue executando o restante deste script
*/

-- ============================================================================
-- VERIFICAR IMPORTAÇÃO
-- ============================================================================

DO $$
DECLARE
    v_total_telefones INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_telefones FROM staging_gim.telefones_gim;

    IF v_total_telefones = 0 THEN
        RAISE EXCEPTION 'ATENÇÃO: Nenhum telefone foi importado! Por favor, importe o CSV usando o pgAdmin (botão direito na tabela → Import/Export Data) antes de continuar.';
    ELSE
        RAISE NOTICE 'OK: % telefones importados com sucesso!', v_total_telefones;
    END IF;
END $$;

-- ============================================================================
-- ANÁLISE DOS DADOS IMPORTADOS
-- ============================================================================

DO $$
DECLARE
    v_total_telefones INTEGER;
    v_pessoas_com_tel INTEGER;
    v_tel_sem_pessoa INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_telefones FROM staging_gim.telefones_gim;
    SELECT COUNT(DISTINCT cod_pessoa) INTO v_pessoas_com_tel FROM staging_gim.telefones_gim;
    SELECT COUNT(*) INTO v_tel_sem_pessoa FROM staging_gim.telefones_gim WHERE cod_pessoa IS NULL;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'ANÁLISE DOS TELEFONES IMPORTADOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de telefones: %', v_total_telefones;
    RAISE NOTICE 'Pessoas com telefone: %', v_pessoas_com_tel;
    RAISE NOTICE 'Telefones sem pessoa: %', v_tel_sem_pessoa;
    RAISE NOTICE '========================================';
END $$;

-- Ver distribuição por tipo
SELECT
    tipo,
    COUNT(*) as quantidade
FROM staging_gim.telefones_gim
GROUP BY tipo
ORDER BY quantidade DESC;

-- ============================================================================
-- FUNÇÃO PARA FORMATAR TELEFONE
-- ============================================================================

CREATE OR REPLACE FUNCTION formatar_telefone_gim(
    p_ddd VARCHAR,
    p_numero VARCHAR,
    p_ramal VARCHAR,
    p_tipo VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_resultado VARCHAR := '';
    v_ddd VARCHAR := TRIM(COALESCE(p_ddd, ''));
    v_numero VARCHAR := REGEXP_REPLACE(TRIM(COALESCE(p_numero, '')), '[^0-9]', '', 'g');
    v_ramal VARCHAR := TRIM(COALESCE(p_ramal, ''));
    v_tipo VARCHAR := TRIM(COALESCE(p_tipo, ''));
BEGIN
    -- Retornar vazio se não houver número
    IF v_numero = '' THEN
        RETURN NULL;
    END IF;

    -- Formatar: (DDD) NUMERO
    IF v_ddd != '' THEN
        v_resultado := '(' || v_ddd || ') ' || v_numero;
    ELSE
        v_resultado := v_numero;
    END IF;

    -- Adicionar ramal se houver
    IF v_ramal != '' THEN
        v_resultado := v_resultado || ' ramal ' || v_ramal;
    END IF;

    -- Adicionar tipo se não for padrão
    IF v_tipo != '' AND v_tipo != 'Residencial' THEN
        v_resultado := v_resultado || ' (' || v_tipo || ')';
    END IF;

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO PARA CONSOLIDAR TELEFONES DE UMA PESSOA
-- ============================================================================

CREATE OR REPLACE FUNCTION consolidar_telefones_pessoa(p_cod_pessoa BIGINT)
RETURNS VARCHAR AS $$
DECLARE
    v_telefones TEXT := '';
    v_count INTEGER := 0;
    rec RECORD;
BEGIN
    FOR rec IN (
        SELECT
            formatar_telefone_gim(ddd, numero, ramal, tipo) as telefone_formatado
        FROM staging_gim.telefones_gim
        WHERE cod_pessoa = p_cod_pessoa
        ORDER BY
            CASE tipo
                WHEN 'Celular' THEN 1
                WHEN 'Residencial' THEN 2
                WHEN 'Comercial' THEN 3
                ELSE 4
            END,
            cod_telefone
    ) LOOP
        IF rec.telefone_formatado IS NOT NULL THEN
            IF v_count > 0 THEN
                v_telefones := v_telefones || ' | ';
            END IF;
            v_telefones := v_telefones || rec.telefone_formatado;
            v_count := v_count + 1;
        END IF;
    END LOOP;

    -- Limitar tamanho se muito grande
    IF LENGTH(v_telefones) > 200 THEN
        v_telefones := LEFT(v_telefones, 197) || '...';
    END IF;

    RETURN NULLIF(v_telefones, '');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ATUALIZAR CAMPO TELEFONE NA TABELA PESSOA
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_pessoa_id_sigma INTEGER;
    v_telefones_consolidados VARCHAR;
BEGIN
    RAISE NOTICE 'Iniciando atualização de telefones...';

    FOR rec IN (
        SELECT DISTINCT cod_pessoa
        FROM staging_gim.telefones_gim
        WHERE cod_pessoa IS NOT NULL
    ) LOOP
        BEGIN
            -- Buscar pessoa no mapeamento
            SELECT id_sigma INTO v_pessoa_id_sigma
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_pessoa;

            IF v_pessoa_id_sigma IS NULL THEN
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('TELEFONE_PESSOA_NAO_ENCONTRADA', rec.cod_pessoa,
                        'Pessoa não encontrada no mapeamento');
                v_errors := v_errors + 1;
                CONTINUE;
            END IF;

            -- Consolidar telefones
            v_telefones_consolidados := consolidar_telefones_pessoa(rec.cod_pessoa);

            IF v_telefones_consolidados IS NOT NULL THEN
                -- Atualizar pessoa
                UPDATE "Pessoa"
                SET telefone = v_telefones_consolidados,
                    "updatedAt" = NOW()
                WHERE id = v_pessoa_id_sigma;

                v_count := v_count + 1;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('TELEFONE', rec.cod_pessoa, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE 'Telefones atualizados: %, Erros: %', v_count, v_errors;
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_pessoas_com_tel INTEGER;
    v_total_telefones_gim INTEGER;
    v_total_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_pessoas_com_tel
    FROM "Pessoa"
    WHERE telefone IS NOT NULL AND telefone != '';

    SELECT COUNT(*) INTO v_total_telefones_gim
    FROM staging_gim.telefones_gim;

    SELECT COUNT(*) INTO v_total_erros
    FROM staging_gim.log_erros
    WHERE etapa LIKE 'TELEFONE%';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE TELEFONES CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Telefones no GIM: %', v_total_telefones_gim;
    RAISE NOTICE 'Pessoas com telefone no SIGMA: %', v_total_pessoas_com_tel;
    RAISE NOTICE 'Total de erros: %', v_total_erros;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Ver exemplos de telefones migrados
SELECT
    id,
    nome,
    telefone
FROM "Pessoa"
WHERE telefone IS NOT NULL
LIMIT 20;

-- Ver pessoas com múltiplos telefones (contém '|')
SELECT
    id,
    nome,
    telefone,
    LENGTH(telefone) - LENGTH(REPLACE(telefone, '|', '')) + 1 as qtd_telefones
FROM "Pessoa"
WHERE telefone LIKE '%|%'
ORDER BY qtd_telefones DESC
LIMIT 20;

-- Ver erros
SELECT * FROM staging_gim.log_erros WHERE etapa LIKE 'TELEFONE%';

-- Estatísticas
SELECT
    'Total de pessoas' as metrica,
    COUNT(*) as quantidade
FROM "Pessoa"
UNION ALL
SELECT
    'Pessoas com telefone',
    COUNT(*)
FROM "Pessoa"
WHERE telefone IS NOT NULL AND telefone != ''
UNION ALL
SELECT
    'Pessoas com múltiplos telefones',
    COUNT(*)
FROM "Pessoa"
WHERE telefone LIKE '%|%';
