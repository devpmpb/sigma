-- ============================================================================
-- SCRIPT DE MIGRAÇÃO GIM → SIGMA - VERSÃO PGADMIN
-- TELEFONES + SUBSÍDIOS - COMPLETO
-- ============================================================================
--
-- IMPORTANTE: Este script é otimizado para pgAdmin
--
-- ANTES DE EXECUTAR:
-- 1. Importe telefone.csv via pgAdmin (veja instruções abaixo)
-- 2. Importe subsidio.csv via pgAdmin (veja instruções abaixo)
-- 3. Execute este script completo
--
-- Autor: Claude Code
-- Data: 2025-01-10
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR TABELAS DE STAGING
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

DROP TABLE IF EXISTS staging_gim.subsidios_gim CASCADE;
CREATE TABLE staging_gim.subsidios_gim (
    cod_subsidio BIGINT PRIMARY KEY,
    dt_liberacao TIMESTAMP,
    quantidade NUMERIC(10,2),
    valor NUMERIC(10,2),
    observacao TEXT,
    enquadramento VARCHAR(50),
    cod_produtor BIGINT,
    cod_programa BIGINT,
    situacao VARCHAR(30)
);

DROP TABLE IF EXISTS staging_gim.map_subsidios CASCADE;
CREATE TABLE staging_gim.map_subsidios (
    id_gim BIGINT PRIMARY KEY,
    id_sigma INTEGER NOT NULL,
    cod_produtor_gim BIGINT,
    produtor_id_sigma INTEGER,
    cod_programa_gim BIGINT,
    programa_id_sigma INTEGER,
    situacao_gim VARCHAR(30),
    status_sigma VARCHAR(30),
    migrado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INSTRUÇÕES PARA IMPORTAR OS CSVs NO PGADMIN
-- ============================================================================

/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                    IMPORTANTE: IMPORTAR CSVs PRIMEIRO                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

PASSO 1: IMPORTAR TELEFONE.CSV
-------------------------------
1. No pgAdmin, navegue até:
   Databases → sigma → Schemas → staging_gim → Tables → telefones_gim

2. Clique com o botão DIREITO em "telefones_gim"

3. Selecione: Import/Export Data...

4. Configure assim:
   ┌─────────────────────────────────────────────────────────────┐
   │ Import/Export:  ● Import  ○ Export                          │
   │ Format:         csv                                          │
   │ Filename:       C:\Users\marce\OneDrive\Desktop\telefone.csv│
   │ Header:         ☑ Yes                                        │
   │ Delimiter:      ;                                            │
   │ Quote:          "                                            │
   │ Escape:         "                                            │
   │ Encoding:       UTF8                                         │
   └─────────────────────────────────────────────────────────────┘

5. Clique em OK e aguarde

6. Você verá: "X rows imported" (esperado: ~2.500 linhas)


PASSO 2: IMPORTAR SUBSIDIO.CSV
-------------------------------
1. No pgAdmin, navegue até:
   Databases → sigma → Schemas → staging_gim → Tables → subsidios_gim

2. Clique com o botão DIREITO em "subsidios_gim"

3. Selecione: Import/Export Data...

4. Configure assim:
   ┌─────────────────────────────────────────────────────────────┐
   │ Import/Export:  ● Import  ○ Export                          │
   │ Format:         csv                                          │
   │ Filename:       C:\Users\marce\OneDrive\Desktop\subsidio.csv│
   │ Header:         ☑ Yes                                        │
   │ Delimiter:      ;                                            │
   │ Quote:          "                                            │
   │ Escape:         "                                            │
   │ Encoding:       UTF8                                         │
   └─────────────────────────────────────────────────────────────┘

5. Clique em OK e aguarde (pode levar 1-2 minutos)

6. Você verá: "X rows imported" (esperado: ~11.170 linhas)


PASSO 3: EXECUTAR ESTE SCRIPT
------------------------------
Após importar AMBOS os CSVs, execute todo o restante deste script.

═══════════════════════════════════════════════════════════════════════════
*/

-- ============================================================================
-- VERIFICAR SE OS CSVs FORAM IMPORTADOS
-- ============================================================================

DO $$
DECLARE
    v_total_telefones INTEGER;
    v_total_subsidios INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_telefones FROM staging_gim.telefones_gim;
    SELECT COUNT(*) INTO v_total_subsidios FROM staging_gim.subsidios_gim;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICAÇÃO DE IMPORTAÇÃO';
    RAISE NOTICE '========================================';

    IF v_total_telefones = 0 THEN
        RAISE EXCEPTION 'ERRO: Nenhum telefone foi importado! Por favor, importe telefone.csv via pgAdmin antes de continuar.';
    ELSE
        RAISE NOTICE '✓ Telefones importados: %', v_total_telefones;
    END IF;

    IF v_total_subsidios = 0 THEN
        RAISE EXCEPTION 'ERRO: Nenhum subsídio foi importado! Por favor, importe subsidio.csv via pgAdmin antes de continuar.';
    ELSE
        RAISE NOTICE '✓ Subsídios importados: %', v_total_subsidios;
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- PARTE 2: FUNÇÕES AUXILIARES - TELEFONES
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
    IF v_numero = '' THEN RETURN NULL; END IF;

    IF v_ddd != '' THEN
        v_resultado := '(' || v_ddd || ') ' || v_numero;
    ELSE
        v_resultado := v_numero;
    END IF;

    IF v_ramal != '' THEN
        v_resultado := v_resultado || ' ramal ' || v_ramal;
    END IF;

    IF v_tipo != '' AND v_tipo != 'Residencial' THEN
        v_resultado := v_resultado || ' (' || v_tipo || ')';
    END IF;

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION consolidar_telefones_pessoa(p_cod_pessoa BIGINT)
RETURNS VARCHAR AS $$
DECLARE
    v_telefones TEXT := '';
    v_count INTEGER := 0;
    rec RECORD;
BEGIN
    FOR rec IN (
        SELECT formatar_telefone_gim(ddd, numero, ramal, tipo) as telefone_formatado
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

    IF LENGTH(v_telefones) > 200 THEN
        v_telefones := LEFT(v_telefones, 197) || '...';
    END IF;

    RETURN NULLIF(v_telefones, '');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 3: FUNÇÕES AUXILIARES - SUBSÍDIOS
-- ============================================================================

CREATE OR REPLACE FUNCTION mapear_status_subsidio(situacao_gim VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE
        WHEN UPPER(TRIM(situacao_gim)) = 'ENTREGUE' THEN 'aprovado'
        WHEN UPPER(TRIM(situacao_gim)) = 'CANCELADO' THEN 'cancelado'
        WHEN UPPER(TRIM(situacao_gim)) = 'PENDENTE' THEN 'pendente'
        ELSE 'pendente'
    END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mapear_enquadramento_programa(
    p_enquadramento VARCHAR,
    p_cod_programa_gim BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_programa_id INTEGER;
BEGIN
    v_programa_id := CASE p_cod_programa_gim
        WHEN 1 THEN (SELECT id FROM "Programa" WHERE nome ILIKE '%calcário%' OR nome ILIKE '%insumo%' LIMIT 1)
        WHEN 2 THEN (SELECT id FROM "Programa" WHERE nome ILIKE '%semente%' OR nome ILIKE '%muda%' LIMIT 1)
        WHEN 3 THEN (SELECT id FROM "Programa" WHERE nome ILIKE '%fertilizante%' OR nome ILIKE '%adubo%' LIMIT 1)
        ELSE NULL
    END;

    IF v_programa_id IS NULL THEN
        SELECT id INTO v_programa_id
        FROM "Programa"
        WHERE "tipoPrograma" = 'SUBSIDIO'
        LIMIT 1;
    END IF;

    RETURN v_programa_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 4: GARANTIR PROGRAMA PADRÃO
-- ============================================================================

DO $$
DECLARE
    v_programa_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_programa_count FROM "Programa";

    IF v_programa_count = 0 THEN
        RAISE NOTICE 'Criando programa padrão...';

        INSERT INTO "Programa" (
            nome,
            descricao,
            "tipoPrograma",
            secretaria,
            ativo,
            "createdAt",
            "updatedAt"
        ) VALUES
        ('Programa de Subsídio Agrícola - Migrado do GIM',
         'Programa genérico para migração de subsídios do sistema GIM',
         'SUBSIDIO',
         'AGRICULTURA',
         true,
         NOW(),
         NOW());

        RAISE NOTICE '✓ Programa padrão criado';
    END IF;
END $$;

-- ============================================================================
-- PARTE 5: MIGRAR TELEFONES
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_pessoa_id_sigma INTEGER;
    v_telefones_consolidados VARCHAR;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INICIANDO MIGRAÇÃO DE TELEFONES';
    RAISE NOTICE '========================================';

    FOR rec IN (
        SELECT DISTINCT cod_pessoa
        FROM staging_gim.telefones_gim
        WHERE cod_pessoa IS NOT NULL
    ) LOOP
        BEGIN
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

            v_telefones_consolidados := consolidar_telefones_pessoa(rec.cod_pessoa);

            IF v_telefones_consolidados IS NOT NULL THEN
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

    RAISE NOTICE '✓ Telefones atualizados: %', v_count;
    RAISE NOTICE '✗ Erros: %', v_errors;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- PARTE 6: MIGRAR SUBSÍDIOS
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    v_sem_produtor INTEGER := 0;
    v_sem_programa INTEGER := 0;
    rec RECORD;
    v_produtor_id INTEGER;
    v_programa_id INTEGER;
    v_status_sigma VARCHAR;
    v_solicitacao_id INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INICIANDO MIGRAÇÃO DE SUBSÍDIOS';
    RAISE NOTICE '========================================';

    FOR rec IN (
        SELECT * FROM staging_gim.subsidios_gim
        ORDER BY cod_subsidio
    ) LOOP
        BEGIN
            v_produtor_id := NULL;
            IF rec.cod_produtor IS NOT NULL THEN
                SELECT id_sigma INTO v_produtor_id
                FROM staging_gim.map_pessoas
                WHERE id_gim = rec.cod_produtor;
            END IF;

            IF v_produtor_id IS NULL THEN
                v_sem_produtor := v_sem_produtor + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('SUBSIDIO_SEM_PRODUTOR', rec.cod_subsidio,
                        'Produtor não encontrado: ' || COALESCE(rec.cod_produtor::TEXT, 'NULL'));
                CONTINUE;
            END IF;

            v_programa_id := mapear_enquadramento_programa(rec.enquadramento, rec.cod_programa);

            IF v_programa_id IS NULL THEN
                v_sem_programa := v_sem_programa + 1;
                INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
                VALUES ('SUBSIDIO_SEM_PROGRAMA', rec.cod_subsidio,
                        'Programa não encontrado para cod_programa: ' || rec.cod_programa);
                CONTINUE;
            END IF;

            v_status_sigma := mapear_status_subsidio(rec.situacao);

            INSERT INTO "SolicitacaoBeneficio" (
                "pessoaId",
                "programaId",
                "datasolicitacao",
                status,
                observacoes,
                "valorCalculado",
                "quantidadeSolicitada",
                "createdAt",
                "updatedAt"
            ) VALUES (
                v_produtor_id,
                v_programa_id,
                COALESCE(rec.dt_liberacao::DATE, NOW()::DATE),
                v_status_sigma,
                CASE
                    WHEN rec.observacao IS NOT NULL AND TRIM(rec.observacao) != '' THEN
                        'Enquadramento: ' || COALESCE(rec.enquadramento, 'N/A') || E'\n' ||
                        'Observação: ' || rec.observacao
                    ELSE
                        'Enquadramento: ' || COALESCE(rec.enquadramento, 'N/A')
                END,
                rec.valor,
                rec.quantidade,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_solicitacao_id;

            INSERT INTO staging_gim.map_subsidios (
                id_gim,
                id_sigma,
                cod_produtor_gim,
                produtor_id_sigma,
                cod_programa_gim,
                programa_id_sigma,
                situacao_gim,
                status_sigma
            ) VALUES (
                rec.cod_subsidio,
                v_solicitacao_id,
                rec.cod_produtor,
                v_produtor_id,
                rec.cod_programa,
                v_programa_id,
                rec.situacao,
                v_status_sigma
            );

            v_count := v_count + 1;

            IF v_count % 1000 = 0 THEN
                RAISE NOTICE 'Processados % subsídios...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES ('SUBSIDIO', rec.cod_subsidio, SQLERRM);
        END;
    END LOOP;

    RAISE NOTICE '✓ Subsídios migrados: %', v_count;
    RAISE NOTICE '✗ Sem produtor: %', v_sem_produtor;
    RAISE NOTICE '✗ Sem programa: %', v_sem_programa;
    RAISE NOTICE '✗ Outros erros: %', v_errors;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- RELATÓRIO FINAL CONSOLIDADO
-- ============================================================================

DO $$
DECLARE
    v_pessoas_com_tel INTEGER;
    v_total_telefones_gim INTEGER;
    v_erros_telefone INTEGER;
    v_total_subsidios INTEGER;
    v_subsidios_aprovados INTEGER;
    v_subsidios_cancelados INTEGER;
    v_subsidios_pendentes INTEGER;
    v_valor_total NUMERIC;
    v_valor_aprovado NUMERIC;
    v_erros_subsidio INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_telefones_gim FROM staging_gim.telefones_gim;
    SELECT COUNT(*) INTO v_pessoas_com_tel FROM "Pessoa" WHERE telefone IS NOT NULL AND telefone != '';
    SELECT COUNT(*) INTO v_erros_telefone FROM staging_gim.log_erros WHERE etapa LIKE 'TELEFONE%';

    SELECT COUNT(*) INTO v_total_subsidios FROM staging_gim.map_subsidios;
    SELECT COUNT(*) INTO v_subsidios_aprovados FROM "SolicitacaoBeneficio" WHERE status = 'aprovado';
    SELECT COUNT(*) INTO v_subsidios_cancelados FROM "SolicitacaoBeneficio" WHERE status = 'cancelado';
    SELECT COUNT(*) INTO v_subsidios_pendentes FROM "SolicitacaoBeneficio" WHERE status = 'pendente';
    SELECT COALESCE(SUM("valorCalculado"), 0) INTO v_valor_total FROM "SolicitacaoBeneficio";
    SELECT COALESCE(SUM("valorCalculado"), 0) INTO v_valor_aprovado FROM "SolicitacaoBeneficio" WHERE status = 'aprovado';
    SELECT COUNT(*) INTO v_erros_subsidio FROM staging_gim.log_erros WHERE etapa LIKE 'SUBSIDIO%';

    RAISE NOTICE '╔════════════════════════════════════════╗';
    RAISE NOTICE '║  RELATÓRIO FINAL DA MIGRAÇÃO           ║';
    RAISE NOTICE '╚════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📞 TELEFONES:';
    RAISE NOTICE '  Total no GIM: %', v_total_telefones_gim;
    RAISE NOTICE '  Pessoas com telefone no SIGMA: %', v_pessoas_com_tel;
    RAISE NOTICE '  Erros: %', v_erros_telefone;
    RAISE NOTICE '';
    RAISE NOTICE '💰 SUBSÍDIOS:';
    RAISE NOTICE '  Total migrados: %', v_total_subsidios;
    RAISE NOTICE '    - Aprovados: %', v_subsidios_aprovados;
    RAISE NOTICE '    - Cancelados: %', v_subsidios_cancelados;
    RAISE NOTICE '    - Pendentes: %', v_subsidios_pendentes;
    RAISE NOTICE '  Valor total: R$ %', v_valor_total;
    RAISE NOTICE '  Valor aprovado: R$ %', v_valor_aprovado;
    RAISE NOTICE '  Erros: %', v_erros_subsidio;
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';

    IF v_erros_telefone > 0 OR v_erros_subsidio > 0 THEN
        RAISE NOTICE '⚠ Para ver detalhes dos erros, execute:';
        RAISE NOTICE 'SELECT * FROM staging_gim.log_erros;';
    ELSE
        RAISE NOTICE '✓ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
    END IF;

    RAISE NOTICE '════════════════════════════════════════';
END $$;
