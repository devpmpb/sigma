# 📋 CONTEXTO COMPLETO - MIGRAÇÃO GIM → SIGMA

> **Última atualização:** 2025-01-26
> **Status:** ⚠️ MIGRAÇÃO EM ANDAMENTO - NECESSÁRIO TESTAR E CORRIGIR

---

## 🎯 SITUAÇÃO ATUAL

### ⚠️ STATUS DA MIGRAÇÃO

**Trabalho pausado por alguns dias para descanso mental. Retomando com novo modelo Claude.**

**Problemas conhecidos:**
- ✅ Pessoas migradas (teste pendente)
- ✅ Propriedades CORRIGIDAS com proprietários corretos
- ✅ Campo `endereco_id` adicionado às propriedades
- ⚠️ **CRÍTICO:** Migração ainda tem erros não identificados
- ⏳ Precisa testar TODAS as migrações do início

**Scripts executados recentemente:**
- ✅ Script 16: Correção de propriedades (todas estavam com proprietarioId = 1)
- ✅ Script 17: Adicionado campo `endereco_id` e migrado dados (618 propriedades)

---

## 📚 GUIA RÁPIDO PARA NOVO MODELO

### 1️⃣ ACESSO AO BANCO DE DADOS (pgAdmin)

**Credenciais:**
- Host: `localhost:5432`
- Database: `sigma`
- User: `postgres`
- Schema principal: `public`
- Schema staging: `staging_gim`

**Como conectar via psql:**
```bash
psql -U postgres -d sigma
```

**Schemas importantes:**
- `public` - Tabelas do SIGMA (destino)
- `staging_gim` - Tabelas CSV importadas do GIM (origem)

**Tabelas de mapeamento (em staging_gim):**
- `map_pessoas` - Mapeia ID GIM → ID SIGMA (pessoas)
- `map_propriedades` - Mapeia ID GIM → ID SIGMA (propriedades)
- `log_erros` - Registra todos os erros de migração

### 2️⃣ LOCALIZAÇÃO DOS CSVs

**Pasta dos CSVs:** `C:/csvs/`

**Arquivos disponíveis:**
```
C:/csvs/Area.csv                    - Áreas por propriedade/pessoa
C:/csvs/arrendamento.csv            - Arrendamentos
C:/csvs/movimentosituacao.csv       - Histórico de situações
C:/csvs/movimentotransferencia.csv  - Transferências de propriedade
C:/csvs/PropriedadeRural.csv        - Dados das propriedades
```

**Estrutura dos CSVs principais:**

**PropriedadeRural.csv:**
```
codPropriedade;matricula;area;numero;denominacao;perimetro;endereco;itr;incra;observacao;situacao
```
- `endereco` = ID de endereço (não é texto!)
- `area` = área total com vírgula decimal
- `situacao` = PRÓPRIA, CONDOMÍNIO, USUFRUTO, ARRENDADA

**Area.csv:**
```
codArea;codPropriedade;codPessoa;residente;area;situacao
```
- Relaciona propriedades → pessoas (com área de cada um)
- `residente` = "true" ou "false" (texto!)
- `situacao` = NULL, NORMAL, ARRENDADA
- **REGRA:** Primeira pessoa NÃO-ARRENDADA = proprietário principal

**movimentotransferencia.csv:**
```
codMovimentoTransferencia;codPropriedade;codProprietario;codNovoProprietario;data;motivo;responsavel
```

### 3️⃣ ESTRUTURA DO BANCO SIGMA

**Tabelas principais (PascalCase com aspas):**
- `"Pessoa"` - Pessoas físicas/jurídicas
- `"Propriedade"` - Propriedades rurais
- `"PropriedadeCondomino"` - Múltiplos proprietários (snake_case nas colunas!)
- `"Endereco"` - Endereços
- `"Telefone"` - Telefones (1:N com Pessoa)
- `"Programa"` - Programas de benefícios
- `"SolicitacaoBeneficio"` - Subsídios/benefícios

