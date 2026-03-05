import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Programa "Migrado do GIM"
  const prog = await prisma.programa.findMany({
    where: { nome: { contains: "Migrado", mode: "insensitive" } },
    select: { id: true, nome: true },
  });
  console.log("Programas com 'Migrado':", JSON.stringify(prog));

  // 2. Map programas (GIM -> SIGMA)
  const mapProg: any[] = await prisma.$queryRawUnsafe(
    "SELECT * FROM staging_gim.map_programas ORDER BY id_gim"
  );
  console.log("\nMAP PROGRAMAS (GIM -> SIGMA):");
  for (const m of mapProg) {
    console.log(`  GIM ${m.id_gim} -> SIGMA ${m.id_sigma}`);
  }

  // 3. Distribuição no staging por cod_programa
  const dist: any[] = await prisma.$queryRawUnsafe(`
    SELECT sg.cod_programa, COUNT(*)::int as qtd
    FROM staging_gim.subsidios_gim sg
    GROUP BY sg.cod_programa
    ORDER BY COUNT(*) DESC
  `);
  console.log("\nDistribuição staging por cod_programa:");
  for (const d of dist) {
    console.log(`  cod_programa ${d.cod_programa}: ${d.qtd} registros`);
  }

  // 4. Distribuição atual no SIGMA
  const distSigma: any[] = await prisma.$queryRawUnsafe(`
    SELECT ms.cod_programa_gim, ms.programa_id_sigma, COUNT(*)::int as qtd
    FROM staging_gim.map_subsidios ms
    GROUP BY ms.cod_programa_gim, ms.programa_id_sigma
    ORDER BY COUNT(*) DESC
  `);
  console.log("\nDistribuição no map_subsidios (como foi mapeado):");
  for (const d of distSigma) {
    console.log(
      `  GIM cod_programa ${d.cod_programa_gim} -> SIGMA programa ${d.programa_id_sigma}: ${d.qtd} registros`
    );
  }

  // 5. Ver quais cod_programa do GIM NÃO estão no map_programas
  const naoMapeados: any[] = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT sg.cod_programa, COUNT(*)::int as qtd
    FROM staging_gim.subsidios_gim sg
    WHERE NOT EXISTS (
      SELECT 1 FROM staging_gim.map_programas mp WHERE mp.id_gim = sg.cod_programa
    )
    GROUP BY sg.cod_programa
    ORDER BY COUNT(*) DESC
  `);
  console.log("\ncod_programa GIM SEM mapeamento:");
  for (const d of naoMapeados) {
    console.log(`  cod_programa ${d.cod_programa}: ${d.qtd} registros`);
  }
}

main().finally(() => prisma.$disconnect());
