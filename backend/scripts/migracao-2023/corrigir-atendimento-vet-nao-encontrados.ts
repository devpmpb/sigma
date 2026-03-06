/**
 * Correcao - Atendimento Veterinario 2023 - Nomes nao encontrados
 *
 * Re-processa registros nao encontrados na migracao original,
 * usando mapeamento manual de nomes -> IDs.
 *
 * Executar com: npx tsx scripts/migracao-2023/corrigir-atendimento-vet-nao-encontrados.ts
 */

import * as XLSX from 'xlsx';
import prisma from '../../src/utils/prisma';

const ARQUIVO_PLANILHA = 'C:\\csvs\\Atend. Veterinário - 2023.xlsx';
const PROGRAMA_ID = 83; // Atendimento Veterinario
const ANO_REFERENCIA = 2023;

const PRECOS: Record<string, number> = {
  'consulta':           96.86,
  'parto':             157.76,
  'aux. parto':        157.76,
  'cesarea':           200.00,
  'cesárea':           200.00,
  'prolapso':          200.00,
  'prolapso de utero': 200.00,
  'prolapso de útero': 200.00,
};

function getPreco(procedimento: string): number {
  const proc = procedimento.toLowerCase().trim();
  for (const [key, valor] of Object.entries(PRECOS)) {
    if (proc.includes(key)) return valor;
  }
  return 96.86;
}

// Mapeamento: nome normalizado da planilha -> ID no banco
const MAPEAMENTO_PESSOAS: Record<string, number> = {
  'ADIR HUNEMEIER':               1092,
  'ADIR V HUNEMEIER':             1092,
  'ADIR VANDERLEI HUNEMEIER':     1092,
  'ADIR VANDERLEI HUNEMEIR':      1092,
  'ANESIO JOSE PAULI':            600,
  'ANTONIO CARLOS BIANCHINNI':    83,
  'ANTONIO CARLOS BIANCHINI':     83,
  'CELIO LUIZ ENGELMANN':         636,
  'DEIVID C KOWALD':              2851,
  'DEIVID KOWALD':                2851,
  'ELIZABETE PAULI':              4268,
  'ELISABETE PAULI':              4268,
  'FABIO R SCHEUERMANN':          2748,
  'FABIO SCHEUERMANN':            2748,
  'FLORISVALDO MUNDT':            120,
  'FLORIVALDO MUNDT':             120,
  'GENUARIO KAPPES':              429,
  'GUINTER SCHEUERMANN':          914,
  'GUNTER SCHEUERMANN':           914,
  'IVONIR LUIZ STHALHOFER':       471,
  'IVONIR STHALHOFER':            471,
  'IVONIR LUIZ STAHLHOFER':       471,
  'JANDIR MITTELTAED':            812,
  'JANDIR MITTELSTAEDT':          812,
  'JOAO JOSE PAULI':              155,
  'JOSE BALDUINO FUHR':           941,
  'LONI STRESNKE':                830,
  'LONI STRENSKE':                830,
  'MARILHANE HECHT':              3204,
  'MARILHIANE HECHT':             3204,
  'SALESIO PAULI':                255,
  'VALERIO DASSOLER':             79,
  'CESER WIEDECKER':              1057,
  'CESER WIEDERKEHR':             1057,
  'DEONISIO FRANCYSKOWSKI':       789,
  'DEONISIO FRANCZISKOWSKI':      789,
  'THEODORO COUSSEAL':            693,
  'THEODORO COUSSEAU':            693,
  'HELIO BIERSDORF':              1011,
  'HELIO BIESDORF':               1011,
  'VILSON FINCKEN':               2875,
  'VILSON FINKEN':                2875,
  'VALDIR BIASEBETE':             3086,
  'VALDIR BIASIBETTI':            3086,
  'RENI KOTZ':                    119,
  'AMARILDO WILHERS':             857,  // AMARILDO WILLERS
  'AMARILDO WILLERS':             857,
  'ADAIR S DE SOUSA':             3598, // ADAIR SELVINO DE SOUZA
  'ADAIR SELVINO DE SOUSA':       3598,
  'CLAUDIR BECKEMCAMP':           385,  // CLAUDIR JOAO BECKENKAMP
  'CLAUDIR BECKENKAMP':           385,
  'EDIMAR ESSER':                 4293, // EDIMAR ANTONIO ESSER
  'EGIDIO FISCHLER':              691,  // EGIDIO FICHLER
  'EGIDIO FICHLER':               691,
  'ELDOR HUNEMEYER':              717,  // ELDOR ASTOR HUNEMEIER
  'ELDOR HUNEMEIER':              717,
  'ELIZEU M ENGELLMANN':          2182, // ELIZEU MARCIO ENGELMANN
  'ELIZEU ENGELLMANN':            2182,
  'HELGA S SCHNEIDER':            213,  // HELGA SCHEFFLER SCHNEIDER
  'HELIO STAADLOBER':             391,  // HELIO STAADTLOBER
  'HELIO STAADTLOBER':            391,
  'IRENA BERGAMNN':               60,   // IRENA BERGMANN
  'IRENA BERGMANN':               60,
  'JACINTO ZEIWEIBRINCKER':       940,  // JACINTO ZEIWEIBRICKER
  'JACINTO ZEIWEIBRICKER':        940,
  'MAICO BOURSCHEIDT':            2936, // MAICO ANDRE BOURSCHEID
  'MAICO BOURSCHEID':             2936,
  'MARIA M SIMON':                204,  // MARIA MARGARIDA SIMON
  // Nao encontrados no banco: Braz Guesser, Edson S. de Souza, Edson Luis Scheumann,
  // Giuvane Marholdt, Ida M. Adam, Ildegardt Drewes, Lauro Eicht, Liro Zeiweibricker,
  // Otavio Meiyer, Paulo Toiller, Pedro Tracysnski, Rafael Hemsing, Renato Borreli,
  // Rosane Bier, Wlamor Reinke, Carla Danila Koch
};

