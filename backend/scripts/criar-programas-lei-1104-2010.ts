/**
 * Criação de Programas - Lei 1104/2010
 *
 * "Dispõe sobre os incentivos para a construção, reforma e ampliação
 *  de sala de ordenha e construção de silos"
 *
 * Cria 2 programas:
 *
 * 1. SALA DE ORDENHA (Art. 2º)
 *    - Fornecimento de materiais de construção
 *    - Construção nova: até R$ 3.000,00
 *    - Reforma/ampliação: até R$ 1.500,00
 *    - Limitado a 1 liberação por produtor para cada tipo
 *    - Requisitos:
 *      - Adimplente com tributos municipais
 *      - Construção nova: mín 10 matrizes bovinas OU NF venda mín 100L leite/dia últimos 10 meses
 *      - Reforma/ampliação: mín 5 matrizes bovinas OU NF venda mín 50L leite/dia últimos 10 meses
 *    - Materiais: ferro 4.2mm, 0.8mm, 10mm, cimento, cal, brita nº1, tijolos 6 furos, cerâmica
 *
 * 2. SILO (Art. 3º)
 *    - Fornecimento de materiais + máquinas para abertura de vala
 *    - Até R$ 2.500,00 por incentivo
 *    - Limitado a 2 incentivos por produtor (alterado pela Lei 1723/2021, Art. 4º §2º, II)
 *    - Requisitos:
 *      - Adimplente com tributos municipais
 *      - Bovinocultor leite: mín 10 matrizes OU NF 100L leite/dia últimos 10 meses
 *      - Suinocultor: mín 15 matrizes suínas
 *    - Materiais: brita nº1, tijolos 6 furos, cimento, ferro
 *    - Serviço: máquinas para abertura de vala
 *
 * Prazo de aplicação dos materiais: 6 meses
 * Penalidade: sem subsídios por 3 anos se não aplicar no prazo
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function criarProgramas() {
  console.log("=".repeat(80));
  console.log("CRIAÇÃO DE PROGRAMAS - LEI 1104/2010");
  console.log("Sala de Ordenha e Silos");
  console.log("=".repeat(80));

  // ========================================================================
  // 1. SALA DE ORDENHA
  // ========================================================================
  console.log("\n📋 Criando programa: Sala de Ordenha...");

  const salaOrdenhaExistente = await prisma.programa.findFirst({
    where: { nome: { contains: "Sala de Ordenha", mode: "insensitive" } },
  });

  if (salaOrdenhaExistente) {
    console.log(
      `⚠️ Programa "Sala de Ordenha" já existe (ID: ${salaOrdenhaExistente.id}). Pulando...`
    );
  } else {
    const salaOrdenha = await prisma.programa.create({
      data: {
        nome: "Sala de Ordenha",
        descricao:
          "Incentivos para construção, reforma e ampliação de sala de ordenha - fornecimento de materiais de construção",
        leiNumero: "1104/2010",
        tipoPrograma: "MATERIAL",
        secretaria: "AGRICULTURA",
        periodicidade: "UNICO", // 1 liberação por produtor por tipo
        unidadeLimite: "reais",
        limiteMaximoFamilia: 3000,
        ativo: true,
      },
    });

    console.log(`✅ Programa criado: Sala de Ordenha (ID: ${salaOrdenha.id})`);

    // Regra 1: Construção nova
    await prisma.regrasNegocio.create({
      data: {
        programaId: salaOrdenha.id,
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "CONSTRUCAO_NOVA",
          descricao: "Construção nova de sala de ordenha",
          materiais: [
            "Barras de ferro 4.2mm",
            "Barras de ferro 0.8mm",
            "Barras de ferro 10mm",
            "Cimento",
            "Cal hidratado",
            "Pedra brita nº 01",
            "Tijolos 6 furos 9x14x24cm",
            "Revestimento cerâmico",
          ],
          requisitos: [
            "Regularidade fiscal junto à Prefeitura",
            "Mínimo 10 matrizes bovinas OU NF venda mín 100L leite/dia últimos 10 meses",
            "Prazo de 6 meses para aplicação dos materiais",
          ],
        },
        valorBeneficio: 3000.0, // R$ 3.000,00
        limiteBeneficio: {
          valor_maximo: 3000,
          unidade: "reais",
          quantidade_maxima: 1, // 1 liberação por produtor
          prazo_aplicacao_meses: 6,
          penalidade_anos: 3,
        },
      },
    });
    console.log("  ✅ Regra: Construção nova (até R$ 3.000,00)");

    // Regra 2: Reforma/ampliação
    await prisma.regrasNegocio.create({
      data: {
        programaId: salaOrdenha.id,
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "REFORMA_AMPLIACAO",
          descricao: "Reforma ou ampliação de sala de ordenha",
          materiais: [
            "Barras de ferro 4.2mm",
            "Barras de ferro 0.8mm",
            "Barras de ferro 10mm",
            "Cimento",
            "Cal hidratado",
            "Pedra brita nº 01",
            "Tijolos 6 furos 9x14x24cm",
            "Revestimento cerâmico",
          ],
          requisitos: [
            "Regularidade fiscal junto à Prefeitura",
            "Mínimo 5 matrizes bovinas OU NF venda mín 50L leite/dia últimos 10 meses",
            "Prazo de 6 meses para aplicação dos materiais",
          ],
        },
        valorBeneficio: 1500.0, // R$ 1.500,00
        limiteBeneficio: {
          valor_maximo: 1500,
          unidade: "reais",
          quantidade_maxima: 1,
          prazo_aplicacao_meses: 6,
          penalidade_anos: 3,
        },
      },
    });
    console.log("  ✅ Regra: Reforma/ampliação (até R$ 1.500,00)");
  }

  // ========================================================================
  // 2. SILO
  // ========================================================================
  console.log("\n📋 Criando programa: Construção de Silo...");

  const siloExistente = await prisma.programa.findFirst({
    where: { nome: { contains: "Silo", mode: "insensitive" } },
  });

  if (siloExistente) {
    console.log(
      `⚠️ Programa "Silo" já existe (ID: ${siloExistente.id}). Pulando...`
    );
  } else {
    const silo = await prisma.programa.create({
      data: {
        nome: "Construção de Silo",
        descricao:
          "Incentivo para construção de silos - fornecimento de materiais e máquinas para abertura de vala",
        leiNumero: "1104/2010 (alterada 1723/2021)",
        tipoPrograma: "MATERIAL",
        secretaria: "AGRICULTURA",
        periodicidade: "UNICO", // 2 liberações por produtor (Lei 1723/2021, Art. 4º §2º, II)
        unidadeLimite: "reais",
        limiteMaximoFamilia: 5000, // 2x R$ 2.500,00
        ativo: true,
      },
    });

    console.log(`✅ Programa criado: Construção de Silo (ID: ${silo.id})`);

    // Regra 1: Bovinocultor de leite
    await prisma.regrasNegocio.create({
      data: {
        programaId: silo.id,
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "BOVINOCULTOR_LEITE",
          descricao: "Construção de silo para bovinocultor de leite",
          materiais: [
            "Pedra brita nº 01",
            "Tijolos 6 furos 9x14x24cm",
            "Cimento",
            "Barras de ferro",
          ],
          servicos: ["Máquinas para abertura de vala"],
          requisitos: [
            "Regularidade fiscal junto à Prefeitura",
            "Mínimo 10 matrizes bovinas OU NF venda mín 100L leite/dia últimos 10 meses",
            "Prazo de 6 meses para aplicação dos materiais",
          ],
        },
        valorBeneficio: 2500.0, // R$ 2.500,00
        limiteBeneficio: {
          valor_maximo: 2500,
          unidade: "reais",
          quantidade_maxima: 2, // 2 incentivos por produtor (Lei 1723/2021)
          prazo_aplicacao_meses: 6,
          penalidade_anos: 3,
        },
      },
    });
    console.log("  ✅ Regra: Bovinocultor leite (até R$ 2.500,00 x 2 vezes)");

    // Regra 2: Suinocultor
    await prisma.regrasNegocio.create({
      data: {
        programaId: silo.id,
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "SUINOCULTOR",
          descricao: "Construção de silo para suinocultor",
          materiais: [
            "Pedra brita nº 01",
            "Tijolos 6 furos 9x14x24cm",
            "Cimento",
            "Barras de ferro",
          ],
          servicos: ["Máquinas para abertura de vala"],
          requisitos: [
            "Regularidade fiscal junto à Prefeitura",
            "Mínimo 15 matrizes suínas",
            "Prazo de 6 meses para aplicação dos materiais",
          ],
        },
        valorBeneficio: 2500.0,
        limiteBeneficio: {
          valor_maximo: 2500,
          unidade: "reais",
          quantidade_maxima: 2, // 2 incentivos por produtor (Lei 1723/2021)
          prazo_aplicacao_meses: 6,
          penalidade_anos: 3,
        },
      },
    });
    console.log("  ✅ Regra: Suinocultor (até R$ 2.500,00 x 2 vezes)");
  }

  // Resumo
  console.log("\n" + "=".repeat(80));
  console.log("RESUMO");
  console.log("=".repeat(80));
  console.log("Lei: 1104/2010 (alterada pela Lei 1723/2021)");
  console.log("Programas criados:");
  console.log("  1. Sala de Ordenha");
  console.log("     - Construção nova: até R$ 3.000,00");
  console.log("     - Reforma/ampliação: até R$ 1.500,00");
  console.log("     - 1 liberação por produtor por tipo");
  console.log("  2. Construção de Silo");
  console.log("     - Até R$ 2.500,00 por incentivo");
  console.log("     - 2 liberações por produtor (Lei 1723/2021)");
  console.log("     - Bovinocultor leite ou suinocultor");
}

criarProgramas()
  .then(() => {
    console.log("\n✅ Criação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na criação:", error);
    process.exit(1);
  });
