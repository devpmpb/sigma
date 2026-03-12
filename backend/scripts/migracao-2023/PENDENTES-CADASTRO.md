# Pessoas Pendentes de Cadastro - Migração 2022 a 2025

Estas pessoas aparecem nas planilhas mas **não foram encontradas no banco de dados**.
Após cadastrá-las no SIGMA, adicionar o ID no script de correção correspondente e rodar novamente.

---

## Como rodar os scripts de correção após cadastrar

```bash
cd backend
# 2022
npx tsx scripts/migracao-2022/corrigir-nao-encontrados-2022.ts
# 2023
npx tsx scripts/migracao-2023/corrigir-pe-de-pato-nao-encontrados.ts
npx tsx scripts/migracao-2023/corrigir-atendimento-vet-nao-encontrados.ts
# 2024
npx tsx scripts/migracao-2024/corrigir-nao-encontrados-2024.ts
# 2025
npx tsx scripts/migracao-2025/corrigir-nao-encontrados-2025.ts
```

Os scripts ignoram duplicatas, então é seguro rodar múltiplas vezes.

---

## Resumo Geral da Migração

### 2022

| Planilha | Total | Migrados | Pendentes |
|----------|-------|----------|-----------|
| Atend. Veterinário | 914 | 832 | ~30 pessoas |
| Inseminação | 1306 | 1197 | ~30 pessoas |
| Esterco Líquido | 130 | 121 | ~5 pessoas |
| Aveia | 95 | 91 | ~4 pessoas |
| Calcário | 33 | 30 | ~3 pessoas |
| Cama de Aviário | 57 | 50 | ~5 pessoas |
| Açudes | 17 | 17 | - |
| Sêmen Bovino | 44 | 40 | ~3 pessoas |
| Sêmen Suíno | 4 | 12 | - |
| Ultrasson | 16 | 17 | ~1 pessoa |
| Piscicultura | 13 | 12 | ~1 pessoa |
| Adubação Pastagem | 8 | 9 | - |
| Apicultura | 5 | 5 | - |
| Equipamentos | 7 | 7 | - |
| Construção Piso | 7 | 6 | ~1 pessoa |
| Mudas Frutíferas | 3 | 3 | - |
| Chiqueiro | 2 | 2 | - |
| Silos | 2 | 2 | - |
| Acesso Pátio | 16 | 2 | ~10 pessoas |

**Total 2022: ~2679 registros, ~2455 migrados (inicial 2000 + correção 455)**


### 2023

| Planilha | Total | Migrados | Pendentes |
|----------|-------|----------|-----------|
| Pé de Pato | 112 | 107 | 5 pessoas |
| Atendimento Veterinário | 560 | ~528 | 16 pessoas |
| Açudes | 8 | 8 | - |
| Inseminação | 592 | 592 | - |

### 2024

| Planilha | Total | Migrados | Pendentes |
|----------|-------|----------|-----------|
| Pé de Pato | 135 | 95 | ~20 pessoas |
| Atendimento Veterinário | 606 | ~565 | ~20 pessoas |
| Inseminação | 1461 | ~1344 | ~30 pessoas |
| Açudes | 18 | 17 | 1 pessoa |
| Aveia | 44 | 42 | 2 pessoas |
| Calcário | 56 | 50 | 6 pessoas |
| Esterco Líquido | 90 | 81 | 9 pessoas |
| Cama de Aviário | 65 | 59 | 6 pessoas |
| Sêmen Bovino | 29 | 27 | 2 pessoas |
| Sêmen Suíno | 14 | 10 | 4 pessoas |
| Ultrasson | 28 | 26 | 2 pessoas |
| Silo | 4 | 4 | - |
| Piscicultura | 6 | 6 | - |
| Adubação Pastagem | 18 | 17 | 1 pessoa |
| Apicultura | 3 | 3 | - |
| Construção de Piso | 1 | 1 | - |
| Mudas Frutíferas | 1 | 1 | - |
| Acesso a Pátio | 6 | 3 | 2 pessoas |
| Equipamentos | 1 | 0 | 1 pessoa |
| Pescador Profissional | 0 | 0 | - |
| Empréstimos Equip. | - | - | formato diferente |

**Total 2024: ~2586 registros, ~1774 migrados**

### 2025

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

**Total 2025: ~2367 registros, ~2201 migrados**

---

## Pessoas não encontradas no banco (lista unificada 2022+2023+2024+2025)

