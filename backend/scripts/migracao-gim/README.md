# 🚀 Migração GIM → SIGMA - Scripts de Migração

## ⏳ STATUS: MIGRAÇÃO EM ANDAMENTO

**Data:** 2025-01-10 a 2025-01-13
**Registros migrados:** 39.016 (sem contar endereços)
**Status:** Falta migrar ~8.588 endereços

---

## 📁 Estrutura de Arquivos

### **Scripts de Migração (EXECUTADOS):**

1. **`01-migrar-pessoas.sql`** - Migração de pessoas e propriedades
2. **`10-migrar-programas.sql`** - Migração de 62 programas do GIM
3. **`11-migrar-regras-programas.sql`** - Criação de ~120 RegrasNegocio
4. **`12-migrar-telefones.sql`** - Migração de ~2.500 telefones (tabela separada)
5. **`08-migrar-telefones-e-subsidios-SIMPLES.sql`** - Migração de 33.016 subsídios
6. **`13-corrigir-mapeamento-subsidios.sql`** - Correção de mapeamento de programas
7. **`14-diagnostico-subsidios-pendentes.sql`** - Diagnóstico final (validação)
8. **`99-validacao-completa.sql`** - Validação completa da migração

### **Scripts em Andamento:**

- **`15-migrar-enderecos.sql`** ⏳ - Migração de ~8.588 endereços (aguardando Bairro.csv)
- **`03-migrar-transferencias-propriedade.sql`** ⭐ **NOVO** - Migração de transferências de propriedade
- **`04-migrar-arrendamentos.sql`** ⭐ **NOVO** - Migração de arrendamentos

### **Scripts Opcionais (NÃO EXECUTADOS):**

- **`02-migrar-propriedades.sql`** - Já incluído no script 01
- **`09-migrar-ramos-atividade.sql`** - Migração opcional de 22 ramos do GIM
- **`popular-ramos-basicos.sql`** - Popular 9 ramos básicos (opcional)

### **Documentação:**

- **`RESUMO-CONTEXTO.md`** ⭐ - Resumo completo da migração, decisões técnicas, próximos passos
- **`README-TABELA-TELEFONE.md`** - Documentação da tabela Telefone
- **`README-RAMOS-ATIVIDADE.md`** - Documentação de Ramos de Atividade
- **`ANALISE-COMPLETA-ESTRUTURAS.md`** - Análise detalhada GIM vs SIGMA

---

## 🎯 Ordem de Execução (para referência)

Estes scripts **JÁ FORAM EXECUTADOS** na seguinte ordem:

```bash
# 1. Migrar dados básicos
psql -U postgres -d sigma -f 01-migrar-pessoas.sql

# 2. Migrar programas (IMPORTANTE: antes de subsídios!)
psql -U postgres -d sigma -f 10-migrar-programas.sql

# 3. Criar regras de negócio
psql -U postgres -d sigma -f 11-migrar-regras-programas.sql

# 4. Migrar telefones (nova abordagem - tabela separada)
psql -U postgres -d sigma -f 12-migrar-telefones.sql

# 5. Migrar subsídios
psql -U postgres -d sigma -f 08-migrar-telefones-e-subsidios-SIMPLES.sql

# 6. Corrigir mapeamento de programas
psql -U postgres -d sigma -f 13-corrigir-mapeamento-subsidios.sql

# 7. Validar migração
psql -U postgres -d sigma -f 14-diagnostico-subsidios-pendentes.sql
psql -U postgres -d sigma -f 99-validacao-completa.sql
```

---

## 📊 Resultado Final

### **Dados Migrados:**

| Tabela | Registros | Status |
|--------|-----------|--------|
| Pessoa | ~1.000 | ✅ 100% |
| Propriedade | ~800 | ✅ 100% |
| Endereco | ~900 | ✅ 100% |
| Programa | 62 | ✅ 100% |
| RegrasNegocio | ~120 | ✅ Criadas |
| Telefone | ~2.500 | ✅ 100% |
| SolicitacaoBeneficio | 33.016 | ✅ 100% |

**Total: 39.016 registros migrados com sucesso**

### **Distribuição de Subsídios:**

- 16.504 subsídios → Programas específicos
- 16.512 subsídios → Programa genérico "Migrado do GIM" (dados históricos legítimos)
- 4.000+ com valor zero → Dados originais do GIM

---

## 🔧 Decisões Técnicas Importantes

### **1. Telefones: Tabela Separada (1:N)**

**Decisão:** Criar tabela `Telefone` separada ao invés de campo único em `Pessoa`

**Motivo:**
- Permite múltiplos telefones por pessoa
- Mantém tipo (Celular/Residencial/Comercial)
- Marca telefone principal automaticamente
- Migration: `20251112233059_adicionar_tabela_telefone`

### **2. RegrasNegocio: JSONB Flexível**

**Decisão:** Manter RegrasNegocio com JSONB (não voltar para campos fixos do GIM)

**Motivo:**
- Flexibilidade para criar regras complexas
- Suporta múltiplos enquadramentos (PEQUENO/GRANDE)
- Facilita adaptação a mudanças na legislação
- ~120 regras criadas automaticamente a partir dos programas GIM

