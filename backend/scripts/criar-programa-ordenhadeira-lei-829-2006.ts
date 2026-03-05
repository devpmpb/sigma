/**
 * Criação do Programa - Lei 829/2006 (alterada 1319/2013)
 *
 * "Dispõe sobre autorização para concessão de auxílio financeiro
 *  para aquisição de ordenhadeiras e resfriadores de leite"
 *
 * Art. 1º - Subsídio de 50% do valor dos equipamentos:
 *   I - Ordenhadeira: máx R$ 2.000,00 (alterado pela Lei 1319/2013, era R$ 1.100)
 *   II - Resfriador de Leite a Granel: máx R$ 3.000,00
 *
 * §1º - Subsídio mediante apresentação de NF de compra
 * §2º - Somente para produtores que ainda NÃO foram contemplados (Lei 1319/2013)
 *
 * Art. 2º - Transferência de equipamento:
 *   - Notificar Secretaria de Agricultura
 *   - Dispensado após 5 anos de uso
 *   - Infringir: perde subsídios por 2 anos
 *   - Proibida transferência/venda para fora do município
 *
 * Art. 3º - Requisitos:
 *   I - Regularidade com Nota de Produtor
 *   II - Adimplente com Tesouro Municipal
 *   III - Ordenhadeira: NF venda mín 70L leite/dia OU mín 6 vacas leiteiras
 *   IV - Resfriador: NF venda mín 70L leite/dia OU mín 10 vacas leiteiras
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function criarProgramaOrdenadeira() {
  console.log("=".repeat(80));
  console.log("CRIAÇÃO DE PROGRAMA - LEI 829/2006 (alterada 1319/2013)");
  console.log("Ordenhadeiras e Resfriadores de Leite");
  console.log("=".repeat(80));

  const existente = await prisma.programa.findFirst({
    where: {
      nome: { contains: "Ordenhadeira", mode: "insensitive" },
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
      nome: "Ordenhadeira e Resfriador de Leite",
      descricao:
        "Auxílio financeiro de 50% para aquisição de ordenhadeiras e resfriadores de leite a granel",
      leiNumero: "829/2006 (alterada 1319/2013)",
      tipoPrograma: "SUBSIDIO",
      secretaria: "AGRICULTURA",
      periodicidade: "UNICO", // Somente para quem ainda não foi contemplado
      unidadeLimite: "reais",
      limiteMaximoFamilia: 5000, // R$ 2.000 + R$ 3.000 (pode pegar ambos)
      ativo: true,
    },
  });

  console.log(
    `✅ Programa criado: Ordenhadeira e Resfriador de Leite (ID: ${programa.id})`
  );

  // Regra 1: Ordenhadeira
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "equipamento",
      parametro: {
        modalidade: "ORDENHADEIRA",
        descricao: "Subsídio de 50% na aquisição de ordenhadeira",
        requisitos: [
          "Regularidade com Nota de Produtor",
          "Adimplente com Tesouro Municipal",
          "NF venda mín 70L leite/dia OU mín 6 vacas leiteiras",
          "NF de compra do equipamento",
          "Não ter sido contemplado anteriormente",
        ],
        restricoes: [
          "Proibida transferência/venda para fora do município",
          "Notificar Secretaria em caso de transferência",
          "Dispensado após 5 anos de uso",
          "Infração: perde subsídios por 2 anos",
        ],
      },
      valorBeneficio: 2000.0, // R$ 2.000,00 (Lei 1319/2013)
      limiteBeneficio: {
        valor_maximo: 2000,
        unidade: "reais",
        percentual: 50,
        quantidade_maxima: 1, // 1 vez por produtor
      },
    },
  });
  console.log("  ✅ Regra: Ordenhadeira (50%, máx R$ 2.000,00)");

  // Regra 2: Resfriador de Leite a Granel
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "equipamento",
      parametro: {
        modalidade: "RESFRIADOR",
        descricao:
          "Subsídio de 50% na aquisição de resfriador de leite a granel",
        requisitos: [
          "Regularidade com Nota de Produtor",
          "Adimplente com Tesouro Municipal",
          "NF venda mín 70L leite/dia OU mín 10 vacas leiteiras",
          "NF de compra do equipamento",
          "Não ter sido contemplado anteriormente",
        ],
        restricoes: [
          "Proibida transferência/venda para fora do município",
          "Notificar Secretaria em caso de transferência",
          "Dispensado após 5 anos de uso",
          "Infração: perde subsídios por 2 anos",
        ],
      },
      valorBeneficio: 3000.0, // R$ 3.000,00
      limiteBeneficio: {
        valor_maximo: 3000,
        unidade: "reais",
        percentual: 50,
        quantidade_maxima: 1, // 1 vez por produtor
      },
    },
  });
  console.log("  ✅ Regra: Resfriador de Leite (50%, máx R$ 3.000,00)");

  // Resumo
  console.log("\n" + "=".repeat(80));
  console.log("RESUMO");
  console.log("=".repeat(80));
  console.log("Lei: 829/2006 (alterada pela Lei 1319/2013)");
  console.log("Programa: Ordenhadeira e Resfriador de Leite");
  console.log("  - Ordenhadeira: 50% do valor, máx R$ 2.000,00");
  console.log("  - Resfriador: 50% do valor, máx R$ 3.000,00");
  console.log("  - Periodicidade: UNICO (1 vez por produtor, por equipamento)");
  console.log("  - Somente para quem ainda NÃO foi contemplado");
}

criarProgramaOrdenadeira()
  .then(() => {
    console.log("\n✅ Criação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na criação:", error);
    process.exit(1);
  });
