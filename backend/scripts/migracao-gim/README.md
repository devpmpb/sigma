# Migração de Dados GIM → SIGMA

Este diretório contém scripts SQL para migrar dados históricos do sistema legado **GIM** (SQL Server) para o novo sistema **SIGMA** (PostgreSQL).

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Dados Migrados](#dados-migrados)
- [Processo de Migração](#processo-de-migração)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Execução Passo a Passo](#execução-passo-a-passo)
- [Validação](#validação)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A migração foi projetada seguindo a estratégia **FAST TRACK** (3-4 semanas):
- Migração "best effort" com registro de exceções
- Validação amostral
- Foco em dados críticos: Produtores, Propriedades, Arrendamentos, Subsídios

## ✅ Pré-requisitos

### 1. Banco de Dados

- **GIM** (origem): SQL Server com acesso de leitura
- **SIGMA** (destino): PostgreSQL 14+ com schema atualizado

### 2. Ferramentas Necessárias

Escolha UMA das opções:

**Opção A: DBeaver / DataGrip (RECOMENDADO)**
- Interface gráfica para exportar/importar dados
- Suporta SQL Server → PostgreSQL
- Download: https://dbeaver.io/

**Opção B: Scripts manuais**
- SQL Server Management Studio (SSMS) para exportar CSVs
- psql para importar no PostgreSQL

**Opção C: Ferramentas de ETL**
- Pentaho Data Integration
- Airbyte
- Apache NiFi

### 3. Schema SIGMA Atualizado

Antes de migrar, execute:

```bash
cd backend
npm run migrate:deploy  # Aplica migrations do Prisma
```

Certifique-se que o campo `enquadramento` foi adicionado em `SolicitacaoBeneficio`.

---

## 📦 Dados Migrados

| **Entidade** | **Tabela GIM** | **Tabela SIGMA** | **Status** |
|--------------|----------------|------------------|------------|
| Pessoas Físicas | `Pessoa` (CPF) | `Pessoa` + `PessoaFisica` | ✅ Pronto |
| Pessoas Jurídicas | `Pessoa` (CNPJ) | `Pessoa` + `PessoaJuridica` | ✅ Pronto |
| Propriedades | `PropriedadeRural` + `Area` | `Propriedade` + `PropriedadeCondomino` | ✅ Pronto |
| Arrendamentos | `Arrendamento` | `Arrendamento` | ✅ Pronto |
| Subsídios | `Subsidio` | `SolicitacaoBeneficio` | ⏳ Pendente* |

\* Aguardando mapeamento de status do GIM

---

## 🗂️ Scripts Disponíveis

1. **`01-migrar-pessoas-postgresql.sql`**
   - Migra Pessoas Físicas e Jurídicas
   - Identifica produtores rurais automaticamente
   - Migra telefones (primeiro da lista)

2. **`02-migrar-propriedades.sql`**
   - Migra propriedades rurais
   - Converte múltiplos proprietários em condôminos
   - Primeiro proprietário vira dono principal

3. **`03-migrar-arrendamentos.sql`**
   - Migra arrendamentos
   - Mapeia status automaticamente
   - Vincula propriedades e arrendatários

4. **`04-migrar-subsidios.sql`** (a completar amanhã)
   - Migra subsídios → solicitações de benefício
   - Requer mapeamento de status específicos do GIM

---

## 🚀 Processo de Migração

### Fluxo Geral

```
GIM (SQL Server)
     ↓
Exportar tabelas para CSV
     ↓
Importar CSVs para staging_gim (PostgreSQL)
     ↓
Executar scripts de transformação
     ↓
Dados migrados para tabelas SIGMA
```

### Estratégia de Mapeamento

Os scripts criam tabelas de controle:

- **`staging_gim.map_pessoas`**: mapeia `codPessoa` (GIM) → `id` (SIGMA)
- **`staging_gim.map_propriedades`**: mapeia `codPropriedade` → `id`
- **`staging_gim.map_arrendamentos`**: mapeia `codArrendamento` → `id`
- **`staging_gim.log_erros`**: registra todos os erros durante migração

---

## 📝 Execução Passo a Passo

### **PASSO 1: Exportar Dados do GIM**

#### Usando SQL Server Management Studio (SSMS):

1. Conecte ao banco GIM
2. Execute as queries abaixo e exporte para CSV:

```sql
-- 1. Pessoas
SELECT
    codPessoa as cod_pessoa,
    nome,
    numeroCPF as numero_cpf,
    CNPJ as cnpj,
    email,
    numeroRG as numero_rg,
    dtNascimento as dt_nascimento,
    razaoSocial as razao_social
FROM Pessoa
WHERE (numeroCPF IS NOT NULL OR CNPJ IS NOT NULL);

-- Salvar como: pessoas_gim.csv

-- 2. Telefones
SELECT
    codTelefone as cod_telefone,
    codPessoa as cod_pessoa,
    numero
FROM Telefone;

-- Salvar como: telefones_gim.csv

-- 3. Blocos (para identificar produtores)
SELECT DISTINCT
    codBloco as cod_bloco,
    codProdutor as cod_produtor
FROM Bloco;

-- Salvar como: blocos_gim.csv

-- 4. Áreas (para identificar produtores e proprietários)
SELECT
    codArea as cod_area,
    codPessoa as cod_pessoa
FROM Area;

-- Salvar como: areas_gim.csv

-- 5. Áreas COMPLETAS (para propriedades)
SELECT
    codArea as cod_area,
    codPropriedade as cod_propriedade,
    codPessoa as cod_pessoa,
    residente,
    area,
    situacao
FROM Area;

-- Salvar como: areas_gim_completa.csv

-- 6. Arrendamentos (para identificar produtores arrendatários)
SELECT
    codArrendamento as cod_arrendamento,
    codArrendatario as cod_arrendatario
FROM Arrendamento;

-- Salvar como: arrendamentos_gim.csv

-- 7. Arrendamentos COMPLETOS
SELECT
    codArrendamento as cod_arrendamento,
    codArea as cod_area,
    codArrendatario as cod_arrendatario,
    area,
    residente,
    situacao,
    observacao,
    dataInicial as data_inicial,
    dataFinal as data_final
FROM Arrendamento;

-- Salvar como: arrendamentos_gim_completo.csv

-- 8. Subsídios (para identificar produtores)
SELECT
    codSubsidio as cod_subsidio,
    codProdutor as cod_produtor
FROM Subsidio;

-- Salvar como: subsidios_gim.csv

-- 9. Propriedades Rurais
SELECT
    codPropriedade as cod_propriedade,
    nome,
    matricula,
    itr,
    incra,
    areaTotal as area_total,
    localizacao
FROM PropriedadeRural;

-- Salvar como: propriedades_gim.csv
```

---

### **PASSO 2: Importar CSVs para PostgreSQL**

Conecte ao banco SIGMA (PostgreSQL) e execute:

```bash
# Usando psql
psql -U seu_usuario -d sigma

# Ou usando DBeaver: importar CSVs via interface
```

Dentro do psql ou query editor:

```sql
-- Importar pessoas
\copy staging_gim.pessoas_gim FROM '/caminho/completo/pessoas_gim.csv' DELIMITER ',' CSV HEADER;

-- Importar telefones
\copy staging_gim.telefones_gim FROM '/caminho/completo/telefones_gim.csv' DELIMITER ',' CSV HEADER;

-- Importar blocos
\copy staging_gim.blocos_gim FROM '/caminho/completo/blocos_gim.csv' DELIMITER ',' CSV HEADER;

-- Importar áreas (simples)
\copy staging_gim.areas_gim FROM '/caminho/completo/areas_gim.csv' DELIMITER ',' CSV HEADER;

-- Importar arrendamentos (simples)
\copy staging_gim.arrendamentos_gim FROM '/caminho/completo/arrendamentos_gim.csv' DELIMITER ',' CSV HEADER;

-- Importar subsídios (simples)
\copy staging_gim.subsidios_gim FROM '/caminho/completo/subsidios_gim.csv' DELIMITER ',' CSV HEADER;

-- Importar propriedades
\copy staging_gim.propriedades_gim FROM '/caminho/completo/propriedades_gim.csv' DELIMITER ',' CSV HEADER;

-- Importar áreas completas
\copy staging_gim.areas_gim_completa FROM '/caminho/completo/areas_gim_completa.csv' DELIMITER ',' CSV HEADER;

-- Importar arrendamentos completos
\copy staging_gim.arrendamentos_gim_completo FROM '/caminho/completo/arrendamentos_gim_completo.csv' DELIMITER ',' CSV HEADER;
```

---

### **PASSO 3: Executar Scripts de Migração**

Execute na ordem:

```sql
-- 1. Migrar Pessoas (PF + PJ)
\i /caminho/completo/01-migrar-pessoas-postgresql.sql

-- 2. Migrar Propriedades
\i /caminho/completo/02-migrar-propriedades.sql

-- 3. Migrar Arrendamentos
\i /caminho/completo/03-migrar-arrendamentos.sql

-- 4. Migrar Subsídios (AMANHÃ - após mapear status)
-- \i /caminho/completo/04-migrar-subsidios.sql
```

---

## ✅ Validação

### Verificar Totais

```sql
-- Comparar quantidade de pessoas
SELECT
    'GIM' as origem,
    COUNT(*) as total
FROM staging_gim.pessoas_gim
UNION ALL
SELECT
    'SIGMA' as origem,
    COUNT(*) as total
FROM "Pessoa";

-- Comparar quantidade de propriedades
SELECT
    'GIM' as origem,
    COUNT(DISTINCT cod_propriedade) as total
FROM staging_gim.areas_gim_completa
UNION ALL
SELECT
    'SIGMA' as origem,
    COUNT(*) as total
FROM "Propriedade";

-- Comparar arrendamentos
SELECT
    'GIM' as origem,
    COUNT(*) as total
FROM staging_gim.arrendamentos_gim_completo
UNION ALL
SELECT
    'SIGMA' as origem,
    COUNT(*) as total
FROM "Arrendamento";
```

### Verificar Produtores

```sql
-- Produtores identificados
SELECT
    COUNT(*) as total_produtores,
    COUNT(CASE WHEN "tipoPessoa" = 'FISICA' THEN 1 END) as pf,
    COUNT(CASE WHEN "tipoPessoa" = 'JURIDICA' THEN 1 END) as pj
FROM "Pessoa"
WHERE "isProdutor" = TRUE;
```

### Verificar Erros

```sql
-- Ver todos os erros
SELECT
    etapa,
    COUNT(*) as quantidade_erros
FROM staging_gim.log_erros
GROUP BY etapa
ORDER BY quantidade_erros DESC;

-- Detalhe dos erros
SELECT * FROM staging_gim.log_erros
ORDER BY data_erro DESC
LIMIT 50;
```

---

## 🛠️ Troubleshooting

### Problema: Erro ao importar CSV

**Sintoma:** `ERROR: invalid byte sequence for encoding "UTF8"`

**Solução:**
```sql
-- Converter encoding do CSV antes de importar
iconv -f ISO-8859-1 -t UTF-8 arquivo.csv > arquivo_utf8.csv
```

---

### Problema: Pessoa sem CPF/CNPJ

**Sintoma:** Pessoas não migraram

**Solução:**
```sql
-- Ver pessoas sem documento no GIM
SELECT * FROM staging_gim.pessoas_gim
WHERE (numero_cpf IS NULL OR numero_cpf = '')
  AND (cnpj IS NULL OR cnpj = '');

-- Decisão: adicionar CPF manualmente ou ignorar
```

---

### Problema: Propriedade sem dono

**Sintoma:** Erro `PROPRIEDADE_SEM_DONO`

**Solução:**
```sql
-- Ver propriedades sem área
SELECT p.*
FROM staging_gim.propriedades_gim p
WHERE NOT EXISTS (
    SELECT 1 FROM staging_gim.areas_gim_completa a
    WHERE a.cod_propriedade = p.cod_propriedade
);

-- Decisão: adicionar área manualmente ou ignorar propriedade
```

---

### Problema: Duplicatas de CPF/CNPJ

**Sintoma:** Menos pessoas migradas que esperado

**Solução:**
```sql
-- Ver duplicatas no GIM
SELECT
    COALESCE(numero_cpf, cnpj) as documento,
    COUNT(*) as quantidade
FROM staging_gim.pessoas_gim
GROUP BY COALESCE(numero_cpf, cnpj)
HAVING COUNT(*) > 1;

-- Decisão: limpar duplicatas no GIM antes de migrar
```

---

## 📊 Relatórios Pós-Migração

Após completar a migração, execute:

```sql
-- Relatório completo
SELECT
    'Pessoas migradas' as item,
    COUNT(*)::TEXT as valor
FROM "Pessoa"
UNION ALL
SELECT
    'Produtores rurais' as item,
    COUNT(*)::TEXT
FROM "Pessoa"
WHERE "isProdutor" = TRUE
UNION ALL
SELECT
    'Propriedades migradas' as item,
    COUNT(*)::TEXT
FROM "Propriedade"
UNION ALL
SELECT
    'Propriedades com múltiplos donos' as item,
    COUNT(DISTINCT "propriedadeId")::TEXT
FROM "PropriedadeCondomino"
UNION ALL
SELECT
    'Arrendamentos ativos' as item,
    COUNT(*)::TEXT
FROM "Arrendamento"
WHERE status = 'ativo'
UNION ALL
SELECT
    'Área total arrendada (alqueires)' as item,
    ROUND(SUM("areaArrendada"), 2)::TEXT
FROM "Arrendamento"
WHERE status = 'ativo';
```

---

## 📞 Suporte

**Dúvidas durante a migração?**

1. Verifique os logs de erro: `SELECT * FROM staging_gim.log_erros`
2. Compare totais entre GIM e SIGMA usando queries de validação
3. Documente problemas encontrados para ajustar scripts

**Próximos passos:**

- [ ] Amanhã: mapear status do Subsidio (GIM) → SolicitacaoBeneficio (SIGMA)
- [ ] Completar script `04-migrar-subsidios.sql`
- [ ] Executar migração de subsídios
- [ ] Validação final com usuários
- [ ] Go-live!

---

**Última atualização:** 2025-01-06
**Versão:** 1.0 (Fast Track)
