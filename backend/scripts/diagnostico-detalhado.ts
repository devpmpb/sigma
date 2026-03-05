import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Quantos registros cada programa recebeu agora vs quantos deveria ter
  const distribuicao: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      p.id, p.nome, p.ativo,
      COUNT(sb.id) as qtd,
      COALESCE(SUM(sb."valorCalculado"), 0) as valor_total
    FROM "Programa" p
    LEFT JOIN "SolicitacaoBeneficio" sb ON sb."programaId" = p.id
    GROUP BY p.id, p.nome, p.ativo
    HAVING COUNT(sb.id) > 0
    ORDER BY COUNT(sb.id) DESC
  `);

  console.log("DISTRIBUIÇÃO ATUAL POR PROGRAMA:");
  console.log("=".repeat(100));
  let totalReg = 0;
  let totalVal = 0;
  for (const d of distribuicao) {
    const ativo = d.ativo ? "ATIVO" : "INATIVO";
    console.log(
      `ID ${String(d.id).padStart(3)} | ${String(d.qtd).padStart(5)} reg | R$ ${Number(d.valor_total).toFixed(2).padStart(12)} | ${ativo.padEnd(8)} | ${d.nome}`
    );
    totalReg += Number(d.qtd);
    totalVal += Number(d.valor_total);
  }
  console.log("=".repeat(100));
  console.log(`TOTAL: ${totalReg} registros | R$ ${totalVal.toFixed(2)}`);

  // Verificar staging - valor total original
  const stagingValor: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*) as total,
      SUM(REPLACE(COALESCE(NULLIF(TRIM(valor), ''), '0'), ',', '.')::NUMERIC) as valor_total
    FROM staging_gim.subsidios_gim
    WHERE valor IS NOT NULL AND TRIM(valor) != ''
  `);
  console.log(`\nSTAGING ORIGINAL: ${stagingValor[0].total} registros | R$ ${Number(stagingValor[0].valor_total).toFixed(2)}`);

  // Quantos caíram no programa genérico (ID 1)
  const generico: any[] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as qtd FROM "SolicitacaoBeneficio" WHERE "programaId" = 1
  `);
  console.log(`\nSubsídios no programa genérico (ID 1): ${generico[0].qtd}`);
}

main().finally(() => prisma.$disconnect());
