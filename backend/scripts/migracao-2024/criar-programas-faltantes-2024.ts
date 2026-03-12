/**
 * Cria programas que faltam para migração 2024
 */
import prisma from '../../src/utils/prisma';

const PROGRAMAS_NOVOS = [
  {
    nome: 'Adubação de Pastagem',
    descricao: 'Subsídio para adubação de pastagem com superfosfato simples, ureia e sementes',
    tipoPrograma: 'SUBSIDIO',
    leiNumero: null,
  },
  {
    nome: 'Apicultura',
    descricao: 'Subsídio para insumos de apicultura',
    tipoPrograma: 'SUBSIDIO',
    leiNumero: null,
  },
  {
    nome: 'Pescador Profissional',
    descricao: 'Subsídio para pescadores profissionais',
    tipoPrograma: 'SUBSIDIO',
    leiNumero: null,
  },
  {
    nome: 'Empréstimo de Equipamentos',
    descricao: 'Empréstimo de equipamentos agrícolas do município',
    tipoPrograma: 'SERVICO',
    leiNumero: null,
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
