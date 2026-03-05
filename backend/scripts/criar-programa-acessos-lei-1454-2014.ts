/**
 * Criação do Programa - Lei 1454/2014 (alterada 1726/2021)
 *
 * "Dispõe sobre a concessão de incentivos para melhoria de acessos
 *  às propriedades rurais, comerciais, industriais, turísticas e
 *  Prestadoras de Serviços do Município de Pato Bragado"
 *
 * Art. 2º - Incentivos:
 *   I - Até 200m³ de pedra poliédricas (alterado pela Lei 1726/2021, era 150m³)
 *   II - Horas máquina para terraplanagem, rolo compactador e deslocamento de terra
 *   Parágrafo único: demais despesas por conta do proprietário
 *
 * Art. 3º - Requisitos:
 *   I - Certidão negativa de tributos municipais
 *   II - Bloco de nota de produtor rural (propriedade rural)
 *   III - Atos constitutivos e alvará (comercial/industrial/turístico)
 *   §1º - Termo de Compromisso de execução + legislação ambiental
 *   §2º - Parecer da Secretaria de Obras, decisão em 15 dias úteis
 *
 * Art. 4º - Prazo de assentamento das pedras: 90 dias após terraplanagem
 *   Parágrafo único: Se não executar, ressarcir o Município
 *
 * Art. 5º - Sujeito a disponibilidade de recursos
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function criarProgramaAcessos() {
  console.log("=".repeat(80));
  console.log("CRIAÇÃO DE PROGRAMA - LEI 1454/2014 (alterada 1726/2021)");
  console.log("Melhoria de Acessos às Propriedades");
  console.log("=".repeat(80));

  const existente = await prisma.programa.findFirst({
    where: {
      OR: [
        { nome: { contains: "Acesso", mode: "insensitive" } },
        { nome: { contains: "Pedras Pátios", mode: "insensitive" } },
        { nome: { contains: "Melhoria de Acessos", mode: "insensitive" } },
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
      nome: "Melhoria de Acessos às Propriedades",
      descricao:
        "Fornecimento de pedra poliédrica e horas-máquina para melhoria de acessos às propriedades rurais, comerciais, industriais, turísticas e prestadoras de serviços",
      leiNumero: "1454/2014 (alterada 1726/2021)",
      tipoPrograma: "MATERIAL",
      secretaria: "AGRICULTURA",
      periodicidade: "UNICO",
      unidadeLimite: "m3",
      limiteMaximoFamilia: 200,
      ativo: true,
    },
  });

  console.log(
    `✅ Programa criado: Melhoria de Acessos às Propriedades (ID: ${programa.id})`
  );

  // Regra 1: Pedra Poliédrica
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "valor_fixo",
      parametro: {
        modalidade: "PEDRA_POLIEDRICA",
        descricao: "Fornecimento de até 200m³ de pedra poliédrica para pavimentação de acesso",
        requisitos: [
          "Certidão negativa de tributos municipais",
          "Bloco de nota de produtor rural (propriedade rural)",
          "Atos constitutivos e alvará (comercial/industrial/turístico)",
          "Termo de Compromisso de execução",
          "Parecer da Secretaria de Obras",
        ],
        restricoes: [
          "Assentar as pedras em até 90 dias após terraplanagem",
          "Se não executar, ressarcir o Município",
          "Sujeito a disponibilidade de recursos",
        ],
      },
      valorBeneficio: 0, // Fornecimento direto, sem valor monetário
      limiteBeneficio: {
        quantidade_maxima: 200, // 200m³ (Lei 1726/2021)
        unidade: "m3",
        prazo_execucao_dias: 90,
      },
    },
  });
  console.log("  ✅ Regra: Pedra Poliédrica (até 200m³)");

  // Regra 2: Hora-Máquina
  await prisma.regrasNegocio.create({
    data: {
      programaId: programa.id,
      tipoRegra: "valor_fixo",
      parametro: {
        modalidade: "HORA_MAQUINA",
        descricao: "Serviços de terraplanagem, rolo compactador e deslocamento de terra",
        servicos: [
          "Terraplanagem do local",
          "Rolo compactador",
          "Deslocamento de terra para assentamento das pedras",
        ],
      },
      valorBeneficio: 0, // Serviço municipal direto
      limiteBeneficio: {
        unidade: "horas",
        nota: "Conforme necessidade avaliada pela Secretaria de Obras",
      },
    },
  });
  console.log("  ✅ Regra: Hora-Máquina (terraplanagem + compactação)");

  // Resumo
  console.log("\n" + "=".repeat(80));
  console.log("RESUMO");
  console.log("=".repeat(80));
  console.log("Lei: 1454/2014 (alterada pela Lei 1726/2021)");
  console.log("Programa: Melhoria de Acessos às Propriedades");
  console.log("  - Até 200m³ de pedra poliédrica (Lei 1726/2021)");
  console.log("  - Horas-máquina para terraplanagem e compactação");
  console.log("  - Prazo de execução: 90 dias");
  console.log("  - Abrange: rural, comercial, industrial, turístico");
}

criarProgramaAcessos()
  .then(() => {
    console.log("\n✅ Criação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na criação:", error);
    process.exit(1);
  });
