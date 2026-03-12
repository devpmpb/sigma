/**
 * Correção de nomes não encontrados na migração 2022
 * Mapeia grafias diferentes para IDs corretos do banco
 *
 * Executar: npx tsx scripts/migracao-2022/corrigir-nao-encontrados-2022.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../../src/utils/prisma';

const PASTA = 'C:\\csvs\\2022';
const ANO = 2022;

// ============================================================================
// MAPEAMENTO: grafia normalizada → ID no banco
// ============================================================================
const MAP: Record<string, number> = {
  // A
  'ADIR HUNEMEIER': 1092,               // ADIR VANDERLEI HUNEMEIR (de scripts anteriores)
  'ADIR V HUNEMEIER': 1092,
  'ADIR VANDERLEI HUNEMEIER': 1092,
  'ADELMO SIMSEN': 1101,                // ADELMO SIMSEM
  'ADRINA MARIA FAVARETTO': 548,        // ADRIANA MARIA FAVARETTO
  'ALCEU BIANCHESI': 652,               // ALCEU BIANCHESSI
  'ANESIO JOSE PAULI': 600,             // ANESIO JOSÉ PAULI
  'ANGELA BIANCHETI': 850,              // ANGELA ZANON BIANCHETTI
  'ANGELA BIANCHETTI': 850,
  'ANGELA ZANON BIACHETTI': 850,
  'ANTENOR VANELI': 2910,               // ANTENOR VANELLI
  'ARI STENSKE': 450,                   // ARI STRENSKE
  'ARI STREMSKE': 450,

  // C
  'CARLOS VANDERLEI PAULWELS': 763,     // CARLOS VANDERLEI PAUWELS
  'CARLOS VANDERLEI PAULWES': 763,
  'CELIO LUIS ENGELLMANN': 636,         // CELIO LUIZ ENGELMANN
  'CELIO LUIZ ENGELLMANN': 636,
  'CIRIO WEBBER': 599,                  // CIRIO WEBER
  'CLAUCIR BECKENCAMP': 2158,           // CLAUCIR CARLOS BECKENKAMP
  'CLAUDINEI PAULI': 973,               // CLAUDENEI PAULI (de scripts anteriores)
  'CLAUDIR BECKENCAMP': 385,            // CLAUDIR JOÃO BECKENKAMP
  'CLAUDIO BIERKEHUER': 138,            // CLAUDIO BIRKHEUER
  'CLAUDIO BIERKHEUER': 138,
  'CLAUDIO BIERCKAUER': 138,
  'CLAUDIO VALDIR URHY': 432,           // CLAUDIO VALDIR UHRY
  'CLOVIS LUIS WENTZ': 3101,            // CLOVIS LUIS WENTZ (encontrado)
  'CLOVIS R KIELING': 244,              // CLOVIS RENATO KIELING (encontrado na busca)
  'CLOVIS RENATO KIELING': 244,
  'CLOVIS RENTAO KIELING': 244,
  'CRISTIANO R WESCHNFELDER': 938,      // CRISTIANO RUDOLFO WESCHENFELDER
  'CRISTIANO WESCHEMFELDER': 938,
  'CRISTIANO WESCHONFELDER': 938,

  // D
  'DACI BUHL': 345,                     // DARCI BUHL
  'DARLON DOUGLAS LEHMKHUL': 2539,      // DARLON DOUGLAS LEHMKUHL (de scripts anteriores)
  'DEIVID CARLOS KOWALD': 2851,         // DEVID CARLOS KOWALD (de scripts anteriores)
  'DEIVID KOWALD': 2851,
  'DEONISIO FRANCISKOWSKI': 789,        // DEONISIO FRANCZISKOWSKI
  'DEONISIO FRANCZINSKOWSKI': 789,
  'DEONISIO FRANCZISKOWISKI': 789,
  'DEONISIO FRANCZYSKOWSKI': 789,
  'DEONISIO FRANZISKOWOSKI': 789,
  'DIONISIO FRANCISKOWSKI': 789,
  'DIRCE SCHRAMEL': 644,                // DIRCE SCHRAMMEL
  'DJONATHAN RODRIGO WATOWSKI': 3780,   // DJONATHAN RODRIGO WASTOWSKI
  'DORVAINO BORELLI': 439,              // DORVALINO BORELLI

  // E
  'EDOSN SCHEURMANN': 0,                // Não encontrado
  'EDSON SCHEWERMANN': 0,
  'EDSON S DE SOUZA': 0,                // Não encontrado
  'EDSON SOUZA': 0,
  'EDSON DE SOUZA': 0,
  'EDUARDO LUIS KIELING SEXADO': 242,   // EDUARDO LUIS KIELING
  'ELEANDRO S WOZTIOK': 1885,           // ELEANDRO STEFLER WOJTIOK
  'ELEANDRO WOIJTIOK': 1885,
  'ELIZEU M ENGELLMANN': 2182,          // ELIZEU MARCIO ENGELMANN (de scripts anteriores)
  'ELIZEU M ENGELMMAN': 2182,
  'ELIZEU MARCIO ENGELLMANN': 2182,
  'ELZA NAVROSKI': 414,                 // ELSA NAVROSKI
  'EMERSON HENZ': 0,                    // Não encontrado
  'ERNO ECKERT': 275,                   // ERNO ECKARDT
  'EVERSON W KUNZLER': 0,               // Não encontrado

  // F
  'FABIANA J R MARCHI': 0,              // Não encontrado
  'FERNANDO BIANCHESI': 0,              // Não encontrado
  'FERNANDO STEIN PAULI': 0,            // Não encontrado
  'FLAVIO KAISER': 397,                 // FLAVIO KAISER

  // G
  'GERMANO A HUNEMEIER': 0,             // Não encontrado
  'GILMAR I BOROSKY': 603,              // GILMAR IVANIR BOROSKI
  'GIUVANE C S MARHOLT': 0,             // Não encontrado (Giuvane Cinara Szczuk Marholdt? ID 289 é feminino)
  'GIUVANE MARHOLT': 0,
  'GIUVANE SZCZUK MARHOLDT': 289,       // GIUVANE CINARA SZCZUK
  'GREGORIO WOZTIOK': 890,              // GREGORIO WOJTIOK
  'GREGORIO WOJTIOK': 890,
  'GUINTER B SCHEUERMANN': 0,           // Não encontrado
  'GUSTAVO PNEUN': 0,                   // Não encontrado

  // H
  'HELGA S SCHNEIDER': 213,             // HELGA SCHEFFLER SCHNEIDER
  'HELGA SCHEFLER SCHNEIDER': 213,
  'HELIO BIERSDORF': 0,                 // Não encontrado
  'HELIO STAADLOBER': 391,              // HELIO STAADTLOBER
  'HILDEGARD DREWES': 0,                // Não encontrado
  'HILDEGARDT DREWES': 0,
  'HILARIO FAVARETTO': 545,             // HILARIO FAVARETTO

  // I
  'IDA ADAM': 0,                         // Não encontrado
  'IDA M ADAM': 0,
  'ILVANEI A LEHMAKUHL': 673,           // ILVANEI ANTONIO LEHMKUHL
  'ILVANIR STALHOFER': 471,             // IVONIR LUIZ STAHLHOFER
  'ILVONEI LEHMKUHL': 673,              // ILVANEI ANTONIO LEHMKUHL
  'ITACIR STREGUE': 2955,               // ITACIR DA ROSA STREGE
  'IVAN JONAS SCZUZK': 1454,            // IVAN JONAS SZCZUK
  'IVANIR LUIZ STAHLHOFER': 471,        // IVONIR LUIZ STAHLHOFER
  'IVANIR STAHLHOFER': 471,
  'IVONI RLUIZ STAHLHOFER': 471,
  'IVONIR LUIZ STAAHDLHOFER': 471,
  'IVONIR LUIZ STAHLOFER': 471,
  'IVONIR STAHLHAFER': 471,
  'IVONIR STALHOFER': 471,
  'IVONIR STHAADLOBER': 391,            // HELIO STAADTLOBER? Ou IVONIR? -> ID 471 (Ivonir Stahlhofer)

  // J
  'JACINTO ZEIBRICHER': 940,            // JACINTO ZEIWEIBRICKER
  'JACIR J COTTICA': 1446,              // JACIR JUAREZ COTICA
  'JACIR JUAREZ COTTICA': 1446,
  'JAIR PAILI': 447,                    // JAIR PAULI
  'JANDIR MITELSTAEDT': 812,            // JANDIR MITTELSTAEDT
  'JANDIR MITTELSTADET': 812,
  'JANDIR MITTELSTAEDF': 812,
  'JANDIR MITTELTAEDT': 812,
  'JARDEL DE SOUZA BEGMANN': 4544,      // JARDEL DE SOUZA BERGMANN
  'JOAO JOSE PAULI': 155,               // JOAO JOSE PAULI
  'JOAO P FISHER': 59,                  // JOÃO PEDRO FISCHER
  'JOSE FUHR': 941,                     // JOSE BALDUINO FUHR
  'JULIANO GONCALVEZ': 0,               // Não encontrado

  // L
  'LAUDENAR DE QUEIROZ': 177,           // LAUDENOR DE QUEIROZ
  'LAUDENOR DE QUERIOZ': 177,
  'LAURO ROQUE EICHT': 750,             // LAURO ROQUE EICH
  'LEOMAR SIMSEM': 97,                  // LEOMAR SIMSEN
  'LIVO JOSE WOLFF': 109,               // LIVO JOSÉ WOLF
  'LUCIA J K SZCZUCK': 292,             // LUCIA JACINTA KORTHAIS SZCZUK

  // M
  'MAICO ANDRE BOURCHEID': 2936,        // MAICO ANDRE BOURSCHEID (de scripts anteriores)
  'MAICO BOURCHEIDT': 2936,
  'MAICO BOURSCHEIDT': 2936,
  'MARCELI KOPSEL': 0,                  // Vários Kopsel, sem Marceli match
  'MARCELO JOSE GENTILINE': 4178,       // MARCELO JOSÉ GENTELINE
  'MARCELO NIERDELE': 935,              // MARCELO GEOVAN NIEDERLE
  'MARIA DATSCH': 0,                    // Várias Datsch, sem Maria
  'MARIA M SIMON': 204,                 // MARIA MARGARIDA SIMON
  'MARIA MARGARIDA SIMSEN': 0,          // Não encontrado (Simsen, não Simon)
  'MARIA SIMON': 204,
  'MARIO DATSH': 774,                   // MARIO SELFREDO DATSCH
  'MARIO DATSCH': 774,
  'MARIO SELFREDO DASTCH': 774,
  'MARLON J KOHL SEXADO': 3757,         // MARLON JONATHAN KOHL
  'MARLON J MARHOLD': 0,                // Não encontrado
  'MAURICIO BACK': 761,                 // MAURICIO JOSÉ BACK

  // N
  'NESTOR WEBBER': 874,                 // NESTOR WEBER
  'NOELI KUHN': 0,                      // Não encontrado (vários Kuhn)
  'NOELI M KONRAD': 0,                  // Não encontrado
  'NOILI MARIA KONRAD': 0,

  // O
  'OSVALDO KROHL': 488,                 // OSVALDO KROLL

  // P
  'PAULO SERGIO MARSCHNER': 616,        // SERGIO PAULO MARSCHNER

  // R
  'RAQUEL SELZLER': 0,                  // Não encontrado
  'RENATO BORRELI': 650,                // RENATO BORELLI
  'RENATO BORELI': 650,
  'ROGERIO C MUNDT': 3195,              // ROGERIO CLAUDIO MUNDT
  'ROGERIO CLAUDIO MUNDT': 3195,
  'ROQUE SELZER': 219,                  // ROQUE SELZLER
  'ROQUEL SEZLER': 219,
  'ROSAI BUHR': 0,                      // Não encontrado
  'ROSANO PAULI': 0,                    // Não encontrado
  'RUBIM DAPPER': 902,                  // RUBIN JOSE DAPPER
  'RUBIM JOSE DAPPER': 902,

  // S
  'SALEZIO PAULI': 0,                   // Não encontrado
  'SERGIO LAURI WASTWOSKI': 501,        // SERGIO LAURI WASTOWSKI
  'SERGIO LAURI WASTWSKI': 501,
  'SERGIO MARCHNER': 616,               // SERGIO PAULO MARSCHNER
  'SERGIO WASTOSKI': 501,
  'SERGIO WOSTOWSKI': 501,
  'SIRLEI TERESINHA ARNOLD': 0,         // Não encontrado

  // U
  'ULLI SCHUER': 47,                    // ULLI SCHIER

  // V
  'VALDIR J MARHODT': 173,              // VALDIR JANDREI MARHOLT
  'VALIRIO LAYTER': 655,                // VALIRIO LAYTER
  'VALMOR REINKE': 0,                   // Não encontrado (vários Reinke)
  'VERA TERESINHA GUIHL': 623,          // VERA TERESINHA GIEHL
  'VILMAR MASCHALL': 0,                 // Não encontrado
  'VILMAR MARSHALL': 0,

  // W
  'WERNO WENTZ': 828,                   // VERNO WENTZ

  // Correção: IVONIR STHAADLOBER provavelmente é IVONIR STAHLHOFER
  // (mistura de Stahlhofer e Staadtlober), mantendo como 471
};

// ============================================================================
// UTILIDADES
// ============================================================================

function normalizarParaMapear(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\(.*$/, '')            // remove parênteses
    .replace(/\s*-\s*(Entreg|Enviado|Linha|Sao|Km|Oriental|Itap|enviado|obras|Clenio|\d).*$/i, '')
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
  if (raw && typeof raw !== 'number' && String(raw).trim()) {
    const s = String(raw).trim();
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
  for (let i = 0; i < Math.min(15, dados.length); i++) {
    const row = dados[i];
    if (!row) continue;
    const rowStr = row.map((c: any) => String(c).toUpperCase()).join(' ');
    if (rowStr.includes('PRODUTORES QUE RECEBERAM') || rowStr.includes('RELATÓRIO DE')
        || rowStr.includes('RELATÓRIO DO') || rowStr.includes('MUNICIPES')) continue;
    if (termos.every(t => rowStr.includes(t.toUpperCase()))) return i;
  }
  return -1;
}

function encontrarColuna(headerRow: any[], ...termos: string[]): number {
  for (let i = 0; i < headerRow.length; i++) {
    const h = String(headerRow[i] || '').toUpperCase();
    if (termos.some(t => h.includes(t.toUpperCase()))) return i;
  }
  return -1;
}

const PRECOS_VET: Record<string, number> = {
  'consulta': 96.86, 'consutla': 96.86, 'parto': 157.76, 'aux. parto': 157.76,
  'cesarea': 200, 'cesárea': 200, 'cesaria': 200, 'prolapso': 200,
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
// PROCESSADORES
// ============================================================================

async function corrigirVeterinario(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Aten. Veterinário 2022.xlsx'));
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
    const mesNum = extrairMesNumero(sheetName);
    const headerIdx = encontrarLinhaHeader(dados, 'PRODUTOR', 'PROCEDIMENTO');
    if (headerIdx === -1) continue;
    let vet = 'Desconhecido';
    const sn = sheetName.toLowerCase();
    if (sn.includes('gustavo')) vet = 'Gustavo';
    else if (sn.includes('luan')) vet = 'Luan';
    else if (sn.includes('jadir')) vet = 'Jadir';
    else if (sn.includes('zardo')) vet = 'Zardo';
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
            observacoes: `Migrado planilha Vet 2022 (correcao) | ${vet} | ${procedimento}`,
            quantidadeSolicitada: 1, valorCalculado: subsidio, modalidade: 'SUBSIDIO',
            calculoDetalhes: { migradoDe: 'Planilha Atendimento Veterinario 2022', correcaoNome: true,
              veterinario: vet, procedimento, numeroAutorizacao: numAut, valorTotal: preco, valorSubsidio: subsidio, percentual: 70, aba: sheetName } }
        });
        stats.migrados++;
        console.log(`  OK: ${nome} (ID:${pessoaId}) | ${vet} | ${procedimento}`);
      } catch (e) { stats.erros++; }
    }
  }
}

async function corrigirInseminacao(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Inseminação 2022.xlsx'));
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
            observacoes: `Migrado planilha Inseminação 2022 (correcao)`,
            quantidadeSolicitada: 1, valorCalculado: 0, modalidade: 'SERVICO',
            calculoDetalhes: { migradoDe: 'Planilha Inseminação 2022', correcaoNome: true,
              vaca: String(row[2] || ''), touro: String(row[3] || ''), numeroAutorizacao: numAut, aba: sheetName } }
        });
        stats.migrados++;
        console.log(`  OK: ${nome} (ID:${pessoaId}) | ${sheetName}`);
      } catch (e) { stats.erros++; }
    }
  }
}

async function corrigirAcudes(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Açúdes 2022.xlsx'));
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
    const nome = nomeRaw.replace(/\s*\(.*$/, '').replace(/\s*-\s*(Entreg|Enviad|Clenio|Linha|São|Km|Oriental|Itap|\d).*$/i, '').trim();
    const pessoaId = getPessoaId(nome);
    if (!pessoaId) continue;
    const horas = Number(row[3]) || 0;
    if (horas <= 0) continue;
    const situacao = String(row[5] || '').trim().toLowerCase();
    if (!situacao.includes('pronto') && !situacao.includes('conclu')) continue;
    const data = parseData(row[6], 5);
    const produtorPagou = Number(row[8]) || 0;
    const existente = await prisma.solicitacaoBeneficio.findFirst({
      where: { pessoaId, programaId: 9, quantidadeSolicitada: horas }
    });
    if (existente) { stats.duplicados++; continue; }
    try {
      await prisma.solicitacaoBeneficio.create({
        data: { pessoaId, programaId: 9, datasolicitacao: data, status: 'concluido',
          observacoes: `Migrado planilha Açudes 2022 (correcao) | ${horas}h`,
          quantidadeSolicitada: horas, valorCalculado: produtorPagou, modalidade: 'SERVICO',
          calculoDetalhes: { migradoDe: 'Planilha Açudes 2022', correcaoNome: true, totalHoras: horas } }
      });
      stats.migrados++;
      console.log(`  OK: ${nome} (ID:${pessoaId}) | ${horas}h`);
    } catch (e) { stats.erros++; }
  }
}

async function corrigirEstercoLiquido(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Esterco Líquido 2022.xlsx'));
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
    const mesNum = extrairMesNumero(sheetName);
    const headerIdx = encontrarLinhaHeader(dados, 'NOME', 'QUANTIDADE');
    if (headerIdx === -1) continue;
    const headerRow = dados[headerIdx];
    const colValor = encontrarColuna(headerRow, 'VALOR', 'R$');
    const colData = encontrarColuna(headerRow, 'DATA');
    const colQuant = encontrarColuna(headerRow, 'QUANTIDADE');
    for (let i = headerIdx + 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row || row.length < 3) continue;
      const nome = String(row[1] || '').trim();
      if (!nome || nome.length < 3) continue;
      const pessoaId = getPessoaId(nome);
      if (!pessoaId) continue;
      const valor = colValor >= 0 ? Number(row[colValor]) || 0 : 0;
      if (valor <= 0) continue;
      const data = colData >= 0 ? parseData(row[colData], mesNum) : new Date(ANO, mesNum, 15);
      const quantidade = colQuant >= 0 ? Number(row[colQuant]) || 1 : 1;
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: { pessoaId, programaId: 63, datasolicitacao: data, valorCalculado: valor }
      });
      if (existente) { stats.duplicados++; continue; }
      try {
        await prisma.solicitacaoBeneficio.create({
          data: { pessoaId, programaId: 63, datasolicitacao: data, status: 'concluido',
            observacoes: `Migrado planilha Esterco Liquido 2022 (correcao) | ${sheetName}`,
            quantidadeSolicitada: quantidade, valorCalculado: valor, modalidade: 'SUBSIDIO',
            calculoDetalhes: { migradoDe: `Planilha Esterco Liquido 2022 - ${sheetName}`, correcaoNome: true, aba: sheetName, quantidade } }
        });
        stats.migrados++;
        console.log(`  OK: ${nome} (ID:${pessoaId}) | R$ ${valor}`);
      } catch (e) { stats.erros++; }
    }
  }
}

async function corrigirAcessoPatio(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Acesso à Pátio 2022.xlsx'));
  const abaAlvo = wb.SheetNames.find(s => s === '2022');
  if (!abaAlvo) return;
  const sheet = wb.Sheets[abaAlvo];
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
  const headerIdx = encontrarLinhaHeader(dados, 'PRODUTOR', 'R$');
  if (headerIdx === -1) return;
  const headerRow = dados[headerIdx];
  const colValor = encontrarColuna(headerRow, 'R$');
  const colData = encontrarColuna(headerRow, 'DATA');
  for (let i = headerIdx + 1; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 3 || typeof row[0] !== 'number') continue;
    const nome = String(row[1] || '').trim();
    if (!nome || nome.length < 3) continue;
    const pessoaId = getPessoaId(nome);
    if (!pessoaId) continue;
    const valor = colValor >= 0 ? Number(row[colValor]) || 0 : 0;
    if (valor <= 0) continue;
    const data = colData >= 0 ? parseData(row[colData], 5) : new Date(ANO, 5, 15);
    const m3 = Number(row[3]) || 0;
    const existente = await prisma.solicitacaoBeneficio.findFirst({
      where: { pessoaId, programaId: 77, valorCalculado: valor }
    });
    if (existente) { stats.duplicados++; continue; }
    try {
      await prisma.solicitacaoBeneficio.create({
        data: { pessoaId, programaId: 77, datasolicitacao: data, status: 'concluido',
          observacoes: `Migrado planilha Acesso Pátio 2022 (correcao)`,
          quantidadeSolicitada: m3, valorCalculado: valor, modalidade: 'SUBSIDIO',
          calculoDetalhes: { migradoDe: 'Planilha Acesso Pátio 2022', correcaoNome: true, m3Pedras: m3, linha: String(row[2] || ''), empresa: String(row[4] || '') } }
      });
      stats.migrados++;
      console.log(`  OK: ${nome} (ID:${pessoaId}) | R$ ${valor}`);
    } catch (e) { stats.erros++; }
  }
}

// Subsídio genérico
async function corrigirSubsidio(
  arquivo: string, programaId: number,
  colProdutor: number, headerTermos: string[],
  stats: Stats
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
    const headerRow = dados[headerIdx];
    const colValor = encontrarColuna(headerRow, 'R$', 'VALOR');
    if (colValor === -1) continue;
    const colData = encontrarColuna(headerRow, 'DATA');
    for (let i = headerIdx + 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row || row.length < 3) continue;
      const nome = String(row[colProdutor] || '').trim();
      if (!nome || nome.length < 3) continue;
      const pessoaId = getPessoaId(nome);
      if (!pessoaId) continue;
      const valor = Number(row[colValor]) || 0;
      if (valor <= 0) continue;
      const data = colData >= 0 ? parseData(row[colData], mesNum) : new Date(ANO, mesNum, 15);
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: { pessoaId, programaId, datasolicitacao: data, valorCalculado: valor }
      });
      if (existente) { stats.duplicados++; continue; }
      try {
        await prisma.solicitacaoBeneficio.create({
          data: { pessoaId, programaId, datasolicitacao: data, status: 'concluido',
            observacoes: `Migrado planilha 2022 (correcao) | ${sheetName}`,
            quantidadeSolicitada: 1, valorCalculado: valor, modalidade: 'SUBSIDIO',
            calculoDetalhes: { migradoDe: `Planilha 2022 - ${arquivo}`, correcaoNome: true, aba: sheetName } }
        });
        stats.migrados++;
        console.log(`  OK: ${nome} (ID:${pessoaId}) | R$ ${valor}`);
      } catch (e) { stats.erros++; }
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('='.repeat(80));
  console.log('CORREÇÃO 2022 - NOMES NÃO ENCONTRADOS');
  console.log('='.repeat(80));

  const planilhas: Array<{ nome: string; fn: (s: Stats) => Promise<void> }> = [
    { nome: 'Atend. Veterinário', fn: corrigirVeterinario },
    { nome: 'Inseminação', fn: corrigirInseminacao },
    { nome: 'Açudes', fn: corrigirAcudes },
    { nome: 'Esterco Líquido', fn: corrigirEstercoLiquido },
    { nome: 'Acesso Pátio', fn: corrigirAcessoPatio },
    { nome: 'Aveia', fn: (s) => corrigirSubsidio('Aveia 2022.xlsx', 66, 1, ['PRODUTOR', 'Quant'], s) },
    { nome: 'Calcário', fn: (s) => corrigirSubsidio('Calcário 2022.xlsx', 64, 1, ['PRODUTOR', 'QUANT'], s) },
    { nome: 'Cama de Aviário', fn: (s) => corrigirSubsidio('Cama de Aviário 2022.xlsx', 65, 1, ['PRODUTOR', 'QUANT'], s) },
    { nome: 'Sêmen Bovino', fn: (s) => corrigirSubsidio('Sêmen Bovino 2022.xlsx', 73, 1, ['PRODUTOR', 'DOSES'], s) },
    { nome: 'Sêmen Suíno', fn: (s) => corrigirSubsidio('Sêmen Suíno 2022.xlsx', 72, 1, ['PRODUTOR', 'MATRIZES'], s) },
    { nome: 'Ultrasson', fn: (s) => corrigirSubsidio('Exames de Ultrasson 2022.xlsx', 70, 1, ['PRODUTOR', 'EXAMES'], s) },
    { nome: 'Piscicultura', fn: (s) => corrigirSubsidio('Piscicultura 2022.xlsx', 9, 1, ['PRODUTOR'], s) },
    { nome: 'Adubação Pastagem', fn: (s) => corrigirSubsidio('Adubação de Pastagem 2022.xlsx', 84, 1, ['PRODUTOR', 'VACAS'], s) },
    { nome: 'Equipamentos', fn: (s) => corrigirSubsidio('Equipamentos 2022.xlsx', 76, 2, ['NOME', 'EQUIPAMENTO'], s) },
    { nome: 'Construção Piso', fn: (s) => corrigirSubsidio('Contruação de Piso.xlsx', 79, 1, ['PRODUTOR', 'Materiais'], s) },
    { nome: 'Mudas Frutíferas', fn: (s) => corrigirSubsidio('Mudas Frutíferas 2022.xlsx', 78, 1, ['PRODUTOR', 'QUANTIDADE'], s) },
    { nome: 'Chiqueiro', fn: (s) => corrigirSubsidio('Chiqueiro 2022.xlsx', 88, 1, ['PRODUTOR', 'Materiais'], s) },
    { nome: 'Silos', fn: (s) => corrigirSubsidio('Silos 2022.xlsx', 75, 1, ['PRODUTOR', 'Materiais'], s) },
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
