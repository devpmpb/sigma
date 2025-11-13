-- ============================================================================
-- SCRIPT DE VALIDAÇÃO COMPLETA DA MIGRAÇÃO GIM → SIGMA
-- ============================================================================
--
-- Este script verifica se todos os dados foram migrados corretamente
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

DO $$
DECLARE
    -- Contadores SIGMA
    v_pessoas INTEGER;
    v_propriedades INTEGER;
    v_enderecos INTEGER;
    v_programas INTEGER;
    v_regras_negocio INTEGER;
    v_telefones INTEGER;
    v_telefones_principais INTEGER;
    v_subsidios INTEGER;
    v_ramos INTEGER;

    -- Contadores GIM (staging)
    v_pessoas_gim INTEGER;
    v_propriedades_gim INTEGER;
    v_enderecos_gim INTEGER;
    v_programas_gim INTEGER;
    v_telefones_gim INTEGER;
    v_subsidios_gim INTEGER;
    v_ramos_gim INTEGER;

    -- Erros
    v_total_erros INTEGER;

    -- Status
    v_status_geral VARCHAR := '✅ SUCESSO';
    v_problemas TEXT := '';
BEGIN
    -- ========================================
    -- CONTAR REGISTROS NO SIGMA
    -- ========================================
    SELECT COUNT(*) INTO v_pessoas FROM "Pessoa";
    SELECT COUNT(*) INTO v_propriedades FROM "Propriedade";
    SELECT COUNT(*) INTO v_enderecos FROM "Endereco";
    SELECT COUNT(*) INTO v_programas FROM "Programa";
    SELECT COUNT(*) INTO v_regras_negocio FROM "RegrasNegocio";
    SELECT COUNT(*) INTO v_telefones FROM "Telefone";
    SELECT COUNT(*) INTO v_telefones_principais FROM "Telefone" WHERE principal = true;
    SELECT COUNT(*) INTO v_subsidios FROM "SolicitacaoBeneficio";
    SELECT COUNT(*) INTO v_ramos FROM "RamoAtividade";

    -- ========================================
    -- CONTAR REGISTROS NO GIM (STAGING)
    -- Tentar diferentes nomes de tabelas (pessoas_gim ou pessoas_csv)
    -- ========================================

    -- Pessoas
    BEGIN
        SELECT COUNT(*) INTO v_pessoas_gim FROM staging_gim.pessoas_gim;
    EXCEPTION WHEN undefined_table THEN
        BEGIN
            SELECT COUNT(*) INTO v_pessoas_gim FROM staging_gim.pessoas_csv;
        EXCEPTION WHEN undefined_table THEN
            v_pessoas_gim := 0;
        END;
    END;

    -- Propriedades
    BEGIN
        SELECT COUNT(*) INTO v_propriedades_gim FROM staging_gim.propriedades_gim;
    EXCEPTION WHEN undefined_table THEN
        BEGIN
            SELECT COUNT(*) INTO v_propriedades_gim FROM staging_gim.propriedades_csv;
        EXCEPTION WHEN undefined_table THEN
            v_propriedades_gim := 0;
        END;
    END;

    -- Endereços
    BEGIN
        SELECT COUNT(*) INTO v_enderecos_gim FROM staging_gim.enderecos_gim;
    EXCEPTION WHEN undefined_table THEN
        BEGIN
            SELECT COUNT(*) INTO v_enderecos_gim FROM staging_gim.enderecos_csv;
        EXCEPTION WHEN undefined_table THEN
            v_enderecos_gim := 0;
        END;
    END;

    -- Programas
    BEGIN
        SELECT COUNT(*) INTO v_programas_gim FROM staging_gim.programas_gim;
    EXCEPTION WHEN undefined_table THEN
        v_programas_gim := 0;
    END;

    -- Telefones
    BEGIN
        SELECT COUNT(*) INTO v_telefones_gim FROM staging_gim.telefones_gim;
    EXCEPTION WHEN undefined_table THEN
        v_telefones_gim := 0;
    END;

    -- Subsídios
    BEGIN
        SELECT COUNT(*) INTO v_subsidios_gim FROM staging_gim.subsidios_gim;
    EXCEPTION WHEN undefined_table THEN
        v_subsidios_gim := 0;
    END;

    -- Ramos
    BEGIN
        SELECT COUNT(*) INTO v_ramos_gim FROM staging_gim.ramos_gim;
    EXCEPTION WHEN undefined_table THEN
        v_ramos_gim := 0;
    END;

    -- ========================================
    -- CONTAR ERROS
    -- ========================================
    SELECT COUNT(*) INTO v_total_erros FROM staging_gim.log_erros;

    -- ========================================
    -- VERIFICAR PROBLEMAS
    -- ========================================

    -- Pessoas
    IF v_pessoas = 0 THEN
        v_status_geral := '🔴 ERRO';
        v_problemas := v_problemas || '- PESSOAS não foram migradas!' || E'\n';
    ELSIF v_pessoas < (v_pessoas_gim * 0.9) THEN
        v_status_geral := '⚠️ AVISO';
        v_problemas := v_problemas || '- PESSOAS: migradas ' || v_pessoas || ' de ' || v_pessoas_gim || E'\n';
    END IF;

    -- Programas
    IF v_programas = 0 THEN
        v_status_geral := '🔴 ERRO';
        v_problemas := v_problemas || '- PROGRAMAS não foram migrados!' || E'\n';
    END IF;

    -- Regras de Negócio
    IF v_regras_negocio = 0 THEN
        v_status_geral := '🔴 ERRO';
        v_problemas := v_problemas || '- REGRAS DE NEGÓCIO não foram criadas! Sistema não conseguirá calcular benefícios!' || E'\n';
    END IF;

    -- Telefones
    IF v_telefones = 0 THEN
        v_status_geral := '⚠️ AVISO';
        v_problemas := v_problemas || '- TELEFONES não foram migrados!' || E'\n';
    END IF;

    -- Subsídios
    IF v_subsidios = 0 THEN
        v_status_geral := '⚠️ AVISO';
        v_problemas := v_problemas || '- SUBSÍDIOS não foram migrados!' || E'\n';
    ELSIF v_subsidios < (v_subsidios_gim * 0.9) THEN
        v_status_geral := '⚠️ AVISO';
        v_problemas := v_problemas || '- SUBSÍDIOS: migrados ' || v_subsidios || ' de ' || v_subsidios_gim || E'\n';
    END IF;

    -- Erros
    IF v_total_erros > (v_pessoas_gim + v_subsidios_gim) * 0.1 THEN
        v_status_geral := '⚠️ AVISO';
        v_problemas := v_problemas || '- Muitos erros durante migração: ' || v_total_erros || E'\n';
    END IF;

    -- ========================================
    -- EXIBIR RELATÓRIO
    -- ========================================
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║     RELATÓRIO DE VALIDAÇÃO COMPLETA DA MIGRAÇÃO GIM → SIGMA   ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE 'STATUS GERAL: %', v_status_geral;
    RAISE NOTICE '';

    IF v_problemas != '' THEN
        RAISE NOTICE '⚠️  PROBLEMAS ENCONTRADOS:';
        RAISE NOTICE '%', v_problemas;
    END IF;

    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE 'COMPARAÇÃO GIM vs SIGMA:';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 PESSOAS:';
    RAISE NOTICE '   GIM (staging):  % registros', v_pessoas_gim;
    RAISE NOTICE '   SIGMA:          % registros', v_pessoas;
    RAISE NOTICE '';

    RAISE NOTICE '🏡 PROPRIEDADES:';
    RAISE NOTICE '   GIM (staging):  % registros', v_propriedades_gim;
    RAISE NOTICE '   SIGMA:          % registros', v_propriedades;
    RAISE NOTICE '';

    RAISE NOTICE '📍 ENDEREÇOS:';
    RAISE NOTICE '   GIM (staging):  % registros', v_enderecos_gim;
    RAISE NOTICE '   SIGMA:          % registros', v_enderecos;
    RAISE NOTICE '';

    RAISE NOTICE '📋 PROGRAMAS:';
    RAISE NOTICE '   GIM (staging):  % registros', v_programas_gim;
    RAISE NOTICE '   SIGMA:          % registros', v_programas;
    RAISE NOTICE '';

    RAISE NOTICE '⚙️  REGRAS DE NEGÓCIO:';
    RAISE NOTICE '   SIGMA:          % regras criadas', v_regras_negocio;
    RAISE NOTICE '   (Uma ou mais regras por programa)';
    RAISE NOTICE '';

    RAISE NOTICE '📞 TELEFONES:';
    RAISE NOTICE '   GIM (staging):  % registros', v_telefones_gim;
    RAISE NOTICE '   SIGMA:          % registros', v_telefones;
    RAISE NOTICE '   Principais:     % registros', v_telefones_principais;
    RAISE NOTICE '';

    RAISE NOTICE '💰 SUBSÍDIOS/BENEFÍCIOS:';
    RAISE NOTICE '   GIM (staging):  % registros', v_subsidios_gim;
    RAISE NOTICE '   SIGMA:          % registros', v_subsidios;
    RAISE NOTICE '';

    IF v_ramos > 0 THEN
        RAISE NOTICE '🌾 RAMOS DE ATIVIDADE:';
        RAISE NOTICE '   SIGMA:          % registros', v_ramos;
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE 'ERROS DE MIGRAÇÃO:';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Total de erros registrados: %', v_total_erros;
    RAISE NOTICE '';

    IF v_total_erros > 0 THEN
        RAISE NOTICE '⚠️  Execute esta query para ver os erros:';
        RAISE NOTICE '   SELECT etapa, COUNT(*) as qtd FROM staging_gim.log_erros GROUP BY etapa ORDER BY qtd DESC;';
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '════════════════════════════════════════════════════════════════';

    IF v_status_geral = '✅ SUCESSO' THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
        RAISE NOTICE '';
        RAISE NOTICE 'Próximos passos:';
        RAISE NOTICE '1. Validar dados no frontend';
        RAISE NOTICE '2. Criar endpoints para Telefone';
        RAISE NOTICE '3. Implementar cálculo de benefícios com RegrasNegocio';
        RAISE NOTICE '4. Treinar usuários';
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- QUERIES ADICIONAIS PARA ANÁLISE DETALHADA
-- ============================================================================

