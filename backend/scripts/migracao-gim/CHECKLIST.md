# ✅ Checklist de Migração GIM → SIGMA

## 📅 HOJE (2025-01-06) - Concluído ✅

- [x] Ajustar schema Prisma (campo `enquadramento` em SolicitacaoBeneficio)
- [x] Script 01: Migração de Pessoas (PF + PJ)
- [x] Script 02: Migração de Propriedades + Condôminos
- [x] Script 03: Migração de Arrendamentos
- [x] README com instruções completas
- [x] Template do Script 04 (Subsídios) - a completar
- [x] Queries de análise para executar no GIM

---

## 📅 AMANHÃ (2025-01-07) - Pendente ⏳

### 1. No Banco GIM (SQL Server)

- [ ] Conectar ao banco GIM no trabalho
- [ ] Executar arquivo `QUERIES-ANALISE-GIM.sql`
- [ ] Anotar valores de `situacao` da tabela Subsidio
- [ ] Verificar se existe tabela Programa
- [ ] Anotar totais para validação posterior

### 2. Completar Script de Subsídios

- [ ] Abrir `04-migrar-subsidios-TEMPLATE.sql`
- [ ] Preencher função `mapear_status_subsidio()` com valores reais
- [ ] Ajustar lógica de mapeamento de programas
- [ ] Salvar como `04-migrar-subsidios.sql`

### 3. Aplicar Migration do Prisma

- [ ] Executar: `cd backend`
- [ ] Executar: `npm run generate` (gera Prisma Client)
- [ ] Executar: `npx prisma migrate dev --name add-enquadramento` (cria migration)
- [ ] Verificar que campo `enquadramento` foi adicionado

---

## 📅 EXECUÇÃO DA MIGRAÇÃO - A definir

### Fase 1: Preparação (1 dia)

- [ ] Fazer backup completo do banco SIGMA
- [ ] Verificar espaço em disco
- [ ] Testar conexões com GIM e SIGMA

### Fase 2: Exportação do GIM (1 dia)

- [ ] Exportar pessoas para CSV
- [ ] Exportar telefones para CSV
- [ ] Exportar blocos para CSV
- [ ] Exportar áreas para CSV
- [ ] Exportar propriedades para CSV
- [ ] Exportar arrendamentos para CSV
- [ ] Exportar subsídios para CSV
- [ ] Verificar integridade dos CSVs

### Fase 3: Importação Staging (meio dia)

- [ ] Importar todos os CSVs para schema `staging_gim`
- [ ] Validar contagem de registros
- [ ] Verificar encoding (UTF-8)

### Fase 4: Migração de Dados (1-2 dias)

- [ ] Executar Script 01 - Pessoas
  - [ ] Verificar totais
  - [ ] Conferir produtores identificados
  - [ ] Ver log de erros
- [ ] Executar Script 02 - Propriedades
  - [ ] Verificar propriedades com múltiplos donos
  - [ ] Conferir condôminos criados
  - [ ] Ver log de erros
- [ ] Executar Script 03 - Arrendamentos
  - [ ] Verificar arrendamentos ativos
  - [ ] Conferir totais
  - [ ] Ver log de erros
- [ ] Executar Script 04 - Subsídios
  - [ ] Verificar status mapeados
  - [ ] Conferir enquadramentos (P/G)
  - [ ] Ver log de erros

### Fase 5: Validação (2-3 dias)

- [ ] Comparar totais GIM vs SIGMA
- [ ] Validar amostragem de dados (10-20%)
  - [ ] 20 pessoas aleatórias
  - [ ] 10 propriedades aleatórias
  - [ ] 10 arrendamentos aleatórios
  - [ ] 15 subsídios aleatórios
- [ ] Verificar integridade referencial
- [ ] Testar queries no SIGMA
- [ ] Documentar discrepâncias encontradas

### Fase 6: Homologação (3-5 dias)

- [ ] Apresentar dados para usuários
- [ ] Corrigir problemas identificados
- [ ] Re-executar scripts se necessário
- [ ] Obter aprovação final

---

## 🚨 Problemas Comuns e Soluções

### Pessoas

| Problema | Solução |
|----------|---------|
| CPF/CNPJ duplicado | Ver query de duplicatas, decidir qual manter |
| Pessoa sem documento | Ignorar ou adicionar documento manualmente |
| Telefones vazios | Normal, campo é opcional |

### Propriedades

| Problema | Solução |
|----------|---------|
| Propriedade sem dono | Ver tabela Area, adicionar proprietário |
| Múltiplos proprietários | Primeiro vira dono, demais condôminos |
| Área sem propriedade | Erro nos dados GIM, investigar |

### Arrendamentos

| Problema | Solução |
|----------|---------|
| Arrendamento sem propriedade | Ver tabela Area, verificar codArea |
| Arrendatário não encontrado | Pessoa não foi migrada, verificar |
| Data inicial NULL | Script usa '2000-01-01' como padrão |

### Subsídios

| Problema | Solução |
|----------|---------|
| Programa não encontrado | Criar programa no SIGMA antes |
| Status desconhecido | Adicionar no mapeamento |
| Valor NULL ou ZERO | Decisão de negócio, migrar ou ignorar |

---

## 📊 Métricas de Sucesso

### Critérios de Aceitação

- [ ] **95%+** das pessoas migradas com sucesso
- [ ] **100%** dos produtores rurais identificados
- [ ] **95%+** das propriedades migradas
- [ ] **90%+** dos arrendamentos ativos migrados
- [ ] **95%+** dos subsídios migrados
- [ ] **< 5%** de taxa de erro total
- [ ] Validação aprovada pelos usuários

### Totais Esperados (preencher depois)

| Entidade | GIM | SIGMA | Taxa |
|----------|-----|-------|------|
| Pessoas | ___ | ___ | ___% |
| Produtores | ___ | ___ | ___% |
| Propriedades | ___ | ___ | ___% |
| Arrendamentos | ___ | ___ | ___% |
| Subsídios | ___ | ___ | ___% |

---

## 🎯 Go-Live

### Pré-requisitos

- [ ] Todas as validações concluídas
- [ ] Usuários treinados no SIGMA
- [ ] Documentação atualizada
- [ ] Backup final do GIM

### Dia do Go-Live

- [ ] Congelar alterações no GIM
- [ ] Executar migração final
- [ ] Validação rápida (1-2h)
- [ ] Liberar acesso ao SIGMA
- [ ] Monitorar uso nas primeiras horas
- [ ] Suporte on-call disponível

---

## 📞 Contatos de Suporte

- **DBA**: _______________
- **Dev Backend**: _______________
- **Usuário-chave Agricultura**: _______________
- **Gestor do Projeto**: _______________

---

**Última atualização**: 2025-01-06
**Próxima ação**: Executar QUERIES-ANALISE-GIM.sql no banco GIM (amanhã)