**⚠️ ATENÇÃO: Naming Convention Mista!**
- Nomes de tabelas: **PascalCase** com aspas duplas (`"Propriedade"`)
- Nomes de colunas em `"PropriedadeCondomino"`: **snake_case** sem aspas (`propriedade_id`, `condomino_id`)
- Outras tabelas: mix de camelCase e snake_case

**Exemplo:**
```sql
-- CORRETO para PropriedadeCondomino
INSERT INTO "PropriedadeCondomino" (propriedade_id, condomino_id, ...) VALUES (...)

-- CORRETO para Propriedade
INSERT INTO "Propriedade" ("proprietarioId", nome, ...) VALUES (...)
```

### 4️⃣ TABELAS STAGING (snake_case)

**Tabelas CSV carregadas em staging_gim:**
- `propriedade_csv` - CSV PropriedadeRural.csv
- `areas_gim` - CSV Area.csv
- `transferencias_gim` - CSV movimentotransferencia.csv
- `arrendamentos_gim` - CSV arrendamento.csv

**Tabelas de controle:**
- `map_pessoas` - (id_gim, id_sigma, nome, migrado_em)
- `map_propriedades` - (id_gim, id_sigma, nome, migrado_em)
- `log_erros` - (etapa, id_gim, erro, data_erro)

### 5️⃣ COMO EXECUTAR SCRIPTS SQL

**Via psql:**
```bash
psql -U postgres -d sigma -f "c:\Fontes\sigma\backend\scripts\migracao-gim\16-CORRIGIR-propriedades.sql"
```

**Via pgAdmin:**
1. Abrir Query Tool
2. Copiar todo o conteúdo do script
3. Executar (F5)
4. Verificar mensagens NOTICE no output

**⚠️ IMPORTANTE:** Scripts são executáveis COMPLETOS (não em partes!)

---

## 📊 HISTÓRICO DO QUE FOI FEITO

### ✅ MIGRAÇÕES CONCLUÍDAS

1. **Pessoas** - Script 01
   - ~1.000 pessoas migradas
   - CPF/CNPJ limpos
   - Mapeamento em `staging_gim.map_pessoas`

2. **Telefones** - Script 12
   - ~2.500 telefones migrados
   - Tabela separada (1:N)
   - Tipo: Celular/Residencial/Comercial

3. **Programas** - Scripts 10, 11
   - 62 programas migrados
   - ~120 RegrasNegocio criadas
   - Conversão GIM → SIGMA

4. **Subsídios** - Scripts 08, 13
   - 33.016 subsídios migrados
   - 16.512 em programa genérico (dados históricos sem programa no GIM)
   - Conversão decimal brasileiro (vírgula → ponto)

### ✅ CORREÇÕES APLICADAS RECENTEMENTE

**Script 16 - CRÍTICO:** Todas as 871 propriedades estavam com `proprietarioId = 1`!

**Problema:** Script 02 original estava errado
- Usava tabela errada
- Não consultava `areas_gim` para encontrar dono correto

**Solução (Script 16):**
```sql
-- PASSO 1: Deletar tudo (propriedades, condôminos, transferências)
-- PASSO 2: Recriar propriedades usando areas_gim
--   - Primeira pessoa NÃO-ARRENDADA = dono principal
--   - Calcular área total somando áreas
--   - Mapear situação (CONDOMÍNIO, USUFRUTO, PRÓPRIA)
-- PASSO 3: Criar condôminos (demais pessoas da propriedade)
-- PASSO 4: Recriar transferências
-- PASSO 5: Relatório final
```

**Script 17:** Adicionado campo `endereco_id`
- Campo `logradouroId` estava sendo usado incorretamente
- CSV tem campo `endereco` que é um ID (não texto!)
- Migrados 618 endereços com sucesso

### ⚠️ PROBLEMAS CONHECIDOS

