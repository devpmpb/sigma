/**
 * Examina a estrutura de todas as planilhas de 2024
 */
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const PASTA = 'C:\\csvs\\2024';

const arquivos = fs.readdirSync(PASTA).filter(f => f.endsWith('.xlsx'));

for (const arq of arquivos) {
  console.log('\n' + '='.repeat(80));
  console.log(`ARQUIVO: ${arq}`);
  console.log('='.repeat(80));

  const wb = XLSX.readFile(path.join(PASTA, arq));
  console.log(`Abas: ${wb.SheetNames.join(', ')}`);

  for (const sheetName of wb.SheetNames.slice(0, 3)) {
    const sheet = wb.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

    console.log(`\n  --- Aba: "${sheetName}" (${dados.length} linhas) ---`);

    // Mostrar as primeiras 5 linhas
    for (let i = 0; i < Math.min(5, dados.length); i++) {
      const row = dados[i];
      if (!row) continue;
      const cols = row.slice(0, 10).map((c: any) => {
        const s = String(c).trim();
        return s.length > 30 ? s.substring(0, 30) + '...' : s;
      });
      console.log(`    [${i}] ${cols.join(' | ')}`);
    }
  }
}