Estas pessoas precisam ser cadastradas no SIGMA. Depois, adicionar o ID no `MAPEAMENTO_PESSOAS` do script de correção correspondente e rodar novamente.

### Pendentes apenas de 2022

| Nome | Aparece em | Observação |
|------|-----------|------------|
| Albino Luiz Wansowski | Cama Aviário 2022 | Família Wansowski existe (Janice ID:3763, Silvio ID:4391) |
| Carine Raquel Richtervitz | Inseminação 2022 | |
| Claudinir Heinz | Inseminação 2022 | Claudinir Henz (ID:642) existe - pode ser a mesma pessoa? |
| Cristian Klein | Inseminação 2022 | Cristiane Klein existe (ID:3894) mas é feminino |
| Edosn/Edson Scheurmann | Inseminação 2022 | Vários Scheuermann no banco, mas sem Edson |
| Fernando Bianchesi | Vet/Aveia 2022 | Vários Bianchessi/Bianchetti no banco |
| Fernando Stein Pauli | Inseminação 2022 | |
| Gustavo Pneun | Inseminação 2022 | |
| Marceli Kopsel | Inseminação 2022 | Vários Kopsel no banco |
| Maria Datsch | Inseminação 2022 | Mario Selfredo Datsch (ID:774) existe |
| Maria Margarida Simsen | Inseminação 2022 | Maria Margarida Simon (ID:204) pode ser? |
| Marlon J. Marhold | Inseminação 2022 | Vários Marholt no banco |
| Noeli Kuhn | Inseminação 2022 | Vários Kuhn no banco |
| Noeli M. Konrad | Cama Aviário/Inseminação 2022 | Vários Konrad no banco |
| Raquel Selzler | Inseminação 2022 | Roque Selzler (ID:219) existe |
| Rosai Buhr | Inseminação 2022 | |
| Rosano Pauli | Inseminação 2022 | |
| Salezio Pauli | Acesso Pátio 2022 | |
| Sirlei Teresinha Arnold | Inseminação 2022 | Airton Arnold (ID:632), Marlene Arnold (ID:633) |
| Valmor Reinke | Acesso Pátio 2022 | Vários Reinke no banco |
| Vilmar Marshall/Maschall | Acesso Pátio 2022 | |

### Pendentes apenas de 2023/2024

| Nome | Aparece em | Observação |
|------|-----------|------------|
| Adelar Kolzler | Pé de Pato 2024 | |
| Adriane Vilela | Vet 2024 | |
| Beno Vorpaguel | Pé de Pato 2024 | |
| Carla Danila Koch | Vet 2023 | |
| Carlito Finken | Acesso Pátio 2024 | Família Finken existe (Vilson ID:2875) |
| Carlos M. Wosniack | Inseminação 2024 | |
| Cleiton Almir Hunemeier | Aveia 2024 | |
| Deolir Passini | Pé de Pato/Inseminação 2024 | |
| Edson Luis Engelmann | Inseminação 2024 | |
| Elaine Rejala | Pé de Pato 2024 | |
| Eloim Schneider | Inseminação 2024 | |
| Geraldo Hafer | Inseminação 2024 | |
| Gilmar Rosinski | Pé de Pato 2024 | |
| Gilson Cosseau | Pé de Pato/Vet 2024 | |
| Giovana Pauli | Pé de Pato/Calcário 2024 | |
| Gorete A.B. Bocorni | Cama Aviário 2024 | |
| Harri Allbring | Pé de Pato 2024 | |
| José Sczuzk | Vet 2024 | Mapeado para ID:1963 |
| Katia J.F. Cottica | Sêmen Suíno 2024 | |
| Lauro Roque Eicht | Pé de Pato/Vet 2023/2024 | |
| Liro Zeiweibricker | Vet 2023 | Jacinto (ID:940) existe |
| Luis Rosinski | Pé de Pato 2024 | |
| Maico Allbring | Pé de Pato 2024 | |
| Marceli Kopsel | Esterco 2024 | |
| Marcelo Allbring | Pé de Pato 2024 | |
| Marcio Cottica | Pé de Pato 2024 | |
| Milton Machado | Pé de Pato 2024 | |
| Nildo Schiber | Pé de Pato 2024 | |
| Otavio Meiyer | Vet 2023 | |
| Rafael Hemsing | Vet 2023/2024 | Família existe mas não Rafael |
| Renato Borreli | Vet 2023 | |
| Rodrigo Drewes | Vet 2024 | |
| Romeu Bombardeli | Vet 2024 | |
| Rosane Bier | Vet 2023 | |
| Simara de Oliveira | Esterco 2024 | |
| Valdair Magnabosco | Inseminação 2024 | |
| Vali Ventz | Pé de Pato 2024 | |
| Vanderlei Astor Reinke | Acesso Pátio 2024 | |
| Walmir Volnei Rieger | Equipamentos 2024 | |
| Wlamor Reinke | Vet 2023 | |

