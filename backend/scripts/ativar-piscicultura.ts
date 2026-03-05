import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.programa.update({
    where: { id: 9 },
    data: { ativo: true },
  });
  console.log("Programa ID 9 (Piscicultura Sustentável) ativado!");
}

main().finally(() => prisma.$disconnect());
