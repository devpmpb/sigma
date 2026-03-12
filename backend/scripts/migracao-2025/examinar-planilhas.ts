import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const DIR = 'C:\\csvs\\2025';

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.xlsx')).sort();

console.log(`\n${'='.repeat(80)}`);
console.log(`  Encontrados ${files.length} arquivos .xlsx em ${DIR}`);
console.log(`${'='.repeat(80)}\n`);

for (const file of files) {
  const filePath = path.join(DIR, file);
  const workbook = XLSX.readFile(filePath);

  console.log(`\n${'─'.repeat(80)}`);
  console.log(`  Arquivo: ${file}`);
  console.log(`  Sheets (${workbook.SheetNames.length}): ${workbook.SheetNames.join(', ')}`);
  console.log(`${'─'.repeat(80)}`);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const ref = sheet['!ref'];

    if (!ref) {
      console.log(`\n  [${sheetName}] - Vazia`);
      continue;
    }

    // Get all data as array of arrays (raw values)
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const totalRows = data.length;

    // Count non-empty rows (at least one cell with content)
    const nonEmptyRows = data.filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined)).length;

    console.log(`\n  [${sheetName}] - Range: ${ref} | Total linhas: ${totalRows} | Não-vazias: ${nonEmptyRows}`);
    console.log('');

    // Print first 5 non-empty rows
    const rowsToPrint = data.slice(0, 5);
    for (let i = 0; i < rowsToPrint.length; i++) {
      const row = rowsToPrint[i];
      // Trim trailing empty cells for display
      let lastNonEmpty = row.length - 1;
      while (lastNonEmpty >= 0 && (row[lastNonEmpty] === '' || row[lastNonEmpty] === null || row[lastNonEmpty] === undefined)) {
        lastNonEmpty--;
      }
      const trimmedRow = row.slice(0, lastNonEmpty + 1);

      const cells = trimmedRow.map((cell: any, colIdx: number) => {
        if (cell === '' || cell === null || cell === undefined) return '';
        // Check if it might be an Excel date serial number
        if (typeof cell === 'number' && cell > 30000 && cell < 60000) {
          try {
            const date = XLSX.SSF.format('dd/mm/yyyy', cell);
            return `${cell}(=${date})`;
          } catch {
            return String(cell);
          }
        }
        return String(cell);
      });

      const label = i === 0 ? 'HDR' : `R${i + 1} `;
      console.log(`    ${label}: ${cells.join(' | ')}`);
    }
  }
}

console.log(`\n${'='.repeat(80)}`);
console.log('  Fim da análise');
console.log(`${'='.repeat(80)}\n`);
