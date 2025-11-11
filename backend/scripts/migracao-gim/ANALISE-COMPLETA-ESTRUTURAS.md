# 📊 ANÁLISE COMPLETA: GIM vs SIGMA

## 🎯 Objetivo

Analisar a estrutura do sistema GIM comparando com o SIGMA para identificar:
1. O que precisa ser migrado
2. O que pode ser descartado
3. Onde a estrutura do SIGMA é superior
4. Recomendações de migração

---

## 📦 ARQUIVOS ANALISADOS DO GIM

| Arquivo | Registros | Status | Descrição |
|---------|-----------|--------|-----------|
| `Pessoa.csv` | ~1.000 | ✅ Migrado | Pessoas físicas e jurídicas |
| `PropriedadeRural.csv` | ~800 | ✅ Migrado | Propriedades rurais |
| `Endereco.csv` | ~900 | ✅ Migrado | Endereços |
| `telefone.csv` | ~2.500 | 🔄 Em migração | Telefones das pessoas |
| `subsidio.csv` | ~11.170 | 🔄 Em migração | Subsídios/benefícios |
| `Programa.csv` | 62 | 📋 Analisar | Programas de benefícios |
| `ramoatividade.csv` | 22 | 📋 Analisar | Ramos de atividade agrícola |
| `programaramoatividade.csv` | 20 | 📋 Analisar | Relação programa x ramo |
| `programadesconsiderarraomatividade.csv` | 20 | 📋 Analisar | Exclusões de ramos |
| `TipoVeiculo.csv` | 5 | 📋 Analisar | Tipos de veículos |
| `Veiculo.csv` | 35 | 📋 Analisar | Veículos municipais |
| `movimentosituacao.csv` | 1.833 | ⚠️ Complexo | Histórico de situações |
| `movimentotransferencia.csv` | 407 | ⚠️ Complexo | Transferências de propriedade |

---

## 🔍 ANÁLISE DETALHADA POR ENTIDADE

### 1. **PROGRAMAS** 📋

#### **Estrutura GIM:**
```csv
codPrograma;data;sumula;descricao;encerrado;enquadramentoUnico;areaP;areaGMax;
qtdeP;valorP;qtdeG;qtdeGMax;valorG;codUnidade;periodicidade;naoBaseadoArea;
liberadoArrendatarios;liberadoArrendatariosNR
```

**Campos importantes:**
- `sumula`: Nome do programa (ex: "Incentivo ao Uso de Adubo Orgânico")
- `descricao`: Descrição detalhada
- `encerrado`: Se programa está ativo ou não
- `enquadramentoUnico`: Se tem enquadramento único ou P/G (pequeno/grande)
- `areaP`, `areaGMax`: Limites de área
- `valorP`, `valorG`: Valores para pequeno e grande produtor
- `periodicidade`: Período de renovação (meses)
- `liberadoArrendatarios`: Se arrendatários podem solicitar

#### **Estrutura SIGMA:**
```prisma
model Programa {
  id           Int
  nome         String
  descricao    String?
  leiNumero    String?
  tipoPrograma TipoPrograma  // SUBSIDIO, MATERIAL, SERVICO, CREDITO, ASSISTENCIA
  secretaria   TipoPerfil    // ADMIN, OBRAS, AGRICULTURA
  ativo        Boolean

  solicitacoes SolicitacaoBeneficio[]
  regras       RegrasNegocio[]
}
```

#### **✅ VEREDITO: SIGMA É SUPERIOR**

**Motivos:**
1. **Flexibilidade**: GIM tem campos fixos (areaP, valorP, etc), SIGMA usa `RegrasNegocio` dinâmicas
2. **Escalabilidade**: SIGMA permite criar regras customizadas sem alterar schema
3. **Manutenibilidade**: Adicionar novo tipo de regra no SIGMA é fácil, no GIM requer migração

**❌ O que DESCARTAR do GIM:**
- Campos `areaP`, `areaGMax`, `valorP`, `valorG`, etc. (hardcoded)
- Campos booleanos específicos (`liberadoArrendatarios`, `naoBaseadoArea`)

