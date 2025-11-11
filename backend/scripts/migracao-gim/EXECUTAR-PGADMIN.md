# 🚀 MIGRAÇÃO NO PGADMIN - TELEFONES E SUBSÍDIOS

## 📋 Guia Passo a Passo para Executar no pgAdmin

Este guia foi criado especificamente para o **pgAdmin**, que usa uma interface gráfica diferente do psql.

---

## ✅ PRÉ-REQUISITOS

Antes de começar, certifique-se:

1. ✅ A migração de **Pessoas** já foi executada
2. ✅ Você tem os arquivos:
   - `C:\Users\marce\OneDrive\Desktop\telefone.csv`
   - `C:\Users\marce\OneDrive\Desktop\subsidio.csv`
3. ✅ O pgAdmin está instalado e conectado ao banco **sigma**

---

## 📝 PASSO A PASSO COMPLETO

### **PASSO 1: Abrir o Query Tool**

1. Abra o **pgAdmin**
2. Conecte ao servidor PostgreSQL
3. Expanda até o banco **sigma**
4. Clique com botão direito em **sigma**
5. Selecione **Query Tool** (ou pressione `Alt+Shift+Q`)

### **PASSO 2: Abrir o Script SQL**

1. No Query Tool, clique em **File** → **Open** (ou `Ctrl+O`)
2. Navegue até: `C:\Fontes\sigma\backend\scripts\migracao-gim\`
3. Selecione: **`07-migrar-telefones-e-subsidios-PGADMIN.sql`**
4. Clique em **Abrir**

### **PASSO 3: Executar a Primeira Parte (Criar Tabelas)**

1. Selecione **APENAS** as primeiras linhas do script (até a linha ~60)
2. Ou clique em **Execute** (F5) para executar tudo de uma vez
3. Aguarde a criação das tabelas `telefones_gim` e `subsidios_gim`

> **IMPORTANTE:** Você verá uma mensagem de ERRO dizendo que os CSVs não foram importados. **Isso é esperado!** Continue para o próximo passo.

### **PASSO 4: Importar telefone.csv**

1. No **Object Browser** (painel esquerdo), navegue até:
   ```
   Servers
     └─ PostgreSQL
         └─ Databases
             └─ sigma
                 └─ Schemas
                     └─ staging_gim
                         └─ Tables
                             └─ telefones_gim
   ```

2. **Clique com o botão DIREITO** em `telefones_gim`

3. Selecione: **Import/Export Data...**

4. Configure a janela assim:

   ```
   ┌─────────────────────────────────────────────────────────┐
   │ General                                                  │
   ├─────────────────────────────────────────────────────────┤
   │ Import/Export:  ● Import  ○ Export                      │
   │                                                          │
   │ Options                                                  │
   ├─────────────────────────────────────────────────────────┤
   │ Format:         csv                                      │
   │ Encoding:       UTF8                                     │
   │                                                          │
   │ Miscellaneous                                            │
   ├─────────────────────────────────────────────────────────┤
   │ OID:            ☐                                        │
   │ Header:         ☑ Yes                                    │
   │                                                          │
   │ Columns                                                  │
   ├─────────────────────────────────────────────────────────┤
   │ (deixe em branco - importará todas as colunas)          │
   │                                                          │
   │ File name:                                               │
   │ C:\Users\marce\OneDrive\Desktop\telefone.csv             │
   │                                    [Browse]              │
   │                                                          │
   │ Options                                                  │
   ├─────────────────────────────────────────────────────────┤
   │ Delimiter:      ;                                        │
   │ Quote:          "                                        │
   │ Escape:         "                                        │
   │ NULL Strings:   (deixe vazio)                            │
   └─────────────────────────────────────────────────────────┘
   ```

5. Clique em **OK**

6. Aguarde a importação

7. Você verá uma mensagem: **"X rows imported"** (esperado: ~2.500 linhas)

### **PASSO 5: Importar subsidio.csv**

1. No **Object Browser**, navegue até:
   ```
   Servers → PostgreSQL → Databases → sigma → Schemas → staging_gim → Tables → subsidios_gim
   ```

2. **Clique com o botão DIREITO** em `subsidios_gim`

3. Selecione: **Import/Export Data...**

4. Configure a janela assim:

   ```
   ┌─────────────────────────────────────────────────────────┐
   │ General                                                  │
   ├─────────────────────────────────────────────────────────┤
   │ Import/Export:  ● Import  ○ Export                      │
   │                                                          │
   │ Options                                                  │
   ├─────────────────────────────────────────────────────────┤
   │ Format:         csv                                      │
   │ Encoding:       UTF8                                     │
   │                                                          │
   │ Miscellaneous                                            │
   ├─────────────────────────────────────────────────────────┤
   │ OID:            ☐                                        │
   │ Header:         ☑ Yes                                    │
   │                                                          │
   │ File name:                                               │
   │ C:\Users\marce\OneDrive\Desktop\subsidio.csv             │
   │                                    [Browse]              │
   │                                                          │
   │ Options                                                  │
   ├─────────────────────────────────────────────────────────┤
   │ Delimiter:      ;                                        │
   │ Quote:          "                                        │
   │ Escape:         "                                        │
   │ NULL Strings:   (deixe vazio)                            │
   └─────────────────────────────────────────────────────────┘
   ```

5. Clique em **OK**

6. Aguarde a importação (pode levar 1-2 minutos para ~11.000 registros)

7. Você verá uma mensagem: **"X rows imported"** (esperado: ~11.170 linhas)

### **PASSO 6: Executar o Restante do Script**

1. Volte para o **Query Tool**

2. Clique em **Execute** (F5) para executar todo o script

   OU

   Selecione apenas a parte a partir de `-- VERIFICAR SE OS CSVs FORAM IMPORTADOS` até o final

3. Aguarde a execução (pode levar ~10 minutos)

4. Acompanhe o progresso na aba **Messages** (parte inferior)

### **PASSO 7: Verificar o Resultado**

No final da execução, você verá algo assim na aba **Messages**:

```
╔════════════════════════════════════════╗
║  RELATÓRIO FINAL DA MIGRAÇÃO           ║
╚════════════════════════════════════════╝

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

