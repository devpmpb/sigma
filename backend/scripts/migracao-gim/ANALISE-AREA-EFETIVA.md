# 📊 Análise Comparativa: Área vs AreaEfetiva (GIM vs SIGMA)

## 🔍 Contexto

A tabela `Area` do GIM e o modelo `AreaEfetiva` do SIGMA representam conceitos diferentes que precisam ser entendidos para migração adequada.

---

## 📁 Estrutura do GIM

### **Tabela Area (1.209 registros)**

```
codArea | codPropriedade | codPessoa | residente | area  | situacao
--------|---------------|-----------|-----------|-------|----------
9       | 9             | 35        | true      | 1,08  | ARRENDADA
21325   | 9             | 31        | false     | 0,54  | NULL
40      | 36            | 79        | true      | 1,6   | NULL
41      | 36            | 81        | false     | 0,8   | ARRENDADA
42      | 36            | 80        | false     | 0,8   | ARRENDADA
```

### **Conceito no GIM:**

A tabela `Area` representa **VÍNCULOS PESSOA-PROPRIEDADE**, onde:

1. **1 Propriedade pode ter N Pessoas** (condôminos, arrendatários, etc)
2. **1 Pessoa pode ter N Propriedades**
3. **Cada registro = 1 vínculo** com área específica

#### Exemplos:

**Propriedade 9 (Condomínio):**
- Pessoa 35: 1,08 alqueires (residente, arrendada)
- Pessoa 31: 0,54 alqueires (não residente)
- **Total da propriedade:** 1,62 alqueires

**Propriedade 36 (Múltiplos donos):**
- Pessoa 79: 1,6 alqueires (residente)
- Pessoa 81: 0,8 alqueires (não residente, arrendada)
- Pessoa 80: 0,8 alqueires (não residente, arrendada)
- **Total da propriedade:** 3,2 alqueires

### **Como o GIM calcula Área Efetiva:**

Para calcular a área efetiva de uma **pessoa**, o GIM:
1. Soma todas as áreas onde `codPessoa = X` e `situacao != 'ARRENDADA'` (área própria)
2. Soma todas as áreas onde pessoa **recebe** arrendamento
3. Subtrai áreas onde pessoa **cede** arrendamento

**Fórmula:**
```
Area Efetiva = areaPropria + areaArrendadaRecebida - areaArrendadaCedida
```

---

## 📁 Estrutura do SIGMA

### **Model AreaEfetiva**

```prisma
model AreaEfetiva {
  id                    Int     @id
  pessoaId              Int?
  pessoa                Pessoa
  anoReferencia         Int
  areaPropria           Decimal  // Soma das propriedades próprias
  areaArrendadaRecebida Decimal  // Soma dos arrendamentos recebidos
  areaArrendadaCedida   Decimal  // Soma dos arrendamentos cedidos
  areaEfetiva           Decimal  // Calculado: própria + recebida - cedida
  atividadeProdutiva    AtividadeProdutiva?
  ramoAtividadeId       Int?
  updatedAt             DateTime
}
```

### **Conceito no SIGMA:**

`AreaEfetiva` é um **SNAPSHOT ANUAL** da situação produtiva de uma **PESSOA**, onde:

1. **1 registro POR PESSOA POR ANO**
2. **Valores já calculados/consolidados**
3. **Não vincula diretamente a propriedades**
4. **Usado para cálculo de benefícios** (subsídios baseados em tamanho)

### **Relacionamentos no SIGMA:**

Para rastrear vínculos pessoa-propriedade, o SIGMA usa:

1. **`Propriedade`** → `proprietarioId` (dono principal)
2. **`PropriedadeCondomino`** → Condôminos adicionais
3. **`Arrendamento`** → Arrendamentos (recebidos e cedidos)
4. **`TransferenciaPropriedade`** → Histórico de mudanças de dono

---

## 🔄 Comparação: GIM vs SIGMA

| Aspecto | GIM (Tabela Area) | SIGMA (AreaEfetiva + Relacionamentos) |
|---------|------------------|--------------------------------------|
| **Granularidade** | 1 registro por vínculo pessoa-propriedade | 1 registro consolidado por pessoa/ano |
| **Vínculo Propriedade** | ✅ Direto via `codPropriedade` | ❌ Indireto via `Propriedade` e `Arrendamento` |
| **Múltiplos Donos** | ✅ N registros na tabela Area | ✅ 1 dono principal + N em `PropriedadeCondomino` |
| **Arrendamentos** | ✅ Marcado na situacao = "ARRENDADA" | ✅ Tabela separada `Arrendamento` |
| **Cálculo Área Efetiva** | ⚙️ Calculado em tempo real (soma) | ✅ Pré-calculado e armazenado |
| **Histórico** | ❌ Sem controle de ano | ✅ Campo `anoReferencia` |
| **Residente** | ✅ Campo `residente` por vínculo | ✅ Campo `isproprietarioResidente` na Propriedade |

