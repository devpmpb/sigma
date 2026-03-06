# Pessoas Pendentes de Cadastro - Migração 2023

Estas pessoas aparecem nas planilhas de 2023 mas **não foram encontradas no banco de dados**.
Após cadastrá-las no SIGMA, adicionar o ID no script de correção correspondente e rodar novamente.

---

## Como rodar os scripts de correção após cadastrar

```bash
cd backend
npx tsx scripts/migracao-2023/corrigir-pe-de-pato-nao-encontrados.ts
npx tsx scripts/migracao-2023/corrigir-atendimento-vet-nao-encontrados.ts
```

Os scripts ignoram duplicatas, então é seguro rodar múltiplas vezes.

---

## Pendentes - Pé de Pato 2023

Programa ID 82 — `corrigir-pe-de-pato-nao-encontrados.ts`

| Nome na planilha      | Horas | Observação                          |
|-----------------------|-------|-------------------------------------|
| Braz Guesser          | ?     | Não encontrado no banco             |
| Edson S. de Souza     | ?     | Não encontrado no banco             |
| Giuvane C. S. Marholdt| ?     | Não encontrado (Giovane Marholdt?)  |
| Lauro Roque Eicht     | ?     | Não encontrado no banco             |
| Paulo A. Toiller      | ?     | Não encontrado no banco             |

---

## Pendentes - Atendimento Veterinário 2023

Programa ID 83 — `corrigir-atendimento-vet-nao-encontrados.ts`

| Nome na planilha          | Observação                                  |
|---------------------------|---------------------------------------------|
| Braz Guesser              | Não encontrado no banco                     |
| Carla Danila Koch         | Não encontrado no banco                     |
| Edson S. de Souza         | Não encontrado no banco                     |
| Edson Luis Scheumann      | Não encontrado no banco                     |
| Giuvane/Giovane Marohldt  | Não encontrado (família Marholdt não existe) |
| Ida M. Adam               | Não encontrado no banco                     |
| Ildegardt Drewes          | Não encontrado no banco                     |
| Lauro Roque Eicht         | Não encontrado no banco                     |
| Liro Zeiweibricker        | Jacinto Zeiweibricker (ID:940) existe, mas não Liro |
| Otavio Meiyer             | Não encontrado no banco                     |
| Paulo A. Toiller          | Não encontrado no banco                     |
| Pedro Tracysnski          | Não encontrado no banco                     |
| Rafael Hemsing            | Família Hemsing existe (IDs: 2793, 2516, 3171, 4182) mas não Rafael |
| Renato Borreli            | Não encontrado no banco                     |
| Rosane Bier               | Não encontrado no banco                     |
| Wlamor Reinke             | Não encontrado no banco                     |

---

## Resumo da Migração Completa

### Pé de Pato 2023
- Total na planilha: 112 produtores
- Migrados (script original): 80
- Migrados (correções manuais): 27
- **Total migrado: 107 produtores**
- Pendentes: 5

### Atendimento Veterinário 2023
- Total na planilha: 560 registros
- Migrados (script original): 480
- Migrados (correções manuais): ~48
- **Total migrado: ~528 registros**
- Pendentes: ~16 pessoas únicas

### Açudes 2023
- Total: 8 registros — **todos migrados** (1 inserido manualmente)

---

## Outros programas com migração pendente

As planilhas abaixo estão em `C:\csvs\` e ainda não foram migradas:

- Acesso a Pátios
- Sala de Ordenha
- Silo
- Equipamentos Agrícolas
- Adubação Pastagem
- Cama de Aviário
- Esterco Líquido
- Aveia
- Calcário

---

*Última atualização: 2026-03-06*
