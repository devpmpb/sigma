import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const r = await p.solicitacaoBeneficio.groupBy({ by: ["status"], _count: { id: true } });
  for (const x of r) console.log(`"${x.status}": ${x._count.id}`);
}
main().finally(() => p.$disconnect());
