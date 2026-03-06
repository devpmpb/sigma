/**
 * Criacao dos 3 programas faltantes:
 *
 * 1. Piscicultura Sustentavel - PL 014/2025 (Lei 1879/2025)
 *    - Alevinos (subsidio 50%, max R$ 72,50/milheiro, max 10.000/ano)
 *    - Pedra rachao para taipa de acude (300m3 a cada 2 anos)
 *    - Hora-maquina escalonada (50%/30%/15%/integral)
 *
 * 2. Descompactacao de Solos (Pe de Pato) - Lei de abril/2003
 *    - 4 horas trator tracado com subsolador por familia/ano
 *
 * 3. Atendimento Veterinario - Lei 1414/2014 (altera Lei 1182/2011)
 *    - Assistencia veterinaria com 70% subsidio municipal
 *
 * Executar com: npx tsx scripts/criar-programas-faltantes.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function criarProgramas() {
  console.log("=".repeat(80));
  console.log("CRIACAO DOS 3 PROGRAMAS FALTANTES");
  console.log("=".repeat(80));

  let programasCriados = 0;
  let regrasCriadas = 0;

  // ============================================================================
  // 1. PISCICULTURA SUSTENTAVEL - PL 014/2025 (Lei 1879/2025)
  // Revoga: 815/2006, 1413/2014, 1587/2018, 1723/2021, 1746/2021
  // ============================================================================
  {
    const nome = "Piscicultura Sustentavel";
    let programa = await prisma.programa.findFirst({
      where: { nome: { contains: "Piscicultura", mode: "insensitive" } },
    });

    if (programa) {
      console.log(`\n>> Programa "${programa.nome}" ja existe (ID: ${programa.id}). Pulando...`);
    } else {
      programa = await prisma.programa.create({
        data: {
          nome,
          descricao:
            "Programa Municipal de Apoio a Piscicultura Sustentavel - fornecimento de alevinos, pedra rachao para taipa de acude e hora-maquina subsidiada",
          leiNumero: "1879/2025",
          tipoPrograma: "SUBSIDIO",
          secretaria: "AGRICULTURA",
          periodicidade: "ANUAL",
          unidadeLimite: "alevinos",
          limiteMaximoFamilia: 10000,
          ativo: true,
        },
      });
      console.log(`\n>> Programa criado: ${nome} (ID: ${programa.id})`);
      programasCriados++;

      // Remover regras existentes para recriar
      await prisma.regrasNegocio.deleteMany({ where: { programaId: programa.id } });

      // Regra 1: Alevinos (Art. 3, I)
      await prisma.regrasNegocio.create({
        data: {
          programaId: programa.id,
          tipoRegra: "piscicultura_alevinos",
          parametro: {
            modalidade: "ALEVINOS",
            descricao: "Fornecimento de alevinos com subsidio de 50%",
            limite_por_m2: 3,
            requisitos: [
              "Licenca ambiental valida",
              "Outorga de uso da agua",
              "Cadastro na Secretaria de Agricultura",
              "Adimplente com tributos municipais",
              "NF de compra dos alevinos",
            ],
          },
          valorBeneficio: 72.5,
          limiteBeneficio: {
            quantidade_maxima: 10000,
            limite_por_m2_lamina: 3,
            unidade: "alevinos",
            percentual: 50,
            valor_maximo_por_milheiro: 72.5,
          },
        },
      });
      regrasCriadas++;
      console.log("   Regra: Alevinos (50%, max R$ 72,50/milheiro, max 10.000/ano)");

      // Regra 2: Pedra Rachao para Acude (Art. 3, II)
      await prisma.regrasNegocio.create({
        data: {
          programaId: programa.id,
          tipoRegra: "piscicultura_pedra",
          parametro: {
            modalidade: "PEDRA_RACHAO",
            descricao: "Pedra rachao para construcao de taipa de acude",
            periodicidade: "BIENAL",
            requisitos: [
              "Disponibilidade na pedreira municipal",
              "Novos: contrato com parceiro comercial",
              "Estabelecidos: NF venda ultimos 18 meses",
            ],
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            quantidade_maxima: 300,
            unidade: "m3",
            periodicidade_meses: 24,
          },
        },
      });
      regrasCriadas++;
      console.log("   Regra: Pedra Rachao (300m3 a cada 2 anos)");

      // Regra 3: Hora-Maquina Faixa 1 - 50% (Art. 3, III, a)
      await prisma.regrasNegocio.create({
        data: {
          programaId: programa.id,
          tipoRegra: "piscicultura_hora_maquina",
          parametro: {
            modalidade: "HORA_MAQUINA",
            faixa: 1,
            descricao: "50% subsidio (1a a 10a hora)",
            hora_inicio: 1,
            hora_fim: 10,
            requisito_segundo_pedido: "NF comercializacao pescado",
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            quantidade_maxima: 10,
            unidade: "horas",
            percentual: 50,
          },
        },
      });
      regrasCriadas++;
      console.log("   Regra: Hora-Maquina Faixa 1 (50%, 1a-10a hora)");

      // Regra 4: Hora-Maquina Faixa 2 - 30% (Art. 3, III, b)
      await prisma.regrasNegocio.create({
        data: {
          programaId: programa.id,
          tipoRegra: "piscicultura_hora_maquina",
          parametro: {
            modalidade: "HORA_MAQUINA",
            faixa: 2,
            descricao: "30% subsidio (11a a 20a hora)",
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
      regrasCriadas++;
      console.log("   Regra: Hora-Maquina Faixa 2 (30%, 11a-20a hora)");

      // Regra 5: Hora-Maquina Faixa 3 - 15% (Art. 3, III, c)
      await prisma.regrasNegocio.create({
        data: {
          programaId: programa.id,
          tipoRegra: "piscicultura_hora_maquina",
          parametro: {
            modalidade: "HORA_MAQUINA",
            faixa: 3,
            descricao: "15% subsidio (21a a 30a hora)",
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
      regrasCriadas++;
      console.log("   Regra: Hora-Maquina Faixa 3 (15%, 21a-30a hora)");

      // Regra 6: Hora-Maquina Faixa 4 - integral (Art. 3, III, d)
      await prisma.regrasNegocio.create({
        data: {
          programaId: programa.id,
          tipoRegra: "piscicultura_hora_maquina",
          parametro: {
            modalidade: "HORA_MAQUINA",
            faixa: 4,
            descricao: "Valor integral 1 VR/hora (a partir da 31a hora)",
            hora_inicio: 31,
            hora_fim: null,
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            unidade: "horas",
            percentual: 0,
            valor_por_hora_vr: 1,
          },
        },
      });
      regrasCriadas++;
      console.log("   Regra: Hora-Maquina Faixa 4 (integral, 31a+ hora)");
    }
  }

  // ============================================================================
  // 2. DESCOMPACTACAO DE SOLOS (PE DE PATO) - Lei abril/2003
  // Revoga Lei 446/1999
  // ============================================================================
  {
    const nome = "Descompactacao de Solos (Pe de Pato)";
    let programa = await prisma.programa.findFirst({
      where: {
        OR: [
          { nome: { contains: "Descompactacao", mode: "insensitive" } },
          { nome: { contains: "Pe de Pato", mode: "insensitive" } },
        ],
      },
    });

    if (programa) {
      console.log(`\n>> Programa "${programa.nome}" ja existe (ID: ${programa.id}). Pulando...`);
    } else {
      programa = await prisma.programa.create({
        data: {
          nome,
          descricao:
            "Programa de Descompactacao de Solos - servicos de trator tracado com subsolador para romper camada de compactacao do solo, aumentando infiltracao e evitando erosoes",
          leiNumero: "2003 (revoga 446/1999)",
          tipoPrograma: "SERVICO",
          secretaria: "AGRICULTURA",
          periodicidade: "ANUAL",
          unidadeLimite: "horas",
          limiteMaximoFamilia: 4,
          ativo: true,
        },
      });
      console.log(`\n>> Programa criado: ${nome} (ID: ${programa.id})`);
      programasCriados++;

      await prisma.regrasNegocio.create({
        data: {
          programaId: programa.id,
          tipoRegra: "hora_maquina",
          parametro: {
            modalidade: "TRATOR_SUBSOLADOR",
            descricao: "Ate 4 horas de trator tracado com subsolador por familia/ano",
            equipamento: "Trator tracado com subsolador",
            requisitos: [
              "Conservacao de solo adequada",
              "Triplice lavagem embalagens agrotoxicos + local apropriado",
              "NF venda produtos agropecuarios (origem Pato Bragado)",
              "Cadastro atualizado na Secretaria de Agricultura",
              "Adimplente com tributos municipais",
              "Vacinacao rebanho bovino contra febre aftosa em dia",
            ],
            penalidade: "Perda do direito a incentivos por 2 anos + possivel ressarcimento",
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            quantidade_maxima: 4,
            unidade: "horas",
            periodicidade: "ANUAL",
          },
        },
      });
      regrasCriadas++;
      console.log("   Regra: 4 horas trator tracado com subsolador/familia/ano");
    }
  }

  // ============================================================================
  // 3. ATENDIMENTO VETERINARIO - Lei 1414/2014 (altera Lei 1182/2011)
  // Acrescenta Art. 2-A a Lei 1182
  // ============================================================================
  {
    const nome = "Atendimento Veterinario";
    let programa = await prisma.programa.findFirst({
      where: {
        OR: [
          { nome: { contains: "Veterinario", mode: "insensitive" } },
          { nome: { contains: "Veterinaria", mode: "insensitive" } },
        ],
      },
    });

    if (programa) {
      console.log(`\n>> Programa "${programa.nome}" ja existe (ID: ${programa.id}). Pulando...`);
    } else {
      programa = await prisma.programa.create({
        data: {
          nome,
          descricao:
            "Assistencia veterinaria aos produtores do Programa de Fomento a Bovinocultura de Leite - municipio subsidia 70% do valor do procedimento",
          leiNumero: "1414/2014 (altera 1182/2011)",
          tipoPrograma: "SUBSIDIO",
          secretaria: "AGRICULTURA",
          periodicidade: "ANUAL",
          unidadeLimite: "procedimentos",
          ativo: true,
        },
      });
      console.log(`\n>> Programa criado: ${nome} (ID: ${programa.id})`);
      programasCriados++;

      // Regra 1: Atendimento por servidores municipais (gratuito)
      await prisma.regrasNegocio.create({
        data: {
          programaId: programa.id,
          tipoRegra: "atendimento_veterinario",
          parametro: {
            modalidade: "SERVIDOR_MUNICIPAL",
            descricao: "Assistencia veterinaria por servidores municipais",
            custo_produtor: 0,
            requisitos: [
              "Participante do Programa de Fomento a Bovinocultura de Leite",
              "Disponibilidade de servidores",
            ],
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            unidade: "procedimentos",
            percentual: 100,
          },
        },
      });
      regrasCriadas++;
      console.log("   Regra: Atendimento por servidores municipais (gratuito)");

      // Regra 2: Atendimento por empresa contratada (70% subsidio)
      await prisma.regrasNegocio.create({
        data: {
          programaId: programa.id,
          tipoRegra: "atendimento_veterinario",
          parametro: {
            modalidade: "EMPRESA_CONTRATADA",
            descricao: "Assistencia veterinaria por empresa contratada - 70% subsidiado",
            percentual_municipio: 70,
            percentual_produtor: 30,
            requisitos: [
              "Participante do Programa de Fomento a Bovinocultura de Leite",
              "Disponibilidade orcamentaria e financeira",
            ],
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            unidade: "procedimentos",
            percentual: 70,
            custo_produtor_percentual: 30,
          },
        },
      });
      regrasCriadas++;
      console.log("   Regra: Empresa contratada (municipio 70%, produtor 30%)");
    }
  }

  // ============================================================================
  // RESUMO
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("RESUMO");
  console.log("=".repeat(80));
  console.log(`Programas criados: ${programasCriados}`);
  console.log(`Regras criadas: ${regrasCriadas}`);

  // Listar todos os programas ativos
  const total = await prisma.programa.count({ where: { ativo: true } });
  console.log(`\nTotal de programas ativos no banco: ${total}`);
}

criarProgramas()
  .then(() => {
    console.log("\nCriacao concluida!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro na criacao:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
