import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("BUSCA DE PRODUTORES COM MAIS REGISTROS (para verificar duplicatas em produção)");
  console.log("=".repeat(80));

  // Buscar produtores com mais solicitações no banco atual (sigma_testes)
  const topProdutores: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      p.id,
      p.nome,
      p."cpfCnpj",
      COUNT(sb.id)::int as qtd_solicitacoes,
      COUNT(DISTINCT sb."programaId")::int as qtd_programas_distintos,
      SUM(sb."valorCalculado") as valor_total
    FROM "Pessoa" p
    INNER JOIN "SolicitacaoBeneficio" sb ON sb."pessoaId" = p.id
    GROUP BY p.id, p.nome, p."cpfCnpj"
    ORDER BY COUNT(sb.id) DESC
    LIMIT 10
  `);

  console.log("\nTOP 10 PRODUTORES COM MAIS SOLICITAÇÕES (banco testes):");
  console.log("-".repeat(80));
  for (const p of topProdutores) {
    console.log(
      `${p.nome.padEnd(40)} | CPF: ${(p.cpfCnpj || "N/A").padEnd(15)} | ${p.qtd_solicitacoes} solicitações | ${p.qtd_programas_distintos} programas | R$ ${Number(p.valor_total || 0).toFixed(2)}`
    );
  }

  // Para cada top produtor, mostrar detalhes das solicitações
  console.log("\n\nDETALHE DOS 3 PRIMEIROS (verificar em produção):");
  for (let i = 0; i < Math.min(3, topProdutores.length); i++) {
    const prod = topProdutores[i];
    console.log(`\n${"=".repeat(80)}`);
    console.log(`PRODUTOR: ${prod.nome} | CPF: ${prod.cpfCnpj}`);
    console.log("-".repeat(80));

    const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
      where: { pessoaId: prod.id },
      include: {
        programa: { select: { nome: true } },
      },
      orderBy: { datasolicitacao: "asc" },
    });

    for (const s of solicitacoes) {
      const data = s.datasolicitacao
        ? new Date(s.datasolicitacao).toLocaleDateString("pt-BR")
        : "N/A";
      console.log(
        `  ID ${String(s.id).padStart(6)} | ${data.padEnd(12)} | ${s.status.padEnd(10)} | R$ ${Number(s.valorCalculado || 0).toFixed(2).padStart(10)} | ${s.programa.nome}`
      );
    }
    console.log(`  TOTAL: ${solicitacoes.length} solicitações`);
  }

  // Buscar possíveis duplicatas EXATAS (mesmo produtor + mesmo programa + mesma data)
  console.log(`\n\n${"=".repeat(80)}`);
  console.log("POSSÍVEIS DUPLICATAS (mesmo produtor + programa + data):");
  console.log("-".repeat(80));

  const duplicatas: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      p.nome,
      p."cpfCnpj",
      prog.nome as programa,
      sb.datasolicitacao,
      sb."valorCalculado",
      COUNT(*)::int as vezes
    FROM "SolicitacaoBeneficio" sb
    INNER JOIN "Pessoa" p ON p.id = sb."pessoaId"
    INNER JOIN "Programa" prog ON prog.id = sb."programaId"
    GROUP BY p.nome, p."cpfCnpj", prog.nome, sb.datasolicitacao, sb."valorCalculado"
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 15
  `);

  if (duplicatas.length === 0) {
    console.log("NENHUMA DUPLICATA EXATA encontrada no banco de testes!");
  } else {
    console.log(`Encontradas ${duplicatas.length} combinações duplicadas:`);
    for (const d of duplicatas) {
      const data = d.datasolicitacao
        ? new Date(d.datasolicitacao).toLocaleDateString("pt-BR")
        : "N/A";
      console.log(
        `  ${d.vezes}x | ${d.nome.padEnd(35)} | ${data.padEnd(12)} | R$ ${Number(d.valorCalculado || 0).toFixed(2).padStart(10)} | ${d.programa}`
      );
    }
  }
}

main().finally(() => prisma.$disconnect());
