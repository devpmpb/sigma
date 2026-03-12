# Alterações - 10/03/2026

## Migração de Dados 2025 - Todas as planilhas

### Programas criados no banco

- **ID 88** - Construção de Chiqueiro
- **ID 89** - Cisterna

### Scripts criados

- `backend/scripts/migracao-2025/criar-programas-faltantes-2025.ts` - Cria programas 88-89
- `backend/scripts/migracao-2025/migrar-tudo-2025.ts` - Script unificado para todas as 21 planilhas de 2025
- `backend/scripts/migracao-2025/corrigir-nao-encontrados-2025.ts` - Correção de nomes com grafia diferente (~309 registros)
- `backend/scripts/migracao-2025/examinar-planilhas.ts` - Examina estrutura das planilhas
- `backend/scripts/migracao-2025/buscar-pendentes-2025.ts` - Busca nomes pendentes no banco

### Melhorias no script de migração

- Detecção dinâmica das colunas R$/VALOR e DATA no header (resolve problema de colunas que mudam entre abas)
- Filtro de linhas de título ("PRODUTORES QUE RECEBERAM...") para evitar confusão com header real
- Limpeza de sufixos em nomes de Açudes ("Entregue Elton...", datas, etc.)

### Resultados da migração 2025

| Planilha | Total | Migrados | Pendentes |
|----------|-------|----------|-----------|
| Inseminação | 1274 | ~1181 | ~22 pessoas |
| Atend. Veterinário | 684 | ~665 | ~19 pessoas |
| Aveia | 105 | ~94 | ~11 pessoas |
| Pé de Pato | 75 | ~53 | ~8 pessoas |
| Esterco Líquido | 46 | ~42 | ~4 pessoas |
| Cama de Aviário | 40 | ~39 | ~1 pessoa |
| Sêmen Bovino | 30 | ~30 | - |
| Exame de Ultrasson | 29 | ~28 | ~1 pessoa |
| Açude | 14 | ~13 | ~1 pessoa |
| Calcário | 15 | ~13 | ~2 pessoas |
| Pecador Profissional | 11 | ~6 | ~5 pessoas |
| Sêmen Suíno | 8 | ~6 | ~2 pessoas |
| Piscicultura | 6 | ~5 | ~1 pessoa |
| Sala de Ordenha | 6 | ~6 | - |
| Adubação Pastagem | 5 | 5 | - |
| Construção de Piso | 5 | ~5 | - |
| Apicultura | 5 | ~4 | ~1 pessoa |
| Equipamentos | 3 | ~3 | - |
| Chiqueiro | 3 | ~2 | ~1 pessoa |
| Cisterna | 2 | ~2 | - |
| Mudas Frutíferas | 1 | 1 | - |
| **TOTAL** | **~2367** | **~2201** | **~41 pessoas únicas** |

---

## Migração de Dados 2024 - Todas as planilhas

### Programas criados no banco

- **ID 84** - Adubação de Pastagem
- **ID 85** - Apicultura
- **ID 86** - Pescador Profissional
- **ID 87** - Empréstimo de Equipamentos

### Scripts criados

- `backend/scripts/migracao-2024/criar-programas-faltantes-2024.ts` - Cria programas 84-87
- `backend/scripts/migracao-2024/migrar-tudo-2024.ts` - Script unificado para todas as 21 planilhas de 2024
- `backend/scripts/migracao-2024/corrigir-nao-encontrados-2024.ts` - Correção de nomes com grafia diferente (~244 registros)
- `backend/scripts/migracao-2024/examinar-planilhas.ts` - Examina estrutura das planilhas

### Resultados da migração 2024

| Planilha | Total | Migrados | Pendentes |
|----------|-------|----------|-----------|
| Inseminação | 1461 | ~1344 | ~30 pessoas |
| Pé de Pato | 135 | 95 | ~20 pessoas |
| Atend. Veterinário | 606 | ~565 | ~20 pessoas |
| Esterco Líquido | 90 | 81 | 9 pessoas |
| Cama de Aviário | 65 | 59 | 6 pessoas |
| Calcário | 56 | 50 | 6 pessoas |
| Sêmen Bovino | 29 | 27 | 2 pessoas |
| Aveia | 44 | 42 | 2 pessoas |
| Ultrasson | 28 | 26 | 2 pessoas |
| Açudes | 18 | 17 | 1 pessoa |
| Adubação Pastagem | 18 | 17 | 1 pessoa |
| Sêmen Suíno | 14 | 10 | 4 pessoas |
| Piscicultura | 6 | 6 | - |
| Silo | 4 | 4 | - |
| Apicultura | 3 | 3 | - |
| Acesso a Pátio | 6 | 3 | 2 pessoas |
| Construção de Piso | 1 | 1 | - |
| Mudas Frutíferas | 1 | 1 | - |
| Equipamentos | 1 | 0 | 1 pessoa |
| **TOTAL** | **~2586** | **~1774** | **~65 pessoas únicas** |

---

# Alterações - 06/03/2026

## Migração de Dados 2023 - Pé de Pato, Atendimento Veterinário, Açudes

### Programas criados no banco

- **ID 82** - Descompactação de Solos (Pé de Pato) - Lei 2003
- **ID 83** - Atendimento Veterinário - Lei 1414/2014

### Scripts criados

- `backend/scripts/criar-programas-faltantes.ts` - Cria programas 82 e 83 com regras de negócio
- `backend/scripts/migracao-2023/migrar-pe-de-pato-2023.ts` - Migração Pé de Pato (112 produtores, 391h)
- `backend/scripts/migracao-2023/migrar-atendimento-veterinario-2023.ts` - Migração Veterinário (560 registros, 27 abas)
- `backend/scripts/migracao-2023/migrar-acudes-2023.ts` - Migração Açudes (8 registros)
- `backend/scripts/migracao-2023/corrigir-pe-de-pato-nao-encontrados.ts` - Correção de nomes 2023 (~30 produtores)
- `backend/scripts/migracao-2023/corrigir-atendimento-vet-nao-encontrados.ts` - Correção de nomes vet 2023 (~48 registros)
- `backend/scripts/migracao-2023/PENDENTES-CADASTRO.md` - Lista unificada de pendentes 2023+2024

### Arquivos modificados

- `backend/prisma/seeds/programasAtuais.ts`
  - Adicionados programas #20 (Pé de Pato) e #21 (Atendimento Veterinário) no array PROGRAMAS

### Resultados da migração 2023

| Planilha | Total | Migrados | Pendentes |
|----------|-------|----------|-----------|
| Pé de Pato 2023 | 112 produtores | 107 | 5 pessoas |
| Atendimento Veterinário 2023 | 560 registros | ~528 | 16 pessoas |
| Açudes 2023 | 8 registros | 8 | - |
