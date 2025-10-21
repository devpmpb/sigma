// backend/prisma/scripts/limparProgramasDuplicados.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function removerProgramasDuplicados() {
  console.log("🧹 Removendo programas duplicados...");

  const programas = await prisma.programa.findMany({
    orderBy: { id: 'asc' }
  });

  const programasUnicos = new Map<string, number>();
  const idsParaRemover: number[] = [];

  for (const programa of programas) {
    if (programasUnicos.has(programa.nome)) {
      // É duplicado, marcar para remoção
      idsParaRemover.push(programa.id);
      console.log(`   ❌ Duplicado: ${programa.nome} (ID: ${programa.id})`);
    } else {
      // Primeiro registro com este nome, manter
      programasUnicos.set(programa.nome, programa.id);
      console.log(`   ✅ Mantendo: ${programa.nome} (ID: ${programa.id})`);
    }
  }

  if (idsParaRemover.length > 0) {
    console.log(`\n📊 Encontrados ${idsParaRemover.length} programas duplicados`);
    console.log(`📊 Serão mantidos ${programasUnicos.size} programas únicos`);

    // Remover regras dos programas duplicados
    const regrasRemovidas = await prisma.regrasNegocio.deleteMany({
      where: { programaId: { in: idsParaRemover } }
    });
    console.log(`   • ${regrasRemovidas.count} regras de negócio removidas`);

    // Remover solicitações dos programas duplicados
    const solicitacoesRemovidas = await prisma.solicitacaoBeneficio.deleteMany({
      where: { programaId: { in: idsParaRemover } }
    });
    console.log(`   • ${solicitacoesRemovidas.count} solicitações removidas`);

    // Remover programas duplicados
    const programasRemovidos = await prisma.programa.deleteMany({
      where: { id: { in: idsParaRemover } }
    });
    console.log(`   • ${programasRemovidos.count} programas duplicados removidos`);

    console.log(`\n✅ Limpeza concluída com sucesso!`);
  } else {
    console.log("\n✅ Nenhum programa duplicado encontrado");
  }
}

async function main() {
  try {
    await removerProgramasDuplicados();
  } catch (error) {
    console.error("❌ Erro durante a limpeza:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
