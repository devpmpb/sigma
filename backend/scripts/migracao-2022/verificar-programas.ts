import prisma from '../../src/utils/prisma';
async function main() {
  const programas = await prisma.programa.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { id: 'asc' }
  });
  for (const p of programas) {
    console.log(`ID ${p.id}: ${p.nome}`);
  }
  // Check specific names
  for (const nome of ['Acesso', 'Pátio', 'Silo', 'Resíduo', 'Poda', 'Sala de Ordenha']) {
    const found = await prisma.programa.findFirst({
      where: { nome: { contains: nome, mode: 'insensitive' } }
    });
    console.log(`\nBusca "${nome}": ${found ? `ID ${found.id} - ${found.nome}` : 'NAO ENCONTRADO'}`);
  }
  await prisma.$disconnect();
}
main();