**✅ O que MIGRAR:**
- `sumula` → `nome`
- `descricao` → `descricao`
- `encerrado` → `ativo` (inverter boolean)
- Criar `RegrasNegocio` com base nos campos de área/valor

**📝 RECOMENDAÇÃO:**
Migrar apenas informações básicas dos programas. As regras específicas (área, valor) devem ser recriadas manualmente no SIGMA usando o modelo `RegrasNegocio`, que é muito mais flexível.

---

### 2. **RAMOS DE ATIVIDADE** 🌾

#### **Estrutura GIM:**
```csv
codRamoAtividade;nome;descricao
1;Avicultura;
2;Bovinocultura de leite;
3;Suinocultura (Para consumo do lar);
```

**Dados:**
- 22 ramos de atividade
- Exemplos: Avicultura, Bovinocultura, Suinocultura, Piscicultura, Apicultura, etc.

#### **Estrutura SIGMA:**
```prisma
enum AtividadeProdutiva {
  AGRICULTURA
  PECUARIA
  AGRICULTURA_PECUARIA
  SILVICULTURA
  AQUICULTURA
  HORTIFRUTI
  AVICULTURA
  SUINOCULTURA
  OUTROS
}

model AreaEfetiva {
  ...
  atividadeProdutiva AtividadeProdutiva?
  ...
}
```

#### **⚠️ VEREDITO: ESTRUTURAS DIFERENTES**

**GIM:**
- Tabela normalizada com 22 ramos específicos
- Relacionamento N:N com Programas
- Permite desconsiderar ramos por programa

**SIGMA:**
- ENUM fixo com 9 categorias genéricas
- Menos granular, mais simples

**❌ PROBLEMA IDENTIFICADO:**
O SIGMA tem ENUMs fixos que **não permitem adicionar novos valores** sem migração de schema.

**✅ SOLUÇÃO RECOMENDADA:**

**Opção 1: Manter ENUM (mais simples)**
- Mapear os 22 ramos do GIM para os 9 ENUMs do SIGMA
- Perder granularidade, mas manter simplicidade

**Opção 2: Criar tabela RamoAtividade (mais flexível)**
```prisma
model RamoAtividade {
  id          Int      @id @default(autoincrement())
  nome        String   @unique
  descricao   String?
  categoria   AtividadeProdutiva
  ativo       Boolean  @default(true)

  areasEfetivas     AreaEfetiva[]
  programas         ProgramaRamoAtividade[]
  exclusoesProgramas ProgramaExclusaoRamo[]
}

model ProgramaRamoAtividade {
  programaId       Int
  programa         Programa @relation(...)
  ramoAtividadeId  Int
  ramoAtividade    RamoAtividade @relation(...)
}

model ProgramaExclusaoRamo {
  programaId       Int
  programa         Programa @relation(...)
  ramoAtividadeId  Int
  ramoAtividade    RamoAtividade @relation(...)
}
```

**📝 RECOMENDAÇÃO:**
**Implementar Opção 2** se vocês precisam dessa granularidade nos programas. Caso contrário, usar o mapeamento para ENUMs existentes.

---

### 3. **VEÍCULOS** 🚗

#### **Estrutura GIM:**
```csv
TipoVeiculo: codTipoVeiculo;nome;descricao
Veiculo: codVeiculo;codTipoVeiculo;placa;modelo;marca;anoFabricacao;anoModelo;
         combustivel;cor;chassi;dtAquisicao;lotacao;foto
```

**Dados:**
- 5 tipos: Automóvel, Caminhão, Motocicleta, Máquina Pesada
- 35 veículos cadastrados

#### **Estrutura SIGMA:**
```prisma
model TipoVeiculo {
  id        Int
  descricao String @unique
  ativo     Boolean
  veiculos  Veiculo[]
}

model Veiculo {
  id            Int
  tipoVeiculoId Int
  tipoVeiculo   TipoVeiculo
  descricao     String
  placa         String @unique
  ativo         Boolean
  ordensServico OrdemServico[]
}
```

#### **⚠️ VEREDITO: SIGMA MAIS SIMPLES (PROPOSITALMENTE)**

