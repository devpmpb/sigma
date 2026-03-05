/**
 * Criação do Programa - Lei 1744/2021 (alterada pela Lei 1791/2022)
 *
 * "Dispõe sobre o Programa de Incentivo à Agrotransformação de Alimentos
 *  de Origem Animal do Município de Pato Bragado"
 *
 * Beneficiários: Produtor rural ou pequena indústria com registro no SIM
 *
 * Subsídios (redação vigente após Lei 1791/2022):
 *
 * Produtor pessoa física:
 *   a) 100% dos exames exigidos para registro no SIM (até 10 produtos)
 *   b) 50% dos exames para manutenção do registro, máx R$ 500,00/ano
 *   c) R$ 5.000,00 para aquisição de utensílios/equipamentos ou construção/
 *      adaptação de espaços (1 por produtor)
 *
 * Pequena indústria alimentícia:
 *   a) 100% dos exames para registro no SIM (até 15 produtos)
 *   b) 50% dos exames para manutenção do registro, máx R$ 500,00/ano
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function criarProgramaSIM() {
  console.log("=".repeat(80));
  console.log("CRIAÇÃO DE PROGRAMA - LEI 1744/2021 (alt. Lei 1791/2022)");
  console.log("Incentivo à Agrotransformação de Alimentos de Origem Animal (SIM)");
  console.log("=".repeat(80));

  let programa = await prisma.programa.findFirst({
    where: { nome: { contains: "SIM", mode: "insensitive" } },
  });

  if (programa) {
    console.log(`ℹ️ Programa já existe (ID: ${programa.id} - ${programa.nome}). Apenas criando regras...`);
  } else {
    programa = await prisma.programa.create({
      data: {
        nome: "Auxílio SIM - Agrotransformação de Alimentos",
        descricao:
          "Subsídio para produtores e pequenas indústrias com registro no Serviço de Inspeção Municipal (SIM), cobrindo exames obrigatórios e equipamentos para agrotransformação de alimentos de origem animal",
        leiNumero: "1744/2021",
        tipoPrograma: "SUBSIDIO",
        secretaria: "AGRICULTURA",
        periodicidade: "ANUAL",
        unidadeLimite: "reais",
        limiteMaximoFamilia: 5000,
        ativo: true,
      },
    });
    console.log(`✅ Programa criado: ${programa.nome} (ID: ${programa.id})`);
  }

  // Remover regras existentes para recriar
  await prisma.regrasNegocio.deleteMany({ where: { programaId: programa.id } });

  // Regra 1: Exames para registro - produtor pessoa física
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "exame",
      parametro: {
        modalidade: "EXAMES_REGISTRO_PF",
        descricao: "100% dos exames para registro no SIM - Pessoa Física",
        beneficiario: "Produtor rural pessoa física com registro no SIM",
        limite_produtos: 10,
        percentual: 100,
        tipo_exames: "Físicos, Químicos, Biológicos e de Água",
        lei_alteracao: "Lei 1791/2022",
      },
      valorBeneficio: 0,
      limiteBeneficio: {
        percentual: 100,
        limite_produtos: 10,
        periodicidade: "POR_REGISTRO",
      },
    },
  });
  console.log("  ✅ Regra: 100% exames para registro (PF, até 10 produtos)");

  // Regra 2: Exames para manutenção - produtor pessoa física
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "exame",
      parametro: {
        modalidade: "EXAMES_MANUTENCAO_PF",
        descricao: "50% dos exames para manutenção do registro no SIM - Pessoa Física",
        beneficiario: "Produtor rural pessoa física com registro no SIM",
        percentual: 50,
        tipo_exames: "Físicos, Químicos, Biológicos e de Água",
        lei_alteracao: "Lei 1791/2022",
      },
      valorBeneficio: 500.0,
      limiteBeneficio: {
        percentual: 50,
        valor_maximo: 500,
        unidade: "reais",
        periodicidade: "ANUAL",
      },
    },
  });
  console.log("  ✅ Regra: 50% exames manutenção (PF, máx R$ 500,00/ano)");

  // Regra 3: Equipamentos/construção - produtor pessoa física
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "equipamento",
      parametro: {
        modalidade: "EQUIPAMENTOS_PF",
        descricao: "R$ 5.000,00 para equipamentos ou adaptação de espaços - Pessoa Física",
        beneficiario: "Produtor rural pessoa física com registro no SIM",
        finalidade: "Aquisição de utensílios/equipamentos ou construção/adaptação de espaços para agrotransformação",
        limite_por_produtor: 1,
        lei_alteracao: "Lei 1791/2022",
      },
      valorBeneficio: 5000.0,
      limiteBeneficio: {
        valor_fixo: 5000,
        unidade: "reais",
        limite_por_produtor: 1,
        periodicidade: "UMA_VEZ",
      },
    },
  });
  console.log("  ✅ Regra: R$ 5.000,00 equipamentos (PF, 1 por produtor)");

  // Regra 4: Exames para registro - pequena indústria
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "exame",
      parametro: {
        modalidade: "EXAMES_REGISTRO_PJ",
        descricao: "100% dos exames para registro no SIM - Pequena Indústria Alimentícia",
        beneficiario: "Pequena indústria alimentícia com registro no SIM",
        limite_produtos: 15,
        percentual: 100,
        tipo_exames: "Físicos, Químicos, Biológicos e de Água",
        lei_alteracao: "Lei 1791/2022",
      },
      valorBeneficio: 0,
      limiteBeneficio: {
        percentual: 100,
        limite_produtos: 15,
        periodicidade: "POR_REGISTRO",
      },
    },
  });
  console.log("  ✅ Regra: 100% exames para registro (PJ, até 15 produtos)");

  // Regra 5: Exames para manutenção - pequena indústria
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "exame",
      parametro: {
        modalidade: "EXAMES_MANUTENCAO_PJ",
        descricao: "50% dos exames para manutenção do registro no SIM - Pequena Indústria",
        beneficiario: "Pequena indústria alimentícia com registro no SIM",
        percentual: 50,
        tipo_exames: "Físicos, Químicos, Biológicos e de Água",
        lei_alteracao: "Lei 1791/2022",
      },
      valorBeneficio: 500.0,
      limiteBeneficio: {
        percentual: 50,
        valor_maximo: 500,
        unidade: "reais",
        periodicidade: "ANUAL",
      },
    },
  });
  console.log("  ✅ Regra: 50% exames manutenção (PJ, máx R$ 500,00/ano)");

  console.log("\n" + "=".repeat(80));
  console.log("RESUMO");
  console.log("=".repeat(80));
  console.log(`ID: ${programa.id}`);
  console.log("Lei: 1744/2021 (alterada pela Lei 1791/2022)");
  console.log("Programa: Auxílio SIM - Agrotransformação de Alimentos de Origem Animal");
  console.log("  Pessoa Física:");
  console.log("    - 100% exames para registro (até 10 produtos)");
  console.log("    - 50% exames para manutenção (máx R$ 500,00/ano)");
  console.log("    - R$ 5.000,00 para equipamentos/construção (1 por produtor)");
  console.log("  Pequena Indústria Alimentícia:");
  console.log("    - 100% exames para registro (até 15 produtos)");
  console.log("    - 50% exames para manutenção (máx R$ 500,00/ano)");
}

criarProgramaSIM()
  .then(() => {
    console.log("\n✅ Criação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na criação:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
