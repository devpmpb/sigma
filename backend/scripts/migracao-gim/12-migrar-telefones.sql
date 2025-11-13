-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA
-- Parte 12: TELEFONES (TABELA SEPARADA 1:N)
-- ============================================================================
--
-- ARQUIVOS NECESSÁRIOS:
-- - C:\Users\marce\OneDrive\Desktop\telefone.csv
--
-- COMO EXECUTAR:
-- 1. Abra o pgAdmin
-- 2. Tools → Query Tool
-- 3. Cole este script COMPLETO
-- 4. Execute (F5)
--
-- Autor: Claude Code
-- Data: 2025-01-12
-- ============================================================================

-- ============================================================================
-- PASSO 1: CRIAR TABELA DE STAGING (SE NÃO EXISTE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS staging_gim.telefones_gim (
    cod_telefone BIGINT,
    cod_pessoa BIGINT,
    ddd VARCHAR(3),
    numero VARCHAR(20),
    ramal VARCHAR(10),
    tipo VARCHAR(20)
);

-- Limpar dados anteriores (se re-executar)
TRUNCATE TABLE staging_gim.telefones_gim;

-- ============================================================================
-- PASSO 2: IMPORTAR CSV
-- ============================================================================

COPY staging_gim.telefones_gim
FROM 'C:\Users\marce\OneDrive\Desktop\telefone.csv'
WITH (FORMAT csv, DELIMITER ';', HEADER true, ENCODING 'UTF8');

-- Verificar importação
DO $$
DECLARE
    v_total_telefones INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_telefones FROM staging_gim.telefones_gim;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTAÇÃO CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Telefones importados: %', v_total_telefones;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 3: FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para mapear tipo de telefone GIM → SIGMA enum
CREATE OR REPLACE FUNCTION mapear_tipo_telefone(tipo_gim VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE UPPER(TRIM(COALESCE(tipo_gim, 'CELULAR')))
        WHEN 'CELULAR' THEN 'CELULAR'
        WHEN 'RESIDENCIAL' THEN 'RESIDENCIAL'
        WHEN 'COMERCIAL' THEN 'COMERCIAL'
        ELSE 'OUTRO'
    END;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar número (apenas dígitos)
CREATE OR REPLACE FUNCTION limpar_numero_telefone(numero VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    -- Remove tudo que não é número
    RETURN REGEXP_REPLACE(TRIM(COALESCE(numero, '')), '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASSO 4: MIGRAR TELEFONES
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    v_sem_pessoa INTEGER := 0;
    rec RECORD;
    v_pessoa_id_sigma INTEGER;
    v_tipo_sigma VARCHAR;
    v_numero_limpo VARCHAR;
    v_ordem INTEGER;
    v_is_principal BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRANDO TELEFONES';
    RAISE NOTICE '========================================';

    -- Limpar telefones existentes (se re-executar)
    DELETE FROM "Telefone";

    FOR rec IN (
        SELECT
            cod_telefone,
            cod_pessoa,
            ddd,
            numero,
            ramal,
            tipo,
            ROW_NUMBER() OVER (
                PARTITION BY cod_pessoa
                ORDER BY
                    CASE UPPER(TRIM(tipo))
                        WHEN 'CELULAR' THEN 1
                        WHEN 'RESIDENCIAL' THEN 2
                        WHEN 'COMERCIAL' THEN 3
                        ELSE 4
                    END,
                    cod_telefone
            ) as ordem_prioridade
        FROM staging_gim.telefones_gim
        WHERE cod_pessoa IS NOT NULL
        ORDER BY cod_pessoa, ordem_prioridade
    ) LOOP
        BEGIN
            -- Buscar pessoa no SIGMA
            SELECT id_sigma INTO v_pessoa_id_sigma
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_pessoa;

            IF v_pessoa_id_sigma IS NULL THEN
                v_sem_pessoa := v_sem_pessoa + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('TELEFONE_SEM_PESSOA', rec.cod_telefone,
                        'Pessoa não encontrada: ' || rec.cod_pessoa);
                CONTINUE;
            END IF;

            -- Limpar número
            v_numero_limpo := limpar_numero_telefone(rec.numero);

            IF v_numero_limpo = '' OR v_numero_limpo IS NULL THEN
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('TELEFONE_NUMERO_INVALIDO', rec.cod_telefone,
                        'Número vazio ou inválido');
                v_errors := v_errors + 1;
                CONTINUE;
            END IF;

            -- Mapear tipo
            v_tipo_sigma := mapear_tipo_telefone(rec.tipo);

            -- Primeiro telefone de cada pessoa é o principal
            v_is_principal := (rec.ordem_prioridade = 1);

            -- Inserir telefone
            INSERT INTO "Telefone" (
                "pessoaId",
                ddd,
                numero,
                ramal,
                tipo,
                principal,
                ativo,
                "createdAt",
                "updatedAt"
            ) VALUES (
                v_pessoa_id_sigma,
                NULLIF(TRIM(rec.ddd), ''),
                v_numero_limpo,
                NULLIF(TRIM(rec.ramal), ''),
                v_tipo_sigma::"TipoTelefone",
                v_is_principal,
                true,
                NOW(),
                NOW()
            );

            v_count := v_count + 1;

            -- Log de progresso a cada 500 registros
            IF v_count % 500 = 0 THEN
                RAISE NOTICE 'Processados % telefones...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('TELEFONE', rec.cod_telefone, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE 'Telefones migrados: %', v_count;
    RAISE NOTICE 'Sem pessoa: %', v_sem_pessoa;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_telefones INTEGER;
    v_total_principais INTEGER;
    v_total_celular INTEGER;
    v_total_residencial INTEGER;
    v_total_comercial INTEGER;
    v_pessoas_com_telefone INTEGER;
    v_total_erros INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_telefones FROM "Telefone";
    SELECT COUNT(*) INTO v_total_principais FROM "Telefone" WHERE principal = true;
    SELECT COUNT(*) INTO v_total_celular FROM "Telefone" WHERE tipo = 'CELULAR';
    SELECT COUNT(*) INTO v_total_residencial FROM "Telefone" WHERE tipo = 'RESIDENCIAL';
    SELECT COUNT(*) INTO v_total_comercial FROM "Telefone" WHERE tipo = 'COMERCIAL';

    SELECT COUNT(DISTINCT "pessoaId") INTO v_pessoas_com_telefone FROM "Telefone";

    SELECT COUNT(*) INTO v_total_erros
    FROM staging_gim.log_erros
    WHERE etapa LIKE 'TELEFONE%';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO FINAL - TELEFONES';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de telefones migrados: %', v_total_telefones;
    RAISE NOTICE '  - Principais: %', v_total_principais;
    RAISE NOTICE '  - Celulares: %', v_total_celular;
    RAISE NOTICE '  - Residenciais: %', v_total_residencial;
    RAISE NOTICE '  - Comerciais: %', v_total_comercial;
    RAISE NOTICE '';
    RAISE NOTICE 'Pessoas com telefone: %', v_pessoas_com_telefone;
    RAISE NOTICE 'Total de erros: %', v_total_erros;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERIES DE VALIDAÇÃO
-- ============================================================================

-- Ver telefones por pessoa (primeiros 20)
SELECT
    p.id,
    p.nome,
    t.tipo,
    t.ddd,
    t.numero,
    t.ramal,
    t.principal
FROM "Telefone" t
INNER JOIN "Pessoa" p ON p.id = t."pessoaId"
ORDER BY p.id, t.principal DESC, t.id
LIMIT 20;

-- Ver pessoas com múltiplos telefones
SELECT
    p.id,
    p.nome,
    COUNT(t.id) as qtd_telefones,
    STRING_AGG(
        t.tipo || ': ' ||
        CASE WHEN t.ddd IS NOT NULL THEN '(' || t.ddd || ') ' ELSE '' END ||
        t.numero ||
        CASE WHEN t.principal THEN ' [PRINCIPAL]' ELSE '' END,
        ', '
        ORDER BY t.principal DESC, t.id
    ) as telefones
FROM "Pessoa" p
INNER JOIN "Telefone" t ON t."pessoaId" = p.id
GROUP BY p.id, p.nome
HAVING COUNT(t.id) > 1
ORDER BY COUNT(t.id) DESC
LIMIT 20;

-- Distribuição de tipos
SELECT
    tipo,
    COUNT(*) as quantidade,
    COUNT(CASE WHEN principal = true THEN 1 END) as principais
FROM "Telefone"
GROUP BY tipo
ORDER BY quantidade DESC;

-- Pessoas sem telefone principal
SELECT
    p.id,
    p.nome,
    COUNT(t.id) as qtd_telefones
FROM "Pessoa" p
LEFT JOIN "Telefone" t ON t."pessoaId" = p.id AND t.principal = true
WHERE t.id IS NULL
  AND EXISTS (SELECT 1 FROM "Telefone" t2 WHERE t2."pessoaId" = p.id)
GROUP BY p.id, p.nome;

-- Ver erros
SELECT * FROM staging_gim.log_erros WHERE etapa LIKE 'TELEFONE%';

-- ============================================================================
-- OBSERVAÇÕES FINAIS
-- ============================================================================

/*
ESTRUTURA DA TABELA TELEFONE:

- id: ID único do telefone
- pessoaId: Referência à Pessoa (1:N)
- ddd: Código de área (opcional)
- numero: Número limpo (apenas dígitos)
- ramal: Ramal (opcional)
- tipo: CELULAR, RESIDENCIAL, COMERCIAL, OUTRO
- principal: Boolean indicando telefone principal
- ativo: Soft delete
- createdAt/updatedAt: Timestamps

PRIORIDADE DE TELEFONE PRINCIPAL:
1. Celular
2. Residencial
3. Comercial
4. Outros

PRÓXIMOS PASSOS:

1. Validar telefones migrados
2. Criar endpoints REST para CRUD de Telefone
3. Atualizar frontend para gerenciar múltiplos telefones
4. (Opcional) Migrar dados do campo Pessoa.telefone antigo para tabela

QUERIES ÚTEIS:

-- Buscar telefone principal de uma pessoa
SELECT * FROM "Telefone" WHERE "pessoaId" = 123 AND principal = true;

-- Buscar todos telefones de uma pessoa
SELECT * FROM "Telefone" WHERE "pessoaId" = 123 ORDER BY principal DESC, id;

-- Atualizar telefone principal
UPDATE "Telefone" SET principal = false WHERE "pessoaId" = 123;
UPDATE "Telefone" SET principal = true WHERE id = 456;
*/
