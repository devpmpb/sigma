/**
 * Corrige o mapeamento de programas dos subsídios restaurados do GIM.
 *
 * Problema: A restauração (restaurar-subsidios.sql) usou mapear_enquadramento_programa()
 * que mapeou quase tudo para programa ID 2 (Esterco Líquido 2007).
 *
 * Solução: Usar o map_subsidios + map_programas para remapear cada registro
 * para o programa correto.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(80));
  console.log("CORREÇÃO DE MAPEAMENTO - SUBSÍDIOS GIM");
  console.log("=".repeat(80));

  // Estado antes
  const antes = await prisma.solicitacaoBeneficio.groupBy({
    by: ["programaId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });
  console.log("\nTop 5 programas ANTES:");
  for (const a of antes) {
    const prog = await prisma.programa.findUnique({
      where: { id: a.programaId },
      select: { nome: true },
    });
    console.log(`  ID ${a.programaId}: ${a._count.id} registros (${prog?.nome})`);
  }

  // Executar UPDATE usando map_subsidios + map_programas
  const result: any[] = await prisma.$queryRawUnsafe(`
    UPDATE "SolicitacaoBeneficio" sb
    SET "programaId" = mp.id_sigma,
        "updatedAt" = NOW()
    FROM staging_gim.map_subsidios ms
    INNER JOIN staging_gim.map_programas mp ON mp.id_gim = ms.cod_programa_gim
    WHERE sb.id = ms.id_sigma
      AND sb."programaId" != mp.id_sigma
      AND mp.id_sigma IS NOT NULL
    RETURNING sb.id
  `);

  console.log(`\nRegistros corrigidos: ${result.length}`);

  // Estado depois
  const depois = await prisma.solicitacaoBeneficio.groupBy({
    by: ["programaId"],
    _count: { id: true },
    _sum: { valorCalculado: true },
    orderBy: { _count: { id: "desc" } },
  });

  console.log("\nDistribuição DEPOIS da correção:");
  for (const d of depois) {
    const prog = await prisma.programa.findUnique({
      where: { id: d.programaId },
      select: { nome: true },
    });
    console.log(
      `  ID ${String(d.programaId).padStart(3)} | ${String(d._count.id).padStart(5)} reg | R$ ${Number(d._sum.valorCalculado || 0).toFixed(2).padStart(14)} | ${prog?.nome}`
    );
  }

  // Valor total
  const total = await prisma.solicitacaoBeneficio.aggregate({
    _sum: { valorCalculado: true },
    _count: { id: true },
  });
  console.log(`\nTotal: ${total._count.id} registros | R$ ${Number(total._sum.valorCalculado || 0).toFixed(2)}`);

  const valorAprovados = await prisma.solicitacaoBeneficio.aggregate({
    _sum: { valorCalculado: true },
    where: { status: { in: ["aprovado", "concluido"] } },
  });
  console.log(`Valor aprovados+concluídos: R$ ${Number(valorAprovados._sum.valorCalculado || 0).toFixed(2)}`);
}

main().finally(() => prisma.$disconnect());
