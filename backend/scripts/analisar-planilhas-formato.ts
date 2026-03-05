import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const PASTA = "C:\\Users\\marce\\Downloads\\2023";

async function main() {
  console.log("=".repeat(80));
  console.log("ANÁLISE DE FORMATO DAS PLANILHAS 2023");
  console.log("=".repeat(80));

  const arquivos = fs.readdirSync(PASTA).filter((f) => f.endsWith(".xlsx"));
  console.log(`\nTotal de arquivos: ${arquivos.length}\n`);

  for (const arquivo of arquivos) {
    const filepath = path.join(PASTA, arquivo);
    console.log(`${"─".repeat(80)}`);
    console.log(`📁 ${arquivo}`);

    try {
      const workbook = XLSX.readFile(filepath);
      console.log(`   Abas: ${workbook.SheetNames.join(", ")}`);

      // Analisar primeira aba com dados
      for (const sheetName of workbook.SheetNames.slice(0, 2)) {
        const sheet = workbook.Sheets[sheetName];
        const dados = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          raw: true,
        }) as any[][];

        if (dados.length === 0) {
          console.log(`   [${sheetName}] Aba vazia`);
          continue;
        }

        // Mostrar primeiras 8 linhas para entender o formato
        console.log(`   [${sheetName}] ${dados.length} linhas total`);
        console.log(`   Primeiras linhas:`);
        for (let i = 0; i < Math.min(8, dados.length); i++) {
          const row = dados[i];
          if (!row || row.every((c: any) => c === "" || c === null || c === undefined))
            continue;
          const cells = row
            .map((c: any) => {
              if (c === "" || c === null || c === undefined) return "";
              return String(c).substring(0, 25);
            })
            .filter((c: string) => c !== "");
          if (cells.length > 0) {
            console.log(`     Linha ${i}: ${cells.join(" | ")}`);
          }
        }
      }
    } catch (e: any) {
      console.log(`   ERRO: ${e.message?.substring(0, 100)}`);
    }
    console.log("");
  }
}

main();
