# ✅ TABELA TELEFONE - NOVA ABORDAGEM IMPLEMENTADA

## 🎯 MUDANÇA DE ABORDAGEM

### **Antes:**
- Campo `Pessoa.telefone` (String, único valor)
- Tentativa de concatenar todos telefones com `|`
- Impossível saber tipo do telefone depois

### **Agora:**
- Tabela `Telefone` separada (1:N com Pessoa)
- Cada pessoa pode ter múltiplos telefones
- Cada telefone tem tipo (CELULAR, RESIDENCIAL, COMERCIAL, OUTRO)
- Um telefone marcado como principal por pessoa

---

## 📋 ESTRUTURA IMPLEMENTADA

### **Schema Prisma:**

```prisma
enum TipoTelefone {
  CELULAR
  RESIDENCIAL
  COMERCIAL
  OUTRO
}

model Telefone {
  id        Int          @id @default(autoincrement())
  pessoaId  Int
  pessoa    Pessoa       @relation(fields: [pessoaId], references: [id], onDelete: Cascade)
  ddd       String?      // 2-3 caracteres
  numero    String       // Número limpo (apenas dígitos)
  ramal     String?
  tipo      TipoTelefone @default(CELULAR)
  principal Boolean      @default(false)
  ativo     Boolean      @default(true)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@index([pessoaId])
  @@index([pessoaId, principal])
}

model Pessoa {
  // ...
  telefone   String?    // DEPRECATED - manter por compatibilidade
  telefones  Telefone[] // NOVA RELAÇÃO
  // ...
}
```

### **Migration Aplicada:**
- ✅ `20251112233059_adicionar_tabela_telefone`
- ✅ Prisma Client gerado

---

## 🚀 ARQUIVOS CRIADOS

### **1. Script de Migração SQL:**
- **Arquivo:** `12-migrar-telefones.sql`
- **O que faz:**
  - Importa CSV telefone.csv
  - Limpa números (remove caracteres não numéricos)
  - Mapeia tipos do GIM para ENUM do SIGMA
  - Marca primeiro telefone (por prioridade) como principal
  - Mantém TODOS os telefones de cada pessoa

### **2. Prioridade de Telefone Principal:**
1. **Celular** (maior prioridade)
2. **Residencial**
3. **Comercial**
4. **Outros**

---

## 📊 COMO EXECUTAR A MIGRAÇÃO

### **Passo 1: Executar script SQL**
```bash
# No pgAdmin:
# 1. Abrir Query Tool
# 2. Executar: backend/scripts/migracao-gim/12-migrar-telefones.sql
```

**Tempo estimado:** ~2 minutos para ~2.500 telefones

### **Passo 2: Validar migração**
```sql
-- Ver total de telefones
SELECT COUNT(*) FROM "Telefone";

-- Ver pessoas com múltiplos telefones
SELECT
    p.nome,
    COUNT(t.id) as qtd_telefones
FROM "Pessoa" p
INNER JOIN "Telefone" t ON t."pessoaId" = p.id
GROUP BY p.id, p.nome
HAVING COUNT(t.id) > 1
ORDER BY COUNT(t.id) DESC
LIMIT 10;

-- Ver distribuição por tipo
SELECT tipo, COUNT(*) FROM "Telefone" GROUP BY tipo;
```

---

## 🔍 QUERIES ÚTEIS

### **Buscar telefone principal de uma pessoa:**
```sql
SELECT * FROM "Telefone"
WHERE "pessoaId" = 123 AND principal = true;
```

### **Buscar todos telefones de uma pessoa:**
```sql
SELECT * FROM "Telefone"
WHERE "pessoaId" = 123
ORDER BY principal DESC, id;
```

### **Atualizar telefone principal:**
```sql
-- Remove principal de todos
UPDATE "Telefone" SET principal = false WHERE "pessoaId" = 123;
-- Define novo principal
UPDATE "Telefone" SET principal = true WHERE id = 456;
```

### **Adicionar novo telefone:**
```sql
INSERT INTO "Telefone" ("pessoaId", ddd, numero, tipo, principal)
VALUES (123, '45', '999998888', 'CELULAR', true);
```

---

## 🎨 INTEGRAÇÃO COM BACKEND/FRONTEND

