# 🚀 MIGRAÇÃO GIM → SIGMA - COMECE AQUI

## ✅ O QUE JÁ FOI FEITO HOJE

1. ✅ **Schema do SIGMA ajustado**
   - Campo `enquadramento` adicionado em `SolicitacaoBeneficio`
   - Migration aplicada com sucesso
   - Prisma Client gerado

2. ✅ **Scripts de migração criados**
   - `01-migrar-pessoas-postgresql.sql` ✅
   - `02-migrar-propriedades.sql` ✅
   - `03-migrar-arrendamentos.sql` ✅
   - `04-migrar-subsidios-TEMPLATE.sql` ⏳ (para completar amanhã)

3. ✅ **Documentação completa**
   - `README.md` - Instruções detalhadas
   - `CHECKLIST.md` - Checklist completo
   - `QUERIES-ANALISE-GIM.sql` - Queries para executar amanhã no GIM

---

## 📋 O QUE FAZER AMANHÃ (2025-01-07)

### **PASSO 1: No banco GIM (5-10 minutos)**

1. Abra o SQL Server Management Studio
2. Conecte ao banco **GIM**
3. Abra o arquivo `QUERIES-ANALISE-GIM.sql`
4. Execute TODAS as queries
5. Anote os resultados (principalmente Query #1 - valores de situação)

### **PASSO 2: Completar script de subsídios (15-20 minutos)**

1. Abra `04-migrar-subsidios-TEMPLATE.sql`
2. Procure por `⚠️` (são os pontos que precisam ser completados)
3. Complete a função `mapear_status_subsidio()` com os valores que anotou
4. Salve como `04-migrar-subsidios.sql`

### **PASSO 3: Me chamar de volta**

Me passe os valores de `situacao` que encontrou e eu te ajudo a finalizar!

---

## 📁 ESTRUTURA DOS ARQUIVOS

```
backend/scripts/migracao-gim/
│
├── 00-INICIO-AQUI.md                    ← VOCÊ ESTÁ AQUI
├── README.md                            ← Instruções completas
├── CHECKLIST.md                         ← Checklist de execução
├── QUERIES-ANALISE-GIM.sql              ← Execute AMANHÃ no GIM
│
├── 01-migrar-pessoas-postgresql.sql     ← Pronto ✅
├── 02-migrar-propriedades.sql           ← Pronto ✅
├── 03-migrar-arrendamentos.sql          ← Pronto ✅
└── 04-migrar-subsidios-TEMPLATE.sql     ← Completar amanhã ⏳
```

---

## 🎯 RESUMO DA MIGRAÇÃO

### O que será migrado:

1. **Pessoas** (Físicas + Jurídicas)
   - Identifica automaticamente produtores rurais
   - Migra telefones e emails

2. **Propriedades**
   - Converte múltiplos proprietários em condôminos
   - Primeiro proprietário vira dono principal

3. **Arrendamentos**
   - Mapeia status automaticamente
   - Vincula propriedades e arrendatários

4. **Subsídios → Solicitações de Benefício**
   - Preserva enquadramento (P/G)
   - Mapeia status do GIM para SIGMA

### Tempo estimado: **3-4 semanas** (Fast Track)

---

## 🔑 DECISÕES TOMADAS

| Questão | Decisão |
|---------|---------|
| Múltiplos proprietários | Primeiro vira dono principal, demais condôminos ✅ |
| Campo enquadramento | Adicionar em SolicitacaoBeneficio ✅ |
| Autorizações | Consolidar em subsídios finais ✅ |
| Telefones | Migrar apenas o primeiro ✅ |
| Status/Situações | Mapear amanhã após ver valores ⏳ |

---

## 🚨 IMPORTANTE

### Antes de executar a migração:

1. ✅ **Backup do SIGMA** - sempre!
2. ✅ **Testar em ambiente de DEV primeiro**
3. ✅ **Validar totais** após cada script
4. ✅ **Documentar problemas** encontrados

### Durante a migração:

- Os scripts criam schema `staging_gim` para dados temporários
- Tabelas `map_*` mapeiam IDs do GIM → SIGMA
- Tabela `log_erros` registra TODOS os erros
- Scripts são **idempotentes** (pode executar múltiplas vezes)

---

## 📞 PRÓXIMOS PASSOS

### Amanhã:
1. Execute `QUERIES-ANALISE-GIM.sql` no banco GIM
2. Complete `04-migrar-subsidios-TEMPLATE.sql`
3. Me avise quando estiver pronto

### Depois (quando for executar):
1. Leia `README.md` completamente
2. Siga `CHECKLIST.md` passo a passo
3. Valide cada etapa antes de prosseguir

---

## 💬 DÚVIDAS?

**Se algo der errado:**
1. Veja a tabela `staging_gim.log_erros`
2. Compare totais GIM vs SIGMA (queries no final de cada script)
3. Me chame com detalhes do erro

**Quer acelerar mais?**
- Podemos executar os scripts em paralelo (com cuidado!)
- Podemos fazer validação mais rápida (10% em vez de 20%)
- Posso criar scripts adicionais se precisar

---

## ✨ TUDO PRONTO!

Você tem agora:
- ✅ Schema do SIGMA atualizado
- ✅ 3 scripts de migração prontos para uso
- ✅ Documentação completa
- ✅ Checklist detalhado
- ⏳ 1 script para completar amanhã

**Bora migrar esses dados!** 💪

---

**Criado por:** Claude Code
**Data:** 2025-01-06
**Estratégia:** Fast Track (3-4 semanas)
**Status:** 80% completo - falta só o mapeamento de status do Subsidio
