# 🚀 Guia Rápido - Migração de Área Efetiva

## 📋 Pré-requisitos

Antes de começar, verifique:

- [x] Migração de Pessoas executada (script 01)
- [x] Migração de Propriedades executada (script 01 ou 02)
- [x] Migração de Arrendamentos executada (script 04)
- [x] Tabela `staging_gim.map_pessoas` existe
- [x] CSV está em `C:/csvs/`:
  - `Area.csv` (1.209 linhas)

---

## 📝 PASSO 1: Preparar o Script no pgAdmin

### 1.1 - Abrir script no pgAdmin

1. Abra o **pgAdmin**
2. Conecte ao banco **sigma**
3. Abra o Query Tool
4. Carregue o arquivo: `backend/scripts/migracao-gim/05-migrar-area-efetiva.sql`

---

## 📝 PASSO 2: Executar Seções na Ordem

### Seção 1: Criar tabela staging

Execute apenas o bloco de CREATE TABLE:

```sql
DROP TABLE IF EXISTS staging_gim.areas_gim CASCADE;
CREATE TABLE staging_gim.areas_gim (
    cod_area BIGINT PRIMARY KEY,
    cod_propriedade BIGINT,
    cod_pessoa BIGINT,
    residente VARCHAR(10),
    area NUMERIC(10,2),
    situacao VARCHAR(30)
);
```

✅ **Verificar:** Execute `SELECT * FROM staging_gim.areas_gim LIMIT 5;` → Deve retornar vazio (tabela criada)

---

### Seção 2: Carregar CSV

Execute o comando COPY:

```sql
COPY staging_gim.areas_gim(
    cod_area,
    cod_propriedade,
    cod_pessoa,
    residente,
    area,
    situacao
)
FROM 'C:/csvs/Area.csv'
DELIMITER ';'
CSV HEADER
ENCODING 'UTF8';
```

✅ **Verificar:** Execute `SELECT COUNT(*) FROM staging_gim.areas_gim;` → Deve retornar **1.209**

---

### ⚠️ Seção 2.1: Corrigir vírgulas decimais (SE NECESSÁRIO)

Execute primeiro para verificar:

```sql
SELECT area FROM staging_gim.areas_gim LIMIT 10;
```

**Se aparecer valores como `0,81` ao invés de `0.81`**, execute a correção:

```sql
UPDATE staging_gim.areas_gim
SET area = REPLACE(area::TEXT, ',', '.')::NUMERIC(10,2)
WHERE area::TEXT LIKE '%,%';
```

✅ **Verificar novamente:**
```sql
SELECT area FROM staging_gim.areas_gim LIMIT 10;
```
→ Agora deve aparecer `0.81` (com ponto)

---

### Seção 3: Migrar dados (Calcular Área Efetiva)

Execute o bloco DO $$:

```sql
DO $$
DECLARE
    v_count INTEGER := 0;
    v_ignorados INTEGER := 0;
    v_errors INTEGER := 0;
    rec RECORD;
    v_pessoa_id INTEGER;
    v_ano_atual INTEGER := EXTRACT(YEAR FROM NOW());
    v_area_propria NUMERIC(10,2);
    v_area_arrendada_recebida NUMERIC(10,2);
    v_area_arrendada_cedida NUMERIC(10,2);
    v_area_efetiva NUMERIC(10,2);
BEGIN
    RAISE NOTICE 'Iniciando migração de Área Efetiva...';
    RAISE NOTICE 'Ano de referência: %', v_ano_atual;
    RAISE NOTICE '';

    -- Para cada pessoa que tem área no GIM
    FOR rec IN (
        SELECT DISTINCT
            a.cod_pessoa
        FROM staging_gim.areas_gim a
        WHERE a.cod_pessoa IS NOT NULL
        ORDER BY a.cod_pessoa
    ) LOOP
        BEGIN
            -- Mapear ID (GIM → SIGMA)
            SELECT id_sigma INTO v_pessoa_id
            FROM staging_gim.map_pessoas
            WHERE id_gim = rec.cod_pessoa;

            IF v_pessoa_id IS NULL THEN
                v_ignorados := v_ignorados + 1;
                CONTINUE;
            END IF;

            -- ========================================================
            -- CALCULAR ÁREA PRÓPRIA
            -- ========================================================
            SELECT COALESCE(SUM(area), 0)
            INTO v_area_propria
            FROM staging_gim.areas_gim
            WHERE cod_pessoa = rec.cod_pessoa
              AND (situacao IS NULL OR UPPER(TRIM(situacao)) != 'ARRENDADA');

            -- ========================================================
            -- CALCULAR ÁREA ARRENDADA RECEBIDA
            -- ========================================================
            SELECT COALESCE(SUM("areaArrendada"), 0)
            INTO v_area_arrendada_recebida
            FROM "Arrendamento"
            WHERE "arrendatarioId" = v_pessoa_id
              AND (status = 'ativo' OR "dataFim" IS NULL OR "dataFim" > NOW());

            -- ========================================================
            -- CALCULAR ÁREA ARRENDADA CEDIDA
            -- ========================================================
            SELECT COALESCE(SUM("areaArrendada"), 0)
            INTO v_area_arrendada_cedida
            FROM "Arrendamento"
            WHERE "proprietarioId" = v_pessoa_id
              AND (status = 'ativo' OR "dataFim" IS NULL OR "dataFim" > NOW());

            -- ========================================================
            -- CALCULAR ÁREA EFETIVA
            -- ========================================================
            v_area_efetiva := v_area_propria + v_area_arrendada_recebida - v_area_arrendada_cedida;

            -- ========================================================
            -- INSERIR OU ATUALIZAR ÁREA EFETIVA
            -- ========================================================
            INSERT INTO "AreaEfetiva" (
                id,
                "anoReferencia",
                "areaPropria",
                "areaArrendadaRecebida",
                "areaArrendadaCedida",
                "areaEfetiva",
                "updatedAt"
            ) VALUES (
                v_pessoa_id,
                v_ano_atual,
                v_area_propria,
                v_area_arrendada_recebida,
                v_area_arrendada_cedida,
                v_area_efetiva,
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                "anoReferencia" = EXCLUDED."anoReferencia",
                "areaPropria" = EXCLUDED."areaPropria",
                "areaArrendadaRecebida" = EXCLUDED."areaArrendadaRecebida",
                "areaArrendadaCedida" = EXCLUDED."areaArrendadaCedida",
                "areaEfetiva" = EXCLUDED."areaEfetiva",
                "updatedAt" = NOW();

            v_count := v_count + 1;

            -- Log de progresso
            IF v_count % 50 = 0 THEN
                RAISE NOTICE '   ✅ % áreas efetivas calculadas...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO staging_gim.log_erros (etapa, id_gim, erro)
            VALUES (
                'AREA_EFETIVA',
                rec.cod_pessoa,
                SQLERRM
            );
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO DE ÁREA EFETIVA CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Áreas efetivas calculadas: %', v_count;
    RAISE NOTICE 'Ignorados (pessoa não encontrada): %', v_ignorados;
    RAISE NOTICE 'Erros: %', v_errors;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

END $$;
```

⏳ **Aguarde:** A migração pode levar alguns segundos

✅ **Resultado esperado:**
```
Áreas efetivas calculadas: XXX
Ignorados (pessoa não encontrada): YYY
Erros: 0
```

---

## 📝 PASSO 3: Validar Migração

Execute as queries de validação incluídas no final do script:

### 1. Comparar totais GIM vs SIGMA

```sql
SELECT
    'GIM - Pessoas com área' as origem,
    COUNT(DISTINCT cod_pessoa) as total_pessoas
FROM staging_gim.areas_gim
UNION ALL
SELECT
    'SIGMA - AreaEfetiva' as origem,
    COUNT(*) as total_pessoas
FROM "AreaEfetiva";
```

**Resultado esperado:** Totais próximos (GIM pode ter mais se houver pessoas não migradas)

---

### 2. Ver áreas efetivas calculadas (Top 20)

```sql
SELECT
    p.nome as pessoa,
    ae."anoReferencia",
    ae."areaPropria",
    ae."areaArrendadaRecebida",
    ae."areaArrendadaCedida",
    ae."areaEfetiva",
    ae."atividadeProdutiva"
FROM "AreaEfetiva" ae
INNER JOIN "Pessoa" p ON p.id = ae.id
ORDER BY ae."areaEfetiva" DESC
LIMIT 20;
```

**Confira:** Valores fazem sentido? Áreas maiores aparecem no topo?

---

### 3. Verificar erros (se houver)

```sql
SELECT *
FROM staging_gim.log_erros
WHERE etapa LIKE 'AREA_EFETIVA%'
ORDER BY data_erro DESC;
```

