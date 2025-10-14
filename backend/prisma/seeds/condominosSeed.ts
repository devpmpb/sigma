import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCondominos() {
  console.log('🏘️  Iniciando seed de condôminos...');

  try {
    // 1. Criar 15 pessoas (proprietários e condôminos potenciais)
    console.log('👥 Criando pessoas...');

    const pessoas = [
      // Proprietários principais (5)
      { nome: 'Carlos Eduardo Silva', cpfCnpj: '123.456.789-01', tipoPessoa: 'FISICA', telefone: '(51) 99999-0001', email: 'carlos.silva@email.com' },
      { nome: 'Ana Paula Oliveira', cpfCnpj: '234.567.890-12', tipoPessoa: 'FISICA', telefone: '(51) 99999-0002', email: 'ana.oliveira@email.com' },
      { nome: 'Roberto Ferreira', cpfCnpj: '345.678.901-23', tipoPessoa: 'FISICA', telefone: '(51) 99999-0003', email: 'roberto.ferreira@email.com' },
      { nome: 'Mariana Costa Santos', cpfCnpj: '456.789.012-34', tipoPessoa: 'FISICA', telefone: '(51) 99999-0004', email: 'mariana.santos@email.com' },
      { nome: 'José Antônio Pereira', cpfCnpj: '567.890.123-45', tipoPessoa: 'FISICA', telefone: '(51) 99999-0005', email: 'jose.pereira@email.com' },

      // Condôminos atuais e potenciais (10)
      { nome: 'Fernanda Lima', cpfCnpj: '678.901.234-56', tipoPessoa: 'FISICA', telefone: '(51) 99999-0006', email: 'fernanda.lima@email.com' },
      { nome: 'Ricardo Gomes', cpfCnpj: '789.012.345-67', tipoPessoa: 'FISICA', telefone: '(51) 99999-0007', email: 'ricardo.gomes@email.com' },
      { nome: 'Juliana Almeida', cpfCnpj: '890.123.456-78', tipoPessoa: 'FISICA', telefone: '(51) 99999-0008', email: 'juliana.almeida@email.com' },
      { nome: 'Pedro Henrique Souza', cpfCnpj: '901.234.567-89', tipoPessoa: 'FISICA', telefone: '(51) 99999-0009', email: 'pedro.souza@email.com' },
      { nome: 'Camila Rodrigues', cpfCnpj: '012.345.678-90', tipoPessoa: 'FISICA', telefone: '(51) 99999-0010', email: 'camila.rodrigues@email.com' },
      { nome: 'Lucas Martins', cpfCnpj: '111.222.333-44', tipoPessoa: 'FISICA', telefone: '(51) 99999-0011', email: 'lucas.martins@email.com' },
      { nome: 'Patrícia Andrade', cpfCnpj: '222.333.444-55', tipoPessoa: 'FISICA', telefone: '(51) 99999-0012', email: 'patricia.andrade@email.com' },
      { nome: 'Marcos Vinícius', cpfCnpj: '333.444.555-66', tipoPessoa: 'FISICA', telefone: '(51) 99999-0013', email: 'marcos.vinicius@email.com' },
      { nome: 'Gabriela Nunes', cpfCnpj: '444.555.666-77', tipoPessoa: 'FISICA', telefone: '(51) 99999-0014', email: 'gabriela.nunes@email.com' },
      { nome: 'Rafael Castro', cpfCnpj: '555.666.777-88', tipoPessoa: 'FISICA', telefone: '(51) 99999-0015', email: 'rafael.castro@email.com' },
    ];

    const pessoasCriadas = [];

    for (const pessoaData of pessoas) {
      // Verificar se já existe
      const pessoaExistente = await prisma.pessoa.findUnique({
        where: { cpfCnpj: pessoaData.cpfCnpj }
      });

      if (pessoaExistente) {
        console.log(`  ↪ Pessoa ${pessoaData.nome} já existe`);
        pessoasCriadas.push(pessoaExistente);
      } else {
        const pessoa = await prisma.pessoa.create({
          data: pessoaData as any
        });
        console.log(`  ✅ Criada pessoa: ${pessoa.nome}`);
        pessoasCriadas.push(pessoa);
      }
    }

    // 2. Criar 5 propriedades em condomínio
    console.log('\n🏘️  Criando propriedades em condomínio...');

    const propriedadesData = [
      {
        nome: 'Chácara Três Irmãos',
        tipoPropriedade: 'RURAL',
        areaTotal: 25.5,
        unidadeArea: 'alqueires',
        situacao: 'CONDOMINIO',
        localizacao: 'Linha Bonita, km 12',
        matricula: 'MAT-2024-001',
        proprietarioId: pessoasCriadas[0].id,
        condominos: [
          { condominoId: pessoasCriadas[5].id, percentual: 33.33 },  // Fernanda Lima
          { condominoId: pessoasCriadas[6].id, percentual: 33.33 },  // Ricardo Gomes
          { condominoId: pessoasCriadas[7].id, percentual: 33.34 },  // Juliana Almeida
        ]
      },
      {
        nome: 'Fazenda São José',
        tipoPropriedade: 'RURAL',
        areaTotal: 48.0,
        unidadeArea: 'alqueires',
        situacao: 'CONDOMINIO',
        localizacao: 'Estrada do Interior, km 8',
        matricula: 'MAT-2024-002',
        proprietarioId: pessoasCriadas[1].id,
        condominos: [
          { condominoId: pessoasCriadas[8].id, percentual: 40.0 },   // Pedro Henrique
          { condominoId: pessoasCriadas[9].id, percentual: 30.0 },   // Camila Rodrigues
          { condominoId: pessoasCriadas[10].id, percentual: 30.0 },  // Lucas Martins
        ]
      },
      {
        nome: 'Sítio Família Unida',
        tipoPropriedade: 'RURAL',
        areaTotal: 15.8,
        unidadeArea: 'alqueires',
        situacao: 'CONDOMINIO',
        localizacao: 'Linha Verde, propriedade 45',
        matricula: 'MAT-2024-003',
        proprietarioId: pessoasCriadas[2].id,
        condominos: [
          { condominoId: pessoasCriadas[11].id, percentual: 25.0 },  // Patrícia Andrade
          { condominoId: pessoasCriadas[12].id, percentual: 25.0 },  // Marcos Vinícius
          { condominoId: pessoasCriadas[13].id, percentual: 50.0 },  // Gabriela Nunes
        ]
      },
      {
        nome: 'Terreno Compartilhado Centro',
        tipoPropriedade: 'LOTE_URBANO',
        areaTotal: 0.5,
        unidadeArea: 'hectares',
        situacao: 'CONDOMINIO',
        localizacao: 'Rua Principal, nº 850',
        matricula: 'MAT-2024-004',
        proprietarioId: pessoasCriadas[3].id,
        condominos: [
          { condominoId: pessoasCriadas[6].id, percentual: 50.0 },   // Ricardo Gomes
          { condominoId: pessoasCriadas[14].id, percentual: 25.0 },  // Rafael Castro
          { condominoId: pessoasCriadas[5].id, percentual: 25.0 },   // Fernanda Lima
        ]
      },
      {
        nome: 'Propriedade Herança Familiar',
        tipoPropriedade: 'RURAL',
        areaTotal: 32.3,
        unidadeArea: 'alqueires',
        situacao: 'CONDOMINIO',
        localizacao: 'Travessa dos Pinheiros, s/n',
        matricula: 'MAT-2024-005',
        proprietarioId: pessoasCriadas[4].id,
        condominos: [
          { condominoId: pessoasCriadas[7].id, percentual: 20.0 },   // Juliana Almeida
          { condominoId: pessoasCriadas[9].id, percentual: 30.0 },   // Camila Rodrigues
          { condominoId: pessoasCriadas[13].id, percentual: 50.0 },  // Gabriela Nunes
        ]
      },
    ];

    let propriedadesCriadas = 0;
    let condominosCriados = 0;

    for (const propData of propriedadesData) {
      const { condominos, ...propriedadeInfo } = propData;

      // Verificar se propriedade já existe
      const propExistente = await prisma.propriedade.findFirst({
        where: { matricula: propriedadeInfo.matricula }
      });

      if (propExistente) {
        console.log(`  ↪ Propriedade ${propriedadeInfo.nome} já existe`);

        // Verificar e adicionar condôminos faltantes
        for (const condominoData of condominos) {
          const jaCondomino = await prisma.propriedadeCondomino.findFirst({
            where: {
              propriedadeId: propExistente.id,
              condominoId: condominoData.condominoId,
              dataFim: null
            }
          });

          if (!jaCondomino) {
            await prisma.propriedadeCondomino.create({
              data: {
                propriedadeId: propExistente.id,
                condominoId: condominoData.condominoId,
                percentual: condominoData.percentual,
              }
            });
            condominosCriados++;
          }
        }
      } else {
        // Criar propriedade
        const propriedade = await prisma.propriedade.create({
          data: propriedadeInfo as any
        });
        console.log(`  ✅ Criada propriedade: ${propriedade.nome}`);
        propriedadesCriadas++;

        // Adicionar condôminos
        for (const condominoData of condominos) {
          await prisma.propriedadeCondomino.create({
            data: {
              propriedadeId: propriedade.id,
              condominoId: condominoData.condominoId,
              percentual: condominoData.percentual,
            }
          });
          condominosCriados++;
        }
      }
    }

    console.log('\n✅ Seed de condôminos concluído!');
    console.log(`   📊 ${pessoasCriadas.length} pessoas disponíveis`);
    console.log(`   🏘️  ${propriedadesCriadas} propriedades criadas`);
    console.log(`   👥 ${condominosCriados} relacionamentos condômino-propriedade criados`);

  } catch (error) {
    console.error('❌ Erro ao executar seed de condôminos:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedCondominos()
    .then(() => {
      console.log('✅ Seed executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
