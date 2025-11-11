# 🚀 EXECUTAR MIGRAÇÃO PARCIAL - AGORA

## ✅ Você JÁ TEM os arquivos:
- `C:\Users\marce\Downloads\Pessoa.csv`
- `C:\Users\marce\Downloads\PropriedadeRural.csv`
- `C:\Users\marce\Downloads\Endereco.csv`

---

## 📝 COMO EXECUTAR (5 minutos)

### **Opção 1: Usando DBeaver ou DataGrip (RECOMENDADO)**

1. Abra o DBeaver/DataGrip
2. Conecte ao banco **sigma** (PostgreSQL)
3. Abra o arquivo `IMPORTAR-DADOS-PARCIAL.sql`
4. **Execute tudo** (Ctrl+Enter ou botão "Run")
5. Veja os resultados no console

### **Opção 2: Usando psql (linha de comando)**

```bash
# Navegue até a pasta do script
cd C:\Fontes\sigma\backend\scripts\migracao-gim

# Execute o script
psql -U postgres -d sigma -f IMPORTAR-DADOS-PARCIAL.sql

# OU se estiver usando outro usuário
psql -U seu_usuario -d sigma -f IMPORTAR-DADOS-PARCIAL.sql
```

### **Opção 3: Pelo pgAdmin**

1. Abra o pgAdmin
2. Conecte ao servidor PostgreSQL
3. Selecione banco **sigma**
4. Clique em **Tools** → **Query Tool**
5. Abra o arquivo `IMPORTAR-DADOS-PARCIAL.sql`
6. Clique em **Execute** (F5)

---

## 📊 O QUE VAI ACONTECER

O script vai:

1. ✅ Criar schema `staging_gim` para dados temporários
2. ✅ Importar os 3 CSVs para staging
3. ✅ Migrar Pessoas Físicas → `Pessoa` + `PessoaFisica`
4. ✅ Migrar Pessoas Jurídicas → `Pessoa` + `PessoaJuridica`
5. ✅ Migrar Propriedades → `Propriedade` (com proprietário temporário)
6. ✅ Mostrar relatório com totais

**Tempo estimado:** 1-3 minutos (depende da quantidade de dados)

---

## ✅ RESULTADO ESPERADO

Você vai ver algo assim no console:

```
NOTICE:  Iniciando migração de Pessoas Físicas...
NOTICE:  Pessoas Físicas: 450 inseridas, 0 erros
NOTICE:  Iniciando migração de Pessoas Jurídicas...
NOTICE:  Pessoas Jurídicas: 25 inseridas, 0 erros
NOTICE:  Iniciando migração de Propriedades...
NOTICE:  Propriedades: 320 inseridas, 0 erros
NOTICE:  ========================================
NOTICE:  MIGRAÇÃO PARCIAL CONCLUÍDA
NOTICE:  ========================================
NOTICE:  Pessoas Físicas migradas: 450
NOTICE:  Pessoas Jurídicas migradas: 25
NOTICE:  Total de Pessoas: 475
NOTICE:  Propriedades migradas: 320
NOTICE:  Total de erros: 0
NOTICE:  ========================================
```

---

## ⚠️ SE DER ERRO

### **Erro: "No such file or directory"**

O script não encontrou os CSVs. Verifique:

1. Os arquivos estão em `C:\Users\marce\Downloads\` ?
2. Os nomes estão corretos? (`Pessoa.csv`, `PropriedadeRural.csv`, `Endereco.csv`)

**Solução:** Edite o script na linha do `\COPY` e ajuste o caminho.

---

### **Erro: "permission denied"**

PostgreSQL não tem permissão para ler os arquivos.

**Solução Windows:**
1. Copie os CSVs para `C:\temp\`
2. Edite o script e troque o caminho para `C:\temp\Pessoa.csv`

**OU**

Execute como administrador.

---

### **Erro: "relation already exists"**

Você já executou o script antes.

**Solução:** O script já limpa as tabelas. Pode executar de novo que vai funcionar.

---

### **Erro: "encoding error"**

Problema de encoding do CSV.

**Solução:**
1. Abra os CSVs no Notepad++
2. Encoding → Convert to UTF-8
3. Salve e execute de novo

---

## 📋 DEPOIS DE EXECUTAR

### **Validar os dados:**

Execute estas queries no PostgreSQL:

```sql
-- Ver quantas pessoas foram importadas
SELECT COUNT(*) FROM "Pessoa";

-- Ver quantas propriedades
SELECT COUNT(*) FROM "Propriedade";

-- Ver se teve erros
SELECT * FROM staging_gim.log_erros;

-- Ver amostra de pessoas
SELECT id, nome, "cpfCnpj" FROM "Pessoa" LIMIT 10;

-- Ver amostra de propriedades
SELECT id, nome, matricula, "areaTotal" FROM "Propriedade" LIMIT 10;
```

---

## 🎯 PRÓXIMOS PASSOS (AMANHÃ)

Depois que rodar este script, você vai exportar do GIM:

1. ✅ Tabela **Area** (proprietários das propriedades) - **CRÍTICA!**
2. ✅ Tabela **Telefone** (telefones das pessoas)
3. ✅ Tabela **Arrendamento** (se tiver)
4. ✅ Tabela **Subsidio** (benefícios)
5. ✅ Tabela **Bloco** (identificar produtores)

E eu crio o script complementar para completar a migração!

---

## 💡 DICA

Depois de executar, tire um print do relatório final e guarda. Vai ajudar na validação final!

---

**Criado por:** Claude Code
**Data:** 2025-01-07
**Tempo para executar:** ~5 minutos
**Dificuldade:** ⭐ Fácil
