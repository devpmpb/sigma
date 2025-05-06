import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Cadastrar bairros iniciais de Pato Bragado
  const bairros = [
    { nome: "Centro" },
    { nome: "Loteamento Fischer" },
    { nome: "Loteamento Bragadense" },
    // Adicione outros bairros da cidade conforme necessário
  ];

  for (const bairro of bairros) {
    await prisma.bairro.upsert({
      where: { nome: bairro.nome },
      update: {},
      create: { nome: bairro.nome },
    });
  }

  console.log("Bairros iniciais cadastrados com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
