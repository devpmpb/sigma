import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    const result: any[] = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) as total FROM staging_gim.subsidios_gim"
    );
    console.log("staging_gim.subsidios_gim tem", result[0].total, "registros");
  } catch (e: any) {
    console.log("Erro subsidios:", e.message?.substring(0, 200));
  }

  try {
    const result2: any[] = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) as total FROM staging_gim.map_subsidios"
    );
    console.log("staging_gim.map_subsidios tem", result2[0].total, "registros");
  } catch (e: any) {
    console.log("Erro map:", e.message?.substring(0, 200));
  }

  // Verificar total de solicitações
  const total = await prisma.solicitacaoBeneficio.count();
  console.log("\nSolicitacaoBeneficio atual:", total, "registros");
}

main().finally(() => prisma.$disconnect());
