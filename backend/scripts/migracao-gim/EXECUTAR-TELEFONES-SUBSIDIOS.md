# 🚀 MIGRAÇÃO COMPLEMENTAR - TELEFONES E SUBSÍDIOS

## ✅ Arquivos Necessários

Você já possui os arquivos:
- `C:\Users\marce\OneDrive\Desktop\telefone.csv` (tabela Telefone do GIM)
- `C:\Users\marce\OneDrive\Desktop\subsidio.csv` (tabela Subsidio do GIM)

---

## 📋 PRÉ-REQUISITOS

**IMPORTANTE:** Antes de executar este script, certifique-se de que:

1. ✅ A migração de **Pessoas** já foi executada (scripts `01-migrar-pessoas.sql` ou `IMPORTAR-DADOS-PARCIAL.sql`)
2. ✅ O schema `staging_gim` existe e contém a tabela `map_pessoas`
3. ✅ Existe pelo menos um **Programa** cadastrado no SIGMA (ou o script criará um automaticamente)

Para verificar:

```sql
-- Verificar se pessoas foram migradas
SELECT COUNT(*) FROM "Pessoa";

-- Verificar se existe mapeamento
SELECT COUNT(*) FROM staging_gim.map_pessoas;

-- Verificar programas (opcional - será criado se não existir)
SELECT * FROM "Programa";
```

---

## 📝 COMO EXECUTAR

### **Opção 1: Script Completo (RECOMENDADO)**

Execute o script consolidado que migra telefones E subsídios de uma vez:

**Arquivo:** `07-migrar-telefones-e-subsidios-COMPLETO.sql`

#### **Usando DBeaver ou DataGrip:**

1. Abra o DBeaver/DataGrip
2. Conecte ao banco **sigma** (PostgreSQL)
3. Abra o arquivo `07-migrar-telefones-e-subsidios-COMPLETO.sql`
4. Execute tudo (Ctrl+Enter ou botão "Run")
5. Acompanhe o progresso no console

#### **Usando psql (linha de comando):**

```bash
cd C:\Fontes\sigma\backend\scripts\migracao-gim
psql -U postgres -d sigma -f 07-migrar-telefones-e-subsidios-COMPLETO.sql
```

#### **Usando pgAdmin:**

1. Abra o pgAdmin
2. Conecte ao servidor PostgreSQL
3. Selecione banco **sigma**
4. Tools → Query Tool
5. Abra `07-migrar-telefones-e-subsidios-COMPLETO.sql`
6. Execute (F5)

---

### **Opção 2: Scripts Separados**

Se preferir executar em etapas separadas:

1. **Primeiro: Telefones**
   ```bash
   psql -U postgres -d sigma -f 05-migrar-telefones.sql
   ```

2. **Depois: Subsídios**
   ```bash
   psql -U postgres -d sigma -f 06-migrar-subsidios.sql
   ```

---

## 📊 O QUE VAI ACONTECER

### **Parte 1: TELEFONES**

1. ✅ Importa arquivo `telefone.csv` para staging
2. ✅ Consolida múltiplos telefones por pessoa
3. ✅ Formata telefones: `(DDD) NUMERO [ramal X] [Tipo]`
4. ✅ Atualiza campo `telefone` na tabela `Pessoa`

**Exemplo de resultado:**
- Pessoa com 1 telefone: `(45) 32821206`
- Pessoa com 2 telefones: `(45) 99748463 (Celular) | (45) 32821665`
- Com ramal: `(45) 32821667 ramal 22`

### **Parte 2: SUBSÍDIOS**

1. ✅ Importa arquivo `subsidio.csv` para staging
2. ✅ Mapeia situações do GIM para status do SIGMA:
   - `ENTREGUE` → `aprovado`
   - `CANCELADO` → `cancelado`
   - `PENDENTE` → `pendente`
3. ✅ Vincula subsídio ao produtor (via `map_pessoas`)
4. ✅ Vincula ao programa (ou cria programa padrão)
5. ✅ Migra para tabela `SolicitacaoBeneficio`

---

## ⏱️ TEMPO ESTIMADO

- **Telefones:** ~1 minuto (processamento rápido)
- **Subsídios:** ~5-8 minutos (~11.170 registros)
- **TOTAL:** ~10 minutos

---

## ✅ RESULTADO ESPERADO

Você verá algo assim no console:

