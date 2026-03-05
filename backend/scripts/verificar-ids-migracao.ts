import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// IDs usados pelos scripts de migração 2023
const idsEsperados = [
  { id: 9, esperado: "Piscicultura", script: "migrar-piscicultura-2023.ts" },
  { id: 42, esperado: "Apicultura", script: "migrar-apicultura-2023.ts" },
  { id: 43, esperado: "Pesca Profissional", script: "migrar-pesca-profissional-2023.ts" },
  { id: 44, esperado: "Adubação Pastagem", script: "migrar-adubacao-pastagem-2023.ts" },
  { id: 47, esperado: "Sêmen Bovino", script: "migrar-semen-bovino-2023.ts" },
  { id: 56, esperado: "Esterco Líquido 2023", script: "migrar-esterco-liquido-2023.ts" },
  { id: 64, esperado: "Calcário/PRÓSOLOS", script: "migrar-calcario-2023.ts" },
  { id: 65, esperado: "Cama de Aviário", script: "migrar-cama-aviario-2023.ts" },
  { id: 66, esperado: "Aveia", script: "migrar-aveia-2023.ts" },
  { id: 69, esperado: "Inseminação", script: "migrar-inseminacao-2023.ts" },
  { id: 70, esperado: "Ultrasson", script: "migrar-ultrasson-2023.ts" },
  { id: 72, esperado: "Sêmen Suíno", script: "migrar-semen-suino-2023.ts" },
];

async function main() {
  console.log("VERIFICAÇÃO DOS IDs DE PROGRAMA PARA MIGRAÇÃO 2023");
  console.log("=".repeat(80));

  let todosOk = true;

  for (const item of idsEsperados) {
    const programa = await prisma.programa.findUnique({
      where: { id: item.id },
      select: { id: true, nome: true, ativo: true },
    });

    if (!programa) {
      console.log(`❌ ID ${item.id}: NÃO EXISTE! (esperado: ${item.esperado}) [${item.script}]`);
      todosOk = false;
    } else {
      const match =
        programa.nome.toLowerCase().includes(item.esperado.toLowerCase().split(" ")[0].toLowerCase());
      const status = match ? "✅" : "⚠️";
      if (!match) todosOk = false;
      console.log(
        `${status} ID ${item.id}: ${programa.nome} | ativo: ${programa.ativo} (esperado: ${item.esperado}) [${item.script}]`
      );
    }
  }

  console.log("\n" + (todosOk ? "✅ Todos os IDs estão corretos!" : "⚠️ Há IDs com problemas - verificar!"));
}

main().finally(() => prisma.$disconnect());
