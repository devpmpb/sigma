# 🚀 Guia Rápido - Migração de Transferências e Arrendamentos

## 📋 Pré-requisitos

Antes de começar, verifique:

- [x] Migração de Pessoas executada (script 01)
- [x] Migração de Propriedades executada (script 02)
- [x] Tabelas `staging_gim.map_pessoas` e `staging_gim.map_propriedades` existem
- [x] Tabela `staging_gim.areas_gim_completa` existe
- [x] CSVs estão em `C:/csvs/`:
  - `movimentotransferencia.csv` (407 linhas)
  - `movimentosituacao.csv` (~mil linhas)
  - `arrendamento.csv`

---

## 📝 PASSO 1: Transferências de Propriedade

### 1.1 - Abrir script no pgAdmin

1. Abra o **pgAdmin**
2. Conecte ao banco **sigma**
3. Abra o Query Tool
4. Carregue o arquivo: `backend/scripts/migracao-gim/03-migrar-transferencias-propriedade.sql`

### 1.2 - Executar seções na ordem

#### Seção 1: Criar tabelas staging
```sql
-- Execute apenas o bloco de CREATE TABLE
DROP TABLE IF EXISTS staging_gim.transferencias_gim CASCADE;
CREATE TABLE staging_gim.transferencias_gim (...);

DROP TABLE IF EXISTS staging_gim.movimentos_situacao_gim CASCADE;
CREATE TABLE staging_gim.movimentos_situacao_gim (...);
```

#### Seção 2: Carregar CSVs
```sql
COPY staging_gim.transferencias_gim(
    cod_movimento_transferencia,
    cod_propriedade,
    cod_proprietario,
    cod_novo_proprietario,
    data,
    motivo,
    responsavel
)
FROM 'C:/csvs/movimentotransferencia.csv'
DELIMITER ';'
CSV HEADER
ENCODING 'UTF8';

COPY staging_gim.movimentos_situacao_gim(
    cod_movimento_situacao,
    cod_propriedade,
    data,
    de,
    para,
    tipo,
    motivo,
    responsavel
)
FROM 'C:/csvs/movimentosituacao.csv'
DELIMITER ';'
CSV HEADER
ENCODING 'UTF8';
```

✅ **Verificar:** Execute `SELECT COUNT(*) FROM staging_gim.transferencias_gim;` → Deve retornar ~407

#### Seção 3: Criar função
```sql
CREATE OR REPLACE FUNCTION staging_gim.buscar_situacao_pos_transferencia(...)
RETURNS "SituacaoPropriedade" AS $$
...
$$ LANGUAGE plpgsql;
```

#### Seção 4: Migrar dados
```sql
DO $$
DECLARE
    v_count INTEGER := 0;
    ...
BEGIN
    RAISE NOTICE 'Iniciando migração de Transferências de Propriedade...';
    ...
END $$;
```

⏳ **Aguarde:** A migração pode levar alguns segundos

✅ **Resultado esperado:**
```
Transferências migradas: XXX
Ignoradas (IDs não encontrados): YYY
Erros: 0
```

#### Seção 5: Validar
Execute as queries de validação no final do script:

```sql
-- 1. Comparar totais
SELECT 'GIM' as origem, COUNT(*) FROM staging_gim.transferencias_gim
UNION ALL
SELECT 'SIGMA', COUNT(*) FROM "TransferenciaPropriedade";

-- 2. Ver transferências migradas
SELECT tp.id, p.nome as propriedade, ...
FROM "TransferenciaPropriedade" tp
...
LIMIT 20;

-- 3. Ver erros (se houver)
SELECT * FROM staging_gim.log_erros
WHERE etapa LIKE 'TRANSFERENCIA%'
ORDER BY data_erro DESC;
```

---

## 📝 PASSO 2: Arrendamentos

### 2.1 - Abrir script no pgAdmin

1. No mesmo Query Tool (ou abra novo)
2. Carregue o arquivo: `backend/scripts/migracao-gim/04-migrar-arrendamentos.sql`

### 2.2 - Executar seções na ordem

