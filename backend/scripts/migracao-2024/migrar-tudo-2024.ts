/**
 * Migração unificada de todas as planilhas 2024
 *
 * Executar: npx tsx scripts/migracao-2024/migrar-tudo-2024.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../../src/utils/prisma';

const PASTA = 'C:\\csvs\\2024';
const ANO = 2024;

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

// Cache de pessoas para evitar múltiplas queries
const cachePessoas = new Map<string, number | null>();

async function buscarPessoa(nome: string): Promise<number | null> {
  const nomeNorm = normalizarNome(nome);
  if (cachePessoas.has(nomeNorm)) return cachePessoas.get(nomeNorm)!;

  // Busca exata
  const exata = await prisma.pessoa.findFirst({
    where: { nome: { equals: nome.trim(), mode: 'insensitive' } }
  });
  if (exata) { cachePessoas.set(nomeNorm, exata.id); return exata.id; }

  // Busca por primeiro + último nome
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
  return 5; // fallback: junho
}

function encontrarLinhaHeader(dados: any[][], ...termos: string[]): number {
  for (let i = 0; i < Math.min(10, dados.length); i++) {
    const row = dados[i];
    if (!row) continue;
    const rowStr = row.map((c: any) => String(c).toUpperCase()).join(' ');
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
    const d = new Date(String(raw));
    if (!isNaN(d.getTime()) && d.getFullYear() >= 2020 && d.getFullYear() <= 2030) return d;
  }
  return new Date(ANO, mesNum, 15);
}

// ============================================================================
// CONFIGURAÇÃO DE CADA PLANILHA
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

// --- Subsídio genérico por abas mensais ---
// Formato: Nº | PRODUTOR | ... | DATA | R$
// colProdutor, colData, colValor são os índices das colunas
async function processarSubsidioGenerico(
  wb: XLSX.WorkBook,
  programaId: number,
  stats: Stats,
  opts: {
    colProdutor: number;
    colData: number;
    colValor: number;
    colQuantidade?: number;
    headerTermos: string[];
    extrairDetalhes?: (row: any[], headerRow: any[]) => Record<string, any>;
  }
) {
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
    const mesNum = extrairMesNumero(sheetName);
    const headerIdx = encontrarLinhaHeader(dados, ...opts.headerTermos);
    if (headerIdx === -1) continue;

    const headerRow = dados[headerIdx];

    for (let i = headerIdx + 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row || row.length < 3) continue;

      const nome = String(row[opts.colProdutor] || '').trim();
      if (!nome || nome.length < 3) continue;

      const valor = Number(row[opts.colValor]) || 0;
      if (valor <= 0) continue;

      stats.total++;
      const data = parseData(row[opts.colData], mesNum);
      const quantidade = opts.colQuantidade !== undefined ? Number(row[opts.colQuantidade]) || 1 : 1;

      const pessoaId = await buscarPessoa(nome);
      if (!pessoaId) {
        stats.naoEncontrados++;
        if (!stats.naoEncontradosNomes.includes(nome)) stats.naoEncontradosNomes.push(nome);
        continue;
      }

      // Duplicata
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: { pessoaId, programaId, datasolicitacao: data, valorCalculado: valor }
      });
      if (existente) { stats.duplicados++; continue; }

      const detalhes = opts.extrairDetalhes ? opts.extrairDetalhes(row, headerRow) : {};

      try {
        await prisma.solicitacaoBeneficio.create({
          data: {
            pessoaId,
            programaId,
            datasolicitacao: data,
            status: 'concluido',
            observacoes: `Migrado planilha 2024 | ${sheetName}`,
            quantidadeSolicitada: quantidade,
            valorCalculado: valor,
            modalidade: 'SUBSIDIO',
            calculoDetalhes: {
              migradoDe: `Planilha 2024 - ${sheetName}`,
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

// --- Pé de Pato (formato específico) ---
async function processarPeDePato(wb: XLSX.WorkBook, programaId: number, stats: Stats) {
  const sheet = wb.Sheets['Planilha1'];
  if (!sheet) return;
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

  // Agrupar por produtor
  const porProdutor = new Map<string, { nome: string; sessoes: Array<{ data: Date; horas: number }> }>();

  for (let i = 2; i < dados.length; i++) {
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
          observacoes: `Migrado planilha Pe de Pato 2024 | ${reg.sessoes.length} sessao(es) | ${totalHoras}h`,
          quantidadeSolicitada: totalHoras,
          valorCalculado: 0,
          modalidade: 'SERVICO',
          calculoDetalhes: {
            migradoDe: 'Planilha Pe de Pato 2024',
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
  'cesarea': 200, 'cesárea': 200, 'prolapso': 200,
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
    if (sheetName.toLowerCase().includes('gustavo')) vet = 'Gustavo';
    else if (sheetName.toLowerCase().includes('jadir')) vet = 'Jadir';
    else if (sheetName.toLowerCase().includes('zardo')) vet = 'Zardo';

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
            observacoes: `Migrado planilha Vet 2024 | ${vet} | ${procedimento}`,
            quantidadeSolicitada: 1, valorCalculado: subsidio, modalidade: 'SUBSIDIO',
            calculoDetalhes: {
              migradoDe: 'Planilha Atendimento Veterinario 2024',
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

// --- Inseminação (formato específico: Nº | Produtor | Nome/nº vaca | Touro | Data | N° autor.) ---
async function processarInseminacao(wb: XLSX.WorkBook, programaId: number, stats: Stats) {
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
    const mesNum = extrairMesNumero(sheetName);
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
            observacoes: `Migrado planilha Inseminação 2024 | ${sheetName}`,
            quantidadeSolicitada: 1, valorCalculado: 0, modalidade: 'SERVICO',
            calculoDetalhes: {
              migradoDe: 'Planilha Inseminação 2024',
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
  const headerIdx = encontrarLinhaHeader(dados, 'PRODUTOR', 'Horas');
  if (headerIdx === -1) return;

  const VR = 179.26;

  for (let i = headerIdx + 1; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 5) continue;
    if (typeof row[0] !== 'number') continue;
    const nomeRaw = String(row[1] || '').trim();
    if (!nomeRaw || nomeRaw.length < 3) continue;
    // Remove sufixo " - Entrega..." do nome
    const nome = nomeRaw.replace(/\s*-\s*(Entreg|Linha|São|Km|Oriental|Itap).*$/i, '').trim();
    const horas = Number(row[3]) || 0;
    if (horas <= 0) continue;
    const situacao = String(row[5] || '').trim().toLowerCase();
    if (!situacao.includes('pronta') && !situacao.includes('conclu')) continue;
    const data = parseData(row[6], 5);
    const produtorPagou = Number(row[8]) || 0;

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
          observacoes: `Migrado planilha Açudes 2024 | ${horas}h`,
          quantidadeSolicitada: horas, valorCalculado: produtorPagou, modalidade: 'SERVICO',
          calculoDetalhes: {
            migradoDe: 'Planilha Açudes 2024',
            totalHoras: horas, valorVR: VR, produtorPagou,
            servico: String(row[2] || ''),
          }
        }
      });
      stats.migrados++;
      stats.valorTotal += produtorPagou;
    } catch (e) { stats.erros++; }
  }
}

// --- Empréstimo de Equipamentos (formato texto livre, diferente) ---
async function processarEmprestimos(wb: XLSX.WorkBook, programaId: number, stats: Stats) {
  // Formato muito diferente, pular por enquanto
  console.log('  (formato nao padronizado, pular)');
}

// --- Acesso a Pátio ---
async function processarAcessoPatio(wb: XLSX.WorkBook, programaId: number, stats: Stats) {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
  const headerIdx = encontrarLinhaHeader(dados, 'PRODUTOR', 'Valor');
  if (headerIdx === -1) return;

  for (let i = headerIdx + 1; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 7) continue;
    const nome = String(row[2] || '').trim(); // col 2 = PRODUTOR
    if (!nome || nome.length < 3) continue;
    const valor = Number(row[6]) || 0;
    if (valor <= 0) continue;
    const m3 = Number(row[4]) || 0;

    stats.total++;
    const pessoaId = await buscarPessoa(nome);
    if (!pessoaId) {
      stats.naoEncontrados++;
      if (!stats.naoEncontradosNomes.includes(nome)) stats.naoEncontradosNomes.push(nome);
      continue;
    }

    const existente = await prisma.solicitacaoBeneficio.findFirst({
      where: { pessoaId, programaId, valorCalculado: valor }
    });
    if (existente) { stats.duplicados++; continue; }

    try {
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId, programaId, datasolicitacao: new Date(ANO, 3, 15),
          status: 'concluido',
          observacoes: `Migrado planilha Acesso Patio 2024 | ${m3} m³ pedras`,
          quantidadeSolicitada: m3, valorCalculado: valor, modalidade: 'SUBSIDIO',
          calculoDetalhes: {
            migradoDe: 'Planilha Acesso a Patio 2024',
            m3Pedras: m3, protocolo: String(row[1] || ''),
          }
        }
      });
      stats.migrados++;
      stats.valorTotal += valor;
    } catch (e) { stats.erros++; }
  }
}

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const MIGRACOES: MigracaoConfig[] = [
  {
    arquivo: 'Pé de Pato - 2024.xlsx',
    programaId: 82,
    modalidade: 'SERVICO',
    processar: processarPeDePato,
  },
  {
    arquivo: 'Atend. Veterinário - 2024.xlsx',
    programaId: 83,
    modalidade: 'SUBSIDIO',
    processar: processarVeterinario,
  },
  {
    arquivo: 'Inseminação - 2024.xlsx',
    programaId: 69,
    modalidade: 'SERVICO',
    processar: processarInseminacao,
  },
  {
    arquivo: 'Açúdes - 2024.xlsx',
    programaId: 9,
    modalidade: 'SERVICO',
    processar: processarAcudes,
  },
  {
    arquivo: 'Aveia - 2024.xlsx',
    programaId: 66,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 5, colValor: 6, colQuantidade: 3,
      headerTermos: ['PRODUTOR', 'Quant'],
      extrairDetalhes: (row) => ({ linha: String(row[2] || ''), quantidade: Number(row[3]) || 0 }),
    }),
  },
  {
    arquivo: 'Calcário - 2024.xlsx',
    programaId: 64,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 2, colValor: 7, colQuantidade: 6,
      headerTermos: ['PRODUTOR', 'QUANT'],
      extrairDetalhes: (row) => ({
        linha: String(row[3] || ''), empresa: String(row[4] || ''),
        autorizacao: Number(row[5]) || 0, toneladas: Number(row[6]) || 0,
      }),
    }),
  },
  {
    arquivo: 'Esterco Líquido - 2024.xlsx',
    programaId: 63,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 5, colValor: 3, colQuantidade: 2,
      headerTermos: ['NOME', 'QUANTIDADE'],
      extrairDetalhes: (row) => ({ quantidade: Number(row[2]) || 0, autorizacao: Number(row[4]) || 0 }),
    }),
  },
  {
    arquivo: 'Cama de Aviário - 2024.xlsx',
    programaId: 65,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 5, colValor: 6, colQuantidade: 3,
      headerTermos: ['PRODUTOR', 'QUANT'],
      extrairDetalhes: (row) => ({
        linha: String(row[2] || ''), toneladas: Number(row[3]) || 0, autorizacao: Number(row[4]) || 0,
      }),
    }),
  },
  {
    arquivo: 'Sêmen Bovino - 2024.xlsx',
    programaId: 73,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 5, colValor: 6, colQuantidade: 4,
      headerTermos: ['PRODUTOR', 'DOSES'],
      extrairDetalhes: (row) => ({
        linha: String(row[2] || ''), femeas: Number(row[3]) || 0, doses: Number(row[4]) || 0,
      }),
    }),
  },
  {
    arquivo: 'Sêmen Suíno - 2024.xlsx',
    programaId: 72,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 4, colValor: 5, colQuantidade: 3,
      headerTermos: ['PRODUTOR', 'MATRIZES'],
      extrairDetalhes: (row) => ({ linha: String(row[2] || ''), matrizes: Number(row[3]) || 0 }),
    }),
  },
  {
    arquivo: 'Exames de Ultrasson - 2024.xlsx',
    programaId: 70,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 5, colValor: 6, colQuantidade: 4,
      headerTermos: ['PRODUTOR', 'EXAMES'],
      extrairDetalhes: (row) => ({
        linha: String(row[2] || ''), femeas: Number(row[3]) || 0, exames: Number(row[4]) || 0,
      }),
    }),
  },
  {
    arquivo: 'Silo - 2024.xlsx',
    programaId: 75,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 6, colValor: 7,
      headerTermos: ['PRODUTOR', 'Materiais'],
      extrairDetalhes: (row) => ({
        linha: String(row[2] || ''), materiais: String(row[3] || ''), empresa: String(row[4] || ''),
      }),
    }),
  },
  {
    arquivo: 'Piscicultura - 2024.xlsx',
    programaId: 9,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 2, colValor: 4,
      headerTermos: ['PRODUTOR', 'QUANT'],
      extrairDetalhes: (row) => ({ linha: String(row[3] || '') }),
    }),
  },
  {
    arquivo: 'Adubação de Pastagem - 2024.xlsx',
    programaId: 84,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 5, colValor: 6, colQuantidade: 3,
      headerTermos: ['PRODUTOR', 'VACAS'],
      extrairDetalhes: (row) => ({
        linha: String(row[2] || ''), numVacas: Number(row[3]) || 0, insumos: String(row[4] || ''),
      }),
    }),
  },
  {
    arquivo: 'Apicultura - 2024.xlsx',
    programaId: 85,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 2, colValor: 6,
      headerTermos: ['PRODUTOR', 'PRODUTO'],
      extrairDetalhes: (row) => ({
        linha: String(row[3] || ''), produto: String(row[4] || ''), empresa: String(row[5] || ''),
      }),
    }),
  },
  {
    arquivo: 'Equipamentos - 2024.xlsx',
    programaId: 76,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 2, colData: 1, colValor: 6,
      headerTermos: ['NOME', 'EQUIPAMENTO'],
      extrairDetalhes: (row) => ({
        linha: String(row[3] || ''), empresa: String(row[4] || ''), equipamento: String(row[5] || ''),
      }),
    }),
  },
  {
    arquivo: 'Construção de Piso- 2024.xlsx',
    programaId: 79,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 5, colValor: 6,
      headerTermos: ['PRODUTOR', 'Materiais'],
      extrairDetalhes: (row) => ({
        linha: String(row[2] || ''), materiais: String(row[3] || ''), empresa: String(row[4] || ''),
      }),
    }),
  },
  {
    arquivo: 'Mudas Frutiferas- 2024.xlsx',
    programaId: 78,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 2, colValor: 6, colQuantidade: 5,
      headerTermos: ['PRODUTOR', 'QUANTIDADE'],
      extrairDetalhes: (row) => ({
        linha: String(row[3] || ''), empresa: String(row[4] || ''), quantidade: Number(row[5]) || 0,
      }),
    }),
  },
  {
    arquivo: 'Pescador Profissional - 2024.xlsx',
    programaId: 86,
    modalidade: 'SUBSIDIO',
    processar: (wb, pid, st) => processarSubsidioGenerico(wb, pid, st, {
      colProdutor: 1, colData: 4, colValor: 5,
      headerTermos: ['PRODUTOR'],
      extrairDetalhes: (row) => ({ linha: String(row[2] || '') }),
    }),
  },
  {
    arquivo: 'Acesso à patio - 2024.xlsx',
    programaId: 77,
    modalidade: 'SUBSIDIO',
    processar: processarAcessoPatio,
  },
  {
    arquivo: 'Empréstimos de Equipamentos.xlsx',
    programaId: 87,
    modalidade: 'SERVICO',
    processar: processarEmprestimos,
  },
];

// ============================================================================
// EXECUÇÃO
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('MIGRAÇÃO COMPLETA 2024');
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
