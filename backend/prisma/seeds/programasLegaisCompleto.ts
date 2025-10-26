// backend/prisma/seeds/programasLegaisCompleto.ts
import { PrismaClient, TipoPrograma, TipoPerfil } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedProgramasLegais() {
  console.log("🌱 Iniciando cadastro dos programas legais municipais...");

  try {
    // ==================================================
    // CRIAR PRODUTORES DE EXEMPLO PRIMEIRO
    // ==================================================
    console.log("👨‍🌾 Criando produtores de exemplo...");

    // Produtor 1: Pequeno produtor (atende Pró-Orgânico até 6 alqueires)
    const produtor1 = await prisma.pessoa.upsert({
      where: { cpfCnpj: "123.456.789-01" },
      update: {},
      create: {
        nome: "João da Silva",
        cpfCnpj: "123.456.789-01",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4321",
        email: "joao.silva@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-001-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "12.345.678-9",
            dataNascimento: new Date("1975-05-15")
          }
        }
      }
    });

    // Propriedade do Produtor 1 - 4 alqueires (atende critério <= 6)
    await prisma.propriedade.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nome: "Sítio Boa Vista",
        tipoPropriedade: "RURAL",
        areaTotal: 4.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha São Francisco",
        atividadeProdutiva: "AGRICULTURA",
        proprietarioId: produtor1.id
      }
    });

    // Área efetiva do Produtor 1
    await prisma.areaEfetiva.upsert({
      where: { id: produtor1.id },
      update: {},
      create: {
        id: produtor1.id,
        anoReferencia: 2024,
        areaPropria: 4.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 4.0
      }
    });

    // Produtor 2: Médio produtor (atende Pró-Orgânico > 6 alqueires - subsídio menor)
    const produtor2 = await prisma.pessoa.upsert({
      where: { cpfCnpj: "234.567.890-12" },
      update: {},
      create: {
        nome: "Maria Oliveira",
        cpfCnpj: "234.567.890-12",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4322",
        email: "maria.oliveira@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-002-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "23.456.789-0",
            dataNascimento: new Date("1980-08-20")
          }
        }
      }
    });

    // Propriedade do Produtor 2 - 10 alqueires (atende critério > 6)
    await prisma.propriedade.upsert({
      where: { id: 2 },
      update: {},
      create: {
        nome: "Fazenda Santa Helena",
        tipoPropriedade: "RURAL",
        areaTotal: 10.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha Santa Rita",
        atividadeProdutiva: "AGRICULTURA_PECUARIA",
        proprietarioId: produtor2.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtor2.id },
      update: {},
      create: {
        id: produtor2.id,
        anoReferencia: 2024,
        areaPropria: 10.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 10.0
      }
    });

    // Produtor 3: Produtor com arrendamento (área total = própria + arrendada)
    const produtor3 = await prisma.pessoa.upsert({
      where: { cpfCnpj: "345.678.901-23" },
      update: {},
      create: {
        nome: "Carlos Santos",
        cpfCnpj: "345.678.901-23",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4323",
        email: "carlos.santos@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-003-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "34.567.890-1",
            dataNascimento: new Date("1985-03-10")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 3 },
      update: {},
      create: {
        nome: "Chácara Recanto Verde",
        tipoPropriedade: "RURAL",
        areaTotal: 3.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Estrada do Açude",
        atividadeProdutiva: "HORTIFRUTI",
        proprietarioId: produtor3.id
      }
    });

    // Arrendamento - Produtor 3 arrenda mais 4 alqueires (total = 7)
    await prisma.arrendamento.create({
      data: {
        propriedadeId: 3,
        proprietarioId: produtor3.id,
        arrendatarioId: produtor3.id,
        areaArrendada: 4.0,
        dataInicio: new Date("2024-01-01"),
        dataFim: new Date("2026-12-31"),
        status: "ativo",
        residente: false,
        atividadeProdutiva: "AGRICULTURA"
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtor3.id },
      update: {},
      create: {
        id: produtor3.id,
        anoReferencia: 2024,
        areaPropria: 3.0,
        areaArrendadaRecebida: 4.0,
        areaArrendadaCedida: 0,
        areaEfetiva: 7.0 // 3 próprios + 4 arrendados
      }
    });

    // Produtor 4: Produtor de leite (atende programa de ordenhadeiras)
    const produtor4 = await prisma.pessoa.upsert({
      where: { cpfCnpj: "456.789.012-34" },
      update: {},
      create: {
        nome: "Pedro Ferreira",
        cpfCnpj: "456.789.012-34",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4324",
        email: "pedro.ferreira@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-004-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "45.678.901-2",
            dataNascimento: new Date("1970-11-25")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 4 },
      update: {},
      create: {
        nome: "Granja Leiteira Ferreira",
        tipoPropriedade: "RURAL",
        areaTotal: 8.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha dos Alemães",
        atividadeProdutiva: "PECUARIA",
        proprietarioId: produtor4.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtor4.id },
      update: {},
      create: {
        id: produtor4.id,
        anoReferencia: 2024,
        areaPropria: 8.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 8.0
      }
    });

    // Produtor 5: Grande produtor (não se enquadra bem nos programas)
    const produtor5 = await prisma.pessoa.upsert({
      where: { cpfCnpj: "567.890.123-45" },
      update: {},
      create: {
        nome: "Agropecuária Campos Verdes LTDA",
        cpfCnpj: "12.345.678/0001-90",
        tipoPessoa: "JURIDICA",
        telefone: "(45) 3055-1234",
        email: "contato@camposverdes.com.br",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-005-2024",
        ativo: true,
        pessoaJuridica: {
          create: {
            nomeFantasia: "Campos Verdes",
            inscricaoEstadual: "123456789",
            inscricaoMunicipal: "987654",
            dataFundacao: new Date("2010-01-15"),
            representanteLegal: "Roberto Campos"
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 5 },
      update: {},
      create: {
        nome: "Fazenda Campos Verdes",
        tipoPropriedade: "RURAL",
        areaTotal: 50.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: false,
        localizacao: "Zona Rural",
        atividadeProdutiva: "AGRICULTURA_PECUARIA",
        proprietarioId: produtor5.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtor5.id },
      update: {},
      create: {
        id: produtor5.id,
        anoReferencia: 2024,
        areaPropria: 50.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 50.0
      }
    });

    console.log("✅ 5 produtores criados:");
    console.log("   1. João da Silva - 4 alqueires (pequeno)");
    console.log("   2. Maria Oliveira - 10 alqueires (médio)");
    console.log("   3. Carlos Santos - 7 alqueires (3 próprios + 4 arrendados)");
    console.log("   4. Pedro Ferreira - 8 alqueires (produtor de leite)");
    console.log("   5. Campos Verdes LTDA - 50 alqueires (grande)");

    // ==================================================
    // LEI 797/2006 - PRÓ-ORGÂNICO (ADUBO ORGÂNICO)
    // ==================================================
    let proOrganico = await prisma.programa.findFirst({
      where: { nome: "Programa de Incentivo ao Uso de Adubo Orgânico - Pró-Orgânico" }
    });

    if (!proOrganico) {
      proOrganico = await prisma.programa.create({
        data: {
          nome: "Programa de Incentivo ao Uso de Adubo Orgânico - Pró-Orgânico",
          descricao:
            "Subsídio para aquisição de adubo orgânico visando melhorar a fertilidade do solo e fixar o produtor rural no campo",
          leiNumero: "LEI Nº 797/2006",
          tipoPrograma: TipoPrograma.SUBSIDIO,
          secretaria: TipoPerfil.AGRICULTURA,
          ativo: true,
        },
      });
    }

    // Regras do Pró-Orgânico (APENAS CÁLCULO DE VALORES)
    await prisma.regrasNegocio.createMany({
      data: [
        // Regra 1: Propriedades até 6 alqueires
        {
          programaId: proOrganico.id,
          tipoRegra: "area_propriedade",
          parametro: {
            condicao: "menor_igual",
            valor: 6,
            unidade: "alqueires",
            descricao:
              "Área total (propriedade + arrendamento) até 6 alqueires",
            incluiArrendamento: true,
          },
          valorBeneficio: 70.0,
          limiteBeneficio: {
            tipo: "quantidade_e_periodo",
            limite: 10,
            unidade: "toneladas",
            limitePorPeriodo: {
              periodo: "bienal",
              quantidade: 1,
            },
            descricao: "Máximo 10 toneladas a cada 2 anos",
          },
        },
        // Regra 2: Propriedades acima de 6 alqueires
        {
          programaId: proOrganico.id,
          tipoRegra: "area_propriedade",
          parametro: {
            condicao: "maior",
            valor: 6,
            unidade: "alqueires",
            descricao:
              "Área total (propriedade + arrendamento) acima de 6 alqueires",
            incluiArrendamento: true,
          },
          valorBeneficio: 50.0,
          limiteBeneficio: {
            tipo: "quantidade_percentual_periodo",
            limite: 10,
            unidade: "toneladas",
            percentual: 50,
            limitePorPeriodo: {
              periodo: "bienal",
              quantidade: 1,
            },
            descricao: "Máximo 10 toneladas (pago 50% da NF) a cada 2 anos",
          },
        },
      ],
    });

    console.log("✅ Pró-Orgânico cadastrado");

    // ==================================================
    // LEI 829/2006 - ORDENHADEIRAS E RESFRIADORES
    // ==================================================
    let equipamentosLeite = await prisma.programa.findFirst({
      where: { nome: "Auxílio Financeiro para Ordenhadeiras e Resfriadores de Leite" }
    });

    if (!equipamentosLeite) {
      equipamentosLeite = await prisma.programa.create({
        data: {
          nome: "Auxílio Financeiro para Ordenhadeiras e Resfriadores de Leite",
          descricao:
            "Subsídio de 50% do valor para aquisição de ordenhadeiras e resfriadores de leite a granel",
          leiNumero: "LEI Nº 829/2006",
          tipoPrograma: TipoPrograma.SUBSIDIO,
          secretaria: TipoPerfil.AGRICULTURA,
          ativo: true,
        },
      });
    }

    // Regras dos Equipamentos (APENAS CÁLCULO DE VALORES)
    await prisma.regrasNegocio.createMany({
      data: [
        // Ordenhadeira
        {
          programaId: equipamentosLeite.id,
          tipoRegra: "tipo_equipamento",
          parametro: {
            tipoEquipamento: "ordenhadeira",
            requisitos: [
              {
                tipo: "producao_minima",
                condicao: "ou",
                opcoes: [
                  { medida: "litros_dia", valor: 70 },
                  { medida: "vacas_leiteiras", valor: 6 },
                ],
              },
            ],
          },
          valorBeneficio: 2000.0, // Limite máximo
          limiteBeneficio: {
            tipo: "percentual_com_teto",
            percentual: 50,
            limite: 2000,
            unidade: "reais",
            usoUnico: true,
            descricao: "50% do valor, máximo R$ 2.000,00 - benefício único",
          },
        },
        // Resfriador
        {
          programaId: equipamentosLeite.id,
          tipoRegra: "tipo_equipamento",
          parametro: {
            tipoEquipamento: "resfriador",
            requisitos: [
              {
                tipo: "producao_minima",
                condicao: "ou",
                opcoes: [
                  { medida: "litros_dia", valor: 70 },
                  { medida: "vacas_leiteiras", valor: 10 },
                ],
              },
            ],
          },
          valorBeneficio: 3000.0, // Limite máximo
          limiteBeneficio: {
            tipo: "percentual_com_teto",
            percentual: 50,
            limite: 3000,
            unidade: "reais",
            usoUnico: true,
            descricao: "50% do valor, máximo R$ 3.000,00 - benefício único",
          },
        },
      ],
    });

    console.log("✅ Ordenhadeiras/Resfriadores cadastrado");

    // ==================================================
    // LEI 1182/2011 - INSEMINAÇÃO ARTIFICIAL
    // ==================================================
    let inseminacaoArtificial = await prisma.programa.findFirst({
      where: { nome: "Programa de Fomento à Bovinocultura e Melhoria Genética de Suínos" }
    });

    if (!inseminacaoArtificial) {
      inseminacaoArtificial = await prisma.programa.create({
        data: {
          nome: "Programa de Fomento à Bovinocultura e Melhoria Genética de Suínos",
          descricao:
            "Programa de inseminação artificial para bovinos e suínos com múltiplas modalidades de benefício",
          leiNumero:
            "LEI Nº 1182/2011 (alterada pelas Leis 1390/2014, 1414/2014, 1465/2015 e 1563/2017)",
          tipoPrograma: TipoPrograma.SERVICO,
          secretaria: TipoPerfil.AGRICULTURA,
          ativo: true,
        },
      });
    }

    // Regras complexas da Inseminação (APENAS CÁLCULO DE VALORES)
    await prisma.regrasNegocio.createMany({
      data: [
        // BOVINOS - Opção 1: Fornecimento direto
        {
          programaId: inseminacaoArtificial.id,
          tipoRegra: "inseminacao_bovinos_opcao1",
          parametro: {
            tipoAnimal: "bovino",
            modalidade: "fornecimento_municipio",
            descricao: "Município fornece sêmen e aplicação subsidiada 70%",
            beneficios: {
              semen: "fornecido_municipio",
              aplicacao: "subsidiada_70_porcento",
              custoProdutor: "30_porcento_aplicacao",
            },
          },
          valorBeneficio: 0, // Fornecimento direto
          limiteBeneficio: {
            tipo: "quantidade_anual",
            limite: 1,
            unidade: "inseminacao_por_animal_ano",
            taxaRepeticao: 30,
            descricao: "1 inseminação/ano/animal + 30% taxa repetição",
          },
        },
        // BOVINOS - Opção 2: Retirada na Secretaria
        {
          programaId: inseminacaoArtificial.id,
          tipoRegra: "inseminacao_bovinos_opcao2",
          parametro: {
            tipoAnimal: "bovino",
            modalidade: "retirada_secretaria",
            descricao: "Produtor capacitado retira sêmen na Secretaria",
            requisitos: [
              { tipo: "capacidade_tecnica", comprovacao: "certificado" },
              { tipo: "tanque_refrigeracao", obrigatorio: true },
              {
                tipo: "curso_manejo_gado",
                entidade: "Secretaria/Sindicato/SEAB",
              },
            ],
          },
          valorBeneficio: 0, // Fornecimento direto
          limiteBeneficio: {
            tipo: "quantidade_anual",
            limite: 1,
            unidade: "dose_por_animal_ano",
            taxaRepeticao: 30,
            descricao: "Sêmen fornecido, aplicação por conta do produtor",
          },
        },
        // BOVINOS - Opção 3: Reembolso
        {
          programaId: inseminacaoArtificial.id,
          tipoRegra: "inseminacao_bovinos_opcao3",
          parametro: {
            tipoAnimal: "bovino",
            modalidade: "reembolso",
            descricao: "Produtor compra e solicita reembolso",
            requisitos: [
              { tipo: "nota_fiscal", obrigatorio: true },
              {
                tipo: "exames",
                tipos: ["brucelose", "tuberculose"],
                periodo: "anual",
              },
            ],
          },
          valorBeneficio: 35.0,
          limiteBeneficio: {
            tipo: "valor_por_dose",
            limite: 35,
            unidade: "reais_por_dose",
            quantidadeAnual: "1_por_animal",
            taxaRepeticao: 30,
            descricao: "Até R$ 35,00/dose/animal/ano + 30% repetição",
          },
        },
        // BOVINOS - Assistência Veterinária
        {
          programaId: inseminacaoArtificial.id,
          tipoRegra: "assistencia_veterinaria",
          parametro: {
            tipoServico: "assistencia_veterinaria",
            modalidade: "subsidio",
            percentualSubsidio: 70,
            percentualProdutor: 30,
            descricao: "Assistência veterinária subsidiada",
          },
          valorBeneficio: 0, // Calculado caso a caso
          limiteBeneficio: {
            tipo: "percentual",
            percentual: 70,
            descricao: "Município paga 70%, produtor 30%",
          },
        },
        // SUÍNOS - Reembolso
        {
          programaId: inseminacaoArtificial.id,
          tipoRegra: "inseminacao_suinos",
          parametro: {
            tipoAnimal: "suino",
            modalidade: "reembolso",
            descricao: "Reembolso para inseminação de suínos",
            requisitos: [
              { tipo: "nota_fiscal", obrigatorio: true },
              { tipo: "relatorio_adapar", comprovacao: "quantidade_matrizes" },
            ],
          },
          valorBeneficio: 30.0,
          limiteBeneficio: {
            tipo: "valor_por_matriz",
            limite: 30,
            unidade: "reais_por_matriz_ano",
            descricao: "Até R$ 30,00/matriz/ano",
          },
        },
      ],
    });

    console.log("✅ Inseminação Artificial cadastrado");

    // Relatório resumido
    const totalProgramas = await prisma.programa.count();
    const totalRegras = await prisma.regrasNegocio.count();
    const totalProdutores = await prisma.pessoa.count({ where: { isProdutor: true } });

    console.log(`\n📊 Resumo do cadastramento:`);
    console.log(`   • ${totalProdutores} produtores rurais`);
    console.log(`   • ${totalProgramas} programas cadastrados`);
    console.log(`   • ${totalRegras} regras de negócio configuradas`);
    console.log(`\n👨‍🌾 Produtores cadastrados:`);
    console.log(`   1. João da Silva - 4 alqueires → Atende Pró-Orgânico (até 6 alq - R$ 70/ton)`);
    console.log(`   2. Maria Oliveira - 10 alqueires → Atende Pró-Orgânico (> 6 alq - R$ 50/ton)`);
    console.log(`   3. Carlos Santos - 7 alqueires (3+4 arrend) → Atende Pró-Orgânico (> 6 alq)`);
    console.log(`   4. Pedro Ferreira - 8 alqueires (pecuária) → Atende Ordenhadeiras/Resfriadores`);
    console.log(`   5. Campos Verdes - 50 alqueires → Grande produtor`);
    console.log(`\n📋 Programas cadastrados:`);
    console.log(`   1. Pró-Orgânico (Lei 797/2006) - 2 regras`);
    console.log(`   2. Ordenhadeiras/Resfriadores (Lei 829/2006) - 2 regras`);
    console.log(`   3. Inseminação Artificial (Lei 1182/2011) - 5 regras`);
    console.log(`\n✅ Total: ${totalRegras} regras funcionais de cálculo`);
  } catch (error) {
    console.error("❌ Erro ao cadastrar programas:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Função auxiliar para limpar dados existentes (opcional)
export async function limparProgramasAntigos() {
  console.log("🧹 Limpando programas anteriores...");

  // Primeiro remove as regras (por causa da FK)
  await prisma.regrasNegocio.deleteMany({});

  // Remove solicitações existentes
  await prisma.solicitacaoBeneficio.deleteMany({});

  // Por fim, remove os programas
  await prisma.programa.deleteMany({});

  console.log("✅ Dados anteriores removidos");
}

// Função para remover apenas programas duplicados
export async function removerProgramasDuplicados() {
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
    } else {
      // Primeiro registro com este nome, manter
      programasUnicos.set(programa.nome, programa.id);
    }
  }

  if (idsParaRemover.length > 0) {
    console.log(`   Encontrados ${idsParaRemover.length} programas duplicados`);

    // Remover regras dos programas duplicados
    await prisma.regrasNegocio.deleteMany({
      where: { programaId: { in: idsParaRemover } }
    });

    // Remover solicitações dos programas duplicados
    await prisma.solicitacaoBeneficio.deleteMany({
      where: { programaId: { in: idsParaRemover } }
    });

    // Remover programas duplicados
    await prisma.programa.deleteMany({
      where: { id: { in: idsParaRemover } }
    });

    console.log(`✅ ${idsParaRemover.length} programas duplicados removidos`);
  } else {
    console.log("✅ Nenhum programa duplicado encontrado");
  }
}

// Executar seed
async function main() {
  try {
    // Opcional: limpar dados anteriores
    // await limparProgramasAntigos();

    // Cadastrar programas legais
    await seedProgramasLegais();

    console.log("\n🎉 Seed dos programas legais concluído com sucesso!");
  } catch (error) {
    console.error("Erro durante o seed:", error);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  main();
}

export default seedProgramasLegais;