**GIM tem:**
- Campos detalhados: `modelo`, `marca`, `anoFabricacao`, `anoModelo`, `combustivel`, `cor`, `chassi`, `dtAquisicao`, `lotacao`, `foto`

**SIGMA tem:**
- Apenas: `descricao`, `placa`
- Foco em identificação simples para ordens de serviço

**❌ CAMPOS DO GIM QUE SIGMA NÃO TEM:**
- `modelo`, `marca`, `anoFabricacao`, `anoModelo`
- `combustivel`, `cor`, `chassi`
- `dtAquisicao`, `lotacao`, `foto`

**✅ DECISÃO:**

**Se precisam desses dados detalhados:**
```prisma
model Veiculo {
  id              Int
  tipoVeiculoId   Int
  tipoVeiculo     TipoVeiculo
  placa           String @unique
  modelo          String?
  marca           String?
  anoFabricacao   Int?
  anoModelo       Int?
  combustivel     String?
  cor             String?
  chassi          String?
  dataAquisicao   DateTime?
  lotacao         Int?
  ativo           Boolean
  createdAt       DateTime
  updatedAt       DateTime

  ordensServico   OrdemServico[]
}
```

**Se não precisam:**
- Manter estrutura simples do SIGMA
- Migrar apenas: `tipo` → `tipoVeiculoId`, `placa`, `descricao` (concatenar modelo + marca)

**📝 RECOMENDAÇÃO:**
Se o módulo de OBRAS precisa de detalhes (manutenção preventiva, documentação), **expandir o modelo**. Caso contrário, **manter simples**.

---

### 4. **MOVIMENTAÇÕES** 🔄

#### **4.1. MOVIMENTOSITUACAO** (Histórico de Situações)

**Estrutura GIM:**
```csv
codMovimentoSituacao;codPropriedade;data;de;para;tipo;motivo;responsavel
```

**Exemplo:**
```
1;1;2006-09-12;USUFRUTO;USUFRUTO;AUTOMÁTICO;SITUAÇÃO INICIAL;GIM
14;9;2006-09-25;PRÓPRIA;CONDOMÍNIO;MANUAL;Segundo Andrieli...;Geancarlo
```

**Dados:**
- 1.833 registros
- Rastreia mudanças de situação: PRÓPRIA ↔ CONDOMÍNIO ↔ USUFRUTO
- Tipos: AUTOMÁTICO (sistema) vs MANUAL (usuário)
- Histórico completo com motivo e responsável

#### **Estrutura SIGMA:**

**Atualmente:** ❌ NÃO TEM histórico de situações!

```prisma
model Propriedade {
  ...
  situacao SituacaoPropriedade  // PROPRIA, CONDOMINIO, USUFRUTO
  ...
}
```

**✅ PROBLEMA IDENTIFICADO:**
O SIGMA **não rastreia histórico de mudanças de situação**. Isso é uma **perda de dados** significativa!

**📝 SOLUÇÃO RECOMENDADA:**

**Criar modelo de auditoria:**
```prisma
model PropriedadeSituacaoHistorico {
  id             Int                   @id @default(autoincrement())
  propriedadeId  Int
  propriedade    Propriedade           @relation(...)

  situacaoAnterior SituacaoPropriedade?
  situacaoNova     SituacaoPropriedade

  tipoMovimento    String               // AUTOMATICO, MANUAL
  motivo           String?
  responsavel      String?              // Usuário que fez a mudança

  createdAt      DateTime              @default(now())
}
```

**Migração:**
- Importar todos os 1.833 registros
- Manter histórico completo
- Implementar trigger/middleware para registrar futuras mudanças

---

#### **4.2. MOVIMENTOTRANSFERENCIA** (Transferências de Propriedade)

**Estrutura GIM:**
```csv
codMovimentoTransferencia;codPropriedade;codProprietario;codNovoProprietario;
data;motivo;responsavel
```

**Exemplo:**
```
5;272;476;478;2007-06-05;Falecimento do Cônjuge.;Jair Costa
6;690;1067;1417;2007-07-09;VENDA;Jair Costa
```

