import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(80));
  console.log("LIMPEZA DE DUPLICATAS - SolicitacaoBeneficio");
  console.log("=".repeat(80));

  // 1. Diagnóstico antes
  const totalAntes = await prisma.solicitacaoBeneficio.count();
  console.log(`\nTotal ANTES: ${totalAntes}`);

  // 2. Buscar todas as duplicatas (mesmo pessoaId + programaId + data + valor)
  const duplicatas: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      "pessoaId",
      "programaId",
      datasolicitacao,
      "valorCalculado",
      "quantidadeSolicitada",
      status,
      COUNT(*)::int as vezes,
      MIN(id) as manter_id,
      ARRAY_AGG(id ORDER BY id) as todos_ids
    FROM "SolicitacaoBeneficio"
    GROUP BY "pessoaId", "programaId", datasolicitacao, "valorCalculado", "quantidadeSolicitada", status
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);

  if (duplicatas.length === 0) {
    console.log("\nNenhuma duplicata encontrada!");
    return;
  }

  // 3. Calcular IDs a remover
  const idsRemover: number[] = [];
  let totalDuplicados = 0;

  console.log(`\nGrupos duplicados encontrados: ${duplicatas.length}`);
  console.log("\nTop 20 duplicatas:");
  console.log("-".repeat(80));

  for (let i = 0; i < Math.min(20, duplicatas.length); i++) {
    const d = duplicatas[i];
    const pessoa = await prisma.pessoa.findUnique({
      where: { id: d.pessoaId },
      select: { nome: true },
    });
    const programa = await prisma.programa.findUnique({
      where: { id: d.programaId },
      select: { nome: true },
    });
    const data = d.datasolicitacao
      ? new Date(d.datasolicitacao).toLocaleDateString("pt-BR")
      : "N/A";
    console.log(
      `  ${d.vezes}x | ${(pessoa?.nome || "?").padEnd(35)} | ${data.padEnd(12)} | R$ ${Number(d.valorCalculado || 0).toFixed(2).padStart(10)} | ${programa?.nome}`
    );
  }

  // Coletar todos os IDs a remover (manter o menor ID de cada grupo)
  for (const d of duplicatas) {
    const ids: number[] = d.todos_ids;
    // Manter o primeiro (menor ID), remover o resto
    for (let i = 1; i < ids.length; i++) {
      idsRemover.push(ids[i]);
    }
    totalDuplicados += ids.length - 1;
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`Total de registros duplicados a REMOVER: ${totalDuplicados}`);
  console.log(`Total de grupos únicos mantidos: ${duplicatas.length}`);
  console.log(`Total esperado após limpeza: ${totalAntes - totalDuplicados}`);

  // 4. Remover em lotes de 500
  console.log(`\nRemovendo ${idsRemover.length} registros duplicados...`);

  let removidos = 0;
  const batchSize = 500;
  for (let i = 0; i < idsRemover.length; i += batchSize) {
    const batch = idsRemover.slice(i, i + batchSize);
    const result = await prisma.solicitacaoBeneficio.deleteMany({
      where: { id: { in: batch } },
    });
    removidos += result.count;
    if (removidos % 1000 === 0 || i + batchSize >= idsRemover.length) {
      console.log(`  Removidos: ${removidos}/${idsRemover.length}`);
    }
  }

  // 5. Diagnóstico depois
  const totalDepois = await prisma.solicitacaoBeneficio.count();
  const valorDepois = await prisma.solicitacaoBeneficio.aggregate({
    _sum: { valorCalculado: true },
  });
  const valorAprovados = await prisma.solicitacaoBeneficio.aggregate({
    _sum: { valorCalculado: true },
    where: { status: { in: ["aprovado", "concluido"] } },
  });

  console.log(`\n${"=".repeat(80)}`);
  console.log("RESULTADO:");
  console.log(`  Total ANTES:  ${totalAntes}`);
  console.log(`  Removidos:    ${removidos}`);
  console.log(`  Total DEPOIS: ${totalDepois}`);
  console.log(`  Valor total:  R$ ${Number(valorDepois._sum.valorCalculado || 0).toFixed(2)}`);
  console.log(`  Valor aprovados+concluídos: R$ ${Number(valorAprovados._sum.valorCalculado || 0).toFixed(2)}`);

  // 6. Verificar se ainda restam duplicatas
  const restantes: any[] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int as grupos
    FROM (
      SELECT "pessoaId", "programaId", datasolicitacao, "valorCalculado", "quantidadeSolicitada", status
      FROM "SolicitacaoBeneficio"
      GROUP BY "pessoaId", "programaId", datasolicitacao, "valorCalculado", "quantidadeSolicitada", status
      HAVING COUNT(*) > 1
    ) sub
  `);
  console.log(`  Duplicatas restantes: ${restantes[0].grupos} grupos`);
  console.log("=".repeat(80));
}

main().finally(() => prisma.$disconnect());