### **Backend - TypeScript:**

```typescript
import { prisma } from './prisma';

// Buscar pessoa com telefones
const pessoa = await prisma.pessoa.findUnique({
  where: { id: 123 },
  include: {
    telefones: {
      where: { ativo: true },
      orderBy: [
        { principal: 'desc' },
        { id: 'asc' }
      ]
    }
  }
});

// Buscar apenas telefone principal
const telefonePrincipal = await prisma.telefone.findFirst({
  where: {
    pessoaId: 123,
    principal: true,
    ativo: true
  }
});

// Adicionar novo telefone
await prisma.telefone.create({
  data: {
    pessoaId: 123,
    ddd: '45',
    numero: '999998888',
    tipo: 'CELULAR',
    principal: false
  }
});

// Atualizar telefone principal
await prisma.$transaction([
  // Remove principal de todos
  prisma.telefone.updateMany({
    where: { pessoaId: 123 },
    data: { principal: false }
  }),
  // Define novo principal
  prisma.telefone.update({
    where: { id: 456 },
    data: { principal: true }
  })
]);
```

### **Frontend - React:**

```tsx
// Componente de lista de telefones
function TelefonesList({ pessoaId }: { pessoaId: number }) {
  const { data: telefones } = useQuery({
    queryKey: ['telefones', pessoaId],
    queryFn: () => api.get(`/pessoas/${pessoaId}/telefones`)
  });

  return (
    <div>
      {telefones?.map(tel => (
        <div key={tel.id}>
          <span>{tel.tipo}: </span>
          {tel.ddd && `(${tel.ddd}) `}
          {tel.numero}
          {tel.ramal && ` ramal ${tel.ramal}`}
          {tel.principal && <Badge>Principal</Badge>}
        </div>
      ))}
    </div>
  );
}
```

---

## ⚙️ ENDPOINTS REST SUGERIDOS

### **GET /api/comum/pessoas/:id/telefones**
- Retorna todos telefones de uma pessoa
- Query params: `?tipo=CELULAR&principal=true`

### **POST /api/comum/pessoas/:id/telefones**
- Adiciona novo telefone
- Body: `{ ddd, numero, ramal?, tipo, principal? }`

### **PUT /api/comum/telefones/:id**
- Atualiza telefone existente
- Body: `{ ddd?, numero?, ramal?, tipo?, principal? }`

### **DELETE /api/comum/telefones/:id**
- Remove telefone (soft delete: `ativo = false`)

### **PATCH /api/comum/telefones/:id/principal**
- Define telefone como principal
- Remove principal dos outros da mesma pessoa

---

## 📝 VANTAGENS DA NOVA ABORDAGEM

1. ✅ **Múltiplos telefones por pessoa** (não mais limitado a 1)
2. ✅ **Tipo identificado** (Celular, Residencial, Comercial)
3. ✅ **Telefone principal marcado** (fácil de buscar)
4. ✅ **Ramal preservado** (quando existe)
5. ✅ **Histórico mantido** (não perde dados ao atualizar)
6. ✅ **Soft delete** (campo `ativo`)
7. ✅ **Relacionamento forte** (CASCADE on delete)
8. ✅ **Índices otimizados** (busca rápida)

---

## 🔄 COMPATIBILIDADE COM CAMPO ANTIGO

O campo `Pessoa.telefone` foi mantido como **DEPRECATED** para:
- Não quebrar código existente
- Permitir migração gradual
- Servir como fallback temporário

**Plano futuro:**
1. Migrar todo código para usar `Pessoa.telefones[]`
2. Remover dependências do campo `telefone`
3. (Opcional) Remover campo em migration futura

---

## ✅ STATUS

- [x] Schema Prisma criado
- [x] ENUM TipoTelefone criado
- [x] Migration aplicada
- [x] Prisma Client gerado
- [x] Script SQL de migração criado
- [ ] Executar script SQL (próximo passo)
- [ ] Validar dados migrados
- [ ] Criar endpoints REST
- [ ] Atualizar frontend

---

**Criado por:** Claude Code
**Data:** 2025-01-12
**Migration:** `20251112233059_adicionar_tabela_telefone`
**Status:** ✅ Pronto para executar migração SQL