---

## 🎯 Cenários de Uso

### **Cenário 1: Pessoa com 1 propriedade própria**

**GIM:**
```
Area: { codArea: 1, codPropriedade: 100, codPessoa: 500, area: 10, situacao: NULL }
```

**SIGMA:**
```
Propriedade: { id: 100, proprietarioId: 500, areaTotal: 10 }
AreaEfetiva: { pessoaId: 500, areaPropria: 10, areaArrendadaRecebida: 0, ... }
```

---

### **Cenário 2: Propriedade em Condomínio (2 donos)**

**GIM:**
```
Area: { codArea: 10, codPropriedade: 200, codPessoa: 600, area: 5, situacao: NULL }
Area: { codArea: 11, codPropriedade: 200, codPessoa: 601, area: 5, situacao: NULL }
```

**SIGMA:**
```
Propriedade: { id: 200, proprietarioId: 600, areaTotal: 10, situacao: CONDOMINIO }
PropriedadeCondomino: { propriedadeId: 200, condominoId: 601, percentual: 50 }

AreaEfetiva (Pessoa 600): { areaPropria: 5, ... }
AreaEfetiva (Pessoa 601): { areaPropria: 5, ... }
```

---

### **Cenário 3: Pessoa arrenda terra de outro**

**GIM:**
```
Area: { codArea: 20, codPropriedade: 300, codPessoa: 700, area: 8, situacao: NULL }
Area: { codArea: 21, codPropriedade: 300, codPessoa: 800, area: 3, situacao: ARRENDADA }
```
*Pessoa 700 cedeu 3 alqueires para Pessoa 800*

**SIGMA:**
```
Propriedade: { id: 300, proprietarioId: 700, areaTotal: 8 }
Arrendamento: {
  propriedadeId: 300,
  proprietarioId: 700,     // Quem cedeu
  arrendatarioId: 800,     // Quem recebeu
  areaArrendada: 3
}

AreaEfetiva (Pessoa 700): { areaPropria: 8, areaArrendadaCedida: 3, areaEfetiva: 5 }
AreaEfetiva (Pessoa 800): { areaPropria: 0, areaArrendadaRecebida: 3, areaEfetiva: 3 }
```

---

## ⚖️ Vantagens e Desvantagens

### **Abordagem GIM (Tabela Area)**

✅ **Vantagens:**
- Simples e direto
- Rastreamento granular pessoa-propriedade
- Fácil calcular área efetiva (soma)

❌ **Desvantagens:**
- Não rastreia histórico temporal
- Arrendamentos não têm datas início/fim
- Difícil saber quem arrendou para quem
- Sem controle de percentual em condomínios

---

### **Abordagem SIGMA (AreaEfetiva + Relacionamentos)**

✅ **Vantagens:**
- **Normalização adequada:** Cada conceito tem sua tabela
- **Histórico completo:** Arrendamentos, Transferências com datas
- **Desempenho:** AreaEfetiva pré-calculado (não precisa somar em tempo real)
- **Rastreabilidade:** Sabe quem arrendou para quem, datas, status
- **Flexibilidade:** Condôminos com percentual, múltiplos arrendamentos

❌ **Desvantagens:**
- Mais complexo (várias tabelas)
- ⚠️ AreaEfetiva precisa sincronização (mas existem soluções automáticas - veja abaixo)

---

## 🚀 Recomendação: Qual é melhor?

### **SIGMA é SUPERIOR para o caso de vocês!**

**Motivos:**

1. **Separação de Conceitos:**
   - `Propriedade` = dados da propriedade
   - `PropriedadeCondomino` = múltiplos donos
   - `Arrendamento` = contratos de arrendamento
   - `AreaEfetiva` = snapshot para cálculo de benefícios

2. **Rastreamento Temporal:**
   - Arrendamentos têm `dataInicio` e `dataFim`
   - Transferências rastreadas com histórico
   - Condôminos podem ter `dataFim` (deixaram de ser condôminos)

3. **Regras de Negócio:**
   - AreaEfetiva por ano (requisito legal para subsídios)
   - Possibilidade de recalcular área efetiva histórica
   - Suporte a mudanças de atividade produtiva por ano

4. **Escalabilidade:**
   - Não precisa somar 1.209 registros toda vez
   - AreaEfetiva já está calculado e indexado
   - Queries mais rápidas para relatórios

---

## 🔧 Estratégia de Migração

### **Opção 1: Calcular AreaEfetiva a partir de Area.csv** ✅ RECOMENDADO

**Lógica:**
```sql
-- Para cada pessoa, calcular área efetiva baseado em Area.csv
FOR cada pessoa
  areaPropria = SUM(area) WHERE codPessoa = X AND situacao != 'ARRENDADA'
  areaArrendadaCedida = SUM(area) WHERE codPessoa = X AND situacao = 'ARRENDADA'
  areaArrendadaRecebida = buscar na tabela Arrendamento

  INSERT INTO AreaEfetiva (
    pessoaId,
    anoReferencia = ANO_ATUAL,
    areaPropria,
    areaArrendadaRecebida,
    areaArrendadaCedida,
    areaEfetiva = areaPropria + areaArrendadaRecebida - areaArrendadaCedida
  )
```