```
========================================
MIGRAÇÃO COMPLEMENTAR GIM → SIGMA
Parte 1: TELEFONES
Parte 2: SUBSÍDIOS
========================================

----------------------------------------
PARTE 1: IMPORTANDO TELEFONES
----------------------------------------
Telefones importados: 2547
Pessoas com telefone: 1832
✓ Telefones atualizados: 1832
✗ Erros: 0

----------------------------------------
PARTE 2: IMPORTANDO SUBSÍDIOS
----------------------------------------
Subsídios importados: 11170
  - ENTREGUE: 7588
  - CANCELADO: 3320
  - PENDENTE: 262
Valor total: R$ 2847530.50

Processados 1000 subsídios...
Processados 2000 subsídios...
...
Processados 11000 subsídios...

✓ Subsídios migrados: 10850
✗ Sem produtor: 285
✗ Sem programa: 0
✗ Outros erros: 35

========================================
RELATÓRIO FINAL DA MIGRAÇÃO COMPLEMENTAR
========================================

📞 TELEFONES:
  Total no GIM: 2547
  Pessoas com telefone no SIGMA: 1832
  Erros: 0

💰 SUBSÍDIOS:
  Total migrados: 10850
    - Aprovados: 7450
    - Cancelados: 3150
    - Pendentes: 250
  Valor total: R$ 2750000.00
  Valor aprovado: R$ 2100000.00
  Erros: 320

========================================
✓ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
========================================
```

---

## 🔍 VALIDAÇÃO DOS DADOS

Após a execução, valide os dados:

### **Validar Telefones:**

```sql
-- Ver quantas pessoas têm telefone
SELECT COUNT(*) FROM "Pessoa" WHERE telefone IS NOT NULL;

-- Ver exemplos de telefones
SELECT id, nome, telefone FROM "Pessoa" WHERE telefone IS NOT NULL LIMIT 20;

-- Ver pessoas com múltiplos telefones
SELECT
    id,
    nome,
    telefone,
    LENGTH(telefone) - LENGTH(REPLACE(telefone, '|', '')) + 1 as qtd_telefones
FROM "Pessoa"
WHERE telefone LIKE '%|%'
ORDER BY qtd_telefones DESC
LIMIT 20;
```

### **Validar Subsídios:**

```sql
-- Ver total de subsídios por status
SELECT
    status,
    COUNT(*) as quantidade,
    SUM("valorCalculado") as valor_total
FROM "SolicitacaoBeneficio"
GROUP BY status;

-- Ver maiores beneficiários
SELECT
    p.nome,
    COUNT(sb.id) as qtd_subsidios,
    SUM(sb."valorCalculado") as valor_total
FROM "SolicitacaoBeneficio" sb
INNER JOIN "Pessoa" p ON p.id = sb."pessoaId"
GROUP BY p.id, p.nome
ORDER BY valor_total DESC
LIMIT 30;

-- Comparar GIM vs SIGMA
SELECT
    'GIM' as origem,
    COUNT(*) as total,
    SUM(valor) as valor_total
FROM staging_gim.subsidios_gim
UNION ALL
SELECT
    'SIGMA',
    COUNT(*),
    SUM("valorCalculado")
FROM "SolicitacaoBeneficio";
```

### **Ver Erros (se houver):**

```sql
-- Ver todos os erros
SELECT * FROM staging_gim.log_erros WHERE etapa LIKE 'TELEFONE%' OR etapa LIKE 'SUBSIDIO%';

-- Resumo de erros
SELECT
    etapa,
    COUNT(*) as quantidade
FROM staging_gim.log_erros
WHERE etapa LIKE 'TELEFONE%' OR etapa LIKE 'SUBSIDIO%'
GROUP BY etapa;
```

---

## ⚠️ POSSÍVEIS ERROS E SOLUÇÕES

### **Erro: "No such file or directory"**

**Causa:** PostgreSQL não encontrou os arquivos CSV.

