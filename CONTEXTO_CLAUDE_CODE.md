# CONTEXTO DO PROJETO SIGMA - MVP

## 📋 VISÃO GERAL

**SIGMA** é um sistema de gestão de subsídios municipais para Pato Bragado/PR, substituindo o sistema legado GIM. O sistema gerencia solicitações de benefícios para produtores rurais, com regras complexas baseadas em leis municipais.

**Stack:** React 19 + TypeScript + TailwindCSS (frontend) | Node.js + Express + Prisma + PostgreSQL (backend)

**Pressão:** MVP precisa ser entregue urgentemente - prefeito cobrando.

---

## ✅ O QUE JÁ FOI IMPLEMENTADO

### 1. Estrutura Base
- CadastroBase e FormBase para CRUD genérico
- Sistema de autenticação com perfis (ADMIN, OBRAS, AGRICULTURA)
- Cadastros: Pessoas, Programas, Regras de Negócio, Propriedades, Arrendamentos
- Cálculo de Área Efetiva (própria + arrendada recebida - arrendada cedida)

### 2. Tela de Solicitação de Benefícios (FOCO DO MVP)
**Arquivo:** `frontend/src/pages/movimentos/comum/solicitacoesBeneficio/SolicitacaoBeneficioForm.tsx`

**Funcionalidades implementadas:**
- ✅ Seleção de Programa e Pessoa (AsyncSearchSelect)
- ✅ Cálculo automático de benefício baseado em regras
- ✅ Enquadramento automático PEQUENO/GRANDE por área efetiva
- ✅ Campo de Quantidade Solicitada (toneladas, cargas, doses, etc)
- ✅ Campo de Quantidade de Animais (para programas de sêmen/ultrassom)
- ✅ SaldoCard mostrando saldo disponível do produtor
- ✅ Validação de saldo antes de salvar (backend bloqueia se exceder)
- ✅ Exibição de erros do backend na tela
- ✅ Histórico de status da solicitação

### 3. Sistema de Saldo de Benefícios
**Arquivos:**
- `backend/src/services/saldoBeneficioService.ts`
- `backend/src/controllers/comum/saldoController.ts`
- `frontend/src/services/comum/saldoService.ts`
- `frontend/src/components/comum/SaldoCard.tsx`

**Funcionalidades:**
- ✅ Cálculo de saldo por período (ANUAL, BIENAL, TRIENAL)
- ✅ Usa ano civil (01/jan - 31/dez) ao invés de data do primeiro pedido
- ✅ Seleção correta de regra baseada em área (PEQUENO vs GRANDE)
- ✅ Verificação de disponibilidade antes de criar solicitação
- ✅ Exibição do saldo restante e valor máximo

### 4. Sistema de Cálculo de Benefícios
**Arquivo:** `backend/src/services/calculoBeneficioService.ts`

**Tipos de regra suportados:**
- ✅ `area_efetiva` / `area_propriedade` - Baseado em área (calcário, esterco, adubo)
- ✅ `tipo_equipamento` - Equipamentos (ordenhadeira, resfriador)
- ✅ `inseminacao` / `semen_*` / `valor_fixo` - Valor fixo por unidade
- ✅ `semen_sexado` - Enquadra por quantidade de vacas (até 25, 26-49, 50+)
- ✅ `semen_suino` - Por quantidade de matrizes
- ✅ `ultrassom` - Exames por animal

### 5. Programas Cadastrados (11 ativos)
Via seed em `backend/prisma/seeds/programasAtuais.ts`:
1. Adubação Orgânica Líquida (Esterco)
2. Adubo Orgânico Sólido (Pró-Orgânico)
3. Correção de Solos (Calcário) - PRÓSOLOS
4. Cobertura do Solo - Aveia, Nabo, Braquiária
5. Inseminação Artificial - Bovinos Leite
6. Ultrassom Bovinos Leite
7. Sêmen Sexado Bovinos Leite
8. Sêmen Bovino de Corte
9. Melhoria Genética Suínos

---

## 🔧 BUGS CORRIGIDOS RECENTEMENTE