**Vantagens:**
- Dados consolidados prontos para uso
- Performance melhor em consultas
- Alinhado com modelo SIGMA

**Desvan tagens:**
- Perde granularidade pessoa-propriedade (mas isso está em `Propriedade` e `PropriedadeCondomino`)

---

### **Opção 2: Criar tabela intermediária Area (igual GIM)** ❌ NÃO RECOMENDADO

Criar tabela no SIGMA igual ao GIM:
```sql
CREATE TABLE Area (
  id INT PRIMARY KEY,
  propriedadeId INT,
  pessoaId INT,
  area DECIMAL,
  situacao VARCHAR
)
```

**Desvantagens:**
- Duplicação de dados (já temos Propriedade, PropriedadeCondomino, Arrendamento)
- Sem ganho de funcionalidade
- Mais complexo de manter sincronizado

---

## 📋 Conclusão e Próximos Passos

### ✅ **Manter modelo SIGMA como está**

O modelo do SIGMA é **superior** porque:
- ✅ Normalizado e bem estruturado
- ✅ Rastreamento temporal completo
- ✅ Suporta regras de negócio complexas
- ✅ Performance adequada

### ✅ **Migrar Area.csv para AreaEfetiva**

Criar script SQL que:
1. Lê `Area.csv` e `Arrendamento.csv`
2. Calcula área efetiva por pessoa
3. Insere em `AreaEfetiva` com ano de referência

### ⚠️ **Observações Importantes:**

1. **Ano de referência:** Como Area.csv não tem ano, usar ano atual ou último ano conhecido
2. **Atividade produtiva:** Pode ser inferida ou deixada NULL

---

## 🔄 Mantendo AreaEfetiva Sincronizado (Soluções Automáticas)

### **Estratégia Recomendada: 4 Camadas de Proteção**

#### **Camada 1: Prevenção Automática** 🎯
**Prisma Middleware** - Recalcula automaticamente quando há mudanças:
```typescript
// backend/src/prisma/middleware/areaEfetivaSync.ts
prisma.$use(async (params, next) => {
  const result = await next(params);

  // Se mudou Propriedade, Arrendamento, etc → recalcular AreaEfetiva
  if (['Propriedade', 'Arrendamento'].includes(params.model)) {
    await recalcularAreaEfetiva(pessoaId);
  }

  return result;
});
```

**Vantagens:**
✅ Automático e transparente
✅ Código TypeScript (fácil testar)
✅ Executa em tempo real

---

#### **Camada 2: Validação em Testes** ✅
**Testes Automatizados** - Detectam inconsistências antes de produção:
```typescript
// backend/tests/areaEfetiva.test.ts
it('deve ter AreaEfetiva sincronizada', async () => {
  const pessoas = await prisma.pessoa.findMany({
    include: { areaEfetiva: true, propriedades: true }
  });

  for (const pessoa of pessoas) {
    const areaSomada = pessoa.propriedades.reduce(
      (sum, p) => sum + p.areaTotal, 0
    );
    expect(pessoa.areaEfetiva.areaPropria).toBeCloseTo(areaSomada);
  }
});
```

**Vantagens:**
✅ Roda no CI/CD
✅ Falha o build se houver problema
✅ Documentação viva

---

#### **Camada 3: Monitoramento Semanal** 🔔
**Query de Auditoria** - Alerta se houver divergências:
```sql
-- Detectar inconsistências
SELECT p.nome, ae."areaPropria" - SUM(prop."areaTotal") as diferenca
FROM "Pessoa" p
INNER JOIN "AreaEfetiva" ae ON ae.id = p.id
LEFT JOIN "Propriedade" prop ON prop."proprietarioId" = p.id
GROUP BY p.id
HAVING ABS(diferenca) > 0.01;
```

Agendar via **cron job** para rodar semanalmente.

---

#### **Camada 4: Correção Manual (Admin)** 🛠️
**Endpoint para recálculo manual**:
```typescript
// POST /api/admin/recalcular-area-efetiva
// Permite recalcular se necessário
```

---

### **Resultado:** Garantia de Consistência! ✅

Com essas 4 camadas, você tem:
- ✅ Prevenção automática (Prisma Middleware)
- ✅ Detecção precoce (Testes CI/CD)
- ✅ Monitoramento contínuo (Auditoria semanal)
- ✅ Correção rápida (Endpoint admin)

**Conclusão:** O modelo SIGMA não só é melhor, como também pode ser **100% automatizado**! 🚀

---

**Quer que eu crie o script de migração de `Area.csv` → `AreaEfetiva`?**
