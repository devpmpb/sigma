# 📋 TODO - Sistema SIGMA

**Última atualização:** 2025-01-17

Este arquivo contém tarefas organizadas por prioridade para o desenvolvimento contínuo do sistema SIGMA.

---

## 🔴 **PRIORIDADE 1 - CRÍTICO** (Fazer AGORA)

### Backend
- [ ] Nenhuma tarefa crítica no momento

### Frontend
- [ ] Nenhuma tarefa crítica no momento

### Infraestrutura
- [ ] Nenhuma tarefa crítica no momento

---

## 🟠 **PRIORIDADE 2 - IMPORTANTE** (Próximas Sprints)

### Backend

#### Sincronização de AreaEfetiva
- [ ] **Implementar Prisma Middleware para recalcular AreaEfetiva automaticamente**
  - Arquivo: `backend/src/prisma/middleware/areaEfetivaSync.ts`
  - Recalcular quando:
    - Propriedade é criada/atualizada/deletada
    - Arrendamento é criado/atualizado/deletada
    - PropriedadeCondomino é criado/deletado
    - TransferenciaPropriedade é criada
  - Documentação: [ANALISE-AREA-EFETIVA.md](backend/scripts/migracao-gim/ANALISE-AREA-EFETIVA.md#-mantendo-areaefetiva-sincronizado-soluções-automáticas)

- [ ] **Criar testes automatizados para validar sincronização de AreaEfetiva**
  - Arquivo: `backend/tests/areaEfetiva.test.ts`
  - Testes:
    - AreaEfetiva.areaPropria = soma de Propriedades
    - AreaEfetiva.areaArrendadaRecebida = soma de Arrendamentos recebidos
    - AreaEfetiva.areaArrendadaCedida = soma de Arrendamentos cedidos
    - AreaEfetiva.areaEfetiva = areaPropria + areaArrendadaRecebida - areaArrendadaCedida

- [ ] **Criar endpoint admin para recalcular AreaEfetiva manualmente**
  - Rota: `POST /api/admin/recalcular-area-efetiva`
  - Parâmetros opcionais: `pessoaId` (recalcular pessoa específica ou todas)
  - Permissão: apenas ADMIN

### Frontend

#### Migração de Dropdowns para Select (FormBase)
- [ ] **Migrar todos os dropdowns para o componente Select do FormBase**
  - Componentes a migrar:
    - [ ] Formulário de Pessoa (tipo pessoa, tipo telefone)
    - [ ] Formulário de Propriedade (tipo propriedade, situação)
    - [ ] Formulário de Endereço (tipo endereço, tipo logradouro)
    - [ ] Formulário de Veículo (tipo veículo)
    - [ ] Formulário de Programa (tipo programa, secretaria)
    - [ ] Formulário de Ordem de Serviço (tipo serviço, status)
    - [ ] Formulário de Arrendamento (status, atividade produtiva)
  - Benefícios:
    - ✅ Consistência visual
    - ✅ Validação integrada
    - ✅ Melhor UX (busca, navegação por teclado)
    - ✅ Menos código duplicado

---

## 🟡 **PRIORIDADE 3 - DESEJÁVEL** (Backlog)

### Backend
- [ ] Implementar query de auditoria semanal para AreaEfetiva
  - Criar script SQL de auditoria
  - Agendar via cron job ou GitHub Actions
  - Enviar email/notificação se houver divergências

- [ ] Criar endpoints CRUD para modelo `Telefone`
  - GET /api/comum/telefones
  - POST /api/comum/telefones
  - PATCH /api/comum/telefones/:id
  - DELETE /api/comum/telefones/:id

- [ ] Implementar cálculo automático de benefícios com `RegrasNegocio`
  - Criar serviço de cálculo
  - Integrar com criação de SolicitacaoBeneficio
  - Validar regras de enquadramento (Pequeno/Grande produtor)

### Frontend
- [ ] Criar componente de gerenciamento de telefones (múltiplos por pessoa)
  - Lista de telefones com tipo e principal
  - Adicionar/Remover telefones inline
  - Marcar telefone principal

- [ ] Atualizar formulário de Pessoa para incluir telefones
  - Integrar componente de telefones
  - Validação: pelo menos 1 telefone obrigatório
  - Marcar primeiro telefone como principal automaticamente

- [ ] Criar tela de configuração de RegrasNegocio (Admin)
  - CRUD de regras por programa
  - Editor JSON para parâmetros e limites
  - Preview de cálculo de benefício

- [ ] Implementar filtros de programa por RamoAtividade
  - Filtrar programas disponíveis baseado na atividade da pessoa
  - Mostrar apenas programas elegíveis

---

## 🟢 **PRIORIDADE 4 - MELHORIAS** (Pode Esperar)

### Backend
- [ ] Implementar cache para queries frequentes
  - Cache de AreaEfetiva (Redis ou memória)
  - Cache de Programas ativos
  - Cache de Permissões por usuário

- [ ] Adicionar logs estruturados (Winston ou Pino)
  - Log de recálculos de AreaEfetiva
  - Log de criação de benefícios
  - Log de mudanças em propriedades

- [ ] Implementar rate limiting em rotas públicas
  - Limitar tentativas de login
  - Limitar consultas sem autenticação

### Frontend
- [ ] Melhorar feedback visual em operações assíncronas
  - Loading states mais claros
  - Mensagens de sucesso/erro padronizadas
  - Progress bars para uploads

- [ ] Implementar paginação server-side em todas as listas
  - Usar TanStack Table com server-side pagination
  - Filtros persistentes na URL
  - Export para CSV/Excel

- [ ] Adicionar gráficos e dashboards
  - Dashboard de benefícios por programa
  - Gráfico de área efetiva por ano
  - Mapa de propriedades (se houver coordenadas)

---

## ⚪ **PRIORIDADE 5 - FUTURO** (Ideias/Pesquisa)

### Backend
- [ ] Implementar versionamento de API
  - Rotas /api/v1, /api/v2
  - Deprecation warnings
  - Migração gradual

- [ ] Adicionar suporte a múltiplos anos em AreaEfetiva
  - Histórico de área efetiva por ano
  - Comparação ano a ano
  - Projeções futuras

- [ ] Implementar auditoria completa (audit log)
  - Rastrear todas as mudanças em dados sensíveis
  - Quem mudou, quando, o quê
  - Rollback de mudanças se necessário

### Frontend
- [ ] Implementar modo offline (PWA)
  - Service workers
  - Sync quando voltar online
  - Cache de dados críticos

- [ ] Adicionar tema escuro
  - Toggle de tema
  - Persistir preferência do usuário
  - Adaptar todos os componentes

- [ ] Implementar tour guiado para novos usuários
  - Onboarding interativo
  - Tooltips contextuais
  - Vídeos tutoriais

### Infraestrutura
- [ ] Configurar CI/CD completo
  - Testes automatizados no GitHub Actions
  - Deploy automático para staging
  - Deploy manual para produção

- [ ] Implementar monitoramento e alertas
  - Sentry para erros
  - Grafana para métricas
  - Alertas via Slack/Email

- [ ] Adicionar backup automatizado do banco
  - Backup diário
  - Retenção de 30 dias
  - Testes de restore mensais

---

## 📝 Notas

### Legenda de Status
- [ ] - Não iniciado
- [🚧] - Em andamento
- [✅] - Concluído
- [❌] - Cancelado
- [⏸️] - Pausado

### Como Usar Este Arquivo
1. **Adicionar tarefa:** Escolha a prioridade correta e adicione no formato markdown
2. **Atualizar status:** Marque com ✅ quando concluído ou 🚧 se em andamento
3. **Revisar prioridades:** Semanalmente, revise e ajuste prioridades conforme necessário
4. **Mover tarefas:** Tarefas concluídas podem ser movidas para um arquivo CHANGELOG.md

### Critérios de Priorização
- **P1 (Crítico):** Bloqueia uso do sistema, segurança, bugs graves
- **P2 (Importante):** Funcionalidades essenciais, qualidade de código, prevenção de problemas
- **P3 (Desejável):** Melhorias de UX, features novas não críticas
- **P4 (Melhorias):** Otimizações, refatorações, nice-to-have
- **P5 (Futuro):** Ideias, pesquisa, experimental

---

**Última revisão:** 2025-01-17
**Próxima revisão:** 2025-01-24
