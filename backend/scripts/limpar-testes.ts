import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Pegar as últimas 20 solicitações
  const recentes = await prisma.solicitacaoBeneficio.findMany({
    orderBy: { id: "desc" },
    take: 20,
    include: {
      pessoa: { select: { id: true, nome: true, cpfCnpj: true } },
      programa: { select: { nome: true } },
    },
  });

  console.log(`Últimas ${recentes.length} solicitações:\n`);
  for (const s of recentes) {
    console.log(
      `ID ${s.id} | ${s.pessoa.nome.padEnd(45)} | ${s.programa.nome.padEnd(50)} | ${s.status}`
    );
  }

  // Identificar quais são de teste
  const testes = recentes.filter(
    (s) =>
      s.pessoa.nome.startsWith("TESTE") ||
      s.pessoa.nome.includes("Arrendatário") ||
      s.pessoa.cpfCnpj === "111.111.111-11" ||
      s.pessoa.cpfCnpj === "222.222.222-22" ||
      s.pessoa.cpfCnpj === "333.333.333-33"
  );

  if (testes.length > 0) {
    console.log(`\n--- SOLICITAÇÕES DE TESTE (${testes.length}): ---`);
    for (const s of testes) {
      console.log(`  ID ${s.id} | ${s.pessoa.nome} | ${s.pessoa.cpfCnpj}`);
    }

    const ids = testes.map((s) => s.id);
    const result = await prisma.solicitacaoBeneficio.deleteMany({
      where: { id: { in: ids } },
    });
    console.log(`\n✅ ${result.count} solicitações de teste removidas.`);
  } else {
    console.log("\nNenhuma solicitação de teste encontrada nas últimas 20.");
  }

  // Contar total restante
  const total = await prisma.solicitacaoBeneficio.count();
  console.log(`\nTotal de solicitações no banco: ${total}`);
}

main().finally(() => prisma.$disconnect());
