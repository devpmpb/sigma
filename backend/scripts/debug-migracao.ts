import * as XLSX from "xlsx";

const filepath = "C:\\Users\\marce\\Downloads\\2023\\Aveia - 2023.xlsx";
const workbook = XLSX.readFile(filepath);

const sheetName = "Junho 2023";
const sheet = workbook.Sheets[sheetName];
const dados = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  defval: "",
  raw: true,
}) as any[][];

console.log(`Aba: ${sheetName}, ${dados.length} linhas\n`);

// Simular busca do cabeçalho
let headerIdx = -1;
for (let i = 0; i < Math.min(15, dados.length); i++) {
  const row = dados[i];
  if (!row) continue;
  const rowStr = row
    .map((c: any) => String(c).toUpperCase().trim())
    .join("|");
  console.log(`Linha ${i}: "${rowStr.substring(0, 100)}"`);
  const match =
    rowStr.includes("PRODUTOR") ||
    (rowStr.includes("NOME") &&
      (rowStr.includes("R$") ||
        rowStr.includes("VALOR") ||
        rowStr.includes("DATA")));
  console.log(`  → Match cabeçalho: ${match}`);
  if (match && headerIdx === -1) {
    headerIdx = i;
  }
}

console.log(`\nCabeçalho encontrado na linha: ${headerIdx}`);

if (headerIdx >= 0) {
  const header = dados[headerIdx].map((c: any) =>
    String(c).toUpperCase().trim()
  );
  console.log(`Header: ${header.join(" | ")}`);

  // Encontrar colunas
  const idxProdutor = header.findIndex((h: string) =>
    h.includes("PRODUTOR")
  );
  const idxValor = header.findIndex(
    (h: string) => h.includes("R$") || h.includes("VALOR")
  );
  const idxData = header.findIndex((h: string) => h.includes("DATA"));

  console.log(
    `idxProdutor=${idxProdutor}, idxValor=${idxValor}, idxData=${idxData}`
  );

  // Processar linhas
  for (let i = headerIdx + 1; i < dados.length; i++) {
    const row = dados[i];
    if (!row) continue;

    const primeiraCol = row[0];
    const temNumero =
      primeiraCol !== "" &&
      primeiraCol !== null &&
      primeiraCol !== undefined &&
      (typeof primeiraCol === "number" ||
        /^\d+$/.test(String(primeiraCol).trim()));

    const nomeProdutor = String(row[idxProdutor] || "").trim();

    console.log(
      `  L${i}: col0=${primeiraCol}(${typeof primeiraCol}) temNum=${temNumero} nome="${nomeProdutor}" valor=${row[idxValor]}`
    );

    // Teste de filtro
    if (!temNumero && (!nomeProdutor || nomeProdutor.length < 3)) {
      console.log("    → SKIP: sem número e sem nome");
      continue;
    }
    if (!nomeProdutor || nomeProdutor.length < 3) {
      console.log("    → SKIP: nome muito curto");
      continue;
    }

    const nomeUpper = nomeProdutor.toUpperCase();
    const mesRegex =
      /^(JANEIRO|FEVEREIRO|MARÇO|MARCO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\b/i;
    if (mesRegex.test(nomeUpper)) {
      console.log("    → SKIP: nome de mês");
      continue;
    }

    console.log("    → OK: registro válido");
  }
}
