import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.programa.findUnique({
    where: { id: 9 },
    include: { _count: { select: { regras: true } } },
  });
  if (p) {
    console.log("ID:", p.id);
    console.log("Nome:", p.nome);
    console.log("Lei:", p.leiNumero);
    console.log("Ativo:", p.ativo);
    console.log("Regras:", p._count.regras);
  } else {
    console.log("Programa ID 9 NAO encontrado");
  }

  // Listar programas inativos tambem
  const inativos = await prisma.programa.findMany({
    where: { ativo: false },
    orderBy: { id: "asc" },
  });
  if (inativos.length > 0) {
    console.log("\nProgramas INATIVOS:");
    for (const i of inativos) {
      console.log(`  ID ${i.id} | ${i.nome} | ${i.leiNumero || "N/A"}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