1. **SaldoCard mostrando regra errada** - Corrigido `encontrarRegraAplicavel()` para buscar regra correta por área
2. **Cálculo aplicando percentual duas vezes** - Removido bloco duplicado
3. **Validação bloqueando após aprovação** - Mudado para só bloquear `pendente` e `em_analise`
4. **Erros do backend não aparecendo** - FormBase agora trata `erro` e `detalhes` além de `message`
5. **Interface sem campo quantidadeAnimais** - Adicionado na interface `ResultadoCalculo`

---

## ✅ FEATURES CONCLUÍDAS

### Feature 1: Validação Anti-Burla de Limites ✅
Implementado em `backend/src/services/saldoBeneficioService.ts`:
- Solicitações `pendente` e `em_analise` agora contam no saldo
- Backend bloqueia criação se quantidade + já solicitado > limite
- Frontend mostra aviso quando vai exceder

### Feature 2: Múltiplas Modalidades de Benefício ✅
Implementado campo `modalidade` na solicitação:
- `APLICACAO_SUBSIDIADA` - Município fornece + aplica
- `RETIRADA_SEMEN` - Produtor capacitado retira
- `REEMBOLSO` - Produtor compra e pede reembolso

Frontend mostra seletor apenas quando programa tem múltiplas modalidades.

---

## ⏳ FEATURES PENDENTES (próximos passos)

### Feature 3: PWA Dashboard Executivo (com Offline)

**Contexto:** Dashboard para prefeito/secretário visualizar dados de benefícios concedidos, com suporte offline completo desde o início.

**Arquitetura PWA Única:**
O SIGMA terá uma única PWA que atende múltiplos perfis:
1. **Prefeito/Secretário** - Visualização de dashboard e relatórios
2. **Produtores** (futuro) - Envio de solicitações de benefício offline
3. **Operadores de Máquinas** (futuro) - Lançamento de hora-máquina offline

**Implementação:**

1. **Infraestrutura PWA:**
```
frontend/
├── public/
│   ├── manifest.json           # Configuração do PWA
│   ├── icons/                  # Ícones 192x192 e 512x512
│   └── sw.js                   # Service Worker
├── src/
│   ├── pwa/
│   │   ├── serviceWorker.ts    # Registro e gerenciamento do SW
│   │   ├── offlineStorage.ts   # IndexedDB para cache local
│   │   └── syncManager.ts      # Sincronização quando online
│   └── pages/
│       └── dashboard/
│           └── DashboardExecutivo.tsx
```

2. **Service Worker (Cache Strategy):**
- **Cache First** para assets estáticos (JS, CSS, imagens)
- **Network First** para API calls (com fallback para cache)
- **Background Sync** para operações offline (futuro)

3. **IndexedDB (Armazenamento Offline):**
```typescript
interface OfflineDB {
  // Cache de dados para visualização
  dashboardData: {
    timestamp: Date;
    estatisticas: EstatisticasGerais;
    porPrograma: EstatisticaPrograma[];
    porPeriodo: EstatisticaPeriodo[];
  };

  // Fila de operações pendentes (futuro)
  pendingOperations: {
    id: string;
    type: 'solicitacao' | 'hora_maquina';
    data: any;
    createdAt: Date;
  }[];
}
```

4. **Dashboard Executivo (Fase 1):**
```typescript
// Páginas a criar
pages/dashboard/DashboardExecutivo.tsx   // Cards e gráficos
pages/dashboard/RelatorioProdutores.tsx  // Lista de beneficiados
pages/dashboard/RelatorioPrograma.tsx    // Detalhes por programa

// Endpoints necessários (backend)
GET /api/dashboard/estatisticas-gerais
GET /api/dashboard/por-programa
GET /api/dashboard/por-periodo
GET /api/dashboard/top-produtores
```

5. **Gráficos (usando recharts):**
- PieChart: Distribuição por programa
- BarChart: Investimento mensal
- LineChart: Evolução temporal
- Cards: Total investido, produtores atendidos, média/produtor

**Fases de Implementação:**
- **Fase 1 (Atual):** Dashboard visualização + Infraestrutura PWA/offline
- **Fase 2 (Futuro):** Solicitação de benefício offline (produtor)
- **Fase 3 (Futuro):** Lançamento hora-máquina offline (operador)

---

### Feature 4: Distribuição Proporcional entre Arrendatários ✅