### **3. Subsídios no Programa Genérico: MANTIDOS**

**Decisão:** 16.512 subsídios permanecem no programa genérico

**Motivo:**
- São dados históricos legítimos do GIM
- Não tinham cod_programa no sistema antigo
- Identificados claramente como "Migrado do GIM"
- Não atrapalham operação (SOMENTE LEITURA)

---

## 🚀 Próximos Passos (Desenvolvimento)

### **Backend:**

1. Criar endpoints CRUD para `Telefone`
2. Atualizar endpoints de `Pessoa` para incluir telefones
3. Implementar cálculo de benefícios com `RegrasNegocio`
4. Criar endpoints para gerenciar `RegrasNegocio`

### **Frontend:**

1. Componente de gerenciamento de telefones
2. Atualizar formulário de Pessoa
3. Tela de configuração de RegrasNegocio
4. Filtros de programa por RamoAtividade (opcional)

---

## 📖 Documentação Completa

Para informações detalhadas sobre a migração, consulte:

- **[RESUMO-CONTEXTO.md](./RESUMO-CONTEXTO.md)** - Resumo completo, decisões, lições aprendidas
- **[README-TABELA-TELEFONE.md](./README-TABELA-TELEFONE.md)** - Documentação da tabela Telefone
- **[README-RAMOS-ATIVIDADE.md](./README-RAMOS-ATIVIDADE.md)** - Documentação de Ramos
- **[ANALISE-COMPLETA-ESTRUTURAS.md](./ANALISE-COMPLETA-ESTRUTURAS.md)** - Análise GIM vs SIGMA

---

## ✅ Validação

Para validar os dados migrados, execute:

```sql
-- Ver distribuição de subsídios
SELECT
    p.nome as programa,
    COUNT(sb.id) as qtd_beneficios,
    SUM(sb."valorCalculado") as valor_total
FROM "Programa" p
LEFT JOIN "SolicitacaoBeneficio" sb ON sb."programaId" = p.id
GROUP BY p.id, p.nome
ORDER BY COUNT(sb.id) DESC;

-- Ver telefones de uma pessoa
SELECT * FROM "Telefone" WHERE "pessoaId" = 1;

-- Ver programas sem regras de negócio
SELECT p.* FROM "Programa" p
LEFT JOIN "RegrasNegocio" r ON r."programaId" = p.id
WHERE r.id IS NULL;
```

---

**Última atualização:** 2025-01-17
**Status:** ⏳ MIGRAÇÃO EM ANDAMENTO - Pendente: transferências, arrendamentos e endereços

**Trabalho realizado em 2025-01-17:**
- ⭐ Script `03-migrar-transferencias-propriedade.sql` criado
  - Migra ~407 transferências de propriedade do GIM
  - Cruza dados de `movimentotransferencia.csv` com `movimentosituacao.csv`
  - Detecta situação da propriedade em cada transferência (PRÓPRIA, CONDOMÍNIO, USUFRUTO)

- ⭐ Script `04-migrar-arrendamentos.sql` criado
  - Migra arrendamentos históricos do GIM
  - Busca proprietário via tabela `areas_gim_completa`
  - Mapeia status (ativo, cancelado, vencido)
  - Converte áreas com vírgula para ponto decimal

**Trabalho realizado em 2025-01-13:**
- ✅ Limpeza de seeds obsoletos (removidos programasLegaisCompleto, produtoresAdicionais, condominosSeed)
- ✅ Script `15-migrar-enderecos.sql` criado
- ⏳ Aguardando Bairro.csv para completar migração de endereços

---

## 📚 Guia de Execução - Scripts Novos

### **Script 03: Transferências de Propriedade**

**Arquivos CSV necessários:**
- `C:/csvs/movimentotransferencia.csv` (407 registros)
- `C:/csvs/movimentosituacao.csv` (dados de situação)

**Passos:**
1. Criar tabelas staging
2. Carregar CSVs via `COPY`
3. Executar função de busca de situação
4. Migrar transferências
5. Validar com queries incluídas no script

**Resultado esperado:** ~407 transferências migradas

---

### **Script 04: Arrendamentos**

**Arquivos CSV necessários:**
- `C:/csvs/arrendamento.csv`

**Passos:**
1. Criar tabela staging
2. Carregar CSV via `COPY`
3. ⚠️ Corrigir separador decimal (vírgula → ponto) se necessário
4. Migrar arrendamentos
5. Validar com queries incluídas no script

**Resultado esperado:** Quantidade variável de arrendamentos históricos

---

## ⚠️ Observações Importantes

### Transferências:
- **Cruzamento de dados:** O script cruza transferências com movimentos de situação para detectar se a propriedade era PRÓPRIA, CONDOMÍNIO ou USUFRUTO no momento da transferência
- **IDs não encontrados:** Transferências que referenciam pessoas/propriedades não migradas serão ignoradas e registradas em `log_erros`

### Arrendamentos:
- **Vírgula decimal:** CSVs brasileiros usam vírgula. O script possui correção automática
- **codArea:** O arrendamento no GIM referencia `codArea`, que é traduzido para propriedade+proprietário via `areas_gim_completa`
