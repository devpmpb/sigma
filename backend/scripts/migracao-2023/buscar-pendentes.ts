import prisma from '../../src/utils/prisma';

async function buscar() {
  const termos: Array<[string, string | null, string]> = [
    // Pe de Pato restantes
    ['Amarildo', null, 'Amarildo Wilhers'],
    ['Wastowski', null, 'Artemio A. Wastowski'],
    ['Braz', 'Guesser', 'Braz Guesser'],
    ['Edson', 'Souza', 'Edson S. de Souza'],
    ['Marohldt', null, 'Giuvane C. S. Marholdt'],
    ['Giovane', null, 'Giovane/Giuvane'],
    ['Eicht', null, 'Lauro Roque Eicht'],
    ['Toiller', null, 'Paulo A. Toiller'],
    ['Gim', null, 'Vilson Gim'],
    // Vet restantes
    ['Adair', null, 'Adair S. de Sousa'],
    ['Claudir', null, 'Claudir Beckemcamp'],
    ['Edimar', 'Esser', 'Edimar Esser'],
    ['Edson', 'Scheumann', 'Edson Luis Scheumann'],
    ['Egidio', null, 'Egidio Fischler'],
    ['Eldor', null, 'Eldor Hunemeyer'],
    ['Elizeu', null, 'Elizeu M. Engellmann'],
    ['Helga', null, 'Helga S. Schneider'],
    ['Staadlober', null, 'Helio Staadlober'],
    ['Ida', 'Adam', 'Ida M. Adam'],
    ['Ildegardt', null, 'Ildegardt Drewes'],
    ['Irena', null, 'Irena Bergamnn'],
    ['Jacinto', null, 'Jacinto Zeiweibrincker'],
    ['Liro', null, 'Liro Zeiweibricker'],
    ['Maico', null, 'Maico Bourscheidt'],
    ['Maria', 'Simon', 'Maria M. Simon'],
    ['Meiyer', null, 'Otavio Meiyer'],
    ['Tracysnski', null, 'Pedro Tracysnski'],
    ['Hemsing', null, 'Rafael Hemsing'],
    ['Borreli', null, 'Renato Borreli'],
    ['Rosane', 'Bier', 'Rosane Bier'],
    ['Wlamor', null, 'Wlamor Reinke'],
    ['Carla', 'Koch', 'Carla Danila Koch'],
  ];

  for (const [p1, p2, label] of termos) {
    const where: any = p2
      ? { AND: [
          { nome: { contains: p1, mode: 'insensitive' } },
          { nome: { contains: p2, mode: 'insensitive' } },
        ]}
      : { nome: { contains: p1, mode: 'insensitive' } };
    const res = await prisma.pessoa.findMany({ where, select: { id: true, nome: true } });
    if (res.length > 0) {
      console.log(`${label}: ${res.map(r => `${r.id} - ${r.nome}`).join(' | ')}`);
    } else {
      console.log(`${label}: NAO ENCONTRADO`);
    }
  }
  await prisma.$disconnect();
}

buscar().catch(console.error);
