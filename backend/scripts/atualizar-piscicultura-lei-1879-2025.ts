/**
 * Atualização do Programa de Piscicultura - Lei 1879/2025
 *
 * Esta lei REVOGA as leis anteriores:
 * - 815/2006, 1413/2014, 1587/2018, 1723/2021 e 1746/2021
 *
 * O programa existente "Alevinos (Legado)" (ID 9) será atualizado para
 * "Piscicultura Sustentável" com as novas regras.
 *
 * A lei define 3 tipos de benefício:
 *
 * I - Fornecimento de Alevinos:
 *   - Limite: 3 alevinos/m² de lâmina d'água, máx 10.000/produtor/ano
 *   - Subsídio: 50% do custo, limitado a R$ 72,50/milheiro
 *   - Requer NF de compra + critérios do Art. 2º
 *
 * II - Pedra Rachão (para taipa de açude):
 *   - Limite: 300m³/produtor a cada 2 anos
 *   - Disponível enquanto houver estoque na pedreira municipal
 *   - Novos empreendimentos: contrato com parceiro comercial
 *   - Já estabelecidos: NF de venda dos últimos 18 meses
 *
 * III - Hora-Máquina:
 *   - 50% subsídio: 1ª a 10ª hora
 *   - 30% subsídio: 11ª a 20ª hora
 *   - 15% subsídio: 21ª a 30ª hora
 *   - Valor integral (1 VR): a partir da 31ª hora
 *   - Requer NF de comercialização para novo pedido (§1º)
 *   - Sem NF: paga valor integral (1 VR) até 40h, depois 2 VR (§2º)
 *
 * Art. 4º - Produtor NÃO habilitado:
 *   - 1ª a 40ª hora: 1 VR
 *   - A partir da 41ª hora: 2 VR
 *
 * Requisitos (Art. 2º):
 *   - Propriedade rural ou contrato de parceria no município
 *   - Infraestrutura adequada (avaliação técnica)
 *   - Licença ambiental válida e outorga de uso da água
 *   - Adimplente com tributos municipais
 *   - Cadastrado na Secretaria de Agricultura
 *   - Boas práticas ambientais
 *   - NF para comercialização (quando aplicável)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROGRAMA_ID = 9; // Alevinos (Legado) -> Piscicultura Sustentável

async function atualizarPiscicultura() {
  console.log("=".repeat(80));
  console.log("ATUALIZAÇÃO - PISCICULTURA - LEI 1879/2025");
  console.log("=".repeat(80));

  // 1. Verificar programa existente
  const programa = await prisma.programa.findUnique({
    where: { id: PROGRAMA_ID },
    include: { regras: true },
  });

  if (!programa) {
    console.error(`❌ Programa ID ${PROGRAMA_ID} não encontrado!`);
    return;
  }

  console.log(`\nPrograma atual:`);
  console.log(`  ID: ${programa.id}`);
  console.log(`  Nome: ${programa.nome}`);
  console.log(`  Lei: ${programa.leiNumero || "N/A"}`);
  console.log(`  Tipo: ${programa.tipoPrograma}`);
  console.log(`  Periodicidade: ${programa.periodicidade}`);
  console.log(`  Regras existentes: ${programa.regras.length}`);

  // 2. Atualizar dados do programa
  console.log("\n📝 Atualizando programa...");

  await prisma.programa.update({
    where: { id: PROGRAMA_ID },
    data: {
      nome: "Piscicultura Sustentável",
      descricao:
        "Programa Municipal de Apoio à Piscicultura Sustentável - fornecimento de alevinos, pedra rachão e hora-máquina",
      leiNumero: "1879/2025",
      tipoPrograma: "SUBSIDIO",
      periodicidade: "ANUAL",
      unidadeLimite: "alevinos",
      limiteMaximoFamilia: 10000,
      ativo: true,
    },
  });

  console.log("✅ Programa atualizado: Piscicultura Sustentável (Lei 1879/2025)");

  // 3. Remover regras antigas (se existirem)
  if (programa.regras.length > 0) {
    console.log(`\n🗑️  Removendo ${programa.regras.length} regra(s) antiga(s)...`);
    await prisma.regrasNegocio.deleteMany({
      where: { programaId: PROGRAMA_ID },
    });
    console.log("✅ Regras antigas removidas");
  }

  // 4. Criar novas regras conforme Lei 1879/2025
  console.log("\n📋 Criando novas regras...");

  // REGRA 1: Fornecimento de Alevinos (Art. 3º, I)
  await prisma.regrasNegocio.create({
    data: {
      programaId: PROGRAMA_ID,
      tipoRegra: "piscicultura_alevinos",
      parametro: {
        modalidade: "ALEVINOS",
        descricao: "Fornecimento de alevinos com subsídio de 50%",
        limite_por_m2: 3,
        requisitos: [
          "Licença ambiental válida",
          "Outorga de uso da água",
          "Cadastro na Secretaria de Agricultura",
          "Adimplente com tributos municipais",
          "NF de compra dos alevinos",
        ],
      },
      valorBeneficio: 72.5, // R$ 72,50/milheiro (máximo de subsídio)
      limiteBeneficio: {
        quantidade_maxima: 10000, // 10.000 alevinos/produtor/ano
        limite_por_m2_lamina: 3,
        unidade: "alevinos",
        percentual: 50, // 50% do custo de aquisição
        valor_maximo_por_milheiro: 72.5,
      },
    },
  });
  console.log("  ✅ Regra 1: Fornecimento de Alevinos (50% subsídio, máx 10.000/ano)");

  // REGRA 2: Pedra Rachão (Art. 3º, II)
  await prisma.regrasNegocio.create({
    data: {
      programaId: PROGRAMA_ID,
      tipoRegra: "piscicultura_pedra",
      parametro: {
        modalidade: "PEDRA_RACHAO",
        descricao: "Fornecimento de pedra rachão para construção de taipa de açude",
        periodicidade: "BIENAL",
        requisitos: [
          "Disponibilidade na pedreira municipal",
          "Novos empreendimentos: contrato formalizado com parceiro comercial",
          "Já estabelecidos: NF de venda dos últimos 18 meses",
        ],
      },
      valorBeneficio: 0, // Entrega gratuita (enquanto houver estoque)
      limiteBeneficio: {
        quantidade_maxima: 300, // 300 m³/produtor
        unidade: "m3",
        periodicidade_meses: 24, // A cada 2 anos
      },
    },
  });
  console.log("  ✅ Regra 2: Pedra Rachão (até 300m³ a cada 2 anos)");

  // REGRA 3: Hora-Máquina - Faixa 1 (Art. 3º, III, a)
  await prisma.regrasNegocio.create({
    data: {
      programaId: PROGRAMA_ID,
      tipoRegra: "piscicultura_hora_maquina",
      parametro: {
        modalidade: "HORA_MAQUINA",
        faixa: 1,
        descricao: "50% de subsídio sobre hora-máquina (1ª a 10ª hora)",
        hora_inicio: 1,
        hora_fim: 10,
        requisito_segundo_pedido: "NF de comercialização da produção do pescado",
      },
      valorBeneficio: 0, // Valor varia conforme VR municipal
      limiteBeneficio: {
        quantidade_maxima: 10, // 10 horas nesta faixa
        unidade: "horas",
        percentual: 50, // 50% de subsídio
      },
    },
  });
  console.log("  ✅ Regra 3: Hora-Máquina Faixa 1 (50% subsídio, 1ª-10ª hora)");

  // REGRA 4: Hora-Máquina - Faixa 2 (Art. 3º, III, b)
  await prisma.regrasNegocio.create({
    data: {
      programaId: PROGRAMA_ID,
      tipoRegra: "piscicultura_hora_maquina",
      parametro: {
        modalidade: "HORA_MAQUINA",
        faixa: 2,
        descricao: "30% de subsídio sobre hora-máquina (11ª a 20ª hora)",
        hora_inicio: 11,
        hora_fim: 20,
      },
      valorBeneficio: 0,
      limiteBeneficio: {
        quantidade_maxima: 10,
        unidade: "horas",
        percentual: 30,
      },
    },
  });
  console.log("  ✅ Regra 4: Hora-Máquina Faixa 2 (30% subsídio, 11ª-20ª hora)");

  // REGRA 5: Hora-Máquina - Faixa 3 (Art. 3º, III, c)
  await prisma.regrasNegocio.create({
    data: {
      programaId: PROGRAMA_ID,
      tipoRegra: "piscicultura_hora_maquina",
      parametro: {
        modalidade: "HORA_MAQUINA",
        faixa: 3,
        descricao: "15% de subsídio sobre hora-máquina (21ª a 30ª hora)",
        hora_inicio: 21,
        hora_fim: 30,
      },
      valorBeneficio: 0,
      limiteBeneficio: {
        quantidade_maxima: 10,
        unidade: "horas",
        percentual: 15,
      },
    },
  });
  console.log("  ✅ Regra 5: Hora-Máquina Faixa 3 (15% subsídio, 21ª-30ª hora)");

  // REGRA 6: Hora-Máquina - Faixa 4 (Art. 3º, III, d)
  await prisma.regrasNegocio.create({
    data: {
      programaId: PROGRAMA_ID,
      tipoRegra: "piscicultura_hora_maquina",
      parametro: {
        modalidade: "HORA_MAQUINA",
        faixa: 4,
        descricao: "Valor integral (1 VR/hora) a partir da 31ª hora",
        hora_inicio: 31,
        hora_fim: null,
      },
      valorBeneficio: 0,
      limiteBeneficio: {
        unidade: "horas",
        percentual: 0,
        valor_por_hora_vr: 1, // 1 VR por hora
      },
    },
  });
  console.log("  ✅ Regra 6: Hora-Máquina Faixa 4 (1 VR/hora, a partir da 31ª hora)");

  // REGRA 7: Hora-Máquina - Sem NF (Art. 3º, §2º)
  await prisma.regrasNegocio.create({
    data: {
      programaId: PROGRAMA_ID,
      tipoRegra: "piscicultura_hora_maquina_sem_nf",
      parametro: {
        modalidade: "HORA_MAQUINA_SEM_NF",
        descricao:
          "Produtor habilitado sem NF de comercialização (a partir do 2º pedido)",
        nota: "§2º - Sem NF: valor integral até 40h (1 VR), após 41ª hora 2 VR",
      },
      valorBeneficio: 0,
      limiteBeneficio: {
        faixa_1_ate_horas: 40,
        faixa_1_valor_vr: 1,
        faixa_2_a_partir_horas: 41,
        faixa_2_valor_vr: 2,
        unidade: "horas",
      },
    },
  });
  console.log(
    "  ✅ Regra 7: Hora-Máquina Sem NF (1 VR até 40h, 2 VR após 41ª hora)"
  );

  // REGRA 8: Hora-Máquina - Produtor NÃO habilitado (Art. 4º)
  await prisma.regrasNegocio.create({
    data: {
      programaId: PROGRAMA_ID,
      tipoRegra: "piscicultura_hora_maquina_nao_habilitado",
      parametro: {
        modalidade: "HORA_MAQUINA_NAO_HABILITADO",
        descricao:
          "Produtor não habilitado no programa (Art. 4º)",
        nota: "Não participa do programa mas pode solicitar hora-máquina",
      },
      valorBeneficio: 0,
      limiteBeneficio: {
        faixa_1_ate_horas: 40,
        faixa_1_valor_vr: 1,
        faixa_2_a_partir_horas: 41,
        faixa_2_valor_vr: 2,
        unidade: "horas",
      },
    },
  });
  console.log(
    "  ✅ Regra 8: Hora-Máquina Não Habilitado (Art. 4º - 1 VR até 40h, 2 VR após)"
  );

  // Resumo
  console.log("\n" + "=".repeat(80));
  console.log("RESUMO DA ATUALIZAÇÃO");
  console.log("=".repeat(80));
  console.log(`Programa: Piscicultura Sustentável (ID ${PROGRAMA_ID})`);
  console.log(`Lei: 1879/2025`);
  console.log(`Leis revogadas: 815/2006, 1413/2014, 1587/2018, 1723/2021, 1746/2021`);
  console.log(`Regras criadas: 8`);
  console.log(`  - 1x Alevinos (50% subsídio, máx 10.000/ano)`);
  console.log(`  - 1x Pedra Rachão (300m³ a cada 2 anos)`);
  console.log(`  - 4x Hora-Máquina habilitado (50%/30%/15%/integral)`);
  console.log(`  - 1x Hora-Máquina sem NF (penalidade)`);
  console.log(`  - 1x Hora-Máquina não habilitado (Art. 4º)`);
}

atualizarPiscicultura()
  .then(() => {
    console.log("\n✅ Atualização concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na atualização:", error);
    process.exit(1);
  });
