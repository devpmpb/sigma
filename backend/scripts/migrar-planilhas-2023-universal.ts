/**
 * Script Universal de Migração - Planilhas 2023
 *
 * Lê todas as planilhas Excel da Claudete e importa para SolicitacaoBeneficio.
 * Cada planilha tem formato ligeiramente diferente, mas o padrão geral é:
 * - Linhas iniciais: título/cabeçalho decorativo
 * - Linha com cabeçalho de colunas (contém "PRODUTOR" ou "NOME")
 * - Dados numéricos começam com Nº sequencial
 *
 * Verificação de duplicatas: pessoaId + programaId + data + valor
 */
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PASTA = "C:\\Users\\marce\\Downloads\\2023";

// ─── Mapeamento: arquivo → programaId ────────────────────────────────────────
interface ConfigPlanilha {
  arquivo: string;
  programaId: number;
  colProdutor: string[];     // nomes possíveis da coluna produtor
  colValor: string[];        // nomes possíveis da coluna valor
  colData: string[];         // nomes possíveis da coluna data
  colQuantidade: string[];   // nomes possíveis da coluna quantidade
  descricao: string;
}

const PLANILHAS: ConfigPlanilha[] = [
  {
    arquivo: "Acesso à Pátios - 2023.xlsx",
    programaId: 77,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["M³ DE PEDRAS", "M³"],
    descricao: "Acesso a Pátios",
  },
  {
    arquivo: "Adubação de Pastagem - 2023.xlsx",
    programaId: 44, // legado - adubação pastagem
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["Nº VACAS", "VACAS"],
    descricao: "Adubação de Pastagem",
  },
  {
    arquivo: "Apicultura - 2023.xlsx",
    programaId: 42, // legado
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: [],
    descricao: "Apicultura",
  },
  {
    arquivo: "Aveia - 2023.xlsx",
    programaId: 66,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["QUANT. (KG)", "QUANT", "KG"],
    descricao: "Aveia",
  },
  {
    arquivo: "Calcário - 2023.xlsx",
    programaId: 64,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["QUANT. (TON.)", "QUANT", "TON"],
    descricao: "Calcário",
  },
  {
    arquivo: "Cama de Aviário - 2023.xlsx",
    programaId: 65,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["QUANT. (TON.)", "QUANT", "TON"],
    descricao: "Cama de Aviário",
  },
  {
    arquivo: "Construção de Piso - 2023.xlsx",
    programaId: 79,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: [],
    descricao: "Construção de Piso",
  },
  {
    arquivo: "Equipamentos - 2023.xlsx",
    programaId: 76,
    colProdutor: ["NOME", "PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: [],
    descricao: "Equipamentos (Ordenhadeira/Resfriador)",
  },
  {
    arquivo: "Esterco Líquido - 2023.xlsx",
    programaId: 63,
    colProdutor: ["NOME", "PRODUTOR"],
    colValor: ["VALOR (R$)", "R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["QUANTIDADE", "QUANT"],
    descricao: "Esterco Líquido",
  },
  {
    arquivo: "Exame de Ultrasson - 2023.xlsx",
    programaId: 70,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["EXAMES", "FÊMEAS"],
    descricao: "Exame de Ultrasson",
  },
  // Inseminação já migrada - pular
  {
    arquivo: "Mudas Frutíferas - 2023.xlsx",
    programaId: 78,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["QUANTIDADE", "QUANT"],
    descricao: "Mudas Frutíferas",
  },
  {
    arquivo: "Pesca Profissional - 2023.xlsx",
    programaId: 43, // legado
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: [],
    descricao: "Pesca Profissional",
  },
  {
    arquivo: "Piscicultura - 2023.xlsx",
    programaId: 9,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["QUANT.", "QUANT", "QUANTIDADE"],
    descricao: "Piscicultura",
  },
  {
    arquivo: "Sala de Ordenha - 2023.xlsx",
    programaId: 74,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: [],
    descricao: "Sala de Ordenha",
  },
  {
    arquivo: "Silo 2023.xlsx",
    programaId: 75,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: [],
    descricao: "Silo",
  },
  {
    arquivo: "Sêmen Bovino 2023.xlsx",
    programaId: 47, // legado - Sêmen Bovino
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["DOSES", "FÊMEAS"],
    descricao: "Sêmen Bovino",
  },
  {
    arquivo: "Sêmen Suíno - 2023.xlsx",
    programaId: 72,
    colProdutor: ["PRODUTOR"],
    colValor: ["R$", "VALOR"],
    colData: ["DATA"],
    colQuantidade: ["Nº MATRIZES", "MATRIZES"],
    descricao: "Sêmen Suíno",
  },
];

// ─── Funções auxiliares ──────────────────────────────────────────────────────

function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

function normalizarNome(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ─── Mapeamento manual: nome na planilha → nome no banco ─────────────────────
// Corrige erros de grafia da Claudete nas planilhas
const MAPEAMENTO_NOMES: Record<string, string> = {
  // Letras trocadas/faltando
  "Adilson Finken": "ADILSON FINCKE",
  "Alexandre Luis Kapser": "ALEXANDRE LUIS KASPER",
  "Amaro Arnold": "AMARO SIDONIO ARNOLT",
  "Ana Carolina Pauli": "ANA CAROLINE PAULI",
  "Ari Stresnke": "ARI STRENSKE",
  "Carlito Finken": "CARLITO FINCKE",
  "Claudir J. Benkenkamp": "CLAUDIR JOAO BECKENKAMP",
  "Dorvalino Boreli": "DORVALINO BORELLI",
  "Elizeu marcio Engellmann": "ELIZEU MARCIO ENGELMANN",
  "Irena Bergamnn": "IRENA BERGMANN",
  "Irena Bergmnn": "IRENA BERGMANN",
  "Jandir Mitteltaedt": "JANDIR MITTELSTAEDT",
  "Jonas Finken": "JONAS FINCKE",
  "Realdo Follamnn": "REALDO FOLLMANN",
  "Rodénerio Decker": "RODENERIO DECKER",
  "Rosani C. Sczuzk": "ROSANI CLEUSA SZCZUK",
  "Valdemar Eugenio Jarabizza": "VALDEMAR EUGENIO JARABIZA",
  "ivan Jonas Sczuk": "IVAN JONAS SZCZUK",
  "Marlosn J. Kohl": "MARLON JOSE KOHL",
  // Nomes abreviados
  "Cesar M. Auth": "CESAR MAURESIR AUTH",
  "César M. Auth": "CESAR MAURESIR AUTH",
  "Germano A. Hunemeier": "GERMANO ADEMAR HÜNEMEIER",
  "Germano Hunemeier": "GERMANO ADEMAR HÜNEMEIER",
  "Clóvis R. Kieling": "CLOVIS RENATO KIELING",
  "Clóvis Renato Kieling": "CLOVIS RENATO KIELING",
  "Ida Adam": "IDA MEINHARDT",
  "Ida M. Adam": "IDA MEINHARDT",
  "Giuvane C.S. Marholdt": "GIUVANE CINARA SZCZUK",
  "Giuvane C.S. Marholt": "GIUVANE CINARA SZCZUK",
  "Katia J. F. Cottica": "KATIA J.F. COTICA",
  "Katia J.F.Cottica": "KATIA J.F. COTICA",
  "Maria I. G. Fuhr": "MARIA INES GARTINER FUHR",
  "Maria I.G. Fuhr": "MARIA INES GARTINER FUHR",
  "Valério A. Dassoler": "VALERIO AGOSTINHO DASSOLER",
  "Rogério C. Mundt": "ROGERIO CLAUDIO MUNDT",
  "Everson W. Kunzler": "EVERSON WENDELINO KUNZLER",
  // Acentos + grafia
  "Antônio Arlindo Sieben": "ANTONIO ARLINDO SIEBEN",
  "Antônio Coelho": "ANTONIO COELHO",
  "Antônio José Pauli": "ANTONIO JOSE PAULI",
  "Antônio de Oliveira": "ANTONIO DE OLIVEIRA",
  "Célio Luiz Engellmann": "CELIO LUIS ENGELMANN",
  "Flávio Kaiser": "FLAVIO KAISER",
  "Flávio kaiser": "FLAVIO KAISER",
  "João José Pauli": "JOAO JOSE PAULI",
  "Salésio Pauli": "SALESIO PAULI",
  "Normélio Luis Zeiweibricker": "NORMELIO LUIS ZEIWEIBRICKER",
  "Rogério Gilberto Scherer": "ROGERIO GILBERTO SCHERER",
  "Marcelo Maldaner": "MARCELO JOSE MALDANER",
  // Nomes compostos / esposa
  "Debora Hunemeier (Cleiton)": "DEBORA HUNEMEIER",
  "Carlos Vanderlei Paulwels": "CARLOS VANDERLEI PAUWELS",
  "Deivid Carlos Kowald": "DEVID CARLOS KOWALD",
  "Deivid Kowald": "DEVID CARLOS KOWALD",
  // Outros
  "Arni Henz": "ARNI HENZ",
  "Geraldo Hefer": "GERALDO HOFER",
  "Jonas Hagdon": "JONAS HAGDON",
  "Erci Kaul Gartiner": "ERCI KAUL GARTINER",
  "Irica Bastian Heinz": "IRICA BASTIAN HEINZ",
  "Nelsy Nogueira Hugue": "NELCY NOGUEIRA HUGUE",
  "Rafael Rodrigo Hemsing": "RAFAEL RODRIGO HENSING",
  "Genecilda Ribeiro da Silva": "GENECILDA RIBEIRO DA SILVA",
  "Silmara de Oliveira": "SILMARA DE OLIVEIRA",
  "Vanderlei Astor Reinke": "VANDERLEI ASTOR REINCKE",
};

// Cache de pessoas para evitar queries repetidas
const cachePessoas = new Map<string, number | null>();

async function buscarPessoaPorNome(nome: string): Promise<number | null> {
  const nomeOriginal = nome.trim();
  // Limpar parênteses e espaços extras
  const nomeLimpo = nomeOriginal.replace(/\s*\(.*\)\s*/g, "").trim();
  const nomeNorm = normalizarNome(nomeLimpo);
  if (cachePessoas.has(nomeNorm)) return cachePessoas.get(nomeNorm)!;

  // 0. Verificar mapeamento manual primeiro
  const nomeMapeado = MAPEAMENTO_NOMES[nomeOriginal] || MAPEAMENTO_NOMES[nomeLimpo];
  if (nomeMapeado) {
    const pessoaMapeada = await prisma.pessoa.findFirst({
      where: { nome: { equals: nomeMapeado, mode: "insensitive" } },
    });
    if (pessoaMapeada) {
      cachePessoas.set(nomeNorm, pessoaMapeada.id);
      return pessoaMapeada.id;
    }
  }

  // 1. Busca exata (case-insensitive)
  const pessoaExata = await prisma.pessoa.findFirst({
    where: { nome: { equals: nomeLimpo, mode: "insensitive" } },
  });
  if (pessoaExata) {
    cachePessoas.set(nomeNorm, pessoaExata.id);
    return pessoaExata.id;
  }

  // 2. Busca sem acentos - carrega candidatos pelo primeiro nome
  const partes = nomeLimpo.split(/\s+/);
  const primeiroNorm = normalizarNome(partes[0]);

  const candidatos = await prisma.pessoa.findMany({
    where: { nome: { startsWith: partes[0], mode: "insensitive" } },
  });

  // Match exato sem acento
  for (const c of candidatos) {
    if (normalizarNome(c.nome) === nomeNorm) {
      cachePessoas.set(nomeNorm, c.id);
      return c.id;
    }
  }

  // 3. Busca por primeiro e último nome sem acento
  if (partes.length >= 2) {
    const ultimoNorm = normalizarNome(partes[partes.length - 1]);
    const matchPrimUlt = candidatos.filter((c) => {
      const cNorm = normalizarNome(c.nome);
      return cNorm.startsWith(primeiroNorm) && cNorm.endsWith(ultimoNorm);
    });
    if (matchPrimUlt.length === 1) {
      cachePessoas.set(nomeNorm, matchPrimUlt[0].id);
      return matchPrimUlt[0].id;
    }
  }

  // 4. Busca parcial - primeiro nome contém
  const candidatos2 = await prisma.pessoa.findMany({
    where: { nome: { contains: partes[0], mode: "insensitive" } },
  });
  for (const c of candidatos2) {
    const cNorm = normalizarNome(c.nome);
    if (cNorm.includes(nomeNorm) || nomeNorm.includes(cNorm)) {
      cachePessoas.set(nomeNorm, c.id);
      return c.id;
    }
  }

  cachePessoas.set(nomeNorm, null);
  return null;
}

function encontrarColunaIdx(
  header: string[],
  nomesColuna: string[]
): number {
  for (const nome of nomesColuna) {
    const idx = header.findIndex((h) =>
      h.toUpperCase().includes(nome.toUpperCase())
    );
    if (idx >= 0) return idx;
  }
  return -1;
}

function parsarData(valor: any, mesAba: string): Date | null {
  if (valor === null || valor === undefined || valor === "") return null;

  // Serial do Excel
  if (typeof valor === "number" && valor > 40000 && valor < 50000) {
    return excelDateToJSDate(valor);
  }

  // String de data
  if (typeof valor === "string") {
    const d = new Date(valor);
    if (!isNaN(d.getTime())) return d;
  }

  // Usar mês da aba como fallback
  const meses: Record<string, number> = {
    janeiro: 0, fevereiro: 1, março: 2, marco: 2, abril: 3, maio: 4, junho: 5,
    julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
  };
  const mesLower = mesAba.toLowerCase();
  for (const [nome, num] of Object.entries(meses)) {
    if (mesLower.includes(nome)) {
      return new Date(2023, num, 15);
    }
  }
  return new Date(2023, 6, 1); // fallback: julho 2023
}

function parsarNumero(valor: any): number {
  if (valor === null || valor === undefined || valor === "") return 0;
  if (typeof valor === "number") return valor;
  const str = String(valor).replace(/[^\d.,\-]/g, "").replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// ─── Migração de uma planilha ────────────────────────────────────────────────

interface Resultado {
  planilha: string;
  programa: string;
  extraidos: number;
  migrados: number;
  duplicatas: number;
  naoEncontrados: number;
  erros: number;
  valorTotal: number;
  naoEncontradosNomes: Set<string>;
}

async function migrarPlanilha(config: ConfigPlanilha): Promise<Resultado> {
  const resultado: Resultado = {
    planilha: config.arquivo,
    programa: config.descricao,
    extraidos: 0,
    migrados: 0,
    duplicatas: 0,
    naoEncontrados: 0,
    erros: 0,
    valorTotal: 0,
    naoEncontradosNomes: new Set(),
  };

  const filepath = path.join(PASTA, config.arquivo);
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠️ Arquivo não encontrado: ${config.arquivo}`);
    return resultado;
  }

  const workbook = XLSX.readFile(filepath);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: true,
    }) as any[][];

    if (dados.length < 2) continue;

    // Encontrar linha de cabeçalho real (contém PRODUTOR ou NOME + múltiplas colunas)
    let headerIdx = -1;
    for (let i = 0; i < Math.min(15, dados.length); i++) {
      const row = dados[i];
      if (!row) continue;
      // Cabeçalho real tem pelo menos 3 colunas preenchidas
      const colunasPreenchidas = row.filter(
        (c: any) => c !== "" && c !== null && c !== undefined
      ).length;
      if (colunasPreenchidas < 3) continue;

      const rowStr = row
        .map((c: any) => String(c).toUpperCase().trim())
        .join("|");
      if (
        rowStr.includes("PRODUTOR") ||
        (rowStr.includes("NOME") &&
          (rowStr.includes("R$") ||
            rowStr.includes("VALOR") ||
            rowStr.includes("DATA")))
      ) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) continue;

    const header = dados[headerIdx].map((c: any) =>
      String(c).toUpperCase().trim()
    );

    const idxProdutor = encontrarColunaIdx(header, config.colProdutor);
    const idxValor = encontrarColunaIdx(header, config.colValor);
    const idxData = encontrarColunaIdx(header, config.colData);
    const idxQuantidade =
      config.colQuantidade.length > 0
        ? encontrarColunaIdx(header, config.colQuantidade)
        : -1;

    if (idxProdutor === -1) continue;

    // Processar linhas de dados
    for (let i = headerIdx + 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row) continue;

      // Verificar se é uma linha de dados válida
      // Primeira coluna pode ser número sequencial ou o nome do produtor pode estar preenchido
      const primeiraCol = row[0];
      const temNumero =
        primeiraCol !== "" &&
        primeiraCol !== null &&
        primeiraCol !== undefined &&
        (typeof primeiraCol === "number" || /^\d+$/.test(String(primeiraCol).trim()));

      const nomeProdutor = String(row[idxProdutor] || "").trim();

      // Precisa ter número sequencial OU nome do produtor
      if (!temNumero && (!nomeProdutor || nomeProdutor.length < 3)) continue;
      if (!nomeProdutor || nomeProdutor.length < 3) continue;

      // Pular linhas de total/resumo/título
      const nomeUpper = nomeProdutor.toUpperCase();
      if (
        nomeUpper.startsWith("TOTAL") ||
        nomeUpper.startsWith("R$") ||
        nomeUpper.startsWith("VALOR") ||
        nomeUpper.includes("REAIS") ||
        nomeUpper.includes("(UM MIL") ||
        nomeUpper.includes("(DOIS MIL") ||
        nomeUpper.includes("(TRÊS MIL") ||
        nomeUpper.includes("(TREZENTOS") ||
        nomeUpper.includes("PRODUTORES QUE") ||
        nomeUpper.includes("RELATÓRIO") ||
        nomeUpper.includes("TANQUES") ||
        nomeUpper.includes("FAMÍLIAS") || nomeUpper.includes("FAMILIAS") ||
        nomeUpper.includes("MUDAS") ||
        nomeUpper.includes("ALEVINOS") ||
        nomeUpper.includes("EXAMES") ||
        nomeUpper.includes("DOSES") ||
        nomeUpper.includes("TONELADAS") ||
        /^\d[\d.,\s]*(KG|TON|P|G|MUDAS|DOSES|EXAMES|ALEVINOS|FAMÍLIAS|FAMILIAS)\b/i.test(nomeUpper) ||
        /^(JANEIRO|FEVEREIRO|MARÇO|MARCO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\b/i.test(nomeUpper) ||
        /^\d[\d.,\s]+$/.test(nomeProdutor.trim()) ||
        /^DE\s+\d{4}/.test(nomeUpper) ||
        /ACESSO|PATIO|PÁTIO/i.test(nomeUpper) && nomeUpper.includes("DE 20")
      )
        continue;

      const valor = idxValor >= 0 ? parsarNumero(row[idxValor]) : 0;
      const data = idxData >= 0 ? parsarData(row[idxData], sheetName) : parsarData(null, sheetName);
      const quantidade = idxQuantidade >= 0 ? parsarNumero(row[idxQuantidade]) : 0;

      resultado.extraidos++;

      try {
        const pessoaId = await buscarPessoaPorNome(nomeProdutor);

        if (!pessoaId) {
          resultado.naoEncontrados++;
          resultado.naoEncontradosNomes.add(nomeProdutor);
          continue;
        }

        const dataFinal = data || new Date(2023, 6, 1);

        // Verificar duplicata
        const existente = await prisma.solicitacaoBeneficio.findFirst({
          where: {
            pessoaId,
            programaId: config.programaId,
            datasolicitacao: dataFinal,
            valorCalculado: valor,
          },
        });

        if (existente) {
          resultado.duplicatas++;
          continue;
        }

        await prisma.solicitacaoBeneficio.create({
          data: {
            pessoaId,
            programaId: config.programaId,
            datasolicitacao: dataFinal,
            status: "concluido",
            observacoes: `Migrado da planilha 2023 | ${config.descricao} | Mês: ${sheetName}`,
            quantidadeSolicitada: quantidade,
            valorCalculado: valor,
            modalidade: "SUBSIDIO",
            calculoDetalhes: {
              migradoDe: "Planilha Excel 2023",
              arquivo: config.arquivo,
              aba: sheetName,
              linhaOriginal: Number(primeiraCol),
            },
          },
        });

        resultado.migrados++;
        resultado.valorTotal += valor;
      } catch (error: any) {
        resultado.erros++;
      }
    }
  }

  return resultado;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(80));
  console.log("MIGRAÇÃO UNIVERSAL - PLANILHAS 2023");
  console.log("=".repeat(80));

  const totalAntes = await prisma.solicitacaoBeneficio.count();
  console.log(`\nRegistros antes: ${totalAntes}`);
  console.log(`Planilhas a processar: ${PLANILHAS.length}\n`);

  const resultados: Resultado[] = [];
  const todosNaoEncontrados = new Set<string>();

  for (let i = 0; i < PLANILHAS.length; i++) {
    const config = PLANILHAS[i];
    console.log(`─── [${i + 1}/${PLANILHAS.length}] ${config.descricao} (ID ${config.programaId}) ───`);

    const resultado = await migrarPlanilha(config);
    resultados.push(resultado);

    console.log(
      `  Extraídos: ${resultado.extraidos} | Migrados: ${resultado.migrados} | ` +
        `Duplicatas: ${resultado.duplicatas} | Não encontrados: ${resultado.naoEncontrados} | ` +
        `Erros: ${resultado.erros} | R$ ${resultado.valorTotal.toFixed(2)}`
    );

    for (const nome of resultado.naoEncontradosNomes) {
      todosNaoEncontrados.add(nome);
    }
  }

  // Relatório final
  const totalDepois = await prisma.solicitacaoBeneficio.count();
  const totalMigrados = resultados.reduce((s, r) => s + r.migrados, 0);
  const totalExtraidos = resultados.reduce((s, r) => s + r.extraidos, 0);
  const totalValor = resultados.reduce((s, r) => s + r.valorTotal, 0);
  const totalNaoEncontrados = resultados.reduce((s, r) => s + r.naoEncontrados, 0);
  const totalDuplicatas = resultados.reduce((s, r) => s + r.duplicatas, 0);

  console.log(`\n${"=".repeat(80)}`);
  console.log("RELATÓRIO FINAL");
  console.log("=".repeat(80));
  console.log(`Registros antes:       ${totalAntes}`);
  console.log(`Registros depois:      ${totalDepois}`);
  console.log(`Novos registros:       ${totalDepois - totalAntes}`);
  console.log(`─────────────────────────────────`);
  console.log(`Total extraídos:       ${totalExtraidos}`);
  console.log(`Total migrados:        ${totalMigrados}`);
  console.log(`Total duplicatas:      ${totalDuplicatas}`);
  console.log(`Total não encontrados: ${totalNaoEncontrados}`);
  console.log(`Valor total migrado:   R$ ${totalValor.toFixed(2)}`);

  // Valor geral atualizado
  const valorGeral = await prisma.solicitacaoBeneficio.aggregate({
    _sum: { valorCalculado: true },
    where: { status: { in: ["aprovado", "concluido"] } },
  });
  console.log(`\nValor aprovados+concluídos: R$ ${Number(valorGeral._sum.valorCalculado || 0).toFixed(2)}`);

  // Tabela por planilha
  console.log(`\n${"─".repeat(80)}`);
  console.log("POR PLANILHA:");
  for (const r of resultados) {
    if (r.extraidos > 0) {
      console.log(
        `  ${r.programa.padEnd(35)} | ${String(r.migrados).padStart(4)} migrados | ` +
          `${String(r.naoEncontrados).padStart(3)} não enc. | R$ ${r.valorTotal.toFixed(2).padStart(12)}`
      );
    }
  }

  // Pessoas não encontradas (únicas)
  if (todosNaoEncontrados.size > 0) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`PESSOAS NÃO ENCONTRADAS (${todosNaoEncontrados.size} nomes únicos):`);
    const nomes = Array.from(todosNaoEncontrados).sort();
    for (const nome of nomes) {
      console.log(`  - ${nome}`);
    }
  }

  console.log(`\n${"=".repeat(80)}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Erro fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
