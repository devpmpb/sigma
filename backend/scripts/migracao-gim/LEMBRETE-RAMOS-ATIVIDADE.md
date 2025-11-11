# 🔖 LEMBRETE: Migração de Ramos de Atividade

## 📋 CONTEXTO RÁPIDO

Se você está vendo este arquivo, provavelmente precisa migrar dados relacionados a **Ramos de Atividade** do GIM para o SIGMA.

---

## 📁 ARQUIVOS NECESSÁRIOS

Envie estes arquivos CSV para o Claude:

1. **`ramoatividade.csv`** (~22 registros)
   - Lista de ramos de atividade (Bovinocultura, Suinocultura, Avicultura, etc.)

2. **`programaramoatividade.csv`** (~20 registros)
   - Relação de quais ramos podem acessar cada programa
   - Formato: `codPrograma;codRamoAtividade`

3. **`programadesconsiderarraomatividade.csv`** (~20 registros)
   - Lista de exclusões (ramos que NÃO podem acessar programas)
   - **NOTA:** Decidimos usar apenas lista de permissões, então esse arquivo pode ser ignorado

---

## 💬 PROMPT PARA O CLAUDE

Cole este texto:

```
Preciso migrar os Ramos de Atividade do GIM para o SIGMA.

Contexto:
- Já implementamos a estrutura com tabelas RamoAtividade e ProgramaRamoAtividade
- Decisão: usar apenas lista de PERMISSÕES (sem tabela de exclusões)
- Lógica: SE existe relação = pode solicitar, SE NÃO existe = não pode

Arquivos anexados:
- ramoatividade.csv (lista de ramos)
- programaramoatividade.csv (relações programa x ramo)

Por favor:
1. Analise os arquivos CSV
2. Crie script SQL para migrar os dados
3. Use o mesmo método COPY FROM que funcionou antes
4. Mapear codRamoAtividade do GIM → id do SIGMA
5. Mapear codPrograma do GIM → id do SIGMA (já temos staging_gim.map_programas?)

Localização dos CSVs:
- C:\Users\marce\OneDrive\Desktop\ramoatividade.csv
- C:\Users\marce\OneDrive\Desktop\programaramoatividade.csv
```

---

## ✅ CHECKLIST

Antes de migrar, verifique:

- [ ] Schema do Prisma tem `RamoAtividade` e `ProgramaRamoAtividade`?
- [ ] Migrations foram rodadas? (`npx prisma migrate dev`)
- [ ] Programas já foram migrados? (precisa de staging_gim.map_programas)
- [ ] Arquivos CSV estão acessíveis?

---

## 🗂️ ESTRUTURA ESPERADA

### **RamoAtividade:**
```prisma
model RamoAtividade {
  id          Int      @id @default(autoincrement())
  nome        String   @unique
  descricao   String?
  categoria   AtividadeProdutiva
  ativo       Boolean  @default(true)

  areasEfetivas AreaEfetiva[]
  programas     ProgramaRamoAtividade[]
}
```

### **ProgramaRamoAtividade:**
```prisma
model ProgramaRamoAtividade {
  programaId       Int
  programa         Programa @relation(...)
  ramoAtividadeId  Int
  ramoAtividade    RamoAtividade @relation(...)

  @@id([programaId, ramoAtividadeId])
}
```

---

**Criado em:** 2025-01-10
**Por:** Claude Code
