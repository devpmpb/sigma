import prisma from '../../src/utils/prisma';

async function main() {
  const progs = await prisma.programa.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, tipoPrograma: true },
    orderBy: { id: 'asc' }
  });
  progs.forEach(p => console.log(`${p.id} | ${p.nome} | ${p.modalidade}`));
  console.log('\nTotal:', progs.length);
  await prisma.$disconnect();
}

main();