**Status:** IMPLEMENTADA

**Funcionalidade:** Quando um arrendatário solicita benefício, o limite é proporcional à área que arrenda da propriedade.

**Exemplo:**
- Propriedade de 100 alqueires
- Arrendatário A arrenda 60 alqueires (60%)
- Limite do programa: 10 toneladas
- Arrendatário A pode pedir: até 6 toneladas (60% de 10)

**Implementação:**

1. **Backend:**
   - `saldoBeneficioService.ts`: Funções `calcularLimiteProporcional()` e `calcularSaldoComProporcao()`
   - `saldoController.ts`: Endpoints `/proporcional` e `/limite-proporcional`
   - `saldoRoutes.ts`: Rotas registradas

2. **Frontend:**
   - `saldoService.ts`: Métodos `getSaldoProporcional()` e `getLimiteProporcional()`
   - `SaldoCard.tsx`: Exibe badge "Proporcional", mostra limite original vs proporcional, detalhes expandíveis dos arrendamentos

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO SUGERIDA

1. **Feature 3 (PWA Dashboard)** - Concluída
2. **Feature 4 (Proporcional)** - Concluída
3. **Cadastrar restante dos programas** - Enviar PDFs das leis para cadastrar
4. **Importar dados das planilhas da Claudete** - Programas não cadastrados no GIM, dados de 2024

---

## 📁 ARQUIVOS PRINCIPAIS

### Backend
```
backend/
├── src/
│   ├── controllers/
│   │   └── comum/
│   │       ├── solicitacaoBeneficioController.ts  # CRUD + createComCalculo
│   │       └── saldoController.ts                  # Consulta saldo
│   ├── services/
│   │   ├── calculoBeneficioService.ts             # Lógica de cálculo
│   │   └── saldoBeneficioService.ts               # Lógica de saldo
│   └── routes/
│       └── comum/
│           ├── solicitacaoBeneficioRoutes.ts
│           └── saldoRoutes.ts
├── prisma/
│   ├── schema.prisma
│   └── seeds/
│       └── programasAtuais.ts                      # 11 programas com regras
```

### Frontend
```
frontend/src/
├── components/
│   ├── cadastro/
│   │   ├── CadastroBase.tsx                       # Base para listagens
│   │   └── FormBase.tsx                           # Base para formulários
│   └── comum/
│       ├── SaldoCard.tsx                          # Card de saldo
│       └── FormField.tsx
├── pages/
│   └── movimentos/
│       └── comum/
│           └── solicitacoesBeneficio/
│               ├── SolicitacaoBeneficioForm.tsx   # FORMULÁRIO PRINCIPAL
│               └── SolicitacoesBeneficio.tsx      # Listagem
├── services/
│   └── comum/
│       ├── solicitacaoBeneficioService.ts
│       ├── saldoService.ts
│       └── programaService.ts
```

---

## 🗄️ MODELO DE DADOS RELEVANTE

```prisma
model SolicitacaoBeneficio {
  id                   Int       
  pessoaId             Int
  programaId           Int
  datasolicitacao      DateTime
  status               String    // pendente, em_analise, aprovada, rejeitada, paga, cancelada
  observacoes          String?
  regraAplicadaId      Int?
  valorCalculado       Float?
  quantidadeSolicitada Float?
  enquadramento        String?   // PEQUENO, GRANDE, etc
}

model Programa {
  id                  Int
  nome                String
  periodicidade       Periodicidade  // ANUAL, BIENAL, TRIENAL
  unidadeLimite       String?        // toneladas, cargas, doses, kg, etc
  limiteMaximoFamilia Float?
  regras              RegrasNegocio[]
}

model RegrasNegocio {
  id              Int
  programaId      Int
  tipoRegra       String   // area_efetiva, semen_sexado, ultrassom, etc
  parametro       Json     // { area_minima, area_maxima, enquadramento, etc }
  valorBeneficio  Float    // R$ por unidade
  limiteBeneficio Json     // { quantidade_maxima, periodicidade_meses, etc }
}

model AreaEfetiva {
  id                    Int
  pessoaId              Int
  anoReferencia         Int
  areaPropria           Float
  areaArrendadaRecebida Float
  areaArrendadaCedida   Float
  areaEfetiva           Float  // calculado
}
```

