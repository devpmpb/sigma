-- ============================================================================
-- QUERIES PARA EXECUTAR NO BANCO GIM (SQL SERVER)
-- Execute estas queries AMANHÃ no trabalho para coletar informações
-- ============================================================================

-- ============================================================================
-- 1. VALORES POSSÍVEIS DE STATUS/SITUAÇÃO EM SUBSIDIO
-- ============================================================================

-- Ver todos os valores distintos de 'situacao' e quantos registros cada um tem
SELECT
    situacao,
    COUNT(*) as quantidade,
    MIN(dtLiberacao) as primeira_ocorrencia,
    MAX(dtLiberacao) as ultima_ocorrencia
FROM Subsidio
GROUP BY situacao
ORDER BY quantidade DESC;

-- ============================================================================
-- 2. ANÁLISE DE ENQUADRAMENTO (P/G)
-- ============================================================================

-- Ver distribuição de enquadramento
SELECT
    enquadramento,
    COUNT(*) as quantidade,
    AVG(valor) as valor_medio,
    MIN(valor) as valor_minimo,
    MAX(valor) as valor_maximo,
    SUM(valor) as valor_total
FROM Subsidio
GROUP BY enquadramento;

-- Ver se há valores NULL ou vazios
SELECT
    CASE
        WHEN enquadramento IS NULL THEN 'NULL'
        WHEN enquadramento = '' THEN 'VAZIO'
        ELSE enquadramento
    END as enquadramento_status,
    COUNT(*) as quantidade
FROM Subsidio
GROUP BY
    CASE
        WHEN enquadramento IS NULL THEN 'NULL'
        WHEN enquadramento = '' THEN 'VAZIO'
        ELSE enquadramento
    END;

-- ============================================================================
-- 3. VERIFICAR SE EXISTE TABELA PROGRAMA
-- ============================================================================

-- Tentar selecionar da tabela Programa
SELECT TOP 10
    codPrograma,
    nome,
    descricao
FROM Programa;

-- Se der erro, significa que a tabela não existe
-- Se funcionar, executar esta para ver todos:
SELECT
    codPrograma,
    nome,
    descricao,
    COUNT(*) OVER() as total_programas
FROM Programa
ORDER BY codPrograma;

-- ============================================================================
-- 4. RELAÇÃO SUBSIDIO ↔ PROGRAMA
-- ============================================================================

-- Ver quantos subsídios estão vinculados a cada programa
SELECT
    p.codPrograma,
    p.nome as nome_programa,
    COUNT(s.codSubsidio) as qtd_subsidios,
    SUM(s.valor) as valor_total
FROM Programa p
LEFT JOIN Subsidio s ON s.codPrograma = p.codPrograma
GROUP BY p.codPrograma, p.nome
ORDER BY qtd_subsidios DESC;

-- Ver subsídios sem programa (se houver)
SELECT COUNT(*)
FROM Subsidio
WHERE codPrograma IS NULL;

-- ============================================================================
-- 5. ANÁLISE DE AUTORIZACAO (se quiser migrar)
-- ============================================================================

-- Ver estrutura da tabela Autorizacao
SELECT TOP 5 * FROM Autorizacao;

-- Ver relação Subsidio ↔ Autorizacao
SELECT
    s.codSubsidio,
    s.situacao as situacao_subsidio,
    COUNT(a.codAutorizacao) as qtd_autorizacoes,
    SUM(a.valor) as valor_autorizado_total,
    s.valor as valor_subsidio
FROM Subsidio s
LEFT JOIN Autorizacao a ON a.codSubsidio = s.codSubsidio
GROUP BY s.codSubsidio, s.situacao, s.valor
ORDER BY qtd_autorizacoes DESC;

-- Ver se há subsídios com múltiplas autorizações
SELECT
    COUNT(*) as subsidios_com_multiplas_autorizacoes
FROM (
    SELECT codSubsidio, COUNT(*) as qtd
    FROM Autorizacao
    GROUP BY codSubsidio
    HAVING COUNT(*) > 1
) subquery;

-- ============================================================================
-- 6. TOTAIS GERAIS (para validação futura)
-- ============================================================================

-- Resumo geral
SELECT
    'Total de Subsídios' as item,
    COUNT(*) as valor
FROM Subsidio
UNION ALL
SELECT
    'Total de Produtores Únicos',
    COUNT(DISTINCT codProdutor)
FROM Subsidio
UNION ALL
SELECT
    'Total de Programas Únicos',
    COUNT(DISTINCT codPrograma)
FROM Subsidio
UNION ALL
SELECT
    'Valor Total de Subsídios',
    CAST(SUM(valor) as INT)
FROM Subsidio
UNION ALL
SELECT
    'Subsídios com Enquadramento P',
    COUNT(*)
FROM Subsidio
WHERE enquadramento = 'P'
UNION ALL
SELECT
    'Subsídios com Enquadramento G',
    COUNT(*)
FROM Subsidio
WHERE enquadramento = 'G';

-- ============================================================================
-- 7. CASOS ESPECIAIS / PROBLEMAS POTENCIAIS
-- ============================================================================

-- Subsídios com valores NULL ou ZERO
SELECT
    'Subsídios sem valor (NULL)' as problema,
    COUNT(*) as quantidade
FROM Subsidio
WHERE valor IS NULL
UNION ALL
SELECT
    'Subsídios com valor ZERO',
    COUNT(*)
FROM Subsidio
WHERE valor = 0
UNION ALL
SELECT
    'Subsídios sem data de liberação',
    COUNT(*)
FROM Subsidio
WHERE dtLiberacao IS NULL
UNION ALL
SELECT
    'Subsídios sem produtor',
    COUNT(*)
FROM Subsidio
WHERE codProdutor IS NULL;

-- ============================================================================
-- 8. AMOSTRAGEM DE DADOS (para conferência)
-- ============================================================================

-- Ver exemplo de cada situação
SELECT TOP 1
    'Exemplo: ' + COALESCE(situacao, 'NULL') as tipo,
    codSubsidio,
    codProdutor,
    codPrograma,
    valor,
    enquadramento,
    dtLiberacao,
    observacao
FROM Subsidio
WHERE situacao IS NOT NULL
GROUP BY situacao, codSubsidio, codProdutor, codPrograma, valor, enquadramento, dtLiberacao, observacao;

-- ============================================================================
-- INSTRUÇÕES
-- ============================================================================

/*
APÓS EXECUTAR ESTAS QUERIES:

1. Anote os valores de 'situacao' da Query #1
   Exemplo:
   - LIBERADO
   - CANCELADO
   - PENDENTE
   (etc)

2. Complete o arquivo 04-migrar-subsidios-TEMPLATE.sql com o mapeamento:
   GIM 'situacao' → SIGMA 'status'

3. Se a tabela Programa existir (Query #3), anote os programas
   Se não existir, crie programas manualmente no SIGMA antes da migração

4. Decida se quer migrar a tabela Autorizacao (Query #5)
   - Se SIM: avise Claude que vai criar script adicional
   - Se NÃO: ignorar autorizações

5. Guarde os totais da Query #6 para validação após migração
*/