### Pendentes que aparecem em 2025 (e possivelmente anos anteriores)

| Nome | Aparece em | Observação |
|------|-----------|------------|
| Adelmo Simsen | Pé de Pato 2025, Esterco 2024 | Mapeado ID:1101 em 2022 |
| Braz Guesser | Sala Ordenha/Inseminação 2025, Pé de Pato 2023/2024, Inseminação 2022 | |
| Daiane Niederle | Aveia 2025, Pé de Pato/Cama 2024 | |
| Edson S. de Souza | Inseminação 2025, Vários 2023/2024, Inseminação 2022 | |
| Eduardo G. Wastowski | Aveia/Esterco 2025, Esterco/Cama 2024 | Família Wastowski existe |
| Emerson R. Henz | Aveia 2025, Calcário/Cama 2024, Inseminação 2022 | |
| Gabriel H. Niederle | Aveia/Chiqueiro 2025, Pé de Pato/Cama 2024 | |
| Germano A. Hunemeier | Sêmen Suíno/Pé de Pato 2025, Sêmen Suíno 2024, Vet 2022 | |
| Giuvane/Giovane Marholt | Inseminação 2025, Vários 2023/2024, Inseminação 2022 | Várias grafias |
| Guilherme M. H. Grutka | Sêmen Suíno 2025 e 2024 | |
| Hildegard Drewes | Inseminação 2025, Vet/Esterco/Cama 2023/2024, Vet 2022 | |
| Ida M. Adam | Inseminação/Aveia 2025, Vet/Esterco 2023/2024, Vet 2022 | |
| Jeferson Mittelstaedt | Inseminação 2025 e 2024 | Jandir (ID:812) existe |
| Luan Hoffer | Vet 2025, Inseminação 2024 | |
| Marcelo Maldaner | Vários 2025, Inseminação 2024 | |
| Maria L. B. Fuhr | Aveia 2025, Calcário 2024 | |
| Maria Ines Fuhr | Aveia/Cama 2025 | |
| Sergio Lewandowski | Pé de Pato/Aveia 2025 | |
| Valdir Hameski | Vet 2025 | |
| Edson Luis Scheumann | Vet 2023/2024 | |

### Pendentes apenas de 2025 (novos)

| Nome | Aparece em | Observação |
|------|-----------|------------|
| Ademar Hagdon / Genecilda Ribeiro da Silva | Pescador 2025 | Nome duplo |
| Alessandro C. Pilger | Esterco 2025 | |
| Antônio de Oliveira | Pescador 2025 | |
| Carlos Schmmelpfnnig | Vet 2025 | |
| Claudio V. Urhy | Esterco 2025 | |
| Edoir Oliniki | Esterco 2025 | |
| Egon Hope | Vet 2025 | |
| Erci K. Gartiner | Pescador 2025 | |
| Geovana L. P. Koch | Aveia 2025 | |
| Geraldo Hoefer | Inseminação 2025 | |
| Hélio Biersdorf | Calcário 2025, Vet 2022 | |
| Irica B. Heinz | Pescador 2025 | |
| Ivanete M. Diehl | Inseminação 2025 | |
| Jeferson F. Fritzen | Pé de Pato 2025 | |
| Leonir Fischer | Vet 2025 | |
| Mario F. dos Passos | Esterco 2025 | |
| Mario Miller | Apicultura 2025 | |
| Matheus Heinz | Vet 2025 | |
| Nelsy Nogueira Hugue | Pescador 2025 | Mapeado ID:2987 |
| Rosane W. Oppermann | Calcário 2025 | |
| Salatiel do Rosário | Pescador 2025 | |
| Sergio Maschner | Vet 2025 | |
| Valério Dassoler | Cama Aviário 2025 | |
| Viviane Fritzen Fincke | Aveia 2025 | |
| Walter Kleemann | Pé de Pato 2025 | |

---

*Última atualização: 2026-03-11*
