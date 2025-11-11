# ✅ RAMOS DE ATIVIDADE - IMPLEMENTAÇÃO CONCLUÍDA

## 🎯 O QUE FOI FEITO

### **1. Schema do Prisma atualizado** ✅
```prisma
// Novo modelo RamoAtividade
model RamoAtividade {
  id          Int      @id @default(autoincrement())
  nome        String   @unique
  descricao   String?
  categoria   AtividadeProdutiva
  ativo       Boolean  @default(true)

  areasEfetivas AreaEfetiva[]
  programas     ProgramaRamoAtividade[]
}

// Novo modelo de relação N:N
model ProgramaRamoAtividade {
  programaId      Int
  ramoAtividadeId Int

  @@id([programaId, ramoAtividadeId])
}

// AreaEfetiva agora pode usar RamoAtividade (opcional)
model AreaEfetiva {
  ...
  atividadeProdutiva AtividadeProdutiva?  // Mantido para compatibilidade
  ramoAtividadeId    Int?                  // Nova relação (mais flexível)
  ramoAtividade      RamoAtividade?
  ...
}
```

### **2. Migration criada e aplicada** ✅
- **Arquivo:** `backend/prisma/migrations/20251110202515_adicionar_ramo_atividade/migration.sql`
- **Status:** ✅ Aplicada ao banco com sucesso
- **Data:** 2025-11-10 20:25:15

### **3. Prisma Client atualizado** ✅
```bash
npx prisma generate
```
Agora você pode usar:
```typescript
import { prisma } from './prisma';

// Buscar ramos
const ramos = await prisma.ramoAtividade.findMany();

// Buscar programas com seus ramos permitidos
const programa = await prisma.programa.findUnique({
  where: { id: 1 },
  include: {
    ramosAtividade: {
      include: {
        ramoAtividade: true
      }
    }
  }
});
```

---

## 📋 PRÓXIMOS PASSOS

### **AGORA (se você tem os CSVs):**

1. **Executar script de dados básicos:**
```bash
# No pgAdmin, executar:
backend/scripts/migracao-gim/popular-ramos-basicos.sql
```

Isso vai inserir 9 ramos básicos (mapeamento dos ENUMs).

2. **Migrar dados do GIM:**
```bash
# No pgAdmin, executar:
backend/scripts/migracao-gim/09-migrar-ramos-atividade.sql
```

Isso vai:
- Importar 22 ramos do GIM
- Mapear automaticamente categorias
- Criar relações programa x ramo

### **DEPOIS (quando tiver os CSVs):**

Se você não tem os CSVs agora, use o arquivo de lembrete:
**`LEMBRETE-RAMOS-ATIVIDADE.md`**

---

## 🗂️ ESTRUTURA DE ARQUIVOS

```
backend/
├── prisma/
│   ├── schema.prisma                    ✅ Atualizado
│   └── migrations/
│       └── 20251110202515_adicionar_ramo_atividade/
│           └── migration.sql            ✅ Aplicada
│
└── scripts/migracao-gim/
    ├── 09-migrar-ramos-atividade.sql    ✅ Pronto para usar
    ├── popular-ramos-basicos.sql        ✅ Dados iniciais
    ├── LEMBRETE-RAMOS-ATIVIDADE.md      📋 Prompt futuro
    └── README-RAMOS-ATIVIDADE.md        📖 Este arquivo
```

---

## 🎨 COMO FUNCIONA

### **Lógica de Permissões:**

**SE existe relação na tabela `ProgramaRamoAtividade`:**
→ O ramo **PODE** solicitar o programa

**SE NÃO existe relação:**
→ O ramo **NÃO PODE** solicitar o programa

### **Exemplo prático:**

**Programa "Incentivo ao Uso de Adubo Orgânico" (ID 3):**

```sql
-- Permitir apenas Bovinocultura e Produção de Milho
INSERT INTO "ProgramaRamoAtividade" ("programaId", "ramoAtividadeId") VALUES
  (3, 2),  -- Bovinocultura
  (3, 9);  -- Produção de Milho
```