1. **Script 03 (Transferências):** 37 registros ignorados
   - IDs não encontrados no mapeamento
   - Precisa investigar

2. **Script 04 (Arrendamentos):** FALHOU completamente
   - Tentava usar tabela `areas_gim_completa` que não existe
   - Tabela correta é `areas_gim`
   - Precisa corrigir e re-executar

3. **Scripts 03, 04, 05:** Eram multi-step (executar em partes)
   - Foram corrigidos para execução única
   - MAS ainda podem ter erros não identificados

4. **Validação geral:** FALTA TESTAR TUDO!
   - Verificar se propriedades têm donos diferentes agora
   - Verificar se condôminos foram criados
   - Verificar se transferências estão corretas

---

## 🔧 SCRIPTS DE MIGRAÇÃO

### ORDEM CORRETA DE EXECUÇÃO

**Executados e OK:**
1. ✅ `01-migrar-pessoas.sql` - Pessoas
2. ✅ `10-migrar-programas.sql` - Programas
3. ✅ `11-migrar-regras-programas.sql` - Regras de negócio
4. ✅ `12-migrar-telefones.sql` - Telefones
5. ✅ `08-migrar-telefones-e-subsidios-SIMPLES.sql` - Subsídios
6. ✅ `13-corrigir-mapeamento-subsidios.sql` - Correção subsídios

**Executados RECENTEMENTE (testar):**
7. ✅ `16-CORRIGIR-propriedades.sql` - CRÍTICO! Corrigiu proprietários
8. ✅ `17-adicionar-enderecoid-propriedade.sql` - Adicionou endereco_id

**Pendentes/Com erro:**
9. ⚠️ `03-migrar-transferencias-propriedade.sql` - 37 ignorados
10. ⚠️ `04-migrar-arrendamentos.sql` - Tabela errada, FALHOU
11. ⏳ `05-migrar-area-efetiva.sql` - Não testado
12. ⏳ `15-migrar-enderecos.sql` - Criado mas não executado

### SCRIPTS DE VALIDAÇÃO

```sql
-- Verificar propriedades têm donos diferentes
SELECT "proprietarioId", COUNT(*) as qtd
FROM "Propriedade"
GROUP BY "proprietarioId"
ORDER BY qtd DESC
LIMIT 20;
-- Se retornar tudo com proprietarioId = 1, ERRO!

-- Verificar condôminos
SELECT COUNT(*) FROM "PropriedadeCondomino";
-- Deveria ter vários registros

-- Verificar transferências
SELECT COUNT(*) FROM transferencias_propriedade;

-- Ver erros recentes
SELECT * FROM staging_gim.log_erros
ORDER BY data_erro DESC
LIMIT 50;

-- Verificar endereços nas propriedades
SELECT
    COUNT(*) as total,
    COUNT(endereco_id) as com_endereco,
    COUNT(*) - COUNT(endereco_id) as sem_endereco
FROM "Propriedade";
```

---

## 🚨 PROBLEMAS E ARMADILHAS

### 1. Naming Convention Mista

**Problema:** Algumas tabelas usam camelCase, outras snake_case

**Exemplo de erro comum:**
```sql
-- ❌ ERRADO
SELECT * FROM "PropriedadeCondomino" WHERE "propriedadeId" = 1;

-- ✅ CORRETO
SELECT * FROM "PropriedadeCondomino" WHERE propriedade_id = 1;
```

**Regra:**
- `"Propriedade"`, `"Pessoa"`, `"Endereco"` → camelCase
- `"PropriedadeCondomino"` → snake_case nas colunas!
- `transferencias_propriedade` → tudo snake_case

### 2. Campo `residente` é Texto!

```sql
-- ❌ ERRADO
WHERE a.residente = TRUE

-- ✅ CORRETO
WHERE a.residente = 'true'

-- OU converter
CASE WHEN a.residente = 'true' THEN TRUE ELSE FALSE END
```

### 3. Conversão de Área com Vírgula

