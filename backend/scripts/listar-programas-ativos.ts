import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const progs = await prisma.programa.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { id: "asc" },
  });
  for (const pr of progs) {
    console.log(`ID ${String(pr.id).padStart(3)}: ${pr.nome}`);
  }
}

main().finally(() => prisma.$disconnect());