**Solução:**
1. Verifique se os arquivos estão em `C:\Users\marce\OneDrive\Desktop\`
2. Se não, edite o script nas linhas `\copy` e ajuste o caminho
3. Ou copie os CSVs para `C:\temp\` e ajuste o script

### **Erro: "permission denied"**

**Causa:** PostgreSQL não tem permissão para ler os arquivos.

**Solução Windows:**
1. Copie os CSVs para `C:\temp\`
2. Dê permissão de leitura para "Everyone"
3. Edite o script e ajuste os caminhos

### **Erro: "relation 'staging_gim.map_pessoas' does not exist"**

**Causa:** A migração de pessoas não foi executada antes.

**Solução:**
1. Execute primeiro o script `IMPORTAR-DADOS-PARCIAL.sql`
2. Depois execute este script

### **Erro: "SUBSIDIO_SEM_PRODUTOR" em massa**

**Causa:** Códigos de produtor do GIM não existem no mapeamento.

**Solução:**
1. Verifique se a migração de pessoas incluiu todos os produtores
2. Execute a query para identificar produtores faltantes:
   ```sql
   SELECT DISTINCT cod_produtor
   FROM staging_gim.subsidios_gim
   WHERE cod_produtor NOT IN (SELECT id_gim FROM staging_gim.map_pessoas);
   ```

### **Erro: "encoding error"**

**Causa:** Problema de codificação do CSV.

**Solução:**
1. Abra os CSVs no Notepad++
2. Encoding → Convert to UTF-8
3. Salve e execute novamente

---

## 📈 ESTATÍSTICAS ESPERADAS

### **TELEFONES:**
- Total de telefones no GIM: ~2.500-3.000
- Pessoas com telefone após migração: ~1.800-2.200
- Taxa de consolidação: ~70-80% (múltiplos telefones por pessoa)

### **SUBSÍDIOS:**
- Total de subsídios: **11.170**
- Distribuição por situação:
  - ENTREGUE: **7.588** (68%)
  - CANCELADO: **3.320** (30%)
  - PENDENTE: **262** (2%)
- Valor total estimado: R$ 2.500.000 - R$ 3.000.000

---

## 🎯 PRÓXIMOS PASSOS

Após executar esta migração, você terá concluído:

1. ✅ Migração de **Pessoas** (Físicas e Jurídicas)
2. ✅ Migração de **Propriedades**
3. ✅ Migração de **Endereços**
4. ✅ Migração de **Telefones** ← **ESTE SCRIPT**
5. ✅ Migração de **Subsídios** ← **ESTE SCRIPT**

### **Ainda faltam (se houver no GIM):**

- 📋 Arrendamentos (se houver tabela correspondente)
- 📋 Transferências de Propriedade (se houver histórico)
- 📋 Outras tabelas específicas do módulo de agricultura

---

## 💾 BACKUP RECOMENDADO

Antes de executar, faça backup do banco:

```bash
pg_dump -U postgres sigma > backup_sigma_antes_telefones_subsidios.sql
```

Para restaurar (se necessário):
```bash
psql -U postgres sigma < backup_sigma_antes_telefones_subsidios.sql
```

---

## 📞 INFORMAÇÕES ADICIONAIS

### **Formato de Telefone:**

O script consolida múltiplos telefones no formato:
```
(DDD) NUMERO [ramal X] [Tipo] | (DDD) NUMERO2 ...
```

Exemplos:
- `(45) 32821206`
- `(45) 91220165 (Celular)`
- `(45) 32821667 ramal 22`
- `(45) 99748463 (Celular) | (45) 32821665`

### **Priorização de Telefones:**

Ordem de exibição:
1. Celular
2. Residencial
3. Comercial
4. Outros

### **Mapeamento de Status:**

| GIM       | SIGMA     | Descrição              |
|-----------|-----------|------------------------|
| ENTREGUE  | aprovado  | Subsídio entregue      |
| CANCELADO | cancelado | Subsídio cancelado     |
| PENDENTE  | pendente  | Subsídio em análise    |

---

## 📝 OBSERVAÇÕES IMPORTANTES

1. **Campo Enquadramento:** Será salvo nas `observacoes` da `SolicitacaoBeneficio` (PEQUENO PRODUTOR, GRANDE PRODUTOR, GERAL)

2. **Programa:** Se não houver programas cadastrados, o script criará automaticamente um programa padrão chamado "Programa de Subsídio Agrícola - Migrado do GIM"

3. **Valor e Quantidade:** Migrados exatamente como estão no GIM (campos `valor` e `quantidade`)

4. **Data de Liberação:** Campo `dt_liberacao` do GIM vira `datasolicitacao` no SIGMA

---

**Criado por:** Claude Code
**Data:** 2025-01-10
**Tempo para executar:** ~10 minutos
**Dificuldade:** ⭐⭐ Médio
**Status:** ✅ Pronto para execução