```sql
-- ❌ ERRADO (causava erro de type mismatch)
CASE
    WHEN p.area::TEXT LIKE '%,%'
    THEN REPLACE(p.area::TEXT, ',', '.')::NUMERIC(10,4)
    ELSE p.area::NUMERIC(10,4)
END

-- ✅ CORRETO (área já é NUMERIC no staging)
p.area -- Simplesmente usar direto
```

### 4. Comparação de IDs GIM vs SIGMA

**No PASSO 3 (condôminos):**
```sql
-- ❌ ERRADO - Compara cod_pessoa (GIM) com proprietarioId (SIGMA)
WHERE a.cod_pessoa != prop."proprietarioId"

-- ✅ CORRETO - Comparar IDs SIGMA
WHERE map_pes.id_sigma != prop."proprietarioId"
```

### 5. Tabelas de Transferências

```sql
-- Estrutura CSV real:
codMovimentoTransferencia  -- não cod_movimento!
codProprietario            -- não cod_proprietario_anterior!
codNovoProprietario        -- não cod_proprietario_novo!
data                       -- não data_transferencia!
motivo                     -- não observacoes!
```

---

## 📝 QUERIES ÚTEIS PARA DEBUG

### Ver todas as tabelas staging
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'staging_gim'
ORDER BY table_name;
```

### Ver estrutura de uma tabela
```sql
\d staging_gim.areas_gim
\d "PropriedadeCondomino"
\d "Propriedade"
```

### Ver conteúdo de mapeamento
```sql
SELECT * FROM staging_gim.map_propriedades LIMIT 10;
SELECT * FROM staging_gim.map_pessoas LIMIT 10;
```

### Ver erros de migração
```sql
SELECT etapa, COUNT(*) as qtd_erros
FROM staging_gim.log_erros
GROUP BY etapa
ORDER BY qtd_erros DESC;
```

### Verificar propriedades migradas
```sql
SELECT
    p.id,
    p.nome,
    p."proprietarioId",
    pes.nome as proprietario,
    p.endereco_id,
    p.situacao
FROM "Propriedade" p
LEFT JOIN "Pessoa" pes ON pes.id = p."proprietarioId"
ORDER BY p.id
LIMIT 20;
```

### Ver condôminos de uma propriedade
```sql
SELECT
    p.id as prop_id,
    p.nome as propriedade,
    pes_dono.nome as proprietario_principal,
    pes_cond.nome as condomino,
    pc.percentual
FROM "Propriedade" p
INNER JOIN "Pessoa" pes_dono ON pes_dono.id = p."proprietarioId"
LEFT JOIN "PropriedadeCondomino" pc ON pc.propriedade_id = p.id
LEFT JOIN "Pessoa" pes_cond ON pes_cond.id = pc.condomino_id
WHERE p.id = 1;
```

---

## 🎯 PRÓXIMOS PASSOS CRÍTICOS

### 🔴 URGENTE - VALIDAÇÃO E CORREÇÃO

1. **Verificar se script 16 funcionou:**
   ```sql
   -- Rodar query de distribuição de proprietários
   -- Se tiver vários proprietários diferentes = OK
   -- Se tudo proprietarioId = 1 = ERRO!
   ```

2. **Testar criação de condôminos:**
   ```sql
   SELECT COUNT(*) FROM "PropriedadeCondomino";
   -- Deveria ter vários registros
   ```

3. **Investigar 37 transferências ignoradas (Script 03)**
   - Verificar quais IDs não foram encontrados
   - Checar se pessoas/propriedades existem no mapeamento

4. **Corrigir script 04 (arrendamentos):**
   - Trocar `areas_gim_completa` → `areas_gim`
   - Re-executar

5. **Executar script 05 (área efetiva):**
   - Testar se funciona
   - Verificar erros

6. **Executar validação completa:**
   - Script 99 (se existir)
   - Queries de contagem
   - Comparar GIM vs SIGMA

### 📋 DEPOIS DA VALIDAÇÃO

7. Migrar endereços completos (Script 15)
8. Criar endpoints backend (Telefone, etc)
9. Criar frontend para gestão

---

## 💡 DICAS PARA O NOVO MODELO

1. **SEMPRE ler o CSV antes de assumir estrutura**
   - Usar: `head -5 /c/csvs/NomeArquivo.csv`
   - Verificar nomes EXATOS das colunas

2. **Testar queries pequenas primeiro**
   - Rodar SELECT antes de INSERT
   - LIMIT 10 para ver se estrutura está correta

3. **Usar NOTICE para debug**
   ```sql
   RAISE NOTICE 'Processando propriedade %: %', rec.cod_propriedade, rec.nome;
   ```

4. **Sempre verificar mapeamento antes de inserir**
   ```sql
   IF NOT EXISTS (SELECT 1 FROM staging_gim.map_pessoas WHERE id_gim = X) THEN
       -- Logar erro e CONTINUE
   END IF;
   ```

5. **Ler arquivo completo antes de editar**
   - Tool Edit requer Read prévio
   - Evita erros de "file not read"

6. **Usar log_erros religiosamente**
   ```sql
   EXCEPTION WHEN OTHERS THEN
       INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
       VALUES ('ETAPA', id_registro, SQLERRM);
   END;
   ```

7. **Verificar se tabela existe antes de usar**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'staging_gim' AND table_name = 'areas_gim';
   ```

