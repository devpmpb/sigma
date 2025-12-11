// backend/prisma/seeds/programasAtuais.ts
// Seed dos programas atualizados conforme leis municipais de Pato Bragado
// Executar com: npx ts-node prisma/seeds/programasAtuais.ts

import {
  PrismaClient,
  TipoPrograma,
  TipoPerfil,
  Periodicidade,
} from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// DEFINIÇÃO DOS PROGRAMAS
// ============================================================================

interface RegraPrograma {
  tipoRegra: string;
  parametro: Record<string, any>;
  valorBeneficio: number;
  limiteBeneficio?: Record<string, any>;
}

interface ProgramaCompleto {
  nome: string;
  descricao: string;
  leiNumero: string;
  tipoPrograma: TipoPrograma;
  secretaria: TipoPerfil;
  periodicidade: Periodicidade;
  unidadeLimite: string;
  limiteMaximoFamilia?: number;
  regras: RegraPrograma[];
}

const PROGRAMAS: ProgramaCompleto[] = [
  // ============================================================================
  // 1. ESTERCO LÍQUIDO - Lei 1611/2018 (alterada 1746/2021, 1687/2020)
  // ============================================================================
  {
    nome: "Adubação Orgânica Líquida (Esterco)",
    descricao:
      "Subsídio para aquisição, distribuição e aspergimento de adubo orgânico líquido",
    leiNumero: "1611/2018",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "tanques",
    limiteMaximoFamilia: 25, // Máximo para produtor leite/corte
    regras: [
      // Regra para pequeno produtor (até 6 alqueires)
      {
        tipoRegra: "area_efetiva",
        parametro: {
          area_maxima: 6,
          enquadramento: "PEQUENO",
          tipo_produtor: "GERAL",
        },
        valorBeneficio: 32.5, // 50% da carga, máx R$ 32,50
        limiteBeneficio: {
          quantidade_maxima: 12, // 12 tanques/ano (Lei 1687/2020)
          unidade: "tanques",
          carga_minima_litros: 15000,
          percentual: 50,
        },
      },
      // Regra para grande produtor (6,01 a 18 alqueires)
      {
        tipoRegra: "area_efetiva",
        parametro: {
          area_minima: 6.01,
          area_maxima: 18,
          enquadramento: "GRANDE",
          tipo_produtor: "GERAL",
        },
        valorBeneficio: 13.0, // 50% da carga, máx R$ 13,00
        limiteBeneficio: {
          quantidade_maxima: 12,
          unidade: "tanques",
          carga_minima_litros: 15000,
          percentual: 50,
        },
      },
      // Regra para produtor de LEITE (pequeno)
      {
        tipoRegra: "area_efetiva",
        parametro: {
          area_maxima: 6,
          enquadramento: "PEQUENO",
          tipo_produtor: "LEITE",
          requisito: "NF venda leite 3 meses anteriores",
        },
        valorBeneficio: 32.5,
        limiteBeneficio: {
          quantidade_maxima: 25, // 25 tanques/ano para leite/corte
          unidade: "tanques",
          carga_minima_litros: 15000,
          percentual: 50,
        },
      },
      // Regra para produtor de LEITE (grande)
      {
        tipoRegra: "area_efetiva",
        parametro: {
          area_minima: 6.01,
          area_maxima: 18,
          enquadramento: "GRANDE",
          tipo_produtor: "LEITE",
          requisito: "NF venda leite 3 meses anteriores",
        },
        valorBeneficio: 13.0,
        limiteBeneficio: {
          quantidade_maxima: 25,
          unidade: "tanques",
          carga_minima_litros: 15000,
          percentual: 50,
        },
      },
    ],
  },

  // ============================================================================
  // 2. CALCÁRIO - Lei 798/2006 (alterada 1587/2018)
  // ============================================================================
  {
    nome: "Correção de Solos (Calcário) - PRÓSOLOS",
    descricao: "Subsídio para aquisição de calcário para correção de solo",
    leiNumero: "798/2006",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.TRIENAL, // A cada 3 anos!
    unidadeLimite: "toneladas",
    limiteMaximoFamilia: 50,
    regras: [
      // Pequeno produtor (até 4 alqueires)
      {
        tipoRegra: "area_efetiva",
        parametro: {
          area_maxima: 4,
          enquadramento: "PEQUENO",
          requisito: "Análise de solo obrigatória",
        },
        valorBeneficio: 105.0, // R$ 105/tonelada
        limiteBeneficio: {
          quantidade_maxima_por_alqueire: 5, // 5 ton/alqueire
          unidade: "toneladas",
          multiplicador_area: true,
        },
      },
      // Grande produtor (acima de 4 alqueires)
      {
        tipoRegra: "area_efetiva",
        parametro: {
          area_minima: 4.01,
          enquadramento: "GRANDE",
          requisito: "Análise de solo obrigatória",
        },
        valorBeneficio: 65.0, // R$ 65/tonelada
        limiteBeneficio: {
          quantidade_maxima_por_alqueire: 5,
          quantidade_maxima_absoluta: 50, // Máx 50 toneladas total
          unidade: "toneladas",
          multiplicador_area: true,
        },
      },
    ],
  },

  // ============================================================================
  // 3. ADUBO ORGÂNICO SÓLIDO - Lei 797/2006 (alterada 1563/2017)
  // ============================================================================
  {
    nome: "Adubo Orgânico Sólido (Pró-Orgânico)",
    descricao:
      "Incentivo ao uso de adubo orgânico para melhorar fertilidade do solo",
    leiNumero: "797/2006",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.BIENAL, // A cada 2 anos!
    unidadeLimite: "toneladas",
    limiteMaximoFamilia: 10,
    regras: [
      {
        tipoRegra: "area_efetiva",
        parametro: {
          area_maxima: 6,
          enquadramento: "PEQUENO",
          requisito: "Renda familiar 80% agropecuária",
        },
        valorBeneficio: 70.0, // R$ 70/tonelada
        limiteBeneficio: {
          quantidade_maxima: 10, // 10 toneladas/família
          unidade: "toneladas",
        },
      },
      {
        tipoRegra: "area_efetiva",
        parametro: {
          area_minima: 6.01,
          enquadramento: "GRANDE",
          requisito: "Renda familiar 80% agropecuária",
        },
        valorBeneficio: 50.0, // R$ 50/tonelada (50% da NF)
        limiteBeneficio: {
          quantidade_maxima: 10,
          unidade: "toneladas",
          percentual: 50,
        },
      },
    ],
  },

  // ============================================================================
  // 4. AVEIA - Lei 1880/2025 (nova, revoga 1321/2013)
  // ============================================================================
  {
    nome: "Cobertura do Solo - Aveia",
    descricao:
      "Subsídio para aquisição de aveia para cobertura e recuperação do solo",
    leiNumero: "1880/2025",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "kg",
    limiteMaximoFamilia: 450,
    regras: [
      {
        tipoRegra: "area_efetiva",
        parametro: {
          enquadramento: "UNICO", // Valor único, sem distinção por área
          exclusivo_tipo: "AVEIA", // Só pode escolher 1 tipo por ano
          nota_fiscal: "Comércio local obrigatório",
        },
        valorBeneficio: 2.95, // R$ 2,95/kg
        limiteBeneficio: {
          quantidade_maxima_por_alqueire: 150, // 150 kg/alqueire
          quantidade_maxima_absoluta: 450, // 450 kg/família
          unidade: "kg",
          multiplicador_area: true,
        },
      },
    ],
  },

  // ============================================================================
  // 5. NABO - Lei 1880/2025
  // ============================================================================
  {
    nome: "Cobertura do Solo - Nabo",
    descricao:
      "Subsídio para aquisição de nabo para cobertura e recuperação do solo",
    leiNumero: "1880/2025",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "kg",
    limiteMaximoFamilia: 100,
    regras: [
      {
        tipoRegra: "area_efetiva",
        parametro: {
          enquadramento: "UNICO",
          exclusivo_tipo: "NABO",
        },
        valorBeneficio: 2.95, // R$ 2,95/kg
        limiteBeneficio: {
          quantidade_maxima_por_alqueire: 30, // 30 kg/alqueire
          quantidade_maxima_absoluta: 100, // 100 kg/família
          unidade: "kg",
          multiplicador_area: true,
        },
      },
    ],
  },

  // ============================================================================
  // 6. BRAQUIÁRIA - Lei 1880/2025
  // ============================================================================
  {
    nome: "Cobertura do Solo - Braquiária",
    descricao:
      "Subsídio para aquisição de braquiária para cobertura e recuperação do solo",
    leiNumero: "1880/2025",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "kg",
    limiteMaximoFamilia: 100,
    regras: [
      {
        tipoRegra: "area_efetiva",
        parametro: {
          enquadramento: "UNICO",
          exclusivo_tipo: "BRAQUIARIA",
        },
        valorBeneficio: 9.75, // R$ 9,75/kg
        limiteBeneficio: {
          quantidade_maxima_por_alqueire: 12, // 12 kg/alqueire
          quantidade_maxima_absoluta: 100, // 100 kg/família
          unidade: "kg",
          multiplicador_area: true,
        },
      },
    ],
  },

  // ============================================================================
  // 7. INSEMINAÇÃO BOVINOS LEITE - Lei 1182/2011 (alterada várias vezes)
  // ============================================================================
  {
    nome: "Inseminação Artificial - Bovinos Leite",
    descricao:
      "Fomento à bovinocultura de leite através de inseminação artificial",
    leiNumero: "1182/2011",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "doses",
    regras: [
      // Modalidade 1: Município fornece sêmen + aplicação subsidiada
      {
        tipoRegra: "inseminacao",
        parametro: {
          modalidade: "APLICACAO_SUBSIDIADA",
          descricao: "Município fornece sêmen, aplicação 70% subsidiada",
          requisito: "Exames brucelose/tuberculose",
        },
        valorBeneficio: 40.6, // Reembolso máx da aplicação
        limiteBeneficio: {
          quantidade_por_animal: 1, // 1 dose/animal/ano
          taxa_repeticao: 30, // +30% dos animais
          unidade: "doses",
          percentual_subsidio: 70,
        },
      },
      // Modalidade 2: Produtor retira sêmen (capacitado)
      {
        tipoRegra: "inseminacao",
        parametro: {
          modalidade: "RETIRADA_SEMEN",
          descricao: "Produtor capacitado retira sêmen, aplica por conta",
          requisito: "Certificado técnico + tanque refrigeração + curso manejo",
        },
        valorBeneficio: 0, // Sêmen é gratuito
        limiteBeneficio: {
          quantidade_por_animal: 1,
          taxa_repeticao: 30,
          unidade: "doses",
        },
      },
    ],
  },

  // ============================================================================
  // 8. ULTRASSOM - Lei 1648/2019 (Art. 2º-B da 1182)
  // ============================================================================
  {
    nome: "Ultrassom Bovinos Leite",
    descricao: "Subsídio para exames de ultrassom em bovinos leiteiros",
    leiNumero: "1648/2019",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "exames",
    limiteMaximoFamilia: 100,
    regras: [
      {
        tipoRegra: "ultrassom",
        parametro: {
          requisito: "NF venda leite últimos 6 meses",
        },
        valorBeneficio: 5.0, // Máx R$ 5,00/exame
        limiteBeneficio: {
          quantidade_por_animal: 2, // Até 2 exames/animal/ano
          quantidade_maxima: 100, // 100 exames/produtor/ano
          unidade: "exames",
          percentual: 50,
        },
      },
    ],
  },

  // ============================================================================
  // 9. SÊMEN SEXADO - Lei 1671/2019 (Art. 2º-C da 1182)
  // ============================================================================
  {
    nome: "Sêmen Sexado Bovinos Leite",
    descricao: "Reembolso para aquisição de sêmen bovino sexado",
    leiNumero: "1671/2019",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "doses",
    limiteMaximoFamilia: 5,
    regras: [
      // Até 25 vacas
      {
        tipoRegra: "semen_sexado",
        parametro: {
          quantidade_vacas_max: 25,
          enquadramento: "PEQUENO",
        },
        valorBeneficio: 100.0, // R$ 100/dose
        limiteBeneficio: {
          quantidade_maxima: 5,
          unidade: "doses",
        },
      },
      // 26-49 vacas
      {
        tipoRegra: "semen_sexado",
        parametro: {
          quantidade_vacas_min: 26,
          quantidade_vacas_max: 49,
          enquadramento: "MEDIO",
        },
        valorBeneficio: 75.0, // R$ 75/dose
        limiteBeneficio: {
          quantidade_maxima: 5,
          unidade: "doses",
        },
      },
      // 50+ vacas
      {
        tipoRegra: "semen_sexado",
        parametro: {
          quantidade_vacas_min: 50,
          enquadramento: "GRANDE",
        },
        valorBeneficio: 50.0, // R$ 50/dose
        limiteBeneficio: {
          quantidade_maxima: 5,
          unidade: "doses",
        },
      },
    ],
  },

  // ============================================================================
  // 10. SÊMEN SUÍNOS - Lei 1182/2011 Art. 3º (alterada 1723/2021)
  // ============================================================================
  {
    nome: "Melhoria Genética Suínos",
    descricao: "Reembolso para aquisição de sêmen suíno",
    leiNumero: "1182/2011",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "matrizes",
    regras: [
      {
        tipoRegra: "semen_suino",
        parametro: {
          requisito: "Relatório ADAPAR com quantidade de matrizes",
        },
        valorBeneficio: 34.0, // R$ 34/matriz/ano (Lei 1723/2021)
        limiteBeneficio: {
          por_matriz: true,
          unidade: "matrizes",
        },
      },
    ],
  },

  // ============================================================================
  // 11. SÊMEN BOVINO CORTE - Lei 1672/2019
  // ============================================================================
  {
    nome: "Sêmen Bovino de Corte",
    descricao: "Fomento à bovinocultura de corte através de melhoria genética",
    leiNumero: "1672/2019",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "doses",
    limiteMaximoFamilia: 50,
    regras: [
      // Bovinocultor de corte
      {
        tipoRegra: "semen_corte",
        parametro: {
          tipo_produtor: "CORTE",
          requisito_segundo_pedido: "NF venda gado de corte",
        },
        valorBeneficio: 20.0, // R$ 20/dose
        limiteBeneficio: {
          quantidade_por_animal: 1,
          quantidade_maxima: 50, // Até 50 animais
          unidade: "doses",
        },
      },
      // Bovinocultor de leite (pode pegar para melhorar rebanho)
      {
        tipoRegra: "semen_corte",
        parametro: {
          tipo_produtor: "LEITE",
          requisito_segundo_pedido: "NF venda gado de corte",
        },
        valorBeneficio: 20.0,
        limiteBeneficio: {
          quantidade_por_animal: 1,
          percentual_animais: 30, // Até 30% dos animais
          unidade: "doses",
        },
      },
    ],
  },
];

