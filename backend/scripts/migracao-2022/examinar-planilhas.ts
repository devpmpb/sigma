/**
 * Examina estrutura das planilhas 2022
 * Executar: npx tsx scripts/migracao-2022/examinar-planilhas.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const PASTA = 'C:\\csvs\\2022';

const arquivos = fs.readdirSync(PASTA).filter(f => f.endsWith('.xlsx'));

for (const arquivo of arquivos) {
  console.log('\n' + '='.repeat(80));
  console.log(`ARQUIVO: ${arquivo}`);
  console.log('='.repeat(80));

  const wb = XLSX.readFile(path.join(PASTA, arquivo));

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

    console.log(`\n  ABA: "${sheetName}" (${dados.length} linhas)`);

    // Mostra primeiras 8 linhas
    for (let i = 0; i < Math.min(8, dados.length); i++) {
      const row = dados[i];
      if (!row) continue;
      const cells = row.map((c: any, idx: number) => `[${idx}]${String(c).substring(0, 30)}`).join(' | ');
      console.log(`    L${i}: ${cells}`);
    }
  }
}

console.log('\nConcluido!');
