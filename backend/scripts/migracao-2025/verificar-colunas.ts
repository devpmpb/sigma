import * as XLSX from 'xlsx';

const checks = [
  'Esterco Líquido - 2025.xlsx',
  'Sêmen Bovino - 2025.xlsx',
  'Calcário - 2025.xlsx',
  'Pecador Profissional - 2025.xlsx',
  'Cisterna - 2025.xlsx',
  'Piscicultura - 2025.xlsx',
  'Cama de Aviário - 2025.xlsx',
];

for (const file of checks) {
  const wb = XLSX.readFile('C:\\csvs\\2025\\' + file);
  console.log('\n=== ' + file + ' ===');
  for (const sn of wb.SheetNames.slice(0, 2)) {
    const data: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '', raw: true });
    console.log('Sheet: ' + sn);
    for (let i = 0; i < Math.min(8, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      const cells = row.map((c: any, j: number) => j + ':' + String(c).substring(0, 30));
      console.log('  R' + i + ': ' + cells.join(' | '));
    }
  }
}
