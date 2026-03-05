/**
 * Criação do Programa - Lei 1670/2019
 *
 * "Dispõe sobre o Programa de Incentivo a Produção Orgânica
 *  do Município de Pato Bragado"
 *
 * Art. 2º - Incentivos para aquisição de produtos e equipamentos
 *           voltados à produção agroecológica
 *
 * Art. 3º - Reembolso de até:
 *   I   - R$ 500,00/produtor/ano - tela de sombreamento (hortas e pomares)
 *   II  - R$ 700,00/produtor/ano - plástico transparente para estufa
 *   III - R$ 1.000,00/produtor/ano - equipamentos de irrigação
 *   IV  - R$ 1.000,00/produtor/ano - utensílios/equipamentos agro-transformação
 *   V   - R$ 500,00/produtor/ano - construção de cercas (hortas e pomares)
 *
 *   §1º - Até 2 incentivos por ano por produtor
 *
 * Art. 4º - Requisitos:
 *   I   - Cadastro atualizado na Secretaria de Agricultura
 *   II  - NF de venda de produção orgânica (origem Pato Bragado)
 *   III - NF de aquisição dos produtos/materiais/equipamentos
 *   IV  - Regularidade tributária municipal
 *   V   - Vínculo com associação de produtores orgânicos OU
 *         fornecimento de orgânicos para merenda escolar (NF)
 *   VI  - Certificação ou projeto para produção agroecológica
 *
 *   §1º - A partir do 2º pedido: NF venda >= valor recebido no ano anterior
 *   §2º - NF usada apenas 1 vez
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function criarProgramaProducaoOrganica() {
  console.log("=".repeat(80));
  console.log("CRIAÇÃO DE PROGRAMA - LEI 1670/2019");
  console.log("Incentivo à Produção Orgânica");
  console.log("=".repeat(80));

  const existente = await prisma.programa.findFirst({
    where: {
      OR: [
        { nome: { contains: "Produção Orgânica", mode: "insensitive" } },
        { nome: { contains: "Producao Organica", mode: "insensitive" } },
      ],
    },
  });

  if (existente) {
    console.log(
      `⚠️ Programa já existe (ID: ${existente.id} - ${existente.nome}). Pulando...`
    );
    return;
  }

  const programa = await prisma.programa.create({
    data: {
      nome: "Incentivo à Produção Orgânica",
      descricao:
        "Reembolso para aquisição de produtos e equipamentos voltados à produção agroecológica - tela sombreamento, plástico estufa, irrigação, agro-transformação e cercas",
      leiNumero: "1670/2019",
      tipoPrograma: "SUBSIDIO",
      secretaria: "AGRICULTURA",
      periodicidade: "ANUAL",
      unidadeLimite: "reais",
      limiteMaximoFamilia: 2000, // 2 incentivos/ano, maior valor = R$ 1.000 x 2
      ativo: true,
    },
  });

  console.log(
    `✅ Programa criado: Incentivo à Produção Orgânica (ID: ${programa.id})`
  );

  // Regra 1: Tela de sombreamento
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "equipamento",
      parametro: {
        modalidade: "TELA_SOMBREAMENTO",
        descricao: "Reembolso para aquisição de tela de sombreamento para hortas e pomares",
        requisitos: [
          "Cadastro atualizado na Secretaria de Agricultura",
          "NF de venda de produção orgânica (origem Pato Bragado)",
          "NF de aquisição do material",
          "Regularidade tributária municipal",
          "Vínculo com associação de orgânicos OU fornecimento para merenda escolar",
          "Certificação ou projeto agroecológico",
        ],
        regra_segundo_pedido:
          "A partir do 2º pedido: NF venda >= valor recebido no ano anterior",
      },
      valorBeneficio: 500.0,
      limiteBeneficio: {
        valor_maximo: 500,
        unidade: "reais",
        periodicidade: "ANUAL",
      },
    },
  });
  console.log("  ✅ Regra: Tela de sombreamento (máx R$ 500,00/ano)");

  // Regra 2: Plástico para estufa
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "equipamento",
      parametro: {
        modalidade: "PLASTICO_ESTUFA",
        descricao:
          "Reembolso para aquisição de plástico transparente para estufa de hortaliças e frutas",
        requisitos: [
          "Cadastro atualizado na Secretaria de Agricultura",
          "NF de venda de produção orgânica (origem Pato Bragado)",
          "NF de aquisição do material",
          "Regularidade tributária municipal",
          "Vínculo com associação de orgânicos OU fornecimento para merenda escolar",
          "Certificação ou projeto agroecológico",
        ],
        regra_segundo_pedido:
          "A partir do 2º pedido: NF venda >= valor recebido no ano anterior",
      },
      valorBeneficio: 700.0,
      limiteBeneficio: {
        valor_maximo: 700,
        unidade: "reais",
        periodicidade: "ANUAL",
      },
    },
  });
  console.log("  ✅ Regra: Plástico estufa (máx R$ 700,00/ano)");

  // Regra 3: Equipamentos de irrigação
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "equipamento",
      parametro: {
        modalidade: "IRRIGACAO",
        descricao:
          "Reembolso para aquisição de equipamentos de irrigação para hortas e pomares",
        requisitos: [
          "Cadastro atualizado na Secretaria de Agricultura",
          "NF de venda de produção orgânica (origem Pato Bragado)",
          "NF de aquisição do equipamento",
          "Regularidade tributária municipal",
          "Vínculo com associação de orgânicos OU fornecimento para merenda escolar",
          "Certificação ou projeto agroecológico",
        ],
        regra_segundo_pedido:
          "A partir do 2º pedido: NF venda >= valor recebido no ano anterior",
      },
      valorBeneficio: 1000.0,
      limiteBeneficio: {
        valor_maximo: 1000,
        unidade: "reais",
        periodicidade: "ANUAL",
      },
    },
  });
  console.log("  ✅ Regra: Equipamentos irrigação (máx R$ 1.000,00/ano)");

  // Regra 4: Utensílios/equipamentos agro-transformação
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "equipamento",
      parametro: {
        modalidade: "AGRO_TRANSFORMACAO",
        descricao:
          "Reembolso para aquisição de utensílios e equipamentos destinados a agro-transformação de alimentos",
        requisitos: [
          "Cadastro atualizado na Secretaria de Agricultura",
          "NF de venda de produção orgânica (origem Pato Bragado)",
          "NF de aquisição do equipamento",
          "Regularidade tributária municipal",
          "Vínculo com associação de orgânicos OU fornecimento para merenda escolar",
          "Certificação ou projeto agroecológico",
        ],
        regra_segundo_pedido:
          "A partir do 2º pedido: NF venda >= valor recebido no ano anterior",
      },
      valorBeneficio: 1000.0,
      limiteBeneficio: {
        valor_maximo: 1000,
        unidade: "reais",
        periodicidade: "ANUAL",
      },
    },
  });
  console.log("  ✅ Regra: Agro-transformação (máx R$ 1.000,00/ano)");

  // Regra 5: Cercas para hortas e pomares
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "equipamento",
      parametro: {
        modalidade: "CERCAS",
        descricao:
          "Reembolso para construção de cercas para proteger hortas e pomares",
        requisitos: [
          "Cadastro atualizado na Secretaria de Agricultura",
          "NF de venda de produção orgânica (origem Pato Bragado)",
          "NF de aquisição do material",
          "Regularidade tributária municipal",
          "Vínculo com associação de orgânicos OU fornecimento para merenda escolar",
          "Certificação ou projeto agroecológico",
        ],
        regra_segundo_pedido:
          "A partir do 2º pedido: NF venda >= valor recebido no ano anterior",
      },
      valorBeneficio: 500.0,
      limiteBeneficio: {
        valor_maximo: 500,
        unidade: "reais",
        periodicidade: "ANUAL",
      },
    },
  });
  console.log("  ✅ Regra: Cercas (máx R$ 500,00/ano)");

  // Resumo
  console.log("\n" + "=".repeat(80));
  console.log("RESUMO");
  console.log("=".repeat(80));
  console.log("Lei: 1670/2019");
  console.log("Programa: Incentivo à Produção Orgânica");
  console.log("  Modalidades de reembolso:");
  console.log("    I   - Tela sombreamento: até R$ 500/ano");
  console.log("    II  - Plástico estufa: até R$ 700/ano");
  console.log("    III - Irrigação: até R$ 1.000/ano");
  console.log("    IV  - Agro-transformação: até R$ 1.000/ano");
  console.log("    V   - Cercas: até R$ 500/ano");
  console.log("  Limite: 2 incentivos por produtor por ano");
  console.log("  2º pedido: comprovar venda >= valor recebido ano anterior");
}

criarProgramaProducaoOrganica()
  .then(() => {
    console.log("\n✅ Criação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na criação:", error);
    process.exit(1);
  });
