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
- `backend/scripts/migracao-2023/corrigir-pe-de-pato-nao-encontrados.ts` - Correção de nomes com grafia diferente (30 produtores)
- `backend/scripts/migracao-2023/corrigir-atendimento-vet-nao-encontrados.ts` - Correção de nomes veterinário (~48 registros)
- `backend/scripts/migracao-2023/PENDENTES-CADASTRO.md` - Lista de pessoas não encontradas no banco

### Arquivos modificados

- `backend/prisma/seeds/programasAtuais.ts`
  - Adicionados programas #20 (Pé de Pato) e #21 (Atendimento Veterinário) no array PROGRAMAS

### Resultados da migração

| Planilha | Total | Migrados | Pendentes |
|----------|-------|----------|-----------|
| Pé de Pato 2023 | 112 produtores | 110 | 5 pessoas não cadastradas |
| Atendimento Veterinário 2023 | 560 registros | ~528 | 16 pessoas não cadastradas |
| Açudes 2023 | 8 registros | 8 | - |
