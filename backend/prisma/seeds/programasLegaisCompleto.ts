// backend/prisma/seeds/programasLegaisCompleto.ts
import { PrismaClient, TipoPrograma, TipoPerfil } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedProgramasLegais() {
  console.log("🌱 Iniciando cadastro dos programas legais municipais...");

  try {
    // ==================================================
    // LEI 797/2006 - PRÓ-ORGÂNICO (ADUBO ORGÂNICO)
    // ==================================================
    const proOrganico = await prisma.programa.create({
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
    const equipamentosLeite = await prisma.programa.create({
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
    const inseminacaoArtificial = await prisma.programa.create({
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

    console.log(`\n📊 Resumo do cadastramento:`);
    console.log(`   • ${totalProgramas} programas cadastrados`);
    console.log(`   • ${totalRegras} regras de negócio configuradas`);
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
