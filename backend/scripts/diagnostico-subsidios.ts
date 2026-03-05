import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Total atual
  const total = await prisma.solicitacaoBeneficio.count();
  console.log("Total SolicitacaoBeneficio agora:", total);

  // 2. Staging original
  const staging: any[] = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) as total FROM staging_gim.subsidios_gim"
  );
  console.log("Total staging_gim.subsidios_gim:", staging[0].total);

  // 3. Map subsidios
  const mapCount: any[] = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) as total FROM staging_gim.map_subsidios"
  );
  console.log("Total staging_gim.map_subsidios:", mapCount[0].total);

  // 4. Verificar se havia dados do script 13 (corrigir mapeamento)
  const logErros: any[] = await prisma.$queryRawUnsafe(
    "SELECT etapa, COUNT(*) as total FROM staging_gim.log_erros GROUP BY etapa ORDER BY total DESC"
  );
  console.log("\nLog de erros por etapa:");
  for (const l of logErros) {
    console.log(`  ${l.etapa}: ${l.total}`);
  }

  // 5. Verificar se existem outras tabelas de staging com subsidios
  const tabelas: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'staging_gim'
    ORDER BY table_name
  `);
  console.log("\nTabelas em staging_gim:");
  for (const t of tabelas) {
    console.log(`  ${t.table_name}`);
  }

  // 6. Valor total atual por status
  const porStatus: any[] = await prisma.$queryRawUnsafe(`
    SELECT status, COUNT(*) as qtd, COALESCE(SUM("valorCalculado"), 0) as valor
    FROM "SolicitacaoBeneficio"
    GROUP BY status
  `);
  console.log("\nSolicitações por status (banco atual):");
  for (const s of porStatus) {
    console.log(`  ${s.status}: ${s.qtd} registros, R$ ${Number(s.valor).toFixed(2)}`);
  }

  // 7. Verificar se havia subsídios inseridos pelo script 13 que não vieram do staging
  const semMap: any[] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as total FROM staging_gim.subsidios_gim sg
    WHERE NOT EXISTS (
      SELECT 1 FROM staging_gim.map_subsidios ms WHERE ms.id_gim = sg.cod_subsidio
    )
  `);
  console.log("\nSubsídios no staging SEM mapeamento:", semMap[0].total);

  // 8. Total de subsídios que FORAM mapeados com sucesso vs erros
  const errosSubsidio: any[] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as total FROM staging_gim.log_erros
    WHERE etapa LIKE 'SUBSIDIO%'
  `);
  console.log("Erros de subsídio registrados:", errosSubsidio[0].total);
}

main().finally(() => prisma.$disconnect());
