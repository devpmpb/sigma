# Migração de Planilhas 2023

Scripts para migrar dados das planilhas Excel de 2023 para o SIGMA.

## Pré-requisitos

1. Banco de dados PostgreSQL rodando
2. Planilhas na pasta `C:\Users\marce\Downloads\2023\`
3. Pessoas já cadastradas no sistema (os scripts buscam por nome)

## Scripts Disponíveis

| Script | Programa | Registros | Programa ID |
|--------|----------|-----------|-------------|
| `migrar-inseminacao-2023.ts` | Inseminação | ~1.276 | 69 |
| `migrar-esterco-liquido-2023.ts` | Esterco Líquido | ~143 | 56 |
| `migrar-aveia-2023.ts` | Aveia | ~97 | 66 |
| `migrar-calcario-2023.ts` | Calcário | ~188 | 64 |
| `migrar-cama-aviario-2023.ts` | Cama de Aviário | ~57 | 65 |
| `migrar-semen-bovino-2023.ts` | Sêmen Bovino | ~217 | 47 |
| `migrar-semen-suino-2023.ts` | Sêmen Suíno | ~35 | 72 |
| `migrar-ultrasson-2023.ts` | Ultrasson | ~227 | 70 |
| `migrar-adubacao-pastagem-2023.ts` | Adubação Pastagem | ~19 | 44 |
| `migrar-apicultura-2023.ts` | Apicultura | ~39 | 42 |
| `migrar-pesca-profissional-2023.ts` | Pesca Profissional | ~6 | 43 |
| `migrar-piscicultura-2023.ts` | Piscicultura | ~52 | 9 |

**Total estimado: ~2.356 registros** (dos 12 programas mapeados)

## Como Executar

### Executar um script específico:

```bash
cd backend
npx ts-node scripts/migracao-2023/migrar-inseminacao-2023.ts
```

### Executar todos:

```bash
cd backend
npx ts-node scripts/migracao-2023/executar-todas-migracoes.ts
```

## O que cada script faz

1. **Lê a planilha Excel** correspondente
2. **Extrai dados** de todas as abas (meses)
3. **Busca pessoa** por nome no banco de dados
4. **Cria SolicitacaoBeneficio** com status "concluido"
5. **Gera relatório** com estatísticas

## Tratamento de Erros

- **Pessoa não encontrada**: O script lista todos os nomes não encontrados. Você pode cadastrá-los manualmente e rodar novamente.
- **Duplicatas**: O script verifica se já existe registro similar antes de criar (evita duplicatas em re-execuções).
- **Datas inválidas**: Usa o mês da aba como fallback.

## Campos Mapeados

### Inseminação
- `quantidadeSolicitada`: 1 (uma inseminação)
- `observacoes`: "Migrado... | Aut: X | Vaca: Y | Touro: Z"
- `calculoDetalhes`: JSON com dados originais

### Esterco Líquido
- `quantidadeSolicitada`: Quantidade de cargas
- `valorCalculado`: Valor em R$
- `observacoes`: "Migrado... | Linha: X"

### Aveia / Calcário / Cama de Aviário
- `quantidadeSolicitada`: Quantidade (Kg ou Ton)
- `valorCalculado`: Valor em R$
- `observacoes`: "Migrado... | Linha: X"

### Sêmen Bovino / Suíno
- `quantidadeSolicitada`: Quantidade de doses
- `observacoes`: "Migrado... | Aut: X | Touro: Y | Linha: Z"
- `modalidade`: MATERIAL

### Ultrasson
- `quantidadeSolicitada`: Quantidade de exames
- `observacoes`: "Migrado... | Aut: X | Linha: Y"
- `modalidade`: SERVICO

### Adubação Pastagem / Apicultura / Pesca / Piscicultura
- `quantidadeSolicitada`: Quantidade
- `valorCalculado`: Valor em R$
- `observacoes`: "Migrado... | Linha: X"

## Programas que Faltam Criar

Os seguintes programas das planilhas NÃO existem no SIGMA:

1. **Atendimento Veterinário** (~556 registros)
2. **Pé de Pato** - hora máquina
3. **Açudes** - hora máquina
4. **Acesso à Pátios** - pedras
5. **Construção de Piso**
6. **Equipamentos**
7. **Sala de Ordenha**
8. **Silo**
9. **Mudas Frutíferas**

Aguardando leis para criação destes programas.

## Mapeamento Completo

| Planilha | Programa ID | Nome no SIGMA | Script |
|----------|-------------|---------------|--------|
| Inseminação | 69 | Inseminação Artificial - Bovinos Leite | ✅ |
| Esterco Líquido | 56 | Esterco Líquido - Bovinocultura | ✅ |
| Aveia | 66 | Cobertura do Solo - Aveia | ✅ |
| Calcário | 64 | Correção de Solos - PRÓSOLOS | ✅ |
| Cama de Aviário | 65 | Adubo Orgânico Sólido (Pró-Orgânico) | ✅ |
| Sêmen Bovino | 47 | Sêmen Bovino | ✅ |
| Sêmen Suíno | 72 | Melhoria Genética Suínos | ✅ |
| Ultrasson | 70 | Ultrassom Bovinos Leite | ✅ |
| Adubação Pastagem | 44 | Adubação de Pastagem (Legado) | ✅ |
| Apicultura | 42 | Apicultura (Legado) | ✅ |
| Pesca Profissional | 43 | Pescador Profissional (Legado) | ✅ |
| Piscicultura | 9 | Alevinos (Legado) | ✅ |
| Atend. Veterinário | - | Não existe | ❌ |
| Pé de Pato | - | Não existe | ❌ |
| Açudes | - | Não existe | ❌ |
| Acesso à Pátios | - | Não existe | ❌ |
| Construção de Piso | - | Não existe | ❌ |
| Equipamentos | - | Não existe | ❌ |
| Sala de Ordenha | - | Não existe | ❌ |
| Silo | - | Não existe | ❌ |
| Mudas Frutíferas | - | Não existe | ❌ |

## Notas Importantes

1. **Execute em ambiente de teste primeiro** antes de rodar em produção
2. Os scripts são **idempotentes** - podem ser re-executados sem criar duplicatas
3. As pessoas precisam estar cadastradas no sistema com nomes **exatamente iguais** ou similares
4. O script mostra um relatório final com quantos registros migraram e quais pessoas não foram encontradas
5. Os registros são criados com `status: 'concluido'` pois são benefícios já concedidos