**Ideal:** 0 registros

---

### 4. Distribuição de área efetiva

```sql
SELECT
    CASE
        WHEN "areaEfetiva" = 0 THEN '0 (sem área)'
        WHEN "areaEfetiva" > 0 AND "areaEfetiva" <= 5 THEN '0-5 alqueires'
        WHEN "areaEfetiva" > 5 AND "areaEfetiva" <= 10 THEN '5-10 alqueires'
        WHEN "areaEfetiva" > 10 AND "areaEfetiva" <= 20 THEN '10-20 alqueires'
        WHEN "areaEfetiva" > 20 AND "areaEfetiva" <= 50 THEN '20-50 alqueires'
        ELSE '50+ alqueires'
    END as faixa,
    COUNT(*) as total_pessoas,
    ROUND(AVG("areaEfetiva"), 2) as media_area
FROM "AreaEfetiva"
GROUP BY faixa
ORDER BY
    CASE faixa
        WHEN '0 (sem área)' THEN 1
        WHEN '0-5 alqueires' THEN 2
        WHEN '5-10 alqueires' THEN 3
        WHEN '10-20 alqueires' THEN 4
        WHEN '20-50 alqueires' THEN 5
        ELSE 6
    END;
```

**Confira:** Distribuição faz sentido? Maioria em qual faixa?

---

### 5. Validar cálculo (deve retornar 0 registros se tudo estiver correto)

```sql
SELECT
    p.nome,
    ae."areaPropria",
    ae."areaArrendadaRecebida",
    ae."areaArrendadaCedida",
    ae."areaEfetiva",
    (ae."areaPropria" + ae."areaArrendadaRecebida" - ae."areaArrendadaCedida") as area_calculada,
    ae."areaEfetiva" - (ae."areaPropria" + ae."areaArrendadaRecebida" - ae."areaArrendadaCedida") as diferenca
FROM "AreaEfetiva" ae
INNER JOIN "Pessoa" p ON p.id = ae.id
WHERE ABS(ae."areaEfetiva" - (ae."areaPropria" + ae."areaArrendadaRecebida" - ae."areaArrendadaCedida")) > 0.01
ORDER BY ABS(diferenca) DESC;
```

**Ideal:** 0 registros (significa que o cálculo está correto)

---

### 6. Estatísticas gerais

```sql
SELECT
    COUNT(*) as total_pessoas_com_area,
    ROUND(AVG("areaEfetiva"), 2) as media_area_efetiva,
    ROUND(MIN("areaEfetiva"), 2) as menor_area,
    ROUND(MAX("areaEfetiva"), 2) as maior_area,
    ROUND(SUM("areaEfetiva"), 2) as soma_total_area
FROM "AreaEfetiva";
```

---

### 7. Pessoas com área cedida (arrendaram para outros)

```sql
SELECT
    p.nome as pessoa,
    ae."areaPropria",
    ae."areaArrendadaCedida",
    ae."areaEfetiva",
    ROUND((ae."areaArrendadaCedida" / NULLIF(ae."areaPropria", 0)) * 100, 2) as percentual_cedido
FROM "AreaEfetiva" ae
INNER JOIN "Pessoa" p ON p.id = ae.id
WHERE ae."areaArrendadaCedida" > 0
ORDER BY ae."areaArrendadaCedida" DESC
LIMIT 20;
```

---

### 8. Pessoas com área recebida (arrendaram de outros)

```sql
SELECT
    p.nome as pessoa,
    ae."areaPropria",
    ae."areaArrendadaRecebida",
    ae."areaEfetiva"
FROM "AreaEfetiva" ae
INNER JOIN "Pessoa" p ON p.id = ae.id
WHERE ae."areaArrendadaRecebida" > 0
ORDER BY ae."areaArrendadaRecebida" DESC
LIMIT 20;
```

---

## ✅ Checklist Final

Após executar o script, verifique:

### Área Efetiva:
- [ ] Total de pessoas no GIM ≈ Total no SIGMA (considerando pessoas não migradas)
- [ ] Distribuição por faixa de área faz sentido
- [ ] Query de validação de cálculo retorna 0 registros (cálculo correto)
- [ ] Estatísticas (média, mínimo, máximo) fazem sentido
- [ ] Pessoas com arrendamento cedido/recebido aparecem corretamente
- [ ] Erros = 0 ou poucos (registrados em `log_erros`)