**Dados:**
- 407 transferências
- Motivos: VENDA, COMPRA, FALECIMENTO, correção cadastral

#### **Estrutura SIGMA:**

**Atualmente:** ✅ JÁ TEM!

```prisma
model TransferenciaPropriedade {
  id                     Int
  propriedadeId          Int
  propriedade            Propriedade
  proprietarioAnteriorId Int
  proprietarioAnterior   Pessoa @relation("TransferenciaProprietarioAnterior")
  proprietarioNovoId     Int
  proprietarioNovo       Pessoa @relation("TransferenciaProprietarioNovo")
  dataTransferencia      DateTime
  motivoTransferencia    String?
  valorTransacao         Decimal?
  createdAt              DateTime
  updatedAt              DateTime
}
```

#### **✅ VEREDITO: SIGMA É EQUIVALENTE**

**Diferenças:**
- GIM: `responsavel` (quem registrou)
- SIGMA: `valorTransacao` (valor da venda)

**📝 RECOMENDAÇÃO:**
- **Adicionar campo `registradoPor`** no SIGMA (opcional)
- **Migrar** as 407 transferências do GIM
- Mapear `motivo` → `motivoTransferencia`

---

## 📊 RESUMO COMPARATIVO

### **✅ ONDE O SIGMA É SUPERIOR:**

1. **Programas:**
   - SIGMA usa `RegrasNegocio` flexíveis
   - GIM tem campos hardcoded (menos escalável)

2. **Estrutura Geral:**
   - SIGMA tem tipagem forte (TypeScript + Prisma)
   - SIGMA tem auditoria (createdAt, updatedAt)
   - SIGMA tem soft delete consistente

3. **Transferências:**
   - SIGMA já tem modelo robusto
   - Campo adicional `valorTransacao`

### **⚠️ ONDE O GIM TEM RECURSOS QUE O SIGMA NÃO TEM:**

1. **Histórico de Situações:**
   - GIM rastreia **todas** as mudanças de situação
   - SIGMA **não rastreia** (perda de auditoria)

2. **Ramos de Atividade:**
   - GIM tem 22 ramos específicos
   - SIGMA tem 9 categorias genéricas (ENUM)

3. **Veículos Detalhados:**
   - GIM tem 12 campos extras (modelo, marca, combustível, etc)
   - SIGMA tem apenas identificação básica

4. **Relação Programas x Ramos:**
   - GIM permite vincular programas a ramos específicos
   - GIM permite **excluir** ramos de programas
   - SIGMA não tem essa funcionalidade

### **❌ O QUE DESCARTAR DO GIM:**

1. **Campos de Programas:**
   - `areaP`, `areaGMax`, `valorP`, `valorG` (usar RegrasNegocio)
   - Flags booleanas específicas (usar RegrasNegocio)

2. **Campos de Veículos (se não forem necessários):**
   - Detalhes técnicos se módulo Obras não precisa

---

## 🎯 RECOMENDAÇÕES FINAIS

### **1. MIGRAÇÕES IMEDIATAS (Sem alterar schema):**

✅ **Já migrado:**
- Pessoa
- Propriedade
- Endereco

🔄 **Em andamento:**
- Telefone
- Subsídio

📋 **Próximos passos:**
- TipoVeiculo (5 registros) → Simples
- Veiculo (35 registros) → Decidir se expande modelo
- Programa (62 registros) → Migrar info básica
- TransferenciaPropriedade (407 registros) → Migrar completo

### **2. MELHORIAS NO SCHEMA DO SIGMA:**

#### **Alta Prioridade:**

**A. Adicionar histórico de situações:**
```prisma
model PropriedadeSituacaoHistorico {
  id                Int                   @id @default(autoincrement())
  propriedadeId     Int
  propriedade       Propriedade           @relation(...)
  situacaoAnterior  SituacaoPropriedade?
  situacaoNova      SituacaoPropriedade
  tipoMovimento     String                // AUTOMATICO, MANUAL
  motivo            String?
  responsavel       String?
  createdAt         DateTime              @default(now())
}
```

