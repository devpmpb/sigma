/**
 * Correcao - Pe de Pato 2023 - Nomes nao encontrados
 *
 * Este script re-processa os registros que nao foram encontrados na
 * migracao original, usando um mapeamento manual de nomes -> IDs.
 *
 * Executar com: npx tsx scripts/migracao-2023/corrigir-pe-de-pato-nao-encontrados.ts
 */

import * as XLSX from 'xlsx';
import prisma from '../../src/utils/prisma';

const ARQUIVO_PLANILHA = 'C:\\csvs\\Pé de Pato - 2023.xlsx';
const PROGRAMA_ID = 82; // Descompactacao de Solos (Pe de Pato)
const ANO_REFERENCIA = 2023;

// Mapeamento manual: nome normalizado da planilha -> ID da pessoa no banco
// Normalizado = uppercase, sem acentos, sem pontuacao extra
const MAPEAMENTO_PESSOAS: Record<string, number> = {
  'ANESIO JOSE PAULI':          600,
  'DEIVID C KOWALD':            2851,
  'DEIVID KOWALD':              2851,
  'ELIZABETE PAULI':            4268,
  'FABIO R SCHEUERMANN':        2748,
  'FABIO SCHEUERMANN':          2748,
  'FLORISVALDO MUNDT':          120,
  'GENUARIO KAPPES':            429,
  'GUINTER SCHEUERMANN':        914,
  'IVONIR LUIZ STHALHOFER':     471,
  'IVONIR STHALHOFER':          471,
  'JOAO JOSE PAULI':            155,
  'JOSE BALDUINO FUHR':         941,
  'MARILHANE HECHT':            3204,
  'SALESIO PAULI':              255,
  'VALERIO DASSOLER':           79,
  'ANTONIO CARLOS BIANCHINNI':  83,
  'ANTONIO CARLOS BIANCHINI':   83,
  'CELIO LUIZ ENGELMANN':       636,
  'LONI STRESNKE':              830,
  'LONI STRENSKE':              830,
  'JANDIR MITTELTAED':          812,
  'JANDIR MITTELSTAEDT':        812,
  'CESER WIEDECKER':            1057,
  'CESER WIEDERKEHR':           1057,
  'DEONISIO FRANCYSKOWSKI':     789,
  'DEONISIO FRANCZISKOWSKI':    789,
  'THEODORO COUSSEAL':          693,
  'THEODORO COUSSEAU':          693,
  'HELIO BIERSDORF':            1011,
  'HELIO BIESDORF':             1011,
  'VILSON FINCKEN':             2875,
  'VILSON FINKEN':              2875,
  'VALDIR BIASEBETE':           3086,
  'VALDIR BIASIBETTI':          3086,
  'RENI KOTZ':                  119,
  'AMARILDO WILHERS':           857,  // AMARILDO WILLERS
  'AMARILDO WILLERS':           857,
  'ARTEMIO A WASTOWSKI':        513,  // ARTENIO ADELAR WASTOWSKI
  'VILSON GIM':                 304,  // WILSON GIM
  'WILSON GIM':                 304,
  // Nao encontrados no banco: Braz Guesser, Edson S. de Souza, Giuvane Marholdt, Lauro Eicht, Paulo Toiller
};

function normalizarParaMapear(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ');
}

function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  return new Date(utc_days * 86400 * 1000);
}

interface RegistroPeDePato {
  produtor: string;
  produtorNorm: string;
  sessoes: Array<{
    data: Date;
    horasTrabalhadas: number;
    observacoes: string;
  }>;
  totalHoras: number;
}