---

## 🎯 REGRAS DE NEGÓCIO IMPORTANTES

1. **Período por Ano Civil**: Sempre 01/jan a 31/dez, não pela data do primeiro pedido
2. **Enquadramento por Área**:
   - PEQUENO: ≤ 14.52 alqueires (ou conforme regra)
   - GRANDE: > 14.52 alqueires
3. **Enquadramento por Animais** (sêmen sexado):
   - PEQUENO: até 25 vacas → R$ 100/dose
   - MEDIO: 26-49 vacas → R$ 75/dose
   - GRANDE: 50+ vacas → R$ 50/dose
4. **Status que contam no saldo**: `aprovada` e `paga`
5. **Status que bloqueiam nova solicitação**: `pendente` e `em_analise`

---

## 🔑 COMANDOS ÚTEIS

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev

# Prisma
npx prisma studio          # Interface visual do banco
npx prisma migrate dev     # Rodar migrations
npx prisma db push         # Push sem migration
npx prisma generate        # Regenerar client

# Seed dos programas
npx ts-node prisma/seeds/programasAtuais.ts
```

---

## 📝 PADRÕES DO PROJETO

1. **Sempre verificar código existente** antes de criar algo novo
2. **Reutilizar CadastroBase e FormBase** para CRUD
3. **Lógica de negócio no backend** (services), não no frontend
4. **Preparação de dados em services**, não em componentes de form
5. **Nomes em português** para campos do banco (exceto timestamps)
6. **Console.log com emojis** para debug (🔍, ✅, ❌, 📦, etc)

---

## 🐛 COMO DEBUGAR

1. **Frontend**: F12 → Console (logs com emojis)
2. **Backend**: Terminal do servidor (logs com emojis)
3. **Banco**: Prisma Studio ou pgAdmin
4. **API**: Network tab no F12

---

## 🧪 TESTES PENDENTES

### Telas que Precisam de Testes Completos

1. **Transferência de Propriedades**
   - Testar transferência total de propriedade
   - Testar transferência parcial (desmembramento)
   - Verificar se atualiza AreaEfetiva do cedente e do receptor
   - Testar validações (área disponível, propriedade existe, etc)
   - Verificar histórico de transferências

2. **Arrendamentos**
   - Testar criação de novo arrendamento
   - Testar renovação de arrendamento
   - Testar encerramento antecipado
   - Verificar cálculo de área efetiva (arrendada recebida vs cedida)
   - Testar validação de sobreposição de datas
   - Verificar se arrendatário aparece corretamente nas buscas de produtor

### Cronograma de Testes (após features prontas)

| Fase | Escopo | Prioridade |
|------|--------|------------|
| **Fase 1** | Fluxo básico de solicitação de benefício (criar, aprovar, pagar) | CRÍTICA |
| **Fase 2** | Cálculos por área (calcário, esterco, adubo) com produtores reais | CRÍTICA |
| **Fase 3** | Cálculos por animais (sêmen sexado, suínos, ultrassom) | ALTA |
| **Fase 4** | Validações de saldo e limites (tentar exceder, múltiplas solicitações) | ALTA |
| **Fase 5** | Transferência de propriedades e impacto na área efetiva | MÉDIA |
| **Fase 6** | Arrendamentos e impacto na área efetiva | MÉDIA |
| **Fase 7** | Relatórios e dashboard do prefeito | MÉDIA |
| **Fase 8** | Casos edge (produtor sem área, programa inativo, etc) | BAIXA |

### Dados de Teste Recomendados

- **Produtor PEQUENO**: < 14.52 alqueires (ex: CPF 111.111.111-11, 3 alq)
- **Produtor GRANDE**: > 14.52 alqueires (ex: CPF 222.222.222-22, 12 alq)
- **Produtor com arrendamento**: Área própria + arrendada
- **Produtor que já recebeu benefício**: Para testar saldo e períodos

---

## 📌 OBSERVAÇÕES FINAIS

- A usuária principal (Claudete) prefere ano civil para períodos
- Prefeito quer dashboard de acompanhamento
- Sistema antigo (GIM) tinha dados desorganizados - migração parcial feita
- Produtores identificados passaram de 369 para 1.000+ após correções
