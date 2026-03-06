/**
 * Script de Migracao - Atendimento Veterinario 2023
 *
 * Planilha: Atend. Veterinario - 2023.xlsx
 * 27 abas (por mes/veterinario: Gustavo, Jadir, Zardo)
 * Programa no SIGMA: ID 83 - "Atendimento Veterinario"
 *
 * Estrutura: N° | PRODUTOR | PROCEDIMENTO | DATA | N° AUTOR.
 *
 * Precos por procedimento (baseado nos totais das abas):
 *   Consulta:         R$ 96,86
 *   Parto/Aux.Parto:  R$ 157,76
 *   Cesarea:          R$ 200,00 (estimado)
 *   Prolapso:         R$ 200,00 (estimado)
 *
 * Lei 1414/2014: municipio subsidia 70%, produtor paga 30%
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import prisma from '../../src/utils/prisma';

const ARQUIVO_PLANILHA = 'C:\\csvs\\Atend. Veterinário - 2023.xlsx';
const PROGRAMA_ID = 83; // Atendimento Veterinario
const ANO_REFERENCIA = 2023;

// Precos por procedimento (valor total - municipio paga 70%)
const PRECOS: Record<string, number> = {
  'consulta':          96.86,
  'parto':            157.76,
  'aux. parto':       157.76,
  'cesarea':          200.00,
  'cesárea':          200.00,
  'prolapso':         200.00,
  'prolapso de utero': 200.00,
  'prolapso de útero': 200.00,
};

function getPreco(procedimento: string): number {
  const proc = procedimento.toLowerCase().trim();
  for (const [key, valor] of Object.entries(PRECOS)) {
    if (proc.includes(key)) return valor;
  }
  return 96.86; // default: consulta
}

interface RegistroVet {
  produtor: string;
  procedimento: string;
  data: Date;
  numeroAutorizacao: number;
  veterinario: string;
  mes: string;
  valorTotal: number;
  valorSubsidio: number; // 70% municipio
  valorProdutor: number; // 30% produtor
}

function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

function normalizarNome(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Extrai veterinario do nome da aba
function extrairVeterinario(aba: string): string {
  if (aba.toLowerCase().includes('gustavo')) return 'Gustavo';
  if (aba.toLowerCase().includes('jadir')) return 'Jadir';
  if (aba.toLowerCase().includes('zardo')) return 'Zardo';
  return 'Desconhecido';
}

// Extrai mes do nome da aba
function extrairMes(aba: string): string {
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  for (const mes of meses) {
    if (aba.toLowerCase().includes(mes)) return mes;
  }
  return 'desconhecido';
}

function mesParaNumero(mes: string): number {
  const meses: Record<string, number> = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
    'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
    'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  };
  return meses[mes.toLowerCase()] ?? 0;
}

// Extrair registros de uma aba
function extrairRegistrosAba(
  workbook: XLSX.WorkBook,
  sheetName: string
): RegistroVet[] {
  const sheet = workbook.Sheets[sheetName];
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
  const registros: RegistroVet[] = [];
  const vet = extrairVeterinario(sheetName);
  const mes = extrairMes(sheetName);
  const mesNum = mesParaNumero(mes);

  // Encontrar cabecalho
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

// Busca pessoa por nome
async function buscarPessoaPorNome(nome: string): Promise<number | null> {
  // Limpar sufixos de parenteses e abreviacoes
  const nomeLimpo = nome.replace(/\s*\/.*$/, '').trim(); // remove "/ Rosani" etc

  const pessoaExata = await prisma.pessoa.findFirst({
    where: { nome: { equals: nomeLimpo, mode: 'insensitive' } }
  });
  if (pessoaExata) return pessoaExata.id;

  const palavras = nomeLimpo.split(' ').filter(p => p.length > 2 && !p.endsWith('.'));
  if (palavras.length >= 2) {
    const pessoas = await prisma.pessoa.findMany({
      where: {
        AND: [
          { nome: { contains: palavras[0], mode: 'insensitive' } },
          { nome: { contains: palavras[palavras.length - 1], mode: 'insensitive' } },
        ]
      }
    });

    if (pessoas.length === 1) return pessoas[0].id;

    const nomeNorm = normalizarNome(nomeLimpo);
    for (const pessoa of pessoas) {
      const pessoaNorm = normalizarNome(pessoa.nome);
      if (pessoaNorm.includes(nomeNorm) || nomeNorm.includes(pessoaNorm)) {
        return pessoa.id;
      }
    }
  }

  return null;
}

async function migrarAtendimentoVeterinario() {
  console.log('='.repeat(80));
  console.log('MIGRACAO - ATENDIMENTO VETERINARIO 2023');
  console.log('='.repeat(80));

  const programa = await prisma.programa.findUnique({ where: { id: PROGRAMA_ID } });
  if (!programa) {
    console.error(`Programa ID ${PROGRAMA_ID} nao encontrado!`);
    return;
  }
  console.log(`Programa: ${programa.nome} (ID: ${programa.id})`);

  const workbook = XLSX.readFile(ARQUIVO_PLANILHA);
  console.log(`Arquivo: ${path.basename(ARQUIVO_PLANILHA)}`);
  console.log(`Abas: ${workbook.SheetNames.length}`);

  // Extrair todos os registros
  const todosRegistros: RegistroVet[] = [];
  for (const aba of workbook.SheetNames) {
    const regs = extrairRegistrosAba(workbook, aba);
    console.log(`  ${aba}: ${regs.length} registros`);
    todosRegistros.push(...regs);
  }

  console.log(`\nTotal de registros: ${todosRegistros.length}`);

  // Contagem por procedimento
  const porProc: Record<string, number> = {};
  for (const r of todosRegistros) {
    const p = r.procedimento.toLowerCase().trim();
    porProc[p] = (porProc[p] || 0) + 1;
  }
  console.log('\nProcedimentos:');
  Object.entries(porProc).sort((a, b) => b[1] - a[1]).forEach(([p, n]) =>
    console.log(`  ${p}: ${n}`)
  );

  const stats = {
    total: todosRegistros.length,
    migrados: 0,
    duplicados: 0,
    pessoasNaoEncontradas: 0,
    erros: 0,
    valorSubsidioTotal: 0,
    pessoasNaoEncontradasNomes: new Set<string>(),
  };

  console.log('\nProcessando registros...');

  for (const registro of todosRegistros) {
    try {
      const pessoaId = await buscarPessoaPorNome(registro.produtor);

      if (!pessoaId) {
        stats.pessoasNaoEncontradas++;
        stats.pessoasNaoEncontradasNomes.add(registro.produtor);
        continue;
      }

      // Verificar duplicata por numero de autorizacao (unico por atendimento)
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
          valorCalculado: registro.valorSubsidio, // municipio paga 70%
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
          }
        }
      });

      stats.migrados++;
      stats.valorSubsidioTotal += registro.valorSubsidio;

      if (stats.migrados % 100 === 0) {
        console.log(`  Migrados: ${stats.migrados}/${todosRegistros.length}`);
      }

    } catch (error) {
      stats.erros++;
      console.error(`  ERRO: ${registro.produtor}:`, error);
    }
  }

  // Relatorio
  console.log('\n' + '='.repeat(80));
  console.log('RELATORIO FINAL');
  console.log('='.repeat(80));
  console.log(`Total de registros: ${stats.total}`);
  console.log(`Migrados: ${stats.migrados}`);
  console.log(`Duplicados: ${stats.duplicados}`);
  console.log(`Pessoas nao encontradas: ${stats.pessoasNaoEncontradas}`);
  console.log(`Erros: ${stats.erros}`);
  console.log(`Valor total subsidio municipio (70%): R$ ${stats.valorSubsidioTotal.toFixed(2)}`);

  if (stats.pessoasNaoEncontradasNomes.size > 0) {
    console.log('\nPessoas nao encontradas:');
    const nomes = Array.from(stats.pessoasNaoEncontradasNomes).sort();
    nomes.forEach(n => console.log(`  - ${n}`));
  }
}

migrarAtendimentoVeterinario()
  .then(() => { console.log('\nMigracao concluida!'); process.exit(0); })
  .catch(e => { console.error('Erro:', e); process.exit(1); });