// ============================================================================
// FUNÇÃO PRINCIPAL DE SEED
// ============================================================================

async function seedProgramas() {
  console.log("🌱 Iniciando seed de programas atuais...\n");

  let programasCriados = 0;
  let regrasCriadas = 0;

  for (const prog of PROGRAMAS) {
    try {
      // Verificar se já existe programa com mesmo nome
      const existente = await prisma.programa.findFirst({
        where: { nome: prog.nome },
      });

      if (existente) {
        console.log(
          `⚠️  Programa "${prog.nome}" já existe (ID: ${existente.id}). Pulando...`
        );
        continue;
      }

      // Criar programa
      const programa = await prisma.programa.create({
        data: {
          nome: prog.nome,
          descricao: prog.descricao,
          leiNumero: prog.leiNumero,
          tipoPrograma: prog.tipoPrograma,
          secretaria: prog.secretaria,
          periodicidade: prog.periodicidade,
          unidadeLimite: prog.unidadeLimite,
          limiteMaximoFamilia: prog.limiteMaximoFamilia,
          ativo: true,
        },
      });

      console.log(`✅ Programa criado: ${prog.nome} (ID: ${programa.id})`);
      programasCriados++;

      // Criar regras do programa
      for (const regra of prog.regras) {
        await prisma.regrasNegocio.create({
          data: {
            programaId: programa.id,
            tipoRegra: regra.tipoRegra,
            parametro: regra.parametro,
            valorBeneficio: regra.valorBeneficio,
            limiteBeneficio: regra.limiteBeneficio ?? undefined,
          },
        });
        regrasCriadas++;
      }

      console.log(`   └─ ${prog.regras.length} regra(s) criada(s)\n`);
    } catch (error) {
      console.error(`❌ Erro ao criar programa "${prog.nome}":`, error);
    }
  }

  console.log("========================================");
  console.log(`📊 RESUMO:`);
  console.log(`   Programas criados: ${programasCriados}`);
  console.log(`   Regras criadas: ${regrasCriadas}`);
  console.log("========================================");
}

// Executar
seedProgramas()
  .then(() => {
    console.log("✅ Seed concluído!");
  })
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
