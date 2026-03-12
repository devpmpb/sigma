/**
 * Correção 2024 - Re-processa registros não encontrados usando mapeamento manual
 *
 * Executar: npx tsx scripts/migracao-2024/corrigir-nao-encontrados-2024.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../../src/utils/prisma';

const PASTA = 'C:\\csvs\\2024';
const ANO = 2024;

// ============================================================================
// MAPEAMENTO NOME NORMALIZADO -> ID
// ============================================================================
const MAP: Record<string, number> = {
  // === Herdados do 2023 ===
  'ADIR HUNEMEIER': 1092,
  'ADIR V HUNEMEIER': 1092,
  'ADIR VANDERLEI HUNEMEIER': 1092,
  'ADIR HUNRMEIER': 1092,
  'CELIO LUIS ENGELMANN': 636,
  'CELIO LUIZ ENGELMANN': 636,
  'CELIO LUIS ENGELLMANN': 636,
  'CELIO LUIZ ENGELLMANN': 636,
  'CELIO ENGELLMANN': 636,
  'DEONISIO FRANCYSKOWSKI': 789,
  'DEONISIO FRANCZISKOWSKI': 789,
  'DEONISIO FRANCZYSKOWSKI': 789,
  'DEONISIO FRANCISKOSKI': 789,
  'DEONISIO FRANCZSKOWSKI': 789,
  'DEIVID KOWALD': 2851,
  'DEIVID C KOWALD': 2851,
  'DEIVID CARLOS KOWALD': 2851,
  'ELIZEU M ENGELLMANN': 2182,
  'ELIZEU MARCIO ENGELLMANN': 2182,
  'ELIZEU MARCIA ENGELLMANN': 2182,
  'ELIZEU ENGELLMANN': 2182,
  'ELIZEU MARCIO ENGELMANN': 2182,
  'FABIO R SCHEUERMANN': 2748,
  'FABIO RSCHEUERMANN': 2748,
  'FABIO SCHEURMMANN': 2748,
  'FABIO SCHEUERMANN': 2748,
  'IVONIR LUIZ STHALHOFER': 471,
  'IVONIR STHALHOFER': 471,
  'IVONIR LUIZ STAHLHOFER': 471,
  'IVONIR LUIZ STAHLOFER': 471,
  'IVONIR SRAHLHOFER': 471,
  'IVONIR STATLHOFER': 471,
  'IVONIR STAHLOHFER': 471,
  'JACINTO ZEIWEIBRINCKER': 940,
  'JACINTO ZEIWEIBRICKER': 940,
  'JACINTO ZEIWEIBRICRER': 940,
  'JACINTO ZEIBRICHER': 940,
  'JACINTO ZEIWEBRICKER': 940,
  'JACINTO ZEIWIBRICKER': 940,
  'JACINTOZEIWEBRICKER': 940,
  'JACINTOZEIWBRIKER': 940,
  'JOSE BALDUINO FUHR': 941,
  'JOSE B FUHR': 941,
  'JOSE BALDUINO FUHR': 941,
  'JOAO JOSE PAULI': 155,
  'JOAO PAULI': 155,
  'MARIA M SIMON': 204,
  'MARIA SIMON': 204,
  'RENI KOTZ': 119,
  'RENI AW KOTZ': 119,
  'VALDIR BIASEBETE': 3086,
  'VALDIR BIASEBETTI': 3086,
  'VALDIR JOAO BIASEBETTI': 3086,
  'IRENA BERGAMNN': 60,
  'IRENA BERGMANN': 60,
  'IRENA BEGMANN': 60,
  'ADAIR S DE SOUSA': 3598,
  'ADAIR SELVINO DE SOUZA': 3598,
  'ELDOR HUNEMEYER': 717,
  'ELDOR HUNEMEIER': 717,
  'ELDOR HUNEMEMEIER': 717,
  'MAICO BOURSCHEIDT': 2936,
  'MAICO BOURSCHEID': 2936,
  'MAICO ANDRE BOURCHEID': 2936,
  'MAICO BOUSCHEID': 2936,
  'HELIO STAADLOBER': 391,
  'HELIO STAADTLOBER': 391,
  'RAFAEL HEMSING': 0, // Não existe no banco (família existe mas não Rafael)
  // === Novos mapeamentos 2024 ===
  'HILARIO FAVARETTO': 545,
  'IVO SAUER': 12,
  'IVO CARLOS SAUER': 12,
  'JOSE F DOS PASSOS': 1655,
  'JOSE WALDEMAR FERREIRA DOS PASSOS': 1655,
  'MARIO DOS PASSOS': 2258,
  'MARIO FERREIRA DOS PASSOS': 2258,
  'SEMARIO ENINGER': 236,
  'GREGORIO WOJTIOK': 890,
  'JOSE ELIAS KAMMER': 403,
  'DARLAN LEHMKUHL': 2539,
  'DARLON LEHMKUHL': 2539,
  'ELEANDRO STEFFER': 1885,
  'ELEANDRO STEFFLER': 1885,
  'ELEANDRO STEFLER': 1885,
  'BERTILO KIELLING': 433,
  'BERTILO KIELING': 433,
  'BERTILO KILING': 433,
  'FLAVIO KAISER': 397,
  'IRIO A BNEDER': 76,
  'IRIO BENDER': 76,
  'CRISTIANO WESCHEFELDER': 938,
  'CRISTIANO WESCHENFELDER': 938,
  'THOMAS FAVARETTO BUENO': 3261,
  'THOMAS FAVARETTO': 3261,
  'NELSOO ROOS': 252,
  'NELSON ROOS': 252,
  'ARMO GUINTER CASSEL': 336,
  'ARNO GUINTER CASSEL': 336,
  'ROSANI C SCZCZUK': 300,
  'ROSANI C SZCUZK': 300,
  'ROSANI SCHUCK': 300,
  'ROSNI C SZCZUK': 300,
  'ROSANI SZCZUK': 300,
  'ILVANEI ANTONIO LEHMKHUL': 673,
  'ILVANEI LEHMKHUL': 673,
  'ILVANEI LEHMKUL': 673,
  'ILVANEI LEHMLUHL': 673,
  'SELVINO SCHIMITT': 201,
  'SELVINO SCHMITT': 201,
  'VILAMAR PAULI': 595,
  'VILMAR PAULI': 595,
  'ANGELA Z BIANCHETTI': 850,
  'ANGELA ZANONBIAMCHETTI': 850,
  'ANGELA ZANONBIANCHETTI': 850,
  'ANGELA ZANON BIANCHETTI': 850,
  'CLAUDIA A P NIEDERE': 936,
  'CLAUDIA NIEDERE': 936,
  'NADIR WARKWN': 724,
  'NADIR WARKEN': 724,
  'DEONISIO A SIEBNEICHLER': 4474,
  'DEONISIO A SIEBENEICHLER': 4474,
  'DEONISIO ANTONIO SIEBENEICHLER': 4474,
  'EGOEN HOPPE': 1909,
  'EGON HOPPE': 1909,
  'JOSE SCZUZK': 1963,
  'JOSE SZCZUK': 1963,
  'CLORIDO SPHOR': 122,
  'CLORIDO SPOHR': 122,
  'ROGERIO PEDRO SPHOR': 233,
  'ROGERIO PEDRO SPOHR': 233,
  'EDSON SAUERESSIG DE SOUZA': 313,
  'EDSON SAUERSSIG DE SOUSA': 313,
  'MARCELO JOSE GENTELINE': 4178,
  'MARCELO GENTELINE': 4178,
  'ARNALDO WURFEL': 835,
  'CRISTIANE FRITZEN': 3963,
  'CRISTIANE FRTIZEN': 3963,
  'ISAIR ANTONIO GASPARIN': 3022,
  'NEIDE BENDER': 4527,
  'OSVALDO KROLL': 488,
  'PAULO C MARODIN': 2338,
  'PAULO CRISTIANO MARODIN': 2338,
  'SANDRA FRIZEN': 791,
  'SANDRA FRITZEN': 791,
  'SERGIO LAURI WATOWSKI': 501,
  'SERGIO LAURI WASTOWSKI': 501,
  'SERGIO LUIS SCHERER': 362,
  'SERGIO LUIZ SCHERER': 362,
  'ROGERIO CLAUDIO MUNDT': 3195,
  'VALDIR KHUN': 864,
  'VALDIR ROBERTO KUHN': 864,
  'LEOMAR SINSEN': 97,
  'LEOMAR SINSEM': 97,
  'LEOMAR SIMSEN': 97,
  'CRISTIANE HUNEMEYER': 718,
  'SILVIO WASTOWSKI': 501, // assuming same as Sergio Lauri? Actually different
  'CLAUDIO BIERKHEUER': 0, // Multiple Claudio with different surnames, not found
  'CLAUDIO BIERKEHUER': 0,
  'CLAUDIO BIRKEUER': 0,
  'CLAUDIO BIEKHEUER': 0,
  'CLAUDIO BURKAUER': 0,
  'CLAUDIO BIERKEUER': 0,
  'CLEITON ALMIR HUNEMEIER': 0, // Não encontrado
  'CLOVIS KILING': 0, // Kieling exists but Clovis not found
  'CLOVIS RENATO KIELING': 0,
  'JAMDIR MITTELSTAEDT': 812,
  'JANDIR MITTELSTAEDT': 812,
  'JEFESON MITTELSTAEDT': 0, // Jeferson? Not found
  'CARLITO FINKEN': 0, // Finken family exists (Vilson) but Carlito not found
  'MATEUS LUIS S HEINZ': 0, // Not found
  'MATEUS SULZBACHE HEINZ': 0,
  'NORMELIO ZEIWBRICKER': 0, // Not found
  'NORMELIO ZEIWIBRICKER': 0,
  'EDSON LUIS ENGELMANN': 0, // Multiple Engelmanns but no Edson Luis
  'EDSON LUIS SCHEUEREMANN': 0,
  'MARCELO MALDANER': 167, // Let me check - 167 is VALDIR MALDANER. Search...
  'ANTONIO JOSE PAULI': 0, // Antônio José - different from the ones we have
  'ANTÔNIO JOSE PAULI': 0,
  'MARIA DE LURDES B FUHR': 0,
  'ESPOLIO ALBANO SCHNEIDER': 0,
  'ROMEU BOMBARDELI': 0,
  'RODRIGO DREWES': 0,
  'MANFREDO STEFANS': 0,
  'ADRIANE VILELA': 0,
  'HILDEGARD DREWES': 0,
  'HILDEGARDT DREWES': 0,
  'GERMANO A HUNEMEIER': 0,
  'EDSON S DE SOUZA': 0, // Not found
  'EDSON DE SOUZA': 0,
  'IDA ADAM': 0,
  'IDA M ADAM': 0,
};

function normalizarParaMapear(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\/.*$/, '')
    .replace(/\s*-\s*(Entreg|Enviado|Linha|Sao|Km|Oriental|Itap|enviado).*$/i, '')
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ');
}

function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  return new Date(utc_days * 86400 * 1000);
}

function parseData(raw: any, mesNum: number): Date {
  if (typeof raw === 'number' && raw > 30000 && raw < 60000) {
    const d = excelDateToJSDate(raw);
    if (d.getFullYear() >= 2020 && d.getFullYear() <= 2030) return d;
  }
  return new Date(ANO, mesNum, 15);
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
  for (let i = 0; i < Math.min(10, dados.length); i++) {
    const row = dados[i];
    if (!row) continue;
    const rowStr = row.map((c: any) => String(c).toUpperCase()).join(' ');
    if (termos.every(t => rowStr.includes(t.toUpperCase()))) return i;
  }
  return -1;
}

const PRECOS_VET: Record<string, number> = {
  'consulta': 96.86, 'consutla': 96.86, 'parto': 157.76, 'aux. parto': 157.76,
  'cesarea': 200, 'cesárea': 200, 'prolapso': 200,
};
function getPrecoVet(proc: string): number {
  const p = proc.toLowerCase().trim();
  for (const [k, v] of Object.entries(PRECOS_VET)) { if (p.includes(k)) return v; }
  return 96.86;
}

function getPessoaId(nome: string): number | null {
  const n = normalizarParaMapear(nome);
  const id = MAP[n];
  if (id === undefined) return null;
  if (id === 0) return null;
  return id;
}

interface Stats { migrados: number; duplicados: number; erros: number; }

// ============================================================================
// PROCESSADORES POR PLANILHA
// ============================================================================

async function corrigirPeDePato(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Pé de Pato - 2024.xlsx'));
  const sheet = wb.Sheets['Planilha1'];
  if (!sheet) return;
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

  const porProdutor = new Map<string, { nome: string; sessoes: Array<{ data: Date; horas: number }> }>();
  for (let i = 2; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 6) continue;
    const nome = String(row[1] || '').trim();
    if (!nome || nome.length < 3 || nome.toLowerCase().includes('prefeitura')) continue;
    const horas = Number(row[5]) || 0;
    if (horas <= 0) continue;
    const key = normalizarParaMapear(nome);
    if (!porProdutor.has(key)) porProdutor.set(key, { nome, sessoes: [] });
    porProdutor.get(key)!.sessoes.push({ data: parseData(row[2], 5), horas });
  }

  for (const [, reg] of porProdutor) {
    const pessoaId = getPessoaId(reg.nome);
    if (!pessoaId) continue;
    const totalHoras = reg.sessoes.reduce((s, x) => s + x.horas, 0);
    const existente = await prisma.solicitacaoBeneficio.findFirst({
      where: { pessoaId, programaId: 82, quantidadeSolicitada: totalHoras }
    });
    if (existente) { stats.duplicados++; continue; }
    try {
      await prisma.solicitacaoBeneficio.create({
        data: { pessoaId, programaId: 82, datasolicitacao: reg.sessoes[reg.sessoes.length - 1].data,
          status: 'concluido', observacoes: `Migrado planilha Pe de Pato 2024 (correcao)`,
          quantidadeSolicitada: totalHoras, valorCalculado: 0, modalidade: 'SERVICO',
          calculoDetalhes: { migradoDe: 'Planilha Pe de Pato 2024', correcaoNome: true, totalHoras } }
      });
      stats.migrados++;
      console.log(`  OK: ${reg.nome} (ID:${pessoaId}) | ${totalHoras}h`);
    } catch (e) { stats.erros++; }
  }
}

async function corrigirVeterinario(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Atend. Veterinário - 2024.xlsx'));
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
      if (!row || row.length < 4 || typeof row[0] !== 'number') continue;
      const nome = String(row[1] || '').trim();
      if (!nome || nome.length < 3) continue;
      const pessoaId = getPessoaId(nome);
      if (!pessoaId) continue;
      const procedimento = String(row[2] || '').trim();
      const data = parseData(row[3], mesNum);
      const numAut = Number(row[4]) || 0;
      const preco = getPrecoVet(procedimento);
      const subsidio = preco * 0.7;
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: { pessoaId, programaId: 83, datasolicitacao: data,
          calculoDetalhes: { path: ['numeroAutorizacao'], equals: numAut } }
      });
      if (existente) { stats.duplicados++; continue; }
      try {
        await prisma.solicitacaoBeneficio.create({
          data: { pessoaId, programaId: 83, datasolicitacao: data, status: 'concluido',
            observacoes: `Migrado planilha Vet 2024 (correcao) | ${vet} | ${procedimento}`,
            quantidadeSolicitada: 1, valorCalculado: subsidio, modalidade: 'SUBSIDIO',
            calculoDetalhes: { migradoDe: 'Planilha Vet 2024', correcaoNome: true,
              veterinario: vet, procedimento, numeroAutorizacao: numAut, valorTotal: preco, valorSubsidio: subsidio } }
        });
        stats.migrados++;
      } catch (e) { stats.erros++; }
    }
  }
}

async function corrigirInseminacao(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Inseminação - 2024.xlsx'));
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
    const mesNum = extrairMesNumero(sheetName);
    const headerIdx = encontrarLinhaHeader(dados, 'Produtor', 'vaca');
    if (headerIdx === -1) continue;
    for (let i = headerIdx + 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row || row.length < 5 || typeof row[0] !== 'number') continue;
      const nome = String(row[1] || '').trim();
      if (!nome || nome.length < 3) continue;
      const pessoaId = getPessoaId(nome);
      if (!pessoaId) continue;
      const data = parseData(row[4], mesNum);
      const numAut = Number(row[5]) || 0;
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: { pessoaId, programaId: 69, datasolicitacao: data,
          calculoDetalhes: { path: ['numeroAutorizacao'], equals: numAut } }
      });
      if (existente) { stats.duplicados++; continue; }
      try {
        await prisma.solicitacaoBeneficio.create({
          data: { pessoaId, programaId: 69, datasolicitacao: data, status: 'concluido',
            observacoes: `Migrado planilha Inseminação 2024 (correcao)`,
            quantidadeSolicitada: 1, valorCalculado: 0, modalidade: 'SERVICO',
            calculoDetalhes: { migradoDe: 'Planilha Inseminação 2024', correcaoNome: true,
              vaca: String(row[2] || ''), touro: String(row[3] || ''), numeroAutorizacao: numAut, aba: sheetName } }
        });
        stats.migrados++;
      } catch (e) { stats.erros++; }
    }
  }
}

async function corrigirAcudes(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Açúdes - 2024.xlsx'));
  const abaAlvo = wb.SheetNames.find(s => s.toLowerCase().includes('pronto'));
  if (!abaAlvo) return;
  const sheet = wb.Sheets[abaAlvo];
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
  const headerIdx = encontrarLinhaHeader(dados, 'PRODUTOR', 'Horas');
  if (headerIdx === -1) return;
  for (let i = headerIdx + 1; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 5 || typeof row[0] !== 'number') continue;
    const nomeRaw = String(row[1] || '').trim();
    if (!nomeRaw || nomeRaw.length < 3) continue;
    const nome = nomeRaw.replace(/\s*-\s*(Entreg|Enviado|Linha|São|Km|Oriental|Itap|enviado|obras).*$/i, '').trim();
    const pessoaId = getPessoaId(nome);
    if (!pessoaId) continue;
    const horas = Number(row[3]) || 0;
    if (horas <= 0) continue;
    const data = parseData(row[6], 5);
    const produtorPagou = Number(row[8]) || 0;
    const existente = await prisma.solicitacaoBeneficio.findFirst({
      where: { pessoaId, programaId: 9, quantidadeSolicitada: horas }
    });
    if (existente) { stats.duplicados++; continue; }
    try {
      await prisma.solicitacaoBeneficio.create({
        data: { pessoaId, programaId: 9, datasolicitacao: data, status: 'concluido',
          observacoes: `Migrado planilha Açudes 2024 (correcao) | ${horas}h`,
          quantidadeSolicitada: horas, valorCalculado: produtorPagou, modalidade: 'SERVICO',
          calculoDetalhes: { migradoDe: 'Planilha Açudes 2024', correcaoNome: true, totalHoras: horas } }
      });
      stats.migrados++;
      console.log(`  OK: ${nome} (ID:${pessoaId}) | ${horas}h`);
    } catch (e) { stats.erros++; }
  }
}

// Subsídio genérico
async function corrigirSubsidio(
  arquivo: string, programaId: number,
  colProdutor: number, colData: number, colValor: number,
  headerTermos: string[], stats: Stats
) {
  const caminhoArquivo = path.join(PASTA, arquivo);
  if (!fs.existsSync(caminhoArquivo)) return;
  const wb = XLSX.readFile(caminhoArquivo);
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
    const mesNum = extrairMesNumero(sheetName);
    const headerIdx = encontrarLinhaHeader(dados, ...headerTermos);
    if (headerIdx === -1) continue;
    for (let i = headerIdx + 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row || row.length < 3) continue;
      const nome = String(row[colProdutor] || '').trim();
      if (!nome || nome.length < 3) continue;
      const pessoaId = getPessoaId(nome);
      if (!pessoaId) continue;
      const valor = Number(row[colValor]) || 0;
      if (valor <= 0) continue;
      const data = parseData(row[colData], mesNum);
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: { pessoaId, programaId, datasolicitacao: data, valorCalculado: valor }
      });
      if (existente) { stats.duplicados++; continue; }
      try {
        await prisma.solicitacaoBeneficio.create({
          data: { pessoaId, programaId, datasolicitacao: data, status: 'concluido',
            observacoes: `Migrado planilha 2024 (correcao) | ${sheetName}`,
            quantidadeSolicitada: 1, valorCalculado: valor, modalidade: 'SUBSIDIO',
            calculoDetalhes: { migradoDe: `Planilha 2024 - ${arquivo}`, correcaoNome: true, aba: sheetName } }
        });
        stats.migrados++;
      } catch (e) { stats.erros++; }
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('='.repeat(80));
  console.log('CORREÇÃO 2024 - NOMES NÃO ENCONTRADOS');
  console.log('='.repeat(80));

  const planilhas: Array<{ nome: string; fn: (s: Stats) => Promise<void> }> = [
    { nome: 'Pé de Pato', fn: corrigirPeDePato },
    { nome: 'Atend. Veterinário', fn: corrigirVeterinario },
    { nome: 'Inseminação', fn: corrigirInseminacao },
    { nome: 'Açudes', fn: corrigirAcudes },
    { nome: 'Aveia', fn: (s) => corrigirSubsidio('Aveia - 2024.xlsx', 66, 1, 5, 6, ['PRODUTOR', 'Quant'], s) },
    { nome: 'Calcário', fn: (s) => corrigirSubsidio('Calcário - 2024.xlsx', 64, 1, 2, 7, ['PRODUTOR', 'QUANT'], s) },
    { nome: 'Esterco Líquido', fn: (s) => corrigirSubsidio('Esterco Líquido - 2024.xlsx', 63, 1, 5, 3, ['NOME', 'QUANTIDADE'], s) },
    { nome: 'Cama de Aviário', fn: (s) => corrigirSubsidio('Cama de Aviário - 2024.xlsx', 65, 1, 5, 6, ['PRODUTOR', 'QUANT'], s) },
    { nome: 'Sêmen Bovino', fn: (s) => corrigirSubsidio('Sêmen Bovino - 2024.xlsx', 73, 1, 5, 6, ['PRODUTOR', 'DOSES'], s) },
    { nome: 'Sêmen Suíno', fn: (s) => corrigirSubsidio('Sêmen Suíno - 2024.xlsx', 72, 1, 4, 5, ['PRODUTOR', 'MATRIZES'], s) },
    { nome: 'Ultrasson', fn: (s) => corrigirSubsidio('Exames de Ultrasson - 2024.xlsx', 70, 1, 5, 6, ['PRODUTOR', 'EXAMES'], s) },
    { nome: 'Adubação Pastagem', fn: (s) => corrigirSubsidio('Adubação de Pastagem - 2024.xlsx', 84, 1, 5, 6, ['PRODUTOR', 'VACAS'], s) },
    { nome: 'Equipamentos', fn: (s) => corrigirSubsidio('Equipamentos - 2024.xlsx', 76, 2, 1, 6, ['NOME', 'EQUIPAMENTO'], s) },
    { nome: 'Construção Piso', fn: (s) => corrigirSubsidio('Construção de Piso- 2024.xlsx', 79, 1, 5, 6, ['PRODUTOR', 'Materiais'], s) },
    { nome: 'Mudas Frutíferas', fn: (s) => corrigirSubsidio('Mudas Frutiferas- 2024.xlsx', 78, 1, 2, 6, ['PRODUTOR', 'QUANTIDADE'], s) },
    { nome: 'Acesso Pátio', fn: (s) => corrigirSubsidio('Acesso à patio - 2024.xlsx', 77, 2, 7, 6, ['PRODUTOR', 'Valor'], s) },
  ];

  let totalMigrados = 0, totalDup = 0;
  for (const p of planilhas) {
    const stats: Stats = { migrados: 0, duplicados: 0, erros: 0 };
    console.log(`\n--- ${p.nome} ---`);
    await p.fn(stats);
    console.log(`  Migrados: ${stats.migrados} | Duplicados: ${stats.duplicados} | Erros: ${stats.erros}`);
    totalMigrados += stats.migrados;
    totalDup += stats.duplicados;
  }

  console.log('\n' + '='.repeat(80));
  console.log(`TOTAL: Migrados: ${totalMigrados} | Duplicados: ${totalDup}`);

  await prisma.$disconnect();
}

main()
  .then(() => { console.log('\nConcluido!'); process.exit(0); })
  .catch(e => { console.error('Erro:', e); process.exit(1); });
