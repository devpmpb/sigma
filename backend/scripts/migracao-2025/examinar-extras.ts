import * as XLSX from 'xlsx';
import * as path from 'path';

const DIR = 'C:/csvs/2025';
const files = ['Cisterna - 2025.xlsx', 'Pecador Profissional - 2025.xlsx', 'Piscicultura - 2025.xlsx', 'Equipamentos - 2025.xlsx'];

for (const f of files) {
  const wb = XLSX.readFile(path.join(DIR, f));
  console.log(`\n=== ${f} ===`);

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`\n  [${sheetName}] (${data.length} linhas)`);

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      const parts: string[] = [];
      for (let j = 0; j < row.length; j++) {
        if (row[j] !== '' && row[j] !== null && row[j] !== undefined) {
          parts.push(String(row[j]));
        }
      }
      if (parts.length > 0) console.log(`    R${i + 1}: ${parts.join(' | ')}`);
    }
  }
}