════════════════════════════════════════
✓ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
════════════════════════════════════════
```

---

## ⏱️ TEMPO ESTIMADO

| Etapa | Tempo |
|-------|-------|
| Criar tabelas | < 1 segundo |
| Importar telefone.csv | ~30 segundos |
| Importar subsidio.csv | ~1-2 minutos |
| Executar migração | ~8-10 minutos |
| **TOTAL** | **~10-13 minutos** |

---

## ⚠️ POSSÍVEIS ERROS E SOLUÇÕES

### **Erro: "could not open file"**

**Mensagem completa:**
```
ERROR: could not open file "C:\Users\marce\OneDrive\Desktop\telefone.csv" for reading: Permission denied
```

**Solução:**
1. Copie os arquivos CSV para `C:\temp\`
2. Na importação, use `C:\temp\telefone.csv` e `C:\temp\subsidio.csv`

---

### **Erro: "relation does not exist"**

**Mensagem completa:**
```
ERROR: relation "staging_gim.map_pessoas" does not exist
```

**Causa:** A migração de pessoas não foi executada.

**Solução:**
1. Execute primeiro o script `IMPORTAR-DADOS-PARCIAL-PGADMIN.sql`
2. Depois execute este script

---

### **Erro: "invalid input syntax for type timestamp"**

**Mensagem completa:**
```
ERROR: invalid input syntax for type timestamp: "2007-01-30 00:00:00.000"
```

**Causa:** Problema no formato de data do CSV.

**Solução:**
1. Abra o arquivo `subsidio.csv` no Excel ou Notepad++
2. Substitua todas as datas no formato `YYYY-MM-DD HH:MM:SS.000` por `YYYY-MM-DD HH:MM:SS`
3. Salve e reimporte

---

### **Erro: "encoding mismatch"**

**Mensagem completa:**
```
ERROR: character with byte sequence 0xXX in encoding "UTF8" has no equivalent in encoding "WIN1252"
```

**Solução:**
1. Abra o CSV no **Notepad++**
2. Menu **Encoding** → **Convert to UTF-8**
3. Salve (`Ctrl+S`)
4. Reimporte no pgAdmin

---

### **Importação não aparece na lista**

Se você importou mas a tabela continua vazia:

1. Clique com botão direito na tabela
2. Selecione **Refresh**
3. Execute: `SELECT COUNT(*) FROM staging_gim.telefones_gim;`

---

## 🔍 VALIDAÇÃO DOS DADOS

Após a execução, valide os dados executando estas queries no Query Tool:

### **Validar Telefones:**

```sql
-- Ver quantas pessoas têm telefone
SELECT COUNT(*) FROM "Pessoa" WHERE telefone IS NOT NULL;

-- Ver exemplos
SELECT id, nome, telefone
FROM "Pessoa"
WHERE telefone IS NOT NULL
LIMIT 20;

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
-- Ver total por status
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
SELECT *
FROM staging_gim.log_erros
WHERE etapa LIKE 'TELEFONE%' OR etapa LIKE 'SUBSIDIO%';

