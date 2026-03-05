import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Programas GIM com nomes
  const progs: any[] = await prisma.$queryRawUnsafe(
    "SELECT cod_programa::int as cod, descricao FROM staging_gim.programas_gim ORDER BY cod_programa"
  );
  console.log("PROGRAMAS GIM:");
  for (const r of progs) console.log(`  ${r.cod}: ${r.descricao}`);

  // Map programas
  const mp: any[] = await prisma.$queryRawUnsafe(
    "SELECT id_gim::int, id_sigma::int, nome_programa FROM staging_gim.map_programas ORDER BY id_gim"
  );
  console.log("\nMAP_PROGRAMAS (GIM -> SIGMA):");
  for (const r of mp) console.log(`  GIM ${r.id_gim} -> SIGMA ${r.id_sigma} (${r.nome_programa})`);

  // Programa 81 no SIGMA
  const sol = await prisma.solicitacaoBeneficio.count({ where: { programaId: 81 } });
  console.log(`\nPrograma 81 (Auxilio SIM): ${sol} solicitacoes`);
}

main().finally(() => prisma.$disconnect());