function normalizarParaMapear(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\/.*$/, '')   // remove "/ Rosani" etc
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ');
}

function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  return new Date(utc_days * 86400 * 1000);
}

function extrairVeterinario(aba: string): string {
  if (aba.toLowerCase().includes('gustavo')) return 'Gustavo';
  if (aba.toLowerCase().includes('jadir')) return 'Jadir';
  if (aba.toLowerCase().includes('zardo')) return 'Zardo';
  return 'Desconhecido';
}

function extrairMes(aba: string): string {
  const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
                  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  for (const mes of meses) {
    if (aba.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(mes)) return mes;
  }
  return 'desconhecido';
}

function mesParaNumero(mes: string): number {
  const meses: Record<string, number> = {
    'janeiro': 0, 'fevereiro': 1, 'marco': 2, 'abril': 3,
    'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
    'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  };
  return meses[mes.toLowerCase()] ?? 0;
}

interface RegistroVet {
  produtor: string;
  produtorNorm: string;
  procedimento: string;
  data: Date;
  numeroAutorizacao: number;
  veterinario: string;
  mes: string;
  valorTotal: number;
  valorSubsidio: number;
  valorProdutor: number;
}

function extrairRegistrosAba(workbook: XLSX.WorkBook, sheetName: string): RegistroVet[] {
  const sheet = workbook.Sheets[sheetName];
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
  const registros: RegistroVet[] = [];
  const vet = extrairVeterinario(sheetName);
  const mes = extrairMes(sheetName);
  const mesNum = mesParaNumero(mes);

  let headerIdx = -1;
  for (let i = 0; i < Math.min(10, dados.length); i++) {
    const row = dados[i];
    if (row && row.some(c => String(c).toUpperCase().includes('PRODUTOR') &&
                              row.some(d => String(d).toUpperCase().includes('PROCEDIMENTO')))) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return [];

  for (let i = headerIdx + 1; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 4) continue;
    if (typeof row[0] !== 'number') continue;

    const produtor = String(row[1] || '').trim();
    if (!produtor || produtor.length < 3) continue;

    const procedimento = String(row[2] || '').trim();

    let data: Date;
    const dataRaw = row[3];
    if (typeof dataRaw === 'number') {
      data = excelDateToJSDate(dataRaw);
    } else {
      data = new Date(ANO_REFERENCIA, mesNum, 15);
    }

    const numeroAutorizacao = Number(row[4]) || 0;
    const precoTotal = getPreco(procedimento);

    registros.push({
      produtor,
      produtorNorm: normalizarParaMapear(produtor),
      procedimento,
      data,
      numeroAutorizacao,
      veterinario: vet,
      mes: sheetName,
      valorTotal: precoTotal,
      valorSubsidio: precoTotal * 0.7,
      valorProdutor: precoTotal * 0.3,
    });
  }

  return registros;
}

async function corrigirAtendimentoVet() {
  console.log('='.repeat(80));
  console.log('CORRECAO - ATENDIMENTO VETERINARIO 2023 - NOMES NAO ENCONTRADOS');
  console.log('='.repeat(80));

  const workbook = XLSX.readFile(ARQUIVO_PLANILHA);
  console.log(`Abas: ${workbook.SheetNames.length}`);

  // Extrair todos os registros
  const todosRegistros: RegistroVet[] = [];
  for (const aba of workbook.SheetNames) {
    const regs = extrairRegistrosAba(workbook, aba);
    todosRegistros.push(...regs);
  }

  console.log(`Total de registros na planilha: ${todosRegistros.length}`);

  // Filtrar apenas os que estao no mapeamento
  const parasCorrigir = todosRegistros.filter(r => MAPEAMENTO_PESSOAS[r.produtorNorm] !== undefined);
  console.log(`Registros com mapeamento: ${parasCorrigir.length}`);

  // Mostrar quem vai ser processado
  const nomesUnicos = new Set(parasCorrigir.map(r => `${r.produtor} -> ID:${MAPEAMENTO_PESSOAS[r.produtorNorm]}`));
  console.log('\nProdutores a processar:');
  nomesUnicos.forEach(n => console.log(`  ${n}`));

  const stats = {
    migrados: 0,
    duplicados: 0,
    erros: 0,
    valorSubsidioTotal: 0,
  };

  console.log('\nProcessando...');

  for (const registro of parasCorrigir) {
    try {
      const pessoaId = MAPEAMENTO_PESSOAS[registro.produtorNorm];

      // Verificar duplicata
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId,
          programaId: PROGRAMA_ID,
          datasolicitacao: registro.data,
          calculoDetalhes: {
            path: ['numeroAutorizacao'],
            equals: registro.numeroAutorizacao,
          }
        }
      });

      if (existente) {
        stats.duplicados++;
        continue;
      }

      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId,
          programaId: PROGRAMA_ID,
          datasolicitacao: registro.data,
          status: 'concluido',
          observacoes: `Migrado planilha Vet 2023 | ${registro.veterinario} | ${registro.procedimento}`,
          quantidadeSolicitada: 1,
          valorCalculado: registro.valorSubsidio,
          modalidade: 'SUBSIDIO',
          calculoDetalhes: {
            migradoDe: 'Planilha Atendimento Veterinario 2023',
            veterinario: registro.veterinario,
            procedimento: registro.procedimento,
            numeroAutorizacao: registro.numeroAutorizacao,
            valorTotalProcedimento: registro.valorTotal,
            valorSubsidioMunicipio: registro.valorSubsidio,
            valorProdutor: registro.valorProdutor,
            percentualSubsidio: 70,
            mes: registro.mes,
            correcaoNome: true,
          }
        }
      });

      stats.migrados++;
      stats.valorSubsidioTotal += registro.valorSubsidio;

    } catch (error) {
      stats.erros++;
      console.error(`  ERRO: ${registro.produtor}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('RESULTADO');
  console.log('='.repeat(80));
  console.log(`Migrados: ${stats.migrados}`);
  console.log(`Duplicados (ja existiam): ${stats.duplicados}`);
  console.log(`Erros: ${stats.erros}`);
  console.log(`Valor subsidio total: R$ ${stats.valorSubsidioTotal.toFixed(2)}`);
}

corrigirAtendimentoVet()
  .then(() => { console.log('\nConcluido!'); process.exit(0); })
  .catch(e => { console.error('Erro:', e); process.exit(1); });
