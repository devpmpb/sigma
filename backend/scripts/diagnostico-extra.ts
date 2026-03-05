import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Verificar estrutura da tabela programas_gim
  const cols: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'staging_gim' AND table_name = 'programas_gim'
    ORDER BY ordinal_position
  `);
  console.log("Colunas de programas_gim:", cols.map((c) => c.column_name).join(", "));

  // 2. Amostra de programas_gim
  const sample: any[] = await prisma.$queryRawUnsafe(
    "SELECT * FROM staging_gim.programas_gim LIMIT 5"
  );
  console.log("\nAmostra programas_gim:");
  for (const s of sample) {
    console.log("  ", JSON.stringify(s));
  }

  // 3. Distribuição dos subsídios no staging por cod_programa
  const distStaging: any[] = await prisma.$queryRawUnsafe(`
    SELECT sg.cod_programa, COUNT(*) as qtd,
           SUM(REPLACE(COALESCE(NULLIF(TRIM(sg.valor), ''), '0'), ',', '.')::NUMERIC) as valor
    FROM staging_gim.subsidios_gim sg
    GROUP BY sg.cod_programa
    ORDER BY COUNT(*) DESC
  `);

  console.log("\n\nDISTRIBUIÇÃO NO STAGING POR COD_PROGRAMA:");
  console.log("=".repeat(80));
  for (const d of distStaging) {
    console.log(
      `Programa GIM ${String(d.cod_programa).padStart(4)} | ${String(d.qtd).padStart(5)} registros | R$ ${Number(d.valor).toFixed(2).padStart(12)}`
    );
  }

  // 4. Map programas
  const mapProg: any[] = await prisma.$queryRawUnsafe(`
    SELECT * FROM staging_gim.map_programas ORDER BY id_gim
  `);
  console.log("\n\nMAP PROGRAMAS (GIM -> SIGMA):");
  for (const m of mapProg) {
    console.log(`  GIM ${m.id_gim} -> SIGMA ${m.id_sigma}`);
  }
}

main().finally(() => prisma.$disconnect());
