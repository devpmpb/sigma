-- ============================================================================
-- RESTAURAÇÃO DOS SUBSÍDIOS A PARTIR DO MAPEAMENTO EXISTENTE
-- ============================================================================
-- O map_subsidios já tem o mapeamento correto de id_gim -> produtor_id_sigma + programa_id_sigma
-- Basta re-inserir usando os dados originais do staging + o mapeamento

-- Primeiro limpar o map_subsidios antigo (vamos recriar)
TRUNCATE staging_gim.map_subsidios;

-- Re-executar a migração usando as funções já existentes
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
    RAISE NOTICE 'RESTAURANDO SUBSÍDIOS';
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
                CONTINUE;
            END IF;

            v_programa_id := mapear_enquadramento_programa(rec.enquadramento, rec.cod_programa);

            IF v_programa_id IS NULL THEN
                v_sem_programa := v_sem_programa + 1;
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
                converter_decimal_br(rec.valor),
                converter_decimal_br(rec.quantidade),
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
            RAISE NOTICE 'Erro no subsidio %: %', rec.cod_subsidio, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE 'Subsídios restaurados: %', v_count;
    RAISE NOTICE 'Sem produtor: %', v_sem_produtor;
    RAISE NOTICE 'Sem programa: %', v_sem_programa;
    RAISE NOTICE 'Outros erros: %', v_errors;
END $$;

-- Verificar resultado
SELECT status, COUNT(*) as quantidade, SUM("valorCalculado") as valor_total
FROM "SolicitacaoBeneficio"
GROUP BY status
ORDER BY quantidade DESC;