-- Resumo de erros
SELECT
    etapa,
    COUNT(*) as quantidade
FROM staging_gim.log_erros
WHERE etapa LIKE 'TELEFONE%' OR etapa LIKE 'SUBSIDIO%'
GROUP BY etapa;
```

---

## 📊 ESTATÍSTICAS ESPERADAS

### **TELEFONES:**
- Total de telefones importados: **~2.500-3.000**
- Pessoas com telefone após migração: **~1.800-2.200**
- Pessoas com múltiplos telefones: **~400-600**

### **SUBSÍDIOS:**
- Total de subsídios: **11.170**
- Aprovados (ENTREGUE): **~7.588** (68%)
- Cancelados (CANCELADO): **~3.320** (30%)
- Pendentes (PENDENTE): **~262** (2%)
- Valor total: **R$ 2.500.000 - R$ 3.000.000**

---

## 💾 BACKUP ANTES DE EXECUTAR

Recomendo fazer backup antes:

1. No pgAdmin, clique com botão direito no banco **sigma**
2. Selecione **Backup...**
3. Configure:
   - Filename: `C:\temp\backup_sigma_antes_telefones_subsidios.backup`
   - Format: Custom
   - Encoding: UTF8
4. Clique em **Backup**

Para restaurar (se necessário):
1. Clique com botão direito em **sigma**
2. Selecione **Restore...**
3. Selecione o arquivo de backup

---

## 📸 CAPTURAS DE TELA ÚTEIS

### **Importar CSV no pgAdmin:**

```
1. Botão direito na tabela
   ┌─────────────────────────┐
   │ ● View/Edit Data        │
   │   Create                │
   │   Import/Export Data... │ ← CLICAR AQUI
   │   Maintenance           │
   │   Backup...             │
   └─────────────────────────┘
```

### **Configuração de Importação:**

```
┌──────────────────────────────────────────┐
│ Import/Export data - telefones_gim       │
├──────────────────────────────────────────┤
│ General                                   │
│   Import/Export:  ● Import  ○ Export     │
│                                           │
│ Options                                   │
│   Format:    csv        ▼                │
│   Encoding:  UTF8       ▼                │
│                                           │
│ Miscellaneous                             │
│   OID:       ☐                            │
│   Header:    ☑ Yes                        │
│                                           │
│ Filename                                  │
│   C:\Users\...\telefone.csv  [Browse]    │
│                                           │
│ Options                                   │
│   Delimiter:     ;                        │
│   Quote:         "                        │
│   Escape:        "                        │
│                                           │
│               [Cancel]  [OK]              │
└──────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE EXECUÇÃO

Use este checklist para acompanhar:

- [ ] Abrir pgAdmin e conectar ao banco sigma
- [ ] Abrir Query Tool
- [ ] Abrir script `07-migrar-telefones-e-subsidios-PGADMIN.sql`
- [ ] Executar primeira parte (criar tabelas)
- [ ] Importar `telefone.csv` via Import/Export Data
- [ ] Verificar: ~2.500 linhas importadas
- [ ] Importar `subsidio.csv` via Import/Export Data
- [ ] Verificar: ~11.170 linhas importadas
- [ ] Executar restante do script
- [ ] Aguardar conclusão (~10 minutos)
- [ ] Verificar relatório final
- [ ] Executar queries de validação
- [ ] Verificar se há erros na tabela `log_erros`
- [ ] Fazer backup do banco (opcional)

---

## 🎯 PRÓXIMOS PASSOS

Após concluir esta migração com sucesso, você terá:

1. ✅ Pessoas migradas
2. ✅ Propriedades migradas
3. ✅ Endereços migrados
4. ✅ **Telefones migrados** ← Concluído
5. ✅ **Subsídios migrados** ← Concluído

Possíveis próximos passos:
- Migrar arrendamentos (se houver)
- Migrar transferências de propriedade (se houver)
- Validar dados completos
- Treinar usuários no novo sistema

---

## 📞 AJUDA

Se encontrar problemas:

1. Verifique a aba **Messages** no pgAdmin para detalhes do erro
2. Execute `SELECT * FROM staging_gim.log_erros;` para ver erros registrados
3. Verifique se os pré-requisitos foram atendidos
4. Consulte a seção "Possíveis Erros e Soluções" acima

---

**Criado por:** Claude Code
**Data:** 2025-01-10
**Tempo para executar:** ~10-13 minutos
**Dificuldade:** ⭐⭐ Médio
**Status:** ✅ Pronto para execução no pgAdmin