#### Seção 1: Criar tabela staging
```sql
DROP TABLE IF EXISTS staging_gim.arrendamentos_gim CASCADE;
CREATE TABLE staging_gim.arrendamentos_gim (...);
```

#### Seção 2: Carregar CSV
```sql
COPY staging_gim.arrendamentos_gim(
    cod_arrendamento,
    cod_area,
    cod_arrendatario,
    area,
    residente,
    situacao,
    observacao,
    data_inicial,
    data_final
)
FROM 'C:/csvs/arrendamento.csv'
DELIMITER ';'
CSV HEADER
ENCODING 'UTF8';
```

#### ⚠️ Seção 2.1: Corrigir vírgulas decimais (SE NECESSÁRIO)

Execute primeiro:
```sql
SELECT area FROM staging_gim.arrendamentos_gim LIMIT 5;
```

Se aparecer valores como `0,81` ao invés de `0.81`, execute a correção:
```sql
UPDATE staging_gim.arrendamentos_gim
SET area = REPLACE(area::TEXT, ',', '.')::NUMERIC(10,2)
WHERE area::TEXT LIKE '%,%';
```

✅ **Verificar:** `SELECT COUNT(*) FROM staging_gim.arrendamentos_gim;`

#### Seção 3: Migrar dados
```sql
DO $$
DECLARE
    v_count INTEGER := 0;
    ...
BEGIN
    RAISE NOTICE 'Iniciando migração de Arrendamentos...';
    ...
END $$;
```

⏳ **Aguarde:** A migração pode levar alguns segundos

✅ **Resultado esperado:**
```
Arrendamentos migrados: XXX
Ignorados (IDs não encontrados): YYY
Erros: 0
```

#### Seção 4: Validar
Execute as queries de validação no final do script:

```sql
-- 1. Comparar totais
SELECT 'GIM' as origem, COUNT(*) FROM staging_gim.arrendamentos_gim
UNION ALL
SELECT 'SIGMA', COUNT(*) FROM "Arrendamento";

-- 2. Ver arrendamentos migrados
SELECT a.id, prop.nome, ...
FROM "Arrendamento" a
...
LIMIT 20;

-- 3. Distribuição por status
SELECT status, COUNT(*), ...
FROM "Arrendamento"
GROUP BY status;
```

---

## ✅ Checklist Final

Após executar os dois scripts, verifique:

### Transferências:
- [ ] Total de transferências no GIM = Total no SIGMA (ou próximo, considerando ignorados)
- [ ] Distribuição por situação faz sentido (PRÓPRIA, CONDOMÍNIO, USUFRUTO)
- [ ] Erros = 0 ou poucos (registrados em `log_erros`)

### Arrendamentos:
- [ ] Total de arrendamentos no GIM = Total no SIGMA (ou próximo)
- [ ] Distribuição por status (ativo, cancelado, vencido) faz sentido
- [ ] Áreas arrendadas estão corretas (sem vírgulas)
- [ ] Erros = 0 ou poucos

### Geral:
- [ ] Tabela `staging_gim.log_erros` revisada
- [ ] Queries de validação executadas
- [ ] Dados parecem consistentes

---

## 🔍 Solução de Problemas

### Erro: "relation staging_gim.map_pessoas does not exist"
**Solução:** Execute primeiro os scripts 01 e 02 (migração de pessoas e propriedades)

### Erro: "codArea não encontrada"
**Solução:** Verifique se a tabela `staging_gim.areas_gim_completa` foi populada no script 02

### Erro: "invalid input syntax for type numeric"
**Solução:** Execute a correção de vírgulas decimais no script de arrendamentos

### Muitos registros ignorados
**Solução:** Normal. Algumas transferências/arrendamentos referenciam pessoas ou propriedades que não foram migradas. Verifique `staging_gim.log_erros` para detalhes.

---

## 📞 Próximos Passos

Após concluir, você terá:
- ✅ Histórico completo de transferências de propriedade
- ✅ Histórico completo de arrendamentos
- ✅ Dados prontos para uso no frontend

**Falta migrar:**
- ⏳ Endereços (aguardando Bairro.csv)

---

**Boa migração! 🚀**
