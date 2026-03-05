/**
 * Criação do Programa - Lei 1663/2019
 *
 * "Dispõe sobre o Programa de Incentivo a Aquisição de Mudas Frutíferas
 *  no âmbito do Município de Pato Bragado"
 *
 * Art. 2º - Reembolso parcial para aquisição de espécies frutíferas
 *   - Sem impedimento legal de plantio
 *   - Com estudo de produção viável na Região Oeste do PR
 *
 * Art. 3º - Reembolso de até 50% do valor total
 *   - Mediante NF de compra na Secretaria de Agricultura
 *   - Valor máximo: R$ 500,00/produtor/ano
 *
 * Art. 4º - Requisitos:
 *   I - Cadastro atualizado na Secretaria de Agricultura
 *   II - NF de venda de produtos agropecuários (origem Pato Bragado)
 *   III - DAP (Declaração de Aptidão ao PRONAF)
 *   IV - NF de aquisição das mudas
 *   V - Regularidade tributária municipal
 *   §1º - A partir do 2º pedido: NF de venda de frutas >= valor recebido no ano anterior
 *   §2º - NF usada apenas 1 vez
 *   §3º - Exceção para mudas com período plantio→produção > 1 ano
 *
 * Art. 5º - Acompanhamento técnico pela Emater
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function criarProgramaMudasFrutiferas() {
  console.log("=".repeat(80));
  console.log("CRIAÇÃO DE PROGRAMA - LEI 1663/2019");
  console.log("Incentivo à Aquisição de Mudas Frutíferas");
  console.log("=".repeat(80));

  const existente = await prisma.programa.findFirst({
    where: {
      nome: { contains: "Mudas", mode: "insensitive" },
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
      nome: "Mudas Frutíferas",
      descricao:
        "Reembolso parcial de até 50% para aquisição de mudas frutíferas por agricultores familiares",
      leiNumero: "1663/2019",
      tipoPrograma: "SUBSIDIO",
      secretaria: "AGRICULTURA",
      periodicidade: "ANUAL",
      unidadeLimite: "reais",
      limiteMaximoFamilia: 500,
      ativo: true,
    },
  });

  console.log(`✅ Programa criado: Mudas Frutíferas (ID: ${programa.id})`);

  // Regra única: Reembolso parcial
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "equipamento",
      parametro: {
        modalidade: "REEMBOLSO_MUDAS",
        descricao: "Reembolso de até 50% na aquisição de mudas frutíferas",
        especies: "Frutíferas sem impedimento legal, viáveis na Região Oeste do PR",
        acompanhamento: "Emater de Pato Bragado",
        requisitos: [
          "Cadastro atualizado na Secretaria de Agricultura",
          "NF de venda de produtos agropecuários (origem Pato Bragado)",
          "DAP - Declaração de Aptidão ao PRONAF",
          "NF de aquisição das mudas frutíferas",
          "Regularidade tributária municipal",
        ],
        regra_segundo_pedido:
          "A partir do 2º pedido: NF de venda de frutas >= valor recebido no ano anterior (exceto mudas com período plantio-produção > 1 ano)",
      },
      valorBeneficio: 500.0, // R$ 500,00/produtor/ano
      limiteBeneficio: {
        valor_maximo: 500,
        unidade: "reais",
        percentual: 50,
        periodicidade: "ANUAL",
      },
    },
  });
  console.log("  ✅ Regra: Reembolso 50% (máx R$ 500,00/ano)");

  // Resumo
  console.log("\n" + "=".repeat(80));
  console.log("RESUMO");
  console.log("=".repeat(80));
  console.log("Lei: 1663/2019");
  console.log("Programa: Mudas Frutíferas");
  console.log("  - Reembolso de até 50% do valor das mudas");
  console.log("  - Máximo R$ 500,00 por produtor/ano");
  console.log("  - Exige DAP (agricultor familiar)");
  console.log("  - A partir do 2º pedido: comprovar venda de frutas");
  console.log("  - Acompanhamento técnico pela Emater");
}

criarProgramaMudasFrutiferas()
  .then(() => {
    console.log("\n✅ Criação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na criação:", error);
    process.exit(1);
  });
