import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Buscar programas legados relevantes
  const nomes = ["Adubação", "Açude", "Sêmen Bovino", "Pesca", "Apicultura", "Pé de Pato", "Veterinário"];
  for (const nome of nomes) {
    const progs = await prisma.programa.findMany({
      where: { nome: { contains: nome, mode: "insensitive" } },
      select: { id: true, nome: true, ativo: true },
    });
    console.log(`\n"${nome}":`);
    for (const p of progs) {
      console.log(`  ID ${p.id}: ${p.nome} (ativo: ${p.ativo})`);
    }
    if (progs.length === 0) console.log("  Nenhum encontrado");
  }
}

main().finally(() => prisma.$disconnect());
