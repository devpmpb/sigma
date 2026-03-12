/**
 * Migração unificada de todas as planilhas 2025
 *
 * Executar: npx tsx scripts/migracao-2025/migrar-tudo-2025.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../../src/utils/prisma';

const PASTA = 'C:\\csvs\\2025';
const ANO = 2025;

// ============================================================================
// UTILIDADES
// ============================================================================

function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  return new Date(utc_days * 86400 * 1000);
}

function normalizarNome(nome: string): string {
  return nome.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const cachePessoas = new Map<string, number | null>();

async function buscarPessoa(nome: string): Promise<number | null> {
  const nomeNorm = normalizarNome(nome);
  if (cachePessoas.has(nomeNorm)) return cachePessoas.get(nomeNorm)!;

  const exata = await prisma.pessoa.findFirst({
    where: { nome: { equals: nome.trim(), mode: 'insensitive' } }
  });
  if (exata) { cachePessoas.set(nomeNorm, exata.id); return exata.id; }

  const palavras = nome.trim().split(' ').filter(p => p.length > 2);
  if (palavras.length >= 2) {
    const pessoas = await prisma.pessoa.findMany({
      where: {
        AND: [
          { nome: { contains: palavras[0], mode: 'insensitive' } },
          { nome: { contains: palavras[palavras.length - 1], mode: 'insensitive' } },
        ]
      }
    });

    if (pessoas.length === 1) {
      cachePessoas.set(nomeNorm, pessoas[0].id);
      return pessoas[0].id;
    }

    for (const pessoa of pessoas) {
      const pessoaNorm = normalizarNome(pessoa.nome);
      if (pessoaNorm.includes(nomeNorm) || nomeNorm.includes(pessoaNorm)) {
        cachePessoas.set(nomeNorm, pessoa.id);
        return pessoa.id;
      }
    }
  }

  cachePessoas.set(nomeNorm, null);
  return null;
}

function extrairMesNumero(aba: string): number {
  const meses: Record<string, number> = {
    'janeiro': 0, 'fevereiro': 1, 'marco': 2, 'abril': 3,
    'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
    'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  };
  const abaNorm = aba.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [mes, num] of Object.entries(meses)) {
    if (abaNorm.includes(mes)) return num;
  }
  return 5;
}

function encontrarLinhaHeader(dados: any[][], ...termos: string[]): number {
  // Procura a linha que contém TODOS os termos, mas ignora linhas de título
  // (títulos costumam ter "PRODUTORES QUE RECEBERAM" e não são headers reais)
  for (let i = 0; i < Math.min(15, dados.length); i++) {
    const row = dados[i];
    if (!row) continue;
    const rowStr = row.map((c: any) => String(c).toUpperCase()).join(' ');
    // Pula linhas de título
    if (rowStr.includes('PRODUTORES QUE RECEBERAM') || rowStr.includes('RELATÓRIO DE')) continue;
    if (termos.every(t => rowStr.includes(t.toUpperCase()))) return i;
  }
  return -1;
}

function parseData(raw: any, mesNum: number): Date {
  if (typeof raw === 'number' && raw > 30000 && raw < 60000) {
    const d = excelDateToJSDate(raw);
    if (d.getFullYear() >= 2020 && d.getFullYear() <= 2030) return d;
  }
  if (raw && typeof raw !== 'number' && String(raw).trim()) {
    const s = String(raw).trim();
    // Tenta formato dd/mm/yyyy
    const match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (match) {
      let ano = parseInt(match[3]);
      if (ano < 100) ano += 2000;
      const d = new Date(ano, parseInt(match[2]) - 1, parseInt(match[1]));
      if (!isNaN(d.getTime()) && d.getFullYear() >= 2020 && d.getFullYear() <= 2030) return d;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 2020 && d.getFullYear() <= 2030) return d;
  }
  return new Date(ANO, mesNum, 15);
}

// ============================================================================
// TIPOS
// ============================================================================

interface MigracaoConfig {
  arquivo: string;
  programaId: number;
  modalidade: string;
  processar: (wb: XLSX.WorkBook, programaId: number, stats: Stats) => Promise<void>;
}

interface Stats {
  total: number;
  migrados: number;
  duplicados: number;
  naoEncontrados: number;
  erros: number;
  naoEncontradosNomes: string[];
  valorTotal: number;
}

function novoStats(): Stats {
  return { total: 0, migrados: 0, duplicados: 0, naoEncontrados: 0, erros: 0, naoEncontradosNomes: [], valorTotal: 0 };
}

// ============================================================================
// PROCESSADORES
// ============================================================================

// Encontra indice de coluna no header que contém um dos termos
function encontrarColuna(headerRow: any[], ...termos: string[]): number {
  for (let i = 0; i < headerRow.length; i++) {
    const h = String(headerRow[i] || '').toUpperCase();
    if (termos.some(t => h.includes(t.toUpperCase()))) return i;
  }
  return -1;
}

// --- Subsídio genérico DINÂMICO por abas mensais ---
// Detecta automaticamente as colunas de R$/VALOR e DATA no header de cada aba
async function processarSubsidioGenerico(
  wb: XLSX.WorkBook,
  programaId: number,
  stats: Stats,
  opts: {
    colProdutor: number;
    headerTermos: string[];
    colQuantidadeTermos?: string[];
    extrairDetalhesDinamico?: (row: any[], headerRow: any[]) => Record<string, any>;
  },
) {
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
    const mesNum = extrairMesNumero(sheetName);
    const headerIdx = encontrarLinhaHeader(dados, ...opts.headerTermos);
    if (headerIdx === -1) continue;

    const headerRow = dados[headerIdx];

    // Detectar colunas dinamicamente
    const colValor = encontrarColuna(headerRow, 'R$', 'VALOR');
    if (colValor === -1) continue;
    const colData = encontrarColuna(headerRow, 'DATA');
    const colQuant = opts.colQuantidadeTermos
      ? encontrarColuna(headerRow, ...opts.colQuantidadeTermos)
      : -1;

    for (let i = headerIdx + 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row || row.length < 3) continue;

      const nome = String(row[opts.colProdutor] || '').trim();
      if (!nome || nome.length < 3) continue;

      const valor = Number(row[colValor]) || 0;
      if (valor <= 0) continue;

      stats.total++;
      const data = colData >= 0 ? parseData(row[colData], mesNum) : new Date(ANO, mesNum, 15);
      const quantidade = colQuant >= 0 ? Number(row[colQuant]) || 1 : 1;

      const pessoaId = await buscarPessoa(nome);
      if (!pessoaId) {
        stats.naoEncontrados++;
        if (!stats.naoEncontradosNomes.includes(nome)) stats.naoEncontradosNomes.push(nome);
        continue;
      }

      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: { pessoaId, programaId, datasolicitacao: data, valorCalculado: valor }
      });
      if (existente) { stats.duplicados++; continue; }

      const detalhes = opts.extrairDetalhesDinamico ? opts.extrairDetalhesDinamico(row, headerRow) : {};

      try {
        await prisma.solicitacaoBeneficio.create({
          data: {
            pessoaId,
            programaId,
            datasolicitacao: data,
            status: 'concluido',
            observacoes: `Migrado planilha 2025 | ${sheetName}`,
            quantidadeSolicitada: quantidade,
            valorCalculado: valor,
            modalidade: 'SUBSIDIO',
            calculoDetalhes: {
              migradoDe: `Planilha 2025 - ${sheetName}`,
              aba: sheetName,
              ...detalhes,
            }
          }
        });
        stats.migrados++;
        stats.valorTotal += valor;
      } catch (e) {
        stats.erros++;
      }
    }
  }
}

// --- Pé de Pato (formato horas máquina) ---
async function processarPeDePato(wb: XLSX.WorkBook, programaId: number, stats: Stats) {
  const sheet = wb.Sheets['Planilha1'];
  if (!sheet) return;
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

  // Header na linha 2 (index 2): Nº | Produtor | Data | Hora Inicial | Hora Final | Total | Horas Disponíveis
  const porProdutor = new Map<string, { nome: string; sessoes: Array<{ data: Date; horas: number }> }>();

  for (let i = 3; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 6) continue;
    const nome = String(row[1] || '').trim();
    if (!nome || nome.length < 3 || nome.toLowerCase().includes('prefeitura')) continue;
    const horas = Number(row[5]) || 0;
    if (horas <= 0) continue;
    const data = parseData(row[2], 5);
    const key = normalizarNome(nome);
    if (!porProdutor.has(key)) porProdutor.set(key, { nome, sessoes: [] });
    porProdutor.get(key)!.sessoes.push({ data, horas });
  }

  for (const [, reg] of porProdutor) {
    stats.total++;
    const totalHoras = reg.sessoes.reduce((s, x) => s + x.horas, 0);
    const pessoaId = await buscarPessoa(reg.nome);
    if (!pessoaId) {
      stats.naoEncontrados++;
      if (!stats.naoEncontradosNomes.includes(reg.nome)) stats.naoEncontradosNomes.push(reg.nome);
      continue;
    }

    const existente = await prisma.solicitacaoBeneficio.findFirst({
      where: { pessoaId, programaId, quantidadeSolicitada: totalHoras }
    });
    if (existente) { stats.duplicados++; continue; }

    try {
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId, programaId,
          datasolicitacao: reg.sessoes[reg.sessoes.length - 1].data,
          status: 'concluido',
          observacoes: `Migrado planilha Pe de Pato 2025 | ${reg.sessoes.length} sessao(es) | ${totalHoras}h`,
          quantidadeSolicitada: totalHoras,
          valorCalculado: 0,
          modalidade: 'SERVICO',
          calculoDetalhes: {
            migradoDe: 'Planilha Pe de Pato 2025',
            totalHoras, totalSessoes: reg.sessoes.length,
            sessoes: reg.sessoes.map(s => ({ data: s.data.toISOString().split('T')[0], horas: s.horas })),
          }
        }
      });
      stats.migrados++;
    } catch (e) { stats.erros++; }
  }
}

// --- Atendimento Veterinário ---
const PRECOS_VET: Record<string, number> = {
  'consulta': 96.86, 'consutla': 96.86, 'parto': 157.76, 'aux. parto': 157.76,
  'cesarea': 200, 'cesárea': 200, 'cesaria': 200, 'prolapso': 200,
};
function getPrecoVet(proc: string): number {
  const p = proc.toLowerCase().trim();
  for (const [k, v] of Object.entries(PRECOS_VET)) { if (p.includes(k)) return v; }
  return 96.86;
}

async function processarVeterinario(wb: XLSX.WorkBook, programaId: number, stats: Stats) {
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
    const mesNum = extrairMesNumero(sheetName);
    const headerIdx = encontrarLinhaHeader(dados, 'PRODUTOR', 'PROCEDIMENTO');
    if (headerIdx === -1) continue;

    let vet = 'Desconhecido';
    const sn = sheetName.toLowerCase();
    if (sn.includes('gustavo')) vet = 'Gustavo';
    else if (sn.includes('jadir')) vet = 'Jadir';
    else if (sn.includes('zardo')) vet = 'Zardo';

    for (let i = headerIdx + 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row || row.length < 4) continue;
      if (typeof row[0] !== 'number') continue;
      const nome = String(row[1] || '').trim();
      if (!nome || nome.length < 3) continue;
      const procedimento = String(row[2] || '').trim();
      const data = parseData(row[3], mesNum);
      const numAut = Number(row[4]) || 0;
      const preco = getPrecoVet(procedimento);
      const subsidio = preco * 0.7;

      stats.total++;
      const pessoaId = await buscarPessoa(nome);
      if (!pessoaId) {
        stats.naoEncontrados++;
        if (!stats.naoEncontradosNomes.includes(nome)) stats.naoEncontradosNomes.push(nome);
        continue;
      }

      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId, programaId, datasolicitacao: data,
          calculoDetalhes: { path: ['numeroAutorizacao'], equals: numAut }
        }
      });
      if (existente) { stats.duplicados++; continue; }

      try {
        await prisma.solicitacaoBeneficio.create({
          data: {
            pessoaId, programaId, datasolicitacao: data,
            status: 'concluido',
            observacoes: `Migrado planilha Vet 2025 | ${vet} | ${procedimento}`,
            quantidadeSolicitada: 1, valorCalculado: subsidio, modalidade: 'SUBSIDIO',
            calculoDetalhes: {
              migradoDe: 'Planilha Atendimento Veterinario 2025',
              veterinario: vet, procedimento, numeroAutorizacao: numAut,
              valorTotal: preco, valorSubsidio: subsidio, percentual: 70, aba: sheetName,
            }
          }
        });
        stats.migrados++;
        stats.valorTotal += subsidio;
      } catch (e) { stats.erros++; }
    }
  }
}

// --- Inseminação ---
async function processarInseminacao(wb: XLSX.WorkBook, programaId: number, stats: Stats) {
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
    const mesNum = extrairMesNumero(sheetName);
    // Header na linha 2 (index 2): Nº | Produtor | Nome/nº vaca | Touro | Data insem. | N° autor.
    const headerIdx = encontrarLinhaHeader(dados, 'Produtor', 'vaca');
    if (headerIdx === -1) continue;

    for (let i = headerIdx + 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row || row.length < 5) continue;
      if (typeof row[0] !== 'number') continue;
      const nome = String(row[1] || '').trim();
      if (!nome || nome.length < 3) continue;
      const vaca = String(row[2] || '').trim();
      const touro = String(row[3] || '').trim();
      const data = parseData(row[4], mesNum);
      const numAut = Number(row[5]) || 0;

      stats.total++;
      const pessoaId = await buscarPessoa(nome);
      if (!pessoaId) {
        stats.naoEncontrados++;
        if (!stats.naoEncontradosNomes.includes(nome)) stats.naoEncontradosNomes.push(nome);
        continue;
      }

      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId, programaId, datasolicitacao: data,
          calculoDetalhes: { path: ['numeroAutorizacao'], equals: numAut }
        }
      });
      if (existente) { stats.duplicados++; continue; }

      try {
        await prisma.solicitacaoBeneficio.create({
          data: {
            pessoaId, programaId, datasolicitacao: data,
            status: 'concluido',
            observacoes: `Migrado planilha Inseminação 2025 | ${sheetName}`,
            quantidadeSolicitada: 1, valorCalculado: 0, modalidade: 'SERVICO',
            calculoDetalhes: {
              migradoDe: 'Planilha Inseminação 2025',
              vaca, touro, numeroAutorizacao: numAut, aba: sheetName,
            }
          }
        });
        stats.migrados++;
      } catch (e) { stats.erros++; }
    }
  }
}

// --- Açudes (aba "Açúdes Prontos") ---
async function processarAcudes(wb: XLSX.WorkBook, programaId: number, stats: Stats) {
  const abaAlvo = wb.SheetNames.find(s => s.toLowerCase().includes('pronto'));
  if (!abaAlvo) { console.log('  Aba "Prontos" nao encontrada'); return; }

  const sheet = wb.Sheets[abaAlvo];
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
  // Colunas: Nº | PRODUTOR | Serviço | M³ Pedras | Horas | Máquina | Situação | Data | Data Término | Produtor Pagou
  const headerIdx = encontrarLinhaHeader(dados, 'PRODUTOR', 'Horas');
  if (headerIdx === -1) return;

  const VR = 188.00; // Valor VR 2025

  for (let i = headerIdx + 1; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 5) continue;
    if (typeof row[0] !== 'number') continue;
    const nomeRaw = String(row[1] || '').trim();
    if (!nomeRaw || nomeRaw.length < 3) continue;
    // Remove sufixos: "(Entregue...)", "- Clenio...", "(dd/mm/yyyy)", "- Enviado..."
    const nome = nomeRaw
      .replace(/\s*\(.*$/, '')           // Remove tudo após "("
      .replace(/\s*-\s*(Entreg|Enviad|Clenio|Linha|São|Km|Oriental|Itap|\d).*$/i, '')
      .trim();
    const horas = Number(row[4]) || 0;
    if (horas <= 0) continue;
    const situacao = String(row[6] || '').trim().toLowerCase();
    if (!situacao.includes('pronto') && !situacao.includes('conclu')) continue;
    const data = parseData(row[7], 5);
    const produtorPagou = Number(row[9]) || 0;

    stats.total++;
    const pessoaId = await buscarPessoa(nome);
    if (!pessoaId) {
      stats.naoEncontrados++;
      if (!stats.naoEncontradosNomes.includes(nome)) stats.naoEncontradosNomes.push(nome);
      continue;
    }

    const existente = await prisma.solicitacaoBeneficio.findFirst({
      where: { pessoaId, programaId, quantidadeSolicitada: horas }
    });
    if (existente) { stats.duplicados++; continue; }

    try {
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId, programaId, datasolicitacao: data,
          status: 'concluido',
          observacoes: `Migrado planilha Açudes 2025 | ${horas}h`,
          quantidadeSolicitada: horas, valorCalculado: produtorPagou, modalidade: 'SERVICO',
          calculoDetalhes: {
            migradoDe: 'Planilha Açudes 2025',
            totalHoras: horas, valorVR: VR, produtorPagou,
            servico: String(row[2] || ''), m3Pedras: Number(row[3]) || 0,
          }
        }
      });
      stats.migrados++;
      stats.valorTotal += produtorPagou;
    } catch (e) { stats.erros++; }
  }
}

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

// Helper: extrai detalhes dinamicamente baseado no header da aba
function extrairDetalhesPorHeader(row: any[], headerRow: any[]): Record<string, any> {
  const detalhes: Record<string, any> = {};
  for (let i = 0; i < headerRow.length; i++) {
    const h = String(headerRow[i] || '').toUpperCase().trim();
    if (!h || h === 'Nº' || h === 'N°' || h === 'PRODUTOR' || h === 'NOME' ||
        h.includes('R$') || h.includes('VALOR') || h === 'DATA') continue;
    const val = row[i];
    if (val !== '' && val !== undefined && val !== null) {
      const key = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      detalhes[key] = val;
    }
  }
  return detalhes;
}

const MIGRACOES: MigracaoConfig[] = [
  {
    arquivo: 'Pé de Pato - 2025.xlsx',
    programaId: 82,
    modalidade: 'SERVICO',
    processar: processarPeDePato,
  },
  {
    arquivo: 'Atend. Veterinário - 2025.xlsx',
    programaId: 83,
    modalidade: 'SUBSIDIO',
    processar: processarVeterinario,
  },
  {
    arquivo: 'Inseminação - 2025.xlsx',
    programaId: 69,
    modalidade: 'SERVICO',
    processar: processarInseminacao,
  },
  {
    arquivo: 'Açude - 2025.xlsx',
    programaId: 9,
    modalidade: 'SERVICO',
    processar: processarAcudes,
  },
  // Subsídios genéricos - todos usam detecção dinâmica de colunas R$/VALOR e DATA
  {
    arquivo: 'Aveia - 2025.xlsx',
    programaId: 66,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'Quant'],
      colQuantidadeTermos: ['QUANT'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Calcário - 2025.xlsx',
    programaId: 64,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'QUANT'],
      colQuantidadeTermos: ['QUANT', 'TON'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Esterco Líquido - 2025.xlsx',
    programaId: 63,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['NOME', 'QUANTIDADE'],
      colQuantidadeTermos: ['QUANTIDADE'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Cama de Aviário - 2025.xlsx',
    programaId: 65,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'QUANT'],
      colQuantidadeTermos: ['QUANT', 'TON'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Sêmen Bovino - 2025.xlsx',
    programaId: 73,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'DOSES'],
      colQuantidadeTermos: ['DOSES'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Sêmen Suíno -2025.xlsx',
    programaId: 72,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'MATRIZES'],
      colQuantidadeTermos: ['MATRIZES'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Exame de Ultrasson - 2025.xlsx',
    programaId: 70,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'EXAMES'],
      colQuantidadeTermos: ['EXAMES'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Piscicultura - 2025.xlsx',
    programaId: 9,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR'],
      colQuantidadeTermos: ['QUANT'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Adubação de Pastagem - 2025.xlsx',
    programaId: 84,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'VACAS'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Apicultura - 2025.xlsx',
    programaId: 85,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'PRODUTO'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Equipamentos - 2025.xlsx',
    programaId: 76,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 2, // col NOME (não PRODUTOR)
      headerTermos: ['NOME', 'EQUIPAMENTO'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Contrução de Piso - 2025.xlsx',
    programaId: 79,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'Materiais'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Mudas Frutíferas - 2025.xlsx',
    programaId: 78,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'QUANTIDADE'],
      colQuantidadeTermos: ['QUANTIDADE'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Pecador Profissional - 2025.xlsx',
    programaId: 86,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Sala de Ordenha - 2025.xlsx',
    programaId: 74,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'Materiais'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Chiqueiro - 2025.xlsx',
    programaId: 88,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR', 'Materiais'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
  {
    arquivo: 'Cisterna - 2025.xlsx',
    programaId: 89,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1,
      headerTermos: ['PRODUTOR'],
      extrairDetalhesDinamico: extrairDetalhesPorHeader,
    }),
  },
];

// ============================================================================
// EXECUÇÃO
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('MIGRAÇÃO COMPLETA 2025');
  console.log('='.repeat(80));

  const resultados: Array<{ arquivo: string; stats: Stats }> = [];
  const todosNaoEncontrados = new Set<string>();

  for (const config of MIGRACOES) {
    const caminhoArquivo = path.join(PASTA, config.arquivo);
    if (!fs.existsSync(caminhoArquivo)) {
      console.log(`\nARQUIVO NAO ENCONTRADO: ${config.arquivo}`);
      continue;
    }

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`PROCESSANDO: ${config.arquivo} (Programa ID: ${config.programaId})`);
    console.log('─'.repeat(80));

    const wb = XLSX.readFile(caminhoArquivo);
    const stats = novoStats();

    await config.processar(wb, config.programaId, stats);

    stats.naoEncontradosNomes.forEach(n => todosNaoEncontrados.add(n));
    resultados.push({ arquivo: config.arquivo, stats });

    console.log(`  Total: ${stats.total} | Migrados: ${stats.migrados} | Duplicados: ${stats.duplicados} | Nao encontrados: ${stats.naoEncontrados} | Erros: ${stats.erros}`);
    if (stats.valorTotal > 0) console.log(`  Valor total: R$ ${stats.valorTotal.toFixed(2)}`);
    if (stats.naoEncontradosNomes.length > 0) {
      console.log(`  Nao encontrados: ${stats.naoEncontradosNomes.join(', ')}`);
    }
  }

  // Resumo final
  console.log('\n' + '='.repeat(80));
  console.log('RESUMO FINAL');
  console.log('='.repeat(80));

  let totalGeral = 0, migradosGeral = 0, naoEncontradosGeral = 0;
  for (const { arquivo, stats } of resultados) {
    console.log(`${arquivo.padEnd(45)} | Total: ${String(stats.total).padStart(4)} | OK: ${String(stats.migrados).padStart(4)} | Dup: ${String(stats.duplicados).padStart(3)} | !: ${String(stats.naoEncontrados).padStart(3)}`);
    totalGeral += stats.total;
    migradosGeral += stats.migrados;
    naoEncontradosGeral += stats.naoEncontrados;
  }

  console.log('─'.repeat(80));
  console.log(`TOTAL: ${totalGeral} registros | Migrados: ${migradosGeral} | Nao encontrados: ${naoEncontradosGeral}`);

  if (todosNaoEncontrados.size > 0) {
    console.log(`\nPESSOAS NAO ENCONTRADAS (${todosNaoEncontrados.size} unicas):`);
    [...todosNaoEncontrados].sort().forEach(n => console.log(`  - ${n}`));
  }

  await prisma.$disconnect();
}

main()
  .then(() => { console.log('\nConcluido!'); process.exit(0); })
  .catch(e => { console.error('Erro:', e); process.exit(1); });
