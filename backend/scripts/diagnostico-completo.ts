import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(80));
  console.log("DIAGNÓSTICO COMPLETO - SOLICITAÇÕES DE BENEFÍCIO");
  console.log("=".repeat(80));

  // 1. Total geral
  const total = await prisma.solicitacaoBeneficio.count();
  console.log(`\nTotal de SolicitacaoBeneficio: ${total}`);

  // 2. Por status
  const porStatus = await prisma.solicitacaoBeneficio.groupBy({
    by: ["status"],
    _count: { id: true },
    _sum: { valorCalculado: true },
  });
  console.log("\nPOR STATUS:");
  for (const s of porStatus) {
    console.log(
      `  ${String(s.status).padEnd(15)} | ${String(s._count.id).padStart(6)} registros | R$ ${Number(s._sum.valorCalculado || 0).toFixed(2).padStart(14)}`
    );
  }

  // 3. Por programa (top 20)
  const porPrograma = await prisma.solicitacaoBeneficio.groupBy({
    by: ["programaId"],
    _count: { id: true },
    _sum: { valorCalculado: true },
    orderBy: { _count: { id: "desc" } },
    take: 30,
  });
  console.log("\nPOR PROGRAMA:");
  for (const p of porPrograma) {
    const programa = await prisma.programa.findUnique({
      where: { id: p.programaId },
      select: { nome: true },
    });
    console.log(
      `  ID ${String(p.programaId).padStart(3)} | ${(programa?.nome || "???").padEnd(55)} | ${String(p._count.id).padStart(6)} reg | R$ ${Number(p._sum.valorCalculado || 0).toFixed(2).padStart(14)}`
    );
  }

  // 4. Verificar se tem dados de migração 2023 (observação contém "planilha")
  const migrados2023 = await prisma.solicitacaoBeneficio.count({
    where: {
      observacoes: { contains: "planilha 2023", mode: "insensitive" },
    },
  });
  console.log(`\nRegistros com 'planilha 2023' nas observações: ${migrados2023}`);

  // 5. Verificar registros com "Enquadramento:" (vindos do GIM)
  const migradosGIM = await prisma.solicitacaoBeneficio.count({
    where: {
      observacoes: { contains: "Enquadramento:", mode: "insensitive" },
    },
  });
  console.log(`Registros com 'Enquadramento:' nas observações (GIM): ${migradosGIM}`);

  // 6. Valor total
  const valorTotal = await prisma.solicitacaoBeneficio.aggregate({
    _sum: { valorCalculado: true },
  });
  console.log(
    `\nVALOR TOTAL: R$ ${Number(valorTotal._sum.valorCalculado || 0).toFixed(2)}`
  );

  // 7. Valor total apenas aprovados/concluídos
  const valorAprovados = await prisma.solicitacaoBeneficio.aggregate({
    _sum: { valorCalculado: true },
    where: { status: { in: ["aprovado", "concluido"] } },
  });
  console.log(
    `VALOR APROVADOS+CONCLUÍDOS: R$ ${Number(valorAprovados._sum.valorCalculado || 0).toFixed(2)}`
  );

  // 8. Verificar se map_subsidios existe e quantos tem
  try {
    const mapCount: any[] = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) as total FROM staging_gim.map_subsidios"
    );
    console.log(`\nstaging_gim.map_subsidios: ${mapCount[0].total} registros`);
  } catch (e: any) {
    console.log(`\nstaging_gim.map_subsidios: ERRO - ${e.message?.substring(0, 100)}`);
  }

  // 9. Verificar subsidios_gim
  try {
    const stagingCount: any[] = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) as total FROM staging_gim.subsidios_gim"
    );
    console.log(`staging_gim.subsidios_gim: ${stagingCount[0].total} registros`);
  } catch (e: any) {
    console.log(`staging_gim.subsidios_gim: ERRO - ${e.message?.substring(0, 100)}`);
  }

  // 10. Verificar se planilhas 2023 existem
  const fs = await import("fs");
  const planilhasDir = "C:\\Users\\marce\\Downloads\\2023";
  try {
    const files = fs.readdirSync(planilhasDir);
    const xlsxFiles = files.filter((f: string) => f.endsWith(".xlsx"));
    console.log(`\nPlanilhas em ${planilhasDir}: ${xlsxFiles.length} arquivos .xlsx`);
    for (const f of xlsxFiles) {
      console.log(`  - ${f}`);
    }
  } catch (e: any) {
    console.log(`\nDiretório ${planilhasDir}: NÃO ENCONTRADO ou erro - ${e.message?.substring(0, 100)}`);
  }

  console.log("\n" + "=".repeat(80));
}

main().finally(() => prisma.$disconnect());
