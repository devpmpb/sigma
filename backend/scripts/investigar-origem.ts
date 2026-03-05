import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("INVESTIGAÇÃO: De onde vieram os 33.021 registros?");
  console.log("=".repeat(80));

  // Hipótese 1: O script 08 foi executado múltiplas vezes?
  // Se staging tem 11.170, e mapeamos 11.004, e o total era 33.021
  // então 33.021 / 11.004 ≈ 3x
  console.log("\nHipótese 1: Script 08 executado 3x?");
  console.log(`  staging_gim.subsidios_gim: 11.170 registros fonte`);
  console.log(`  map_subsidios tem: 11.004 (1 execução)`);
  console.log(`  33.021 / 11.004 ≈ ${(33021 / 11004).toFixed(2)}x`);

  // Hipótese 2: Verificar sequência dos IDs antigos via map_subsidios
  const idRange: any[] = await prisma.$queryRawUnsafe(`
    SELECT MIN(id_sigma) as min_id, MAX(id_sigma) as max_id, COUNT(*)::int as total
    FROM staging_gim.map_subsidios
  `);
  console.log(`\nmap_subsidios: min_id=${idRange[0].min_id}, max_id=${idRange[0].max_id}, total=${idRange[0].total}`);

  // Hipótese 3: Verificar se havia solicitações sem mapeamento GIM
  // (que poderiam ter vindo de outra fonte)
  const semMapeamento = await prisma.solicitacaoBeneficio.count({
    where: {
      observacoes: {
        not: { contains: "Enquadramento:" },
      },
    },
  });
  console.log(`\nSolicitações SEM 'Enquadramento:': ${semMapeamento}`);

  // As que tem "planilha 2023"
  const planilha2023 = await prisma.solicitacaoBeneficio.count({
    where: {
      observacoes: { contains: "planilha 2023", mode: "insensitive" },
    },
  });
  console.log(`Solicitações com 'planilha 2023': ${planilha2023}`);

  // Hipótese 4: Verificar max ID na tabela
  const maxId: any[] = await prisma.$queryRawUnsafe(
    `SELECT MAX(id) as max_id FROM "SolicitacaoBeneficio"`
  );
  console.log(`\nMaior ID atual em SolicitacaoBeneficio: ${maxId[0].max_id}`);

  // Hipótese 5: Verificar se a sequência tem gaps (indica múltiplas execuções/deleções)
  const seqVal: any[] = await prisma.$queryRawUnsafe(`
    SELECT last_value FROM "SolicitacaoBeneficio_id_seq"
  `);
  console.log(`Valor atual da sequência: ${seqVal[0].last_value}`);

  // Verificar quantos IDs existem vs gaps
  const total = await prisma.solicitacaoBeneficio.count();
  console.log(`Total de registros: ${total}`);
  console.log(
    `Gap (seq - total): ${Number(seqVal[0].last_value) - total} IDs "faltando"`
  );

  // Se a sequência estiver em ~44.000+ seria evidência de 3 execuções + deleções
  // Se estiver em ~33.000+ seria evidência de 1 execução normal + adição de dados 2023

  console.log("\n" + "=".repeat(80));
  console.log("CONCLUSÃO:");
  const seqValue = Number(seqVal[0].last_value);
  if (seqValue > 40000) {
    console.log("A sequência está alta, indicando MÚLTIPLAS execuções do script de importação.");
    console.log("Os 33.021 provavelmente incluíam registros DUPLICADOS de múltiplas execuções.");
  } else if (seqValue > 33000) {
    console.log("A sequência indica que houve ~33.000 registros criados antes da deleção.");
    console.log("Combinação de: GIM + planilhas 2023 + possíveis re-execuções.");
  } else {
    console.log("A sequência está baixa - os dados restaurados + planilhas são próximos do total original.");
  }
}

main().finally(() => prisma.$disconnect());
