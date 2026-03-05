import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const programas = await prisma.programa.findMany({
    where: { ativo: true },
    orderBy: { id: "asc" },
    include: { _count: { select: { regras: true } } },
  });

  console.log("=".repeat(100));
  console.log("PROGRAMAS ATIVOS NO BANCO");
  console.log("=".repeat(100));

  for (const p of programas) {
    const lei = p.leiNumero || "N/A";
    console.log(
      `ID ${String(p.id).padStart(3)} | ${p.nome.padEnd(50)} | Lei: ${lei.padEnd(30)} | ${p.tipoPrograma.padEnd(10)} | ${p.periodicidade.padEnd(8)} | ${p._count.regras} regras`
    );
  }

  console.log("=".repeat(100));
  console.log(`Total: ${programas.length} programas ativos`);
}

main().finally(() => prisma.$disconnect());
