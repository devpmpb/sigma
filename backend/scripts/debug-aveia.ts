import * as XLSX from "xlsx";

const filepath = "C:\\Users\\marce\\Downloads\\2023\\Aveia - 2023.xlsx";
const workbook = XLSX.readFile(filepath);

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const dados = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  }) as any[][];

  console.log(`\n=== ABA: ${sheetName} (${dados.length} linhas) ===`);

  for (let i = 0; i < dados.length; i++) {
    const row = dados[i];
    if (!row) continue;
    const cells = row.map((c: any, idx: number) => {
      if (c === "" || c === null || c === undefined) return `[${idx}]:vazio`;
      return `[${idx}]:${typeof c}=${String(c).substring(0, 30)}`;
    }).filter((c: string) => !c.includes("vazio"));
    if (cells.length > 0) {
      console.log(`  L${i}: ${cells.join(" | ")}`);
    }
  }
}
