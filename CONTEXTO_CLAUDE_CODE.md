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

## ⏳ FEATURES PENDENTES (próximos passos)

### Feature 3: Múltiplas Modalidades de Benefício

**Contexto:** Alguns programas permitem escolher COMO receber o benefício.

**Programa para testar:** "Inseminação Artificial - Bovinos Leite" (Lei 1182/2011)

**Modalidades deste programa:**
1. `APLICACAO_SUBSIDIADA` - Município fornece sêmen + aplicação 70% subsidiada
2. `RETIRADA_SEMEN` - Produtor capacitado retira sêmen e aplica por conta
3. `REEMBOLSO` - Produtor compra e pede reembolso depois

**O que implementar:**

1. **Backend - Adicionar campo na tabela:**
```prisma
model SolicitacaoBeneficio {
  // ... campos existentes
  modalidade  String?  // REEMBOLSO, FORNECIMENTO, RETIRADA
}
```

2. **Backend - No calculoBeneficioService:**
- Verificar se o programa tem múltiplas modalidades (olhar `parametro.modalidade` nas regras)
- Filtrar regras pela modalidade selecionada

3. **Frontend - No SolicitacaoBeneficioForm:**
- Adicionar estado `modalidadeSelecionada`
- Mostrar campo de seleção APENAS se programa tiver regras com modalidades diferentes
- Passar modalidade no cálculo para filtrar regra correta

**Como identificar programas com modalidades:**
```typescript
// Verificar se programa tem regras com modalidades diferentes
const temModalidades = programaSelecionado?.regras?.some(r => r.parametro?.modalidade);
```

**Modalidades possíveis (enum sugerido):**
```typescript
enum ModalidadeBeneficio {
  REEMBOLSO = "REEMBOLSO",
  FORNECIMENTO_MUNICIPIO = "FORNECIMENTO_MUNICIPIO", 
  RETIRADA_SECRETARIA = "RETIRADA_SECRETARIA"
}
```

---

### Feature 4: Distribuição Proporcional entre Arrendatários

**Contexto:** Quando uma propriedade tem múltiplos arrendatários, cada um deve receber proporcionalmente à área que arrenda.

**Exemplo:**
- Propriedade de 100 alqueires
- Arrendatário A: 60 alqueires (60%)
- Arrendatário B: 40 alqueires (40%)
- Limite do programa: 10 toneladas/propriedade
- Arrendatário A pode pedir: até 6 toneladas
- Arrendatário B pode pedir: até 4 toneladas

**O que implementar:**

1. **Backend - Nova função em saldoBeneficioService:**
```typescript
async function calcularLimiteProporcional(
  pessoaId: number,
  programaId: number
): Promise<{ limiteOriginal: number; limiteProporcional: number; percentual: number }>
```

2. **Lógica:**
- Buscar arrendamentos ativos da pessoa
- Para cada propriedade arrendada, calcular % da área total
- Aplicar % ao limite do programa
- Somar limites proporcionais de todas propriedades

3. **Frontend:**
- Mostrar no SaldoCard: "Limite proporcional: X (Y% de Z)"

**Tabelas envolvidas:** `Arrendamento`, `Propriedade`, `AreaEfetiva`

---

### Feature 5: Validação Anti-Burla de Limites

**Contexto:** Impedir que produtor faça múltiplas solicitações pequenas para burlar o limite do período.

**Exemplo de burla:**
- Limite: 10 toneladas/ano
- Produtor pede 5 ton em janeiro → aprovado
- Produtor pede 5 ton em fevereiro → aprovado
- Produtor pede 5 ton em março → deveria BLOQUEAR (já tem 10 aprovadas)

**Já está parcialmente implementado!** O `saldoBeneficioService.verificarDisponibilidade()` já faz isso.

**O que verificar/melhorar:**

1. **Garantir que solicitações `pendente` e `em_analise` também contam no saldo:**
```typescript
// No calcularSaldoDisponivel, verificar se considera pendentes
status: { in: ["aprovada", "paga", "pendente", "em_analise"] }
```

2. **Adicionar validação no frontend** antes de enviar:
- Mostrar aviso se quantidade + já solicitado > limite
- Bloquear botão salvar se exceder

3. **Testar cenários:**
- Criar solicitação pendente de 8 unidades
- Tentar criar outra de 5 unidades (limite 10)
- Deve bloquear com mensagem clara

---

### Feature 6: Relatórios para o Prefeito

**Contexto:** Dashboard com visão executiva dos benefícios concedidos.

**Já existe estrutura:** `backend/src/controllers/comum/relatorioController.ts` e `relatorioBeneficioService.ts`

**Relatórios necessários:**

1. **Por Programa:**
- Total de solicitações por programa
- Valor total investido por programa
- Gráfico de pizza/barras

2. **Por Período:**
- Investimento mensal/anual
- Comparativo com ano anterior
- Gráfico de linha temporal

3. **Por Produtor:**
- Top 10 produtores beneficiados
- Lista com filtros (programa, período, valor)

4. **Resumo Executivo:**
- Cards: Total investido, Produtores atendidos, Média por produtor
- Filtro por período (mês, ano, personalizado)

**Frontend - Criar página:**
`frontend/src/pages/relatorios/DashboardPrefeito.tsx`

**Bibliotecas sugeridas (já disponíveis):**
- recharts - Para gráficos
- Já tem no projeto, usar `import { LineChart, BarChart, PieChart } from "recharts"`

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO SUGERIDA

1. **Feature 5 (Anti-Burla)** - Mais fácil, só ajustar validação existente
2. **Feature 3 (Modalidades)** - Média complexidade, afeta formulário
3. **Feature 6 (Relatórios)** - Independente, pode fazer em paralelo
4. **Feature 4 (Proporcional)** - Mais complexa, deixar por último
5. **Cadastrar restante dos programas** - Enviar PDFs das leis para cadastrar
6. **Importar dados das planilhas da Claudete** - Programas não cadastrados no GIM, dados de 2024

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
