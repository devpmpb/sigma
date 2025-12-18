-- =============================================================================
-- SIGMA - Script para Limpar Dados de Teste
-- =============================================================================
-- CUIDADO: Este script apaga dados! Use apenas para limpar testes.
-- Execute no pgAdmin ou psql
-- =============================================================================

-- Desabilitar verificação de foreign keys temporariamente
SET session_replication_role = 'replica';

-- =============================================================================
-- APAGAR DADOS DE TESTE (mantém cadastros base)
-- =============================================================================

-- Apagar solicitações de benefício (dados de teste)
DELETE FROM "SolicitacaoBeneficio";
TRUNCATE TABLE "SolicitacaoBeneficio" RESTART IDENTITY CASCADE;

-- Apagar transferências de propriedade
DELETE FROM "TransferenciaPropriedade";

-- Apagar sessões de usuário
DELETE FROM "UsuarioSessao";

-- =============================================================================
-- OPCIONAL: Apagar cadastros também (descomente se necessário)
-- =============================================================================

-- Apagar arrendamentos
-- DELETE FROM "Arrendamento";

-- Apagar propriedades e vínculos
-- DELETE FROM "PropriedadeProprietario";
-- DELETE FROM "Propriedade";

-- Apagar endereços
-- DELETE FROM "Endereco";

-- Apagar pessoas (exceto usuários do sistema)
-- DELETE FROM "Pessoa" WHERE id NOT IN (SELECT "pessoaId" FROM "Usuario" WHERE "pessoaId" IS NOT NULL);

-- =============================================================================
-- RESETAR SEQUÊNCIAS (IDs voltam para 1)
-- =============================================================================

-- Resetar sequência de solicitações
ALTER SEQUENCE "SolicitacaoBeneficio_id_seq" RESTART WITH 1;

-- Resetar sequência de transferências
ALTER SEQUENCE "TransferenciaPropriedade_id_seq" RESTART WITH 1;

-- =============================================================================
-- Reabilitar verificação de foreign keys
-- =============================================================================
SET session_replication_role = 'origin';

-- Verificar contagem
SELECT 'SolicitacaoBeneficio' as tabela, COUNT(*) as registros FROM "SolicitacaoBeneficio"
UNION ALL
SELECT 'TransferenciaPropriedade', COUNT(*) FROM "TransferenciaPropriedade"
UNION ALL
SELECT 'Arrendamento', COUNT(*) FROM "Arrendamento"
UNION ALL
SELECT 'Propriedade', COUNT(*) FROM "Propriedade"
UNION ALL
SELECT 'Pessoa', COUNT(*) FROM "Pessoa";