**B. Adicionar campo em TransferenciaPropriedade:**
```prisma
model TransferenciaPropriedade {
  ...
  registradoPor String?  // Usuário que registrou
  ...
}
```

#### **Média Prioridade:**

**C. Expandir modelo de Veículos (se necessário):**
```prisma
model Veiculo {
  ...
  modelo          String?
  marca           String?
  anoFabricacao   Int?
  anoModelo       Int?
  combustivel     String?
  cor             String?
  chassi          String?
  dataAquisicao   DateTime?
  ...
}
```

**D. Criar tabela RamoAtividade (se precisar granularidade):**
```prisma
model RamoAtividade {
  id          Int      @id @default(autoincrement())
  nome        String   @unique
  descricao   String?
  categoria   AtividadeProdutiva
  ativo       Boolean  @default(true)

  areasEfetivas          AreaEfetiva[]
  programasPermitidos    ProgramaRamoAtividade[]
  programasExcluidos     ProgramaExclusaoRamo[]
}

model ProgramaRamoAtividade {
  programaId       Int
  programa         Programa @relation(...)
  ramoAtividadeId  Int
  ramoAtividade    RamoAtividade @relation(...)

  @@id([programaId, ramoAtividadeId])
}

model ProgramaExclusaoRamo {
  programaId       Int
  programa         Programa @relation(...)
  ramoAtividadeId  Int
  ramoAtividade    RamoAtividade @relation(...)

  @@id([programaId, ramoAtividadeId])
}
```

### **3. ORDEM DE EXECUÇÃO RECOMENDADA:**

**Fase 1: Concluir migrações simples (1 dia)**
1. ✅ Executar migração de Telefones
2. ✅ Executar migração de Subsídios
3. Migrar TipoVeiculo (simples)
4. Migrar Veiculo (decidir campos antes)

**Fase 2: Melhorar schema (2-3 dias)**
1. Adicionar `PropriedadeSituacaoHistorico`
2. Adicionar `registradoPor` em `TransferenciaPropriedade`
3. Decidir sobre RamoAtividade (tabela vs ENUM)
4. Rodar migrations

**Fase 3: Migrações complexas (3-4 dias)**
1. Migrar histórico de situações (1.833 registros)
2. Migrar transferências (407 registros)
3. Migrar programas (62 registros)
4. Criar RegrasNegocio para programas existentes

**Fase 4: Migrar relações programas (1 dia)**
1. Migrar programaramoatividade
2. Migrar programadesconsiderarraomatividade
3. Testar validações

---

## 📈 ESTATÍSTICAS FINAIS

### **Dados do GIM:**
- **Total de registros:** ~18.000
- **Já migrados:** ~2.700 (Pessoa, Propriedade, Endereco)
- **Em migração:** ~13.600 (Telefone, Subsídio)
- **Pendente:** ~1.700 (Veículos, Programas, Históricos, Transferências)

### **Complexidade:**
- ✅ **Simples:** TipoVeiculo, Veiculo, Programa
- ⚠️ **Média:** Transferências, RamoAtividade
- 🔴 **Alta:** MovimentoSituacao (requer novo modelo)

---

## ✅ CONCLUSÃO

### **A estrutura do SIGMA é SUPERIOR em:**
- Flexibilidade (RegrasNegocio vs campos fixos)
- Escalabilidade (fácil adicionar novos tipos)
- Tipagem forte (TypeScript + Prisma)
- Auditoria básica (timestamps)

### **O GIM tem funcionalidades que FALTAM no SIGMA:**
- ❌ Histórico de mudanças de situação
- ❌ Granularidade em ramos de atividade
- ❌ Relação programas x ramos (permitir/excluir)

### **Próximos passos:**
1. ✅ Concluir migração de Telefones e Subsídios
2. 📋 Decidir sobre expansão de Veículos
3. 🔧 Implementar PropriedadeSituacaoHistorico
4. 🔧 Decidir sobre RamoAtividade (tabela vs ENUM)
5. 📋 Migrar dados restantes

---

**Criado por:** Claude Code
**Data:** 2025-01-10
**Versão:** 1.0