---

## 🎓 LIÇÕES APRENDIDAS (IMPORTANTES!)

1. **Sempre validar pressupostos**
   - CSV pode ter estrutura diferente do esperado
   - Campos podem ter nomes diferentes

2. **Dados legacy são complicados**
   - Sistema GIM tinha suas próprias regras
   - Nem tudo se mapeia 1:1 para SIGMA

3. **Scripts multi-step são problemáticos**
   - Usuário pode executar partes erradas
   - SEMPRE criar scripts de execução única

4. **Type conversions são perigosas**
   - ::TEXT pode falhar se tipo já for TEXT
   - Verificar tipo ANTES de converter

5. **Naming conventions importam MUITO**
   - Mistura de camelCase e snake_case causa bugs sutis
   - Sempre verificar estrutura real da tabela

6. **IDs GIM ≠ IDs SIGMA**
   - NUNCA comparar diretamente
   - SEMPRE usar tabelas de mapeamento (map_*)

---

## 📧 PROMPT PARA RETOMAR

```
Olá! Retomando a migração GIM → SIGMA após pausa.

SITUAÇÃO:
⚠️ Migração parcialmente completa, MAS tem erros
✅ Pessoas, Telefones, Programas, Subsídios OK
✅ Propriedades CORRIGIDAS (script 16) - eram todas proprietarioId = 1
✅ Campo endereco_id adicionado (script 17) - 618 propriedades
⚠️ Transferências: 37 ignoradas (IDs não encontrados)
❌ Arrendamentos: FALHOU (tabela errada)
⏳ Precisa TESTAR tudo e corrigir erros

CONTEXTO COMPLETO:
Leia: backend/scripts/migracao-gim/RESUMO-CONTEXTO.md

PRIORIDADES:
1. Validar se script 16 funcionou (propriedades têm donos diferentes?)
2. Verificar se condôminos foram criados
3. Investigar 37 transferências ignoradas
4. Corrigir script 04 (arrendamentos)
5. Executar validação completa

IMPORTANTE:
- CSVs em: C:/csvs/
- Banco: sigma@localhost:5432
- Schema staging: staging_gim
- Naming: Tabelas PascalCase, colunas mixed (ver doc!)

Preciso que valide a migração e corrija os erros pendentes.
```

---

**Última atualização:** 2025-01-26
**Por:** Marcelo (usuário) + Claude Code
**Status:** ⚠️ MIGRAÇÃO EM ANDAMENTO - VALIDAÇÃO E CORREÇÃO NECESSÁRIAS