-- Distribuição de erros por etapa
SELECT
    etapa,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM staging_gim.log_erros), 2) as percentual
FROM staging_gim.log_erros
GROUP BY etapa
ORDER BY quantidade DESC;

-- Programas sem regras de negócio (CRÍTICO!)
SELECT
    p.id,
    p.nome,
    p."tipoPrograma",
    p.ativo
FROM "Programa" p
LEFT JOIN "RegrasNegocio" r ON r."programaId" = p.id
WHERE r.id IS NULL
ORDER BY p.id;

-- Pessoas sem telefone
SELECT COUNT(*) as pessoas_sem_telefone
FROM "Pessoa" p
LEFT JOIN "Telefone" t ON t."pessoaId" = p.id
WHERE t.id IS NULL;

-- Distribuição de subsídios por status
SELECT
    status,
    COUNT(*) as quantidade,
    SUM("valorCalculado") as valor_total,
    ROUND(AVG("valorCalculado"), 2) as valor_medio
FROM "SolicitacaoBeneficio"
GROUP BY status
ORDER BY quantidade DESC;

-- Top 10 programas com mais benefícios
SELECT
    p.nome as programa,
    COUNT(sb.id) as qtd_beneficios,
    SUM(sb."valorCalculado") as valor_total
FROM "Programa" p
LEFT JOIN "SolicitacaoBeneficio" sb ON sb."programaId" = p.id
GROUP BY p.id, p.nome
ORDER BY COUNT(sb.id) DESC
LIMIT 10;