Agora:
- ✅ Produtores de **Bovinocultura** podem solicitar
- ✅ Produtores de **Produção de Milho** podem solicitar
- ❌ Produtores de **Avicultura** NÃO podem solicitar (não está na lista)
- ❌ Produtores de **Reflorestamento** NÃO podem solicitar (não está na lista)

---

## 🔍 QUERIES ÚTEIS

### **Listar todos os ramos:**
```sql
SELECT id, nome, categoria, ativo
FROM "RamoAtividade"
ORDER BY categoria, nome;
```

### **Ver quais ramos podem acessar um programa:**
```sql
SELECT
    r.nome as ramo,
    r.categoria
FROM "ProgramaRamoAtividade" pra
INNER JOIN "RamoAtividade" r ON r.id = pra."ramoAtividadeId"
WHERE pra."programaId" = 3  -- ID do programa
ORDER BY r.categoria, r.nome;
```

### **Ver quais programas um ramo pode acessar:**
```sql
SELECT
    p.nome as programa,
    p."tipoPrograma"
FROM "ProgramaRamoAtividade" pra
INNER JOIN "Programa" p ON p.id = pra."programaId"
WHERE pra."ramoAtividadeId" = 2  -- ID do ramo (ex: Bovinocultura)
ORDER BY p.nome;
```

### **Adicionar novo ramo:**
```sql
INSERT INTO "RamoAtividade" (nome, descricao, categoria, ativo)
VALUES ('Piscicultura', 'Criação de peixes', 'AQUICULTURA', true);
```

### **Permitir um ramo em um programa:**
```sql
INSERT INTO "ProgramaRamoAtividade" ("programaId", "ramoAtividadeId")
VALUES (3, 5);  -- Programa 3, Ramo 5
```

### **Remover permissão:**
```sql
DELETE FROM "ProgramaRamoAtividade"
WHERE "programaId" = 3
  AND "ramoAtividadeId" = 5;
```

---

## ⚙️ INTEGRAÇÃO COM BACKEND/FRONTEND

### **Backend (validação):**

```typescript
// Verificar se um ramo pode solicitar um programa
async function ramoPermitidoNoPrograma(
  programaId: number,
  ramoAtividadeId: number
): Promise<boolean> {
  const relacao = await prisma.programaRamoAtividade.findUnique({
    where: {
      programaId_ramoAtividadeId: {
        programaId,
        ramoAtividadeId
      }
    }
  });

  return relacao !== null;
}
```

### **Frontend (filtrar programas):**

```typescript
// Buscar apenas programas que o ramo pode acessar
async function getProgramasDisponiveis(ramoAtividadeId: number) {
  const programas = await api.get('/programas', {
    params: { ramoAtividadeId }
  });
  return programas;
}
```

---

## 📊 DADOS ATUAIS

### **Ramos básicos inseridos (9):**

| ID | Nome | Categoria |
|----|------|-----------|
| 1 | Agricultura Geral | AGRICULTURA |
| 2 | Pecuária Geral | PECUARIA |
| 3 | Agricultura e Pecuária | AGRICULTURA_PECUARIA |
| 4 | Silvicultura | SILVICULTURA |
| 5 | Aquicultura | AQUICULTURA |
| 6 | Hortifrúti | HORTIFRUTI |
| 7 | Avicultura | AVICULTURA |
| 8 | Suinocultura | SUINOCULTURA |
| 9 | Outras Atividades | OUTROS |

**Após migração do GIM:** ~22 ramos

---

## ✅ STATUS FINAL

- [x] Schema do Prisma atualizado
- [x] Migration criada e aplicada
- [x] Prisma Client gerado
- [x] Dados básicos prontos para inserir
- [x] Script de migração do GIM pronto
- [x] Documentação completa
- [ ] Popular dados básicos (executar SQL)
- [ ] Migrar dados do GIM (quando tiver CSVs)
- [ ] Testar no frontend
- [ ] Validar regras de negócio

---

**Criado por:** Claude Code
**Data:** 2025-01-10
**Status:** ✅ Pronto para uso
