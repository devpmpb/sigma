/**
 * Criação do Programa - Lei 1364/2013 (alterada pela Lei 1793/2022)
 *
 * "Dispõe sobre auxílio à construção de piso de concreto"
 *
 * Art. 2º (redação dada pela Lei 1793/2022):
 *   I - Fornecimento de até 1 carga de caminhão caçamba basculante de pedra maroada
 *   II - Horas-máquina para preparação do terreno (sem limite de horas)
 *   III - Reembolso: 1m³ de areia a cada 20m² de piso
 *   IV - Reembolso: 1m³ de pedra britada a cada 20m² de piso
 *   V - Reembolso: 1m³ de concreto usinado a cada 20m² de piso
 *
 *   §3º - Valor reembolso (III, IV, V): até R$ 9,00/m² de piso, limitado a R$ 2.700,00
 *   §4º - Se optar por concreto usinado, NÃO tem reembolso de areia e brita
 *   §5º - Valor pode ser atualizado anualmente pelo IPCA via Decreto
 *
 * Art. 4º (redação dada pela Lei 1793/2022):
 *   - Prazo de 120 dias para concluir a obra
 *   - Após conclusão: apresentar NF para reembolso
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function criarProgramaPiso() {
  console.log("=".repeat(80));
  console.log("CRIAÇÃO DE PROGRAMA - LEI 1364/2013 (alterada 1793/2022)");
  console.log("Construção de Piso de Concreto");
  console.log("=".repeat(80));

  const existente = await prisma.programa.findFirst({
    where: {
      nome: { contains: "Piso", mode: "insensitive" },
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
      nome: "Construção de Piso de Concreto",
      descricao:
        "Auxílio para construção de piso de concreto - fornecimento de pedra maroada, horas-máquina e reembolso de materiais",
      leiNumero: "1364/2013 (alterada 1793/2022)",
      tipoPrograma: "MATERIAL",
      secretaria: "AGRICULTURA",
      periodicidade: "UNICO",
      unidadeLimite: "reais",
      limiteMaximoFamilia: 2700,
      ativo: true,
    },
  });

  console.log(
    `✅ Programa criado: Construção de Piso de Concreto (ID: ${programa.id})`
  );

  // Regra 1: Fornecimento direto (pedra maroada + hora-máquina)
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "valor_fixo",
      parametro: {
        modalidade: "FORNECIMENTO_DIRETO",
        descricao: "Pedra maroada e horas-máquina para preparação do terreno",
        itens: [
          "Até 1 carga de caminhão caçamba basculante de pedra maroada",
          "Horas-máquina para preparação do terreno (sem limite)",
        ],
      },
      valorBeneficio: 0, // Fornecimento direto
      limiteBeneficio: {
        pedra_maroada_cargas: 1,
        horas_maquina: "sem_limite",
        unidade: "fornecimento",
      },
    },
  });
  console.log("  ✅ Regra: Fornecimento direto (pedra maroada + hora-máquina)");

  // Regra 2: Reembolso - Areia + Pedra Britada (opção 1)
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "valor_fixo",
      parametro: {
        modalidade: "REEMBOLSO_AREIA_BRITA",
        descricao:
          "Reembolso de areia e pedra britada (não cumulativo com concreto usinado)",
        itens: [
          "1m³ de areia a cada 20m² de piso",
          "1m³ de pedra britada a cada 20m² de piso",
        ],
        nota: "§4º - Quem optar por concreto usinado NÃO recebe este reembolso",
      },
      valorBeneficio: 9.0, // R$ 9,00/m² de piso
      limiteBeneficio: {
        valor_por_m2: 9.0,
        valor_maximo: 2700,
        unidade: "reais",
        atualizacao: "IPCA anual via Decreto",
        prazo_conclusao_dias: 120,
      },
    },
  });
  console.log("  ✅ Regra: Reembolso areia + brita (até R$ 9,00/m², máx R$ 2.700)");

  // Regra 3: Reembolso - Concreto Usinado (opção 2)
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "valor_fixo",
      parametro: {
        modalidade: "REEMBOLSO_CONCRETO_USINADO",
        descricao:
          "Reembolso de concreto usinado (não cumulativo com areia/brita)",
        itens: ["1m³ de concreto usinado a cada 20m² de piso"],
        nota: "§4º - Quem optar por concreto usinado NÃO recebe areia e brita",
      },
      valorBeneficio: 9.0, // R$ 9,00/m² de piso
      limiteBeneficio: {
        valor_por_m2: 9.0,
        valor_maximo: 2700,
        unidade: "reais",
        atualizacao: "IPCA anual via Decreto",
        prazo_conclusao_dias: 120,
      },
    },
  });
  console.log("  ✅ Regra: Reembolso concreto usinado (até R$ 9,00/m², máx R$ 2.700)");

  // Resumo
  console.log("\n" + "=".repeat(80));
  console.log("RESUMO");
  console.log("=".repeat(80));
  console.log("Lei: 1364/2013 (alterada pela Lei 1793/2022)");
  console.log("Programa: Construção de Piso de Concreto");
  console.log("  Fornecimento direto:");
  console.log("    - 1 carga de pedra maroada");
  console.log("    - Horas-máquina sem limite");
  console.log("  Reembolso (opção A - areia + brita OU opção B - concreto usinado):");
  console.log("    - Até R$ 9,00/m² de piso");
  console.log("    - Máximo R$ 2.700,00");
  console.log("    - Prazo de conclusão: 120 dias");
}

criarProgramaPiso()
  .then(() => {
    console.log("\n✅ Criação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na criação:", error);
    process.exit(1);
  });