### Geral:
- [ ] Tabela `staging_gim.log_erros` revisada
- [ ] Todas as queries de validação executadas
- [ ] Dados parecem consistentes
- [ ] Ano de referência correto (ano atual)

---

## 🔍 Solução de Problemas

### Erro: "relation staging_gim.map_pessoas does not exist"
**Solução:** Execute primeiro o script 01 (migração de pessoas)

### Erro: "invalid input syntax for type numeric"
**Solução:** Execute a correção de vírgulas decimais (Seção 2.1):
```sql
UPDATE staging_gim.areas_gim
SET area = REPLACE(area::TEXT, ',', '.')::NUMERIC(10,2)
WHERE area::TEXT LIKE '%,%';
```

### Erro: "duplicate key value violates unique constraint"
**Solução:** Normal se você rodar o script 2x. O UPSERT vai atualizar os registros existentes. Se quiser recomeçar do zero:
```sql
DELETE FROM "AreaEfetiva";
```

### Muitos registros ignorados
**Solução:** Normal. Algumas pessoas do GIM podem não ter sido migradas. Verifique `staging_gim.log_erros` para detalhes.

### Área efetiva negativa
**Isso pode acontecer!** Se uma pessoa cedeu mais área do que possui (arrendou terra e depois a vendeu, por exemplo). Verifique se faz sentido no contexto do negócio.

---

## 📊 Entendendo os Cálculos

### Fórmula da Área Efetiva:
```
areaEfetiva = areaPropria + areaArrendadaRecebida - areaArrendadaCedida
```

### Exemplo:
- **João** possui 10 alqueires (areaPropria = 10)
- **João** cedeu 3 alqueires para Maria (areaArrendadaCedida = 3)
- **João** recebeu 2 alqueires de Pedro (areaArrendadaRecebida = 2)
- **Área Efetiva de João:** 10 + 2 - 3 = **9 alqueires**

### Observações:
- **areaPropria:** Soma de todas as áreas em `staging_gim.areas_gim` onde `situacao != 'ARRENDADA'`
- **areaArrendadaRecebida:** Soma dos arrendamentos onde a pessoa é `arrendatarioId` (quem recebeu)
- **areaArrendadaCedida:** Soma dos arrendamentos onde a pessoa é `proprietarioId` (quem cedeu)
- **Somente arrendamentos ativos** são considerados: `status = 'ativo'` OU `dataFim IS NULL` OU `dataFim > NOW()`

---

## 📞 Próximos Passos

Após concluir, você terá:
- ✅ Área efetiva calculada para cada pessoa no ano atual
- ✅ Base para cálculo de benefícios/subsídios
- ✅ Dados prontos para uso no frontend

**Falta migrar:**
- ⏳ Endereços (aguardando Bairro.csv)

---

## 🎯 Query de Auditoria Semanal (BONUS)

Use esta query para detectar inconsistências entre `AreaEfetiva` e dados reais:

```sql
-- Detectar inconsistências entre AreaEfetiva e dados reais
-- Esta query deve retornar 0 registros se tudo estiver sincronizado
SELECT
    p.nome,
    ae."areaPropria" as area_propria_registrada,

    -- Calcular área própria real (soma das propriedades)
    COALESCE((
        SELECT SUM(prop."areaTotal")
        FROM "Propriedade" prop
        WHERE prop."proprietarioId" = p.id
    ), 0) as area_propria_calculada,

    -- Diferença
    ae."areaPropria" - COALESCE((
        SELECT SUM(prop."areaTotal")
        FROM "Propriedade" prop
        WHERE prop."proprietarioId" = p.id
    ), 0) as diferenca

FROM "Pessoa" p
INNER JOIN "AreaEfetiva" ae ON ae.id = p.id
WHERE ABS(
    ae."areaPropria" - COALESCE((
        SELECT SUM(prop."areaTotal")
        FROM "Propriedade" prop
        WHERE prop."proprietarioId" = p.id
    ), 0)
) > 0.01
ORDER BY ABS(diferenca) DESC;
```

**Ideal:** 0 registros

**Se retornar registros:** Significa que `areaPropria` em `AreaEfetiva` está diferente da soma real das propriedades. Isso pode acontecer porque:
1. Propriedades foram adicionadas/removidas após a migração
2. Área de propriedade foi atualizada
3. **Solução:** Implementar o Prisma Middleware (ver TODO.md, Prioridade 2)

---

**Boa migração! 🚀**