async function corrigirPeDePato() {
  console.log('='.repeat(80));
  console.log('CORRECAO - PE DE PATO 2023 - NOMES NAO ENCONTRADOS');
  console.log('='.repeat(80));

  const workbook = XLSX.readFile(ARQUIVO_PLANILHA);
  const sheet = workbook.Sheets['Planilha1'];
  if (!sheet) {
    console.error('Aba "Planilha1" nao encontrada!');
    return;
  }

  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

  // Estrutura: col 0=Nº, col 1=Produtor, col 2=Data, col 3=HoraInicial, col 4=HoraFinal, col 5=Total
  // Dados iniciam na linha 3 (indice 3), igual ao script original
  const porProdutor = new Map<string, RegistroPeDePato>();

  for (let i = 3; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 6) continue;

    const nomeRaw = String(row[1] || '').trim();
    if (!nomeRaw || nomeRaw.length < 3) continue;
    if (nomeRaw.toLowerCase().includes('prefeitura')) continue;

    const horasTrabalhadas = Number(row[5]) || 0;
    if (horasTrabalhadas <= 0) continue;

    let data: Date;
    const dataRaw = row[2];
    if (typeof dataRaw === 'number') {
      data = excelDateToJSDate(dataRaw);
    } else {
      data = new Date(ANO_REFERENCIA, 5, 15);
    }

    const observacoes = '';
    const nomeNorm = normalizarParaMapear(nomeRaw);

    if (!porProdutor.has(nomeNorm)) {
      porProdutor.set(nomeNorm, {
        produtor: nomeRaw,
        produtorNorm: nomeNorm,
        sessoes: [],
        totalHoras: 0,
      });
    }

    const reg = porProdutor.get(nomeNorm)!;
    reg.sessoes.push({ data, horasTrabalhadas, observacoes });
    reg.totalHoras += horasTrabalhadas;
  }

  console.log(`\nTotal de produtores na planilha: ${porProdutor.size}`);

  // Filtrar apenas os que estao no mapeamento manual
  const parasInserir: Array<{ pessoaId: number; registro: RegistroPeDePato }> = [];

  for (const [nomeNorm, registro] of porProdutor) {
    const pessoaId = MAPEAMENTO_PESSOAS[nomeNorm];
    if (pessoaId) {
      parasInserir.push({ pessoaId, registro });
    }
  }

  console.log(`Registros com mapeamento manual encontrado: ${parasInserir.length}`);

  const stats = {
    migrados: 0,
    duplicados: 0,
    erros: 0,
    horasTotal: 0,
  };

  for (const { pessoaId, registro } of parasInserir) {
    try {
      // Verificar duplicata: ja existe registro para esta pessoa/programa/totalHoras?
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId,
          programaId: PROGRAMA_ID,
          quantidadeSolicitada: registro.totalHoras,
        }
      });

      if (existente) {
        stats.duplicados++;
        console.log(`  DUPLICADO: ${registro.produtor} (${registro.totalHoras}h)`);
        continue;
      }

      // Data: usar a ultima sessao, ou meio do ano
      const dataSolicitacao = registro.sessoes.length > 0
        ? registro.sessoes[registro.sessoes.length - 1].data
        : new Date(ANO_REFERENCIA, 5, 15);

      const obsDetalhes = registro.sessoes
        .map(s => `${s.data.toLocaleDateString('pt-BR')}: ${s.horasTrabalhadas}h${s.observacoes ? ' - ' + s.observacoes : ''}`)
        .join('; ');

      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId,
          programaId: PROGRAMA_ID,
          datasolicitacao: dataSolicitacao,
          status: 'concluido',
          observacoes: `Migrado planilha Pe de Pato 2023 | ${registro.totalHoras}h total`,
          quantidadeSolicitada: registro.totalHoras,
          valorCalculado: 0,
          modalidade: 'SERVICO',
          calculoDetalhes: {
            migradoDe: 'Planilha Pe de Pato 2023',
            totalHoras: registro.totalHoras,
            sessoes: registro.sessoes.map(s => ({
              data: s.data.toISOString(),
              horas: s.horasTrabalhadas,
              observacoes: s.observacoes,
            })),
            detalhesSessoes: obsDetalhes,
            correcaoNome: true,
          }
        }
      });

      stats.migrados++;
      stats.horasTotal += registro.totalHoras;
      console.log(`  OK: ${registro.produtor} (ID:${pessoaId}) | ${registro.totalHoras}h`);

    } catch (error) {
      stats.erros++;
      console.error(`  ERRO: ${registro.produtor}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('RESULTADO');
  console.log('='.repeat(80));
  console.log(`Migrados: ${stats.migrados}`);
  console.log(`Duplicados: ${stats.duplicados}`);
  console.log(`Erros: ${stats.erros}`);
  console.log(`Horas migradas: ${stats.horasTotal}`);
}

corrigirPeDePato()
  .then(() => { console.log('\nConcluido!'); process.exit(0); })
  .catch(e => { console.error('Erro:', e); process.exit(1); });
