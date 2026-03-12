/**
 * Correção de nomes não encontrados na migração 2025
 * Mapeia grafias diferentes para IDs corretos do banco
 *
 * Executar: npx tsx scripts/migracao-2025/corrigir-nao-encontrados-2025.ts
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import prisma from '../../src/utils/prisma';

const PASTA = 'C:\\csvs\\2025';
const ANO = 2025;

// ============================================================================
// MAPEAMENTO: grafia da planilha → ID no banco
// ============================================================================
const MAPEAMENTO_PESSOAS: Record<string, number> = {
  // A
  'Adelio L. Engellmann': 638,        // ADELIO LUIZ ENGELMANN
  'Adir Hunemeier': 1092,              // ADIR VANDERLEI HUNEMEIR
  'Adir Hunemeyer': 1092,
  'Adir V. Hunemeier': 1092,
  'Adir Vanderlei Hunemeier': 1092,
  'Adriana Vilella': 2907,             // ADRIANA INACIA VILELLA CAPRIOTTI
  'Alceu A. Bourcheid': 566,           // ALCEU ALOISIO BOURSCHEID
  'Alceu Bianchesi': 652,              // ALCEU BIANCHESSI
  'Alcides Hunemeyer': 507,            // ALCIDES SIDNEI HUNEMEIER
  'Alessandro C. Pilger': 4462,        // ALESSANDRO CLEITON PILGER (se existir)
  'Ana C. P. Mittelstaedt': 4483,      // ANA CAROLINE PILGER MITTELSTAEDT
  'Ana Caroline P. Mittelstaedt': 4483,
  'Anilda S. Smyslony': 332,           // ANILDA STELTER ZMYSLONY
  'Antônio A. Sieben': 3327,           // ANTONIO ARLINDO SIEBEN
  'Antônio Arlindo Sieben': 3327,
  'Antônio José Pauli': 444,           // ANTONIO JOSE PAULI

  // B
  'Bertilo Kiling': 433,               // BERTILO LUIS KIELING
  'Braz Guesser': 3406,                // BRAZ GUESSER (se existir)

  // C
  'Carla Danila Lnager': 3397,         // CARLA DANILA LANGER
  'Carlos Schmmelpfnnig': 3081,        // CARLOS SCHMMELPFENNIG (se existir)
  'Carlos V. Paulwels': 763,           // CARLOS VANDERLEI PAUWELS
  'Carlos V. Paulwes': 763,
  'Carlos Vanderlei puwls': 763,
  'Cesar Alth': 84,                    // CESAR MAURESIR AUTH
  'Cezar Auth': 84,
  'Clair Khun': 821,                   // CLAIR BACKES KUHN
  'Claudinei Pauli': 973,              // CLAUDENEI PAULI
  'Claudio Burkauer': 3417,            // CLAUDIO BIRKHEUER (se existir)
  'Claudir Beckemkamp': 385,           // CLAUDIR JOAO BECKENKAMP
  'Claudir Bekerkamp': 385,
  'Claudir Joao Beckemkamp': 385,
  'Cleonice S. Stenske': 2071,         // CLEONICE SCHIRMER STRENSKE
  'Clovis Renato Kieling': 2965,       // CLOVIS RENATO KIELING
  'Clóvis Renato Kieling': 2965,
  'Crisitiano Weschelfelder': 938,     // CRISTIANO RUDOLFO WESCHENFELDER
  'Cristiane Hunemeyer': 718,          // CRISTIANE GRYGUTSCH HUNEMEIER
  'Cristiane Hunemeyerr': 718,
  'Célio Luis Engellmann': 636,        // CELIO LUIZ ENGELMANN

  // D
  'Darci Bhul': 345,                   // DARCI BUHL
  'Darlon Lempkul': 2539,              // DARLON DOUGLAS LEHMKUHL
  'Deivid Carlos Kowald': 2851,        // DEVID CARLOS KOWALD
  'Deivid Kowald': 2851,
  'DEIVID KOWALD': 2851,
  'Deonisio Franciskoski': 789,        // DEONISIO FRANCZISKOWSKI
  'Deonisio Franczskowski': 789,
  'Deonisio Fransciskowski': 789,
  'Deonisio Seibenicler': 4474,        // DEONISIO ANTONIO SIEBENEICHLER
  'Deonisio Seinbencler': 4474,
  'DEONIZIO SIEBENESCHLER': 4474,
  'DIONISIO SIEBENEISCHLER': 4474,
  'Dirceu M.Schneider': 2929,          // DIRCEU MARCOS SCHNEIDER
  'Dirceu M. Schneider': 2929,
  'Djonathan Wastwoski': 3780,         // DJONATHAN RODRIGO WASTOWSKI
  'Dorvalino Borreli': 439,            // DORVALINO BORELLI

  // E
  'Edoir Oliniki': 4359,               // EDOIR OLINIKI (se existir)
  'Edson Scheurmann': 916,             // EDSON LUIS SCHEUERMANN
  'ELEANDRO WOITIOK': 1885,            // ELEANDRO STEFLER WOJTIOK
  'Eleandro Steffler': 1885,
  'Eliseu Engelmann': 2182,            // ELIZEU MARCIO ENGELMANN
  'Elizeu M.Engelmann': 2182,
  'Elizeu M. Engellmann': 2182,
  'Erio Bender': 76,                   // IRIO AFFONSO BENDER
  'Evando Kotz': 102,                  // EVALDO KOTZ

  // F
  'Fernando Biachesi': 884,            // FERNANDO LUIS BIANCHESSI
  'Fernando Bianchesi': 884,
  'Flávia Engelmann': 1390,            // FLAVIA CRISTIANE LICZKOWSKI ENGELMANN

  // G
  'Genuario Kapes': 429,               // GENUARIO KAPPES
  'Gustavo R. Preuess': 354,           // GUSTAVO RAFAEL PREUSS
  'Guinter B. Scheuermann': 914,       // GUNTER BRUNO SCHEUERMANN

  // H
  'Helio Sthatlhober': 391,            // HELIO STAADTLOBER

  // I
  'Ido Schimit': 266,                  // IDO SCHMITT
  'Ilvanei Lempkul': 673,              // ILVANEI ANTONIO LEHMKUHL
  'Ilvonei Lehmkhul': 673,
  'Ivonir L. Stahlfofer': 375,         // IVONIR LUIZ STAHLHOFER
  'Ivonir Luis Sthalhofer': 375,
  'Ivonir Sthalhofer': 375,
  'Ivonir Sthalofer': 375,
  'Ivonir Sthalofher': 375,

  // J
  'Jacinto Zeibricker': 940,           // JACINTO ZEIWEIBRICKER
  'Jacinto Zeiwbricker': 940,
  'Jacinto Zeiweibricher': 940,
  'José B. Fuhr': 1963,                // JOSE BALDUINO FUHR
  'José Balduino Fuhr': 1963,

  // L
  'Leila Maria Fogasa': 3802,          // LEILA MARIA FOGASSA
  'Leomar Simsem': 97,                 // LEOMAR SIMSEN
  'Leomar Sinsem': 97,
  'Leomar Sinsen': 97,
  'Leonir Fischer': 4115,              // LEONIR FISCHER (se existir)
  'Livo Wollf': 109,                   // LIVO JOSE WOLF
  'Luis Simonette': 200,               // LUIZ VALMOR SIMONETTI
  'Luis V. Simonette': 200,

  // M
  'Manfredo Steffans': 295,            // MANFREDO STEFAN
  'Mnafredo Stefans': 295,
  'Marcelo José Gentelini': 4178,      // MARCELO JOSE GENTELINE
  'Marcelo José Gentilini': 4178,
  'Marcos Eckaert': 4085,              // MARCOS CRISTIANO ECKARDT
  'Marcos Eckart': 4085,
  'Margarida Simom': 204,              // MARIA MARGARIDA SIMON
  'Maria Simon': 204,
  'Maria M. Simon': 204,

  // N
  'Neldo Pedro Fiscxher': 4112,        // NELDO PEDRO FISCHER
  'Nelsy Nogueira Hugue': 2987,        // NELCY NOGUEIRA HUGUE
  'Normelio Zeiwbricker': 925,         // NORMELIO LUIS ZEIWEIBRICKER
  'Normelio zeiwbricker': 925,
  'Normeliuo Zeiwbricker': 925,
  'Normeliuo Zeiweibricker': 925,

  // O
  'Osvaldo Krholl': 488,               // OSVALDO KROLL

  // P
  'Paulo Alfredo Toiller': 768,        // PAULO ALFREDO TOILLIER
  'Pedro Schneider': 4114,             // PEDRO SCHNEIDER (se existir)
  'Pedro Traczinski': 4111,            // PEDRO TRACZYNSKI
  'Pedro J. Tracznski': 4111,

  // R
  'Rogério C. Mundt': 3407,            // ROGERIO CLAUDIO MUNDT
  'Rogério Claudio Mundt': 3407,
  'Roque Selszer': 219,                // ROQUE SELZLER
  'Roque Selzer': 219,
  'Rosani C. Zczuck': 300,             // ROSANI CLEUSA SZCZUK

  // S
  'Sergio Wastoski': 501,              // SERGIO LAURI WASTOWSKI
  'Sergio Wastoswki': 501,
  'Sergio Lauri Wastwoski': 501,
  'SILVIO WANZOWSKI': 4459,            // SILVIO WANZOWSKI (se existir)

  // V
  'VALDECIR RIEGER': 3156,             // VALDECIR VOLNEI RIEGER
  'Valdecir Rieger': 3156,
  'Valdecir V. Rieger': 3156,
  'Valdenirio Scaffer': 2931,          // VALDENIRIO SCHAFFER
  'Valdir João Biasebetti': 3086,      // VALDIR JOAO BIASIBETTI
  'Valdir Roberto Khun': 864,          // VALDIR ROBERTO KUHN
  'Valério Dassoler': 3704,            // VALERIO DASSOLER (se existir)
  'Valyer Eldor Reinke': 3328,         // VALTER ELDOR REINKE
  'Vandoir Magnabosco': 3705,          // VALDOIR MAGNABOSCO
  'vilmar Marchall': 4091,             // VILMAR MARCHALL (se existir)

  // W
  'Wilson Scheurmann': 911,            // WILSON IVO SCHEUERMANN

  // Elsa Klering / Elsa S. Klering - verificar
  'Elsa Klering': 4113,                // ELSA KLERING (se existir)
  'Elsa S. Klering': 4113,
  'Elsa Scholler': 58,                 // ELSA SCHMOLLER
};

// ============================================================================
// UTILIDADES (mesmas do script principal)
// ============================================================================

function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  return new Date(utc_days * 86400 * 1000);
}

function normalizarNome(nome: string): string {
  return nome.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

function encontrarLinhaHeader(dados: any[][], ...termos: string[]): number {
  for (let i = 0; i < Math.min(15, dados.length); i++) {
    const row = dados[i];
    if (!row) continue;
    const rowStr = row.map((c: any) => String(c).toUpperCase()).join(' ');
    if (rowStr.includes('PRODUTORES QUE RECEBERAM') || rowStr.includes('RELATÓRIO DE')) continue;
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

// ============================================================================
// PREÇOS VETERINÁRIO
// ============================================================================
const PRECOS_VET: Record<string, number> = {
  'consulta': 96.86, 'consutla': 96.86, 'parto': 157.76, 'aux. parto': 157.76,
  'cesarea': 200, 'cesárea': 200, 'cesaria': 200, 'prolapso': 200,
};
function getPrecoVet(proc: string): number {
  const p = proc.toLowerCase().trim();
  for (const [k, v] of Object.entries(PRECOS_VET)) { if (p.includes(k)) return v; }
  return 96.86;
}

// ============================================================================
// PROCESSAMENTO
// ============================================================================

interface Stats {
  total: number;
  migrados: number;
  duplicados: number;
  naoEncontrados: number;
  erros: number;
  naoEncontradosNomes: string[];
}

function novoStats(): Stats {
  return { total: 0, migrados: 0, duplicados: 0, naoEncontrados: 0, erros: 0, naoEncontradosNomes: [] };
}

function getPessoaId(nome: string): number | null {
  // Busca exata
  if (MAPEAMENTO_PESSOAS[nome]) return MAPEAMENTO_PESSOAS[nome];
  // Busca case-insensitive
  const nomeUpper = nome.toUpperCase().trim();
  for (const [key, id] of Object.entries(MAPEAMENTO_PESSOAS)) {
    if (key.toUpperCase().trim() === nomeUpper) return id;
  }
  return null;
}

// --- Subsídio genérico ---
async function corrigirSubsidioGenerico(
  arquivo: string, programaId: number, stats: Stats,
  opts: { colProdutorIdx: number; headerTermos: string[]; colQuantTermos?: string[] }
) {
  const wb = XLSX.readFile(path.join(PASTA, arquivo));
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
    const mesNum = extrairMesNumero(sheetName);
    const headerIdx = encontrarLinhaHeader(dados, ...opts.headerTermos);
    if (headerIdx === -1) continue;
    const headerRow = dados[headerIdx];
    const colValor = encontrarColuna(headerRow, 'R$', 'VALOR');
    if (colValor === -1) continue;
    const colData = encontrarColuna(headerRow, 'DATA');
    const colQuant = opts.colQuantTermos ? encontrarColuna(headerRow, ...opts.colQuantTermos) : -1;

    for (let i = headerIdx + 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row || row.length < 3) continue;
      const nome = String(row[opts.colProdutorIdx] || '').trim();
      if (!nome || nome.length < 3) continue;
      const valor = Number(row[colValor]) || 0;
      if (valor <= 0) continue;

      const pessoaId = getPessoaId(nome);
      if (!pessoaId) continue;

      stats.total++;
      const data = colData >= 0 ? parseData(row[colData], mesNum) : new Date(ANO, mesNum, 15);
      const quantidade = colQuant >= 0 ? Number(row[colQuant]) || 1 : 1;

      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: { pessoaId, programaId, datasolicitacao: data, valorCalculado: valor }
      });
      if (existente) { stats.duplicados++; continue; }

      try {
        await prisma.solicitacaoBeneficio.create({
          data: {
            pessoaId, programaId, datasolicitacao: data,
            status: 'concluido',
            observacoes: `Migrado planilha 2025 (correcao) | ${sheetName}`,
            quantidadeSolicitada: quantidade,
            valorCalculado: valor,
            modalidade: 'SUBSIDIO',
            calculoDetalhes: {
              migradoDe: `Planilha 2025 - ${sheetName} (correcao)`,
              aba: sheetName, nomeOriginal: nome,
            }
          }
        });
        stats.migrados++;
      } catch (e) { stats.erros++; }
    }
  }
}

// --- Veterinário ---
async function corrigirVeterinario(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Atend. Veterinário - 2025.xlsx'));
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

      const pessoaId = getPessoaId(nome);
      if (!pessoaId) continue;

      stats.total++;
      const procedimento = String(row[2] || '').trim();
      const data = parseData(row[3], mesNum);
      const numAut = Number(row[4]) || 0;
      const preco = getPrecoVet(procedimento);
      const subsidio = preco * 0.7;

      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId, programaId: 83, datasolicitacao: data,
          calculoDetalhes: { path: ['numeroAutorizacao'], equals: numAut }
        }
      });
      if (existente) { stats.duplicados++; continue; }

      try {
        await prisma.solicitacaoBeneficio.create({
          data: {
            pessoaId, programaId: 83, datasolicitacao: data,
            status: 'concluido',
            observacoes: `Migrado planilha Vet 2025 (correcao) | ${vet} | ${procedimento}`,
            quantidadeSolicitada: 1, valorCalculado: subsidio, modalidade: 'SUBSIDIO',
            calculoDetalhes: {
              migradoDe: 'Planilha Atendimento Veterinario 2025 (correcao)',
              veterinario: vet, procedimento, numeroAutorizacao: numAut,
              valorTotal: preco, valorSubsidio: subsidio, percentual: 70,
              aba: sheetName, nomeOriginal: nome,
            }
          }
        });
        stats.migrados++;
      } catch (e) { stats.erros++; }
    }
  }
}

// --- Inseminação ---
async function corrigirInseminacao(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Inseminação - 2025.xlsx'));
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

      const pessoaId = getPessoaId(nome);
      if (!pessoaId) continue;

      stats.total++;
      const vaca = String(row[2] || '').trim();
      const touro = String(row[3] || '').trim();
      const data = parseData(row[4], mesNum);
      const numAut = Number(row[5]) || 0;

      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId, programaId: 69, datasolicitacao: data,
          calculoDetalhes: { path: ['numeroAutorizacao'], equals: numAut }
        }
      });
      if (existente) { stats.duplicados++; continue; }

      try {
        await prisma.solicitacaoBeneficio.create({
          data: {
            pessoaId, programaId: 69, datasolicitacao: data,
            status: 'concluido',
            observacoes: `Migrado planilha Inseminação 2025 (correcao) | ${sheetName}`,
            quantidadeSolicitada: 1, valorCalculado: 0, modalidade: 'SERVICO',
            calculoDetalhes: {
              migradoDe: 'Planilha Inseminação 2025 (correcao)',
              vaca, touro, numeroAutorizacao: numAut, aba: sheetName, nomeOriginal: nome,
            }
          }
        });
        stats.migrados++;
      } catch (e) { stats.erros++; }
    }
  }
}

// --- Pé de Pato ---
async function corrigirPeDePato(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Pé de Pato - 2025.xlsx'));
  const sheet = wb.Sheets['Planilha1'];
  if (!sheet) return;
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

  const porProdutor = new Map<number, { nome: string; sessoes: Array<{ data: Date; horas: number }> }>();

  for (let i = 3; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 6) continue;
    const nome = String(row[1] || '').trim();
    if (!nome || nome.length < 3) continue;
    const pessoaId = getPessoaId(nome);
    if (!pessoaId) continue;
    const horas = Number(row[5]) || 0;
    if (horas <= 0) continue;
    const data = parseData(row[2], 5);
    if (!porProdutor.has(pessoaId)) porProdutor.set(pessoaId, { nome, sessoes: [] });
    porProdutor.get(pessoaId)!.sessoes.push({ data, horas });
  }

  for (const [pessoaId, reg] of porProdutor) {
    stats.total++;
    const totalHoras = reg.sessoes.reduce((s, x) => s + x.horas, 0);

    const existente = await prisma.solicitacaoBeneficio.findFirst({
      where: { pessoaId, programaId: 82, quantidadeSolicitada: totalHoras }
    });
    if (existente) { stats.duplicados++; continue; }

    try {
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId, programaId: 82,
          datasolicitacao: reg.sessoes[reg.sessoes.length - 1].data,
          status: 'concluido',
          observacoes: `Migrado planilha Pe de Pato 2025 (correcao) | ${reg.sessoes.length} sessao(es) | ${totalHoras}h`,
          quantidadeSolicitada: totalHoras,
          valorCalculado: 0,
          modalidade: 'SERVICO',
          calculoDetalhes: {
            migradoDe: 'Planilha Pe de Pato 2025 (correcao)',
            totalHoras, totalSessoes: reg.sessoes.length, nomeOriginal: reg.nome,
          }
        }
      });
      stats.migrados++;
    } catch (e) { stats.erros++; }
  }
}

// --- Açudes ---
async function corrigirAcudes(stats: Stats) {
  const wb = XLSX.readFile(path.join(PASTA, 'Açude - 2025.xlsx'));
  const abaAlvo = wb.SheetNames.find(s => s.toLowerCase().includes('pronto'));
  if (!abaAlvo) return;
  const sheet = wb.Sheets[abaAlvo];
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];
  const headerIdx = encontrarLinhaHeader(dados, 'PRODUTOR', 'Horas');
  if (headerIdx === -1) return;

  for (let i = headerIdx + 1; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 5) continue;
    if (typeof row[0] !== 'number') continue;
    const nomeRaw = String(row[1] || '').trim();
    if (!nomeRaw || nomeRaw.length < 3) continue;
    const nome = nomeRaw.replace(/\s*\(.*$/, '').replace(/\s*-\s*(Entreg|Enviad|Clenio|Linha|São|Km|Oriental|Itap|\d).*$/i, '').trim();

    const pessoaId = getPessoaId(nome) || getPessoaId(nomeRaw);
    if (!pessoaId) continue;

    const horas = Number(row[4]) || 0;
    if (horas <= 0) continue;
    const situacao = String(row[6] || '').trim().toLowerCase();
    if (!situacao.includes('pronto') && !situacao.includes('conclu')) continue;

    stats.total++;
    const data = parseData(row[7], 5);
    const produtorPagou = Number(row[9]) || 0;

    const existente = await prisma.solicitacaoBeneficio.findFirst({
      where: { pessoaId, programaId: 9, quantidadeSolicitada: horas }
    });
    if (existente) { stats.duplicados++; continue; }

    try {
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId, programaId: 9, datasolicitacao: data,
          status: 'concluido',
          observacoes: `Migrado planilha Açudes 2025 (correcao) | ${horas}h`,
          quantidadeSolicitada: horas, valorCalculado: produtorPagou, modalidade: 'SERVICO',
          calculoDetalhes: {
            migradoDe: 'Planilha Açudes 2025 (correcao)',
            totalHoras: horas, produtorPagou, nomeOriginal: nomeRaw,
          }
        }
      });
      stats.migrados++;
    } catch (e) { stats.erros++; }
  }
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('CORREÇÃO DE NOMES NÃO ENCONTRADOS - 2025');
  console.log('='.repeat(80));

  // Verificar quais IDs existem no banco
  const idsUnicos = [...new Set(Object.values(MAPEAMENTO_PESSOAS))];
  const existentes = await prisma.pessoa.findMany({
    where: { id: { in: idsUnicos } },
    select: { id: true, nome: true }
  });
  const idsExistentes = new Set(existentes.map(p => p.id));
  const idsInvalidos = idsUnicos.filter(id => !idsExistentes.has(id));
  if (idsInvalidos.length > 0) {
    console.log(`\nAVISO: ${idsInvalidos.length} IDs do mapeamento nao existem no banco: ${idsInvalidos.join(', ')}`);
    // Remove IDs inválidos
    for (const [nome, id] of Object.entries(MAPEAMENTO_PESSOAS)) {
      if (!idsExistentes.has(id)) delete MAPEAMENTO_PESSOAS[nome];
    }
  }
  console.log(`Mapeamentos validos: ${Object.keys(MAPEAMENTO_PESSOAS).length}`);

  // Veterinário
  console.log('\n--- Atendimento Veterinário ---');
  const statsVet = novoStats();
  await corrigirVeterinario(statsVet);
  console.log(`  Encontrados: ${statsVet.total} | Migrados: ${statsVet.migrados} | Dup: ${statsVet.duplicados} | Erros: ${statsVet.erros}`);

  // Inseminação
  console.log('\n--- Inseminação ---');
  const statsInsem = novoStats();
  await corrigirInseminacao(statsInsem);
  console.log(`  Encontrados: ${statsInsem.total} | Migrados: ${statsInsem.migrados} | Dup: ${statsInsem.duplicados} | Erros: ${statsInsem.erros}`);

  // Pé de Pato
  console.log('\n--- Pé de Pato ---');
  const statsPdp = novoStats();
  await corrigirPeDePato(statsPdp);
  console.log(`  Encontrados: ${statsPdp.total} | Migrados: ${statsPdp.migrados} | Dup: ${statsPdp.duplicados} | Erros: ${statsPdp.erros}`);

  // Açudes
  console.log('\n--- Açudes ---');
  const statsAc = novoStats();
  await corrigirAcudes(statsAc);
  console.log(`  Encontrados: ${statsAc.total} | Migrados: ${statsAc.migrados} | Dup: ${statsAc.duplicados} | Erros: ${statsAc.erros}`);

  // Subsídios genéricos
  const subsidios = [
    { arquivo: 'Aveia - 2025.xlsx', pid: 66, h: ['PRODUTOR', 'Quant'], q: ['QUANT'] },
    { arquivo: 'Calcário - 2025.xlsx', pid: 64, h: ['PRODUTOR', 'QUANT'], q: ['QUANT', 'TON'] },
    { arquivo: 'Esterco Líquido - 2025.xlsx', pid: 63, h: ['NOME', 'QUANTIDADE'], q: ['QUANTIDADE'] },
    { arquivo: 'Cama de Aviário - 2025.xlsx', pid: 65, h: ['PRODUTOR', 'QUANT'], q: ['QUANT', 'TON'] },
    { arquivo: 'Sêmen Bovino - 2025.xlsx', pid: 73, h: ['PRODUTOR', 'DOSES'], q: ['DOSES'] },
    { arquivo: 'Sêmen Suíno -2025.xlsx', pid: 72, h: ['PRODUTOR', 'MATRIZES'], q: ['MATRIZES'] },
    { arquivo: 'Exame de Ultrasson - 2025.xlsx', pid: 70, h: ['PRODUTOR', 'EXAMES'], q: ['EXAMES'] },
    { arquivo: 'Piscicultura - 2025.xlsx', pid: 9, h: ['PRODUTOR', 'QUANT'], q: ['QUANT'] },
    { arquivo: 'Adubação de Pastagem - 2025.xlsx', pid: 84, h: ['PRODUTOR', 'VACAS'] },
    { arquivo: 'Apicultura - 2025.xlsx', pid: 85, h: ['PRODUTOR', 'PRODUTO'] },
    { arquivo: 'Equipamentos - 2025.xlsx', pid: 76, h: ['NOME', 'EQUIPAMENTO'], colProd: 2 },
    { arquivo: 'Contrução de Piso - 2025.xlsx', pid: 79, h: ['PRODUTOR', 'Materiais'] },
    { arquivo: 'Mudas Frutíferas - 2025.xlsx', pid: 78, h: ['PRODUTOR', 'QUANTIDADE'], q: ['QUANTIDADE'] },
    { arquivo: 'Pecador Profissional - 2025.xlsx', pid: 86, h: ['PRODUTOR', 'R$'] },
    { arquivo: 'Sala de Ordenha - 2025.xlsx', pid: 74, h: ['PRODUTOR', 'Materiais'] },
    { arquivo: 'Chiqueiro - 2025.xlsx', pid: 88, h: ['PRODUTOR', 'Materiais'] },
    { arquivo: 'Cisterna - 2025.xlsx', pid: 89, h: ['PRODUTOR', 'R$'] },
  ];

  for (const sub of subsidios) {
    const filePath = path.join(PASTA, sub.arquivo);
    const exists = require('fs').existsSync(filePath);
    if (!exists) continue;

    console.log(`\n--- ${sub.arquivo} ---`);
    const st = novoStats();
    await corrigirSubsidioGenerico(sub.arquivo, sub.pid, st, {
      colProdutorIdx: (sub as any).colProd || 1,
      headerTermos: sub.h,
      colQuantTermos: sub.q,
    });
    console.log(`  Encontrados: ${st.total} | Migrados: ${st.migrados} | Dup: ${st.duplicados} | Erros: ${st.erros}`);
  }

  // Resumo
  const totalMigrados = statsVet.migrados + statsInsem.migrados + statsPdp.migrados + statsAc.migrados;
  console.log('\n' + '='.repeat(80));
  console.log(`TOTAL CORRIGIDO (específicos): ${totalMigrados}`);
  console.log('='.repeat(80));

  await prisma.$disconnect();
}

main()
  .then(() => { console.log('\nConcluido!'); process.exit(0); })
  .catch(e => { console.error('Erro:', e); process.exit(1); });
