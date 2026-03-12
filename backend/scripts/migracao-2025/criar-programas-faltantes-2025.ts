/**
 * Cria programas que faltam para migração 2025
 *
 * Executar: npx tsx scripts/migracao-2025/criar-programas-faltantes-2025.ts
 */
import prisma from '../../src/utils/prisma';

const PROGRAMAS_NOVOS = [
  {
    nome: 'Construção de Chiqueiro',
    descricao: 'Subsídio para materiais de construção de chiqueiro',
    tipoPrograma: 'SUBSIDIO',
  },
  {
    nome: 'Cisterna',
    descricao: 'Subsídio para cisternas rurais',
    tipoPrograma: 'SUBSIDIO',
  },
];

async function main() {
  for (const prog of PROGRAMAS_NOVOS) {
    const existente = await prisma.programa.findFirst({
      where: { nome: { equals: prog.nome, mode: 'insensitive' } }
    });

    if (existente) {
      console.log(`JA EXISTE: ${existente.nome} (ID: ${existente.id})`);
      continue;
    }

    const criado = await prisma.programa.create({
      data: {
        nome: prog.nome,
        descricao: prog.descricao,
        tipoPrograma: prog.tipoPrograma as any,
        secretaria: 'AGRICULTURA' as any,
        ativo: true,
      }
    });

    console.log(`CRIADO: ${criado.nome} (ID: ${criado.id})`);
  }

  // Listar todos
  const todos = await prisma.programa.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { id: 'asc' }
  });
  console.log('\nProgramas ativos:');
  todos.forEach(p => console.log(`  ${p.id} | ${p.nome}`));
  console.log(`Total: ${todos.length}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
