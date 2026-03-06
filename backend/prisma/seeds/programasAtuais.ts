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
  // 4. AVEIA - Lei 1880/2025 (revoga: 1321/2013, 1563/2017, 1723/2021)
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

  // ============================================================================
  // 12. PISCICULTURA SUSTENTÁVEL - Lei 1879/2025
  // (Revoga: 815/2006, 1413/2014, 1587/2018, 1723/2021, 1746/2021)
  // ============================================================================
  {
    nome: "Piscicultura Sustentável",
    descricao:
      "Programa Municipal de Apoio à Piscicultura Sustentável - fornecimento de alevinos, pedra rachão e hora-máquina",
    leiNumero: "1879/2025",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "alevinos",
    limiteMaximoFamilia: 10000,
    regras: [
      // Art. 3º, I - Alevinos
      {
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
        valorBeneficio: 72.5, // R$ 72,50/milheiro
        limiteBeneficio: {
          quantidade_maxima: 10000,
          limite_por_m2_lamina: 3,
          unidade: "alevinos",
          percentual: 50,
          valor_maximo_por_milheiro: 72.5,
        },
      },
      // Art. 3º, II - Pedra Rachão
      {
        tipoRegra: "piscicultura_pedra",
        parametro: {
          modalidade: "PEDRA_RACHAO",
          descricao: "Pedra rachão para construção de taipa de açude",
          periodicidade: "BIENAL",
          requisitos: [
            "Disponibilidade na pedreira municipal",
            "Novos: contrato com parceiro comercial",
            "Estabelecidos: NF venda últimos 18 meses",
          ],
        },
        valorBeneficio: 0,
        limiteBeneficio: {
          quantidade_maxima: 300,
          unidade: "m3",
          periodicidade_meses: 24,
        },
      },
      // Art. 3º, III, a - Hora-Máquina Faixa 1 (50%)
      {
        tipoRegra: "piscicultura_hora_maquina",
        parametro: {
          modalidade: "HORA_MAQUINA",
          faixa: 1,
          descricao: "50% subsídio (1ª a 10ª hora)",
          hora_inicio: 1,
          hora_fim: 10,
          requisito_segundo_pedido: "NF comercialização pescado",
        },
        valorBeneficio: 0,
        limiteBeneficio: {
          quantidade_maxima: 10,
          unidade: "horas",
          percentual: 50,
        },
      },
      // Art. 3º, III, b - Hora-Máquina Faixa 2 (30%)
      {
        tipoRegra: "piscicultura_hora_maquina",
        parametro: {
          modalidade: "HORA_MAQUINA",
          faixa: 2,
          descricao: "30% subsídio (11ª a 20ª hora)",
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
      // Art. 3º, III, c - Hora-Máquina Faixa 3 (15%)
      {
        tipoRegra: "piscicultura_hora_maquina",
        parametro: {
          modalidade: "HORA_MAQUINA",
          faixa: 3,
          descricao: "15% subsídio (21ª a 30ª hora)",
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
      // Art. 3º, III, d - Hora-Máquina Faixa 4 (integral)
      {
        tipoRegra: "piscicultura_hora_maquina",
        parametro: {
          modalidade: "HORA_MAQUINA",
          faixa: 4,
          descricao: "Valor integral 1 VR/hora (a partir da 31ª hora)",
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
    ],
  },

  // ============================================================================
  // 13. SALA DE ORDENHA - Lei 1104/2010 (Art. 2º)
  // ============================================================================
  {
    nome: "Sala de Ordenha",
    descricao:
      "Incentivos para construção, reforma e ampliação de sala de ordenha - fornecimento de materiais de construção",
    leiNumero: "1104/2010",
    tipoPrograma: TipoPrograma.MATERIAL,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.UNICO,
    unidadeLimite: "reais",
    limiteMaximoFamilia: 3000,
    regras: [
      // Construção nova
      {
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "CONSTRUCAO_NOVA",
          descricao: "Construção nova de sala de ordenha",
          materiais: [
            "Barras de ferro 4.2mm, 0.8mm, 10mm",
            "Cimento", "Cal hidratado",
            "Pedra brita nº 01",
            "Tijolos 6 furos 9x14x24cm",
            "Revestimento cerâmico",
          ],
          requisitos: [
            "Regularidade fiscal junto à Prefeitura",
            "Mín 10 matrizes bovinas OU NF 100L leite/dia últimos 10 meses",
          ],
        },
        valorBeneficio: 3000.0,
        limiteBeneficio: {
          valor_maximo: 3000,
          unidade: "reais",
          quantidade_maxima: 1,
          prazo_aplicacao_meses: 6,
          penalidade_anos: 3,
        },
      },
      // Reforma/ampliação
      {
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "REFORMA_AMPLIACAO",
          descricao: "Reforma ou ampliação de sala de ordenha",
          requisitos: [
            "Regularidade fiscal junto à Prefeitura",
            "Mín 5 matrizes bovinas OU NF 50L leite/dia últimos 10 meses",
          ],
        },
        valorBeneficio: 1500.0,
        limiteBeneficio: {
          valor_maximo: 1500,
          unidade: "reais",
          quantidade_maxima: 1,
          prazo_aplicacao_meses: 6,
          penalidade_anos: 3,
        },
      },
    ],
  },

  // ============================================================================
  // 14. CONSTRUÇÃO DE SILO - Lei 1104/2010 (Art. 3º, alterada Lei 1723/2021)
  // ============================================================================
  {
    nome: "Construção de Silo",
    descricao:
      "Incentivo para construção de silos - fornecimento de materiais e máquinas para abertura de vala",
    leiNumero: "1104/2010 (alterada 1723/2021)",
    tipoPrograma: TipoPrograma.MATERIAL,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.UNICO,
    unidadeLimite: "reais",
    limiteMaximoFamilia: 5000, // 2x R$ 2.500,00 (Lei 1723/2021)
    regras: [
      // Bovinocultor de leite
      {
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "BOVINOCULTOR_LEITE",
          descricao: "Construção de silo para bovinocultor de leite",
          materiais: [
            "Pedra brita nº 01", "Tijolos 6 furos",
            "Cimento", "Barras de ferro",
          ],
          servicos: ["Máquinas para abertura de vala"],
          requisitos: [
            "Regularidade fiscal junto à Prefeitura",
            "Mín 10 matrizes bovinas OU NF 100L leite/dia últimos 10 meses",
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
      // Suinocultor
      {
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "SUINOCULTOR",
          descricao: "Construção de silo para suinocultor",
          requisitos: [
            "Regularidade fiscal junto à Prefeitura",
            "Mínimo 15 matrizes suínas",
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
    ],
  },

  // ============================================================================
  // 15. ORDENHADEIRA E RESFRIADOR - Lei 829/2006 (alterada 1319/2013)
  // ============================================================================
  {
    nome: "Ordenhadeira e Resfriador de Leite",
    descricao:
      "Auxílio financeiro de 50% para aquisição de ordenhadeiras e resfriadores de leite a granel",
    leiNumero: "829/2006 (alterada 1319/2013)",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.UNICO,
    unidadeLimite: "reais",
    limiteMaximoFamilia: 5000, // R$ 2.000 + R$ 3.000
    regras: [
      // Ordenhadeira
      {
        tipoRegra: "equipamento",
        parametro: {
          modalidade: "ORDENHADEIRA",
          descricao: "Subsídio 50% na aquisição de ordenhadeira",
          requisitos: [
            "Regularidade com Nota de Produtor",
            "Adimplente com Tesouro Municipal",
            "NF venda mín 70L leite/dia OU mín 6 vacas leiteiras",
            "NF de compra do equipamento",
            "Não ter sido contemplado anteriormente",
          ],
        },
        valorBeneficio: 2000.0, // R$ 2.000,00 (Lei 1319/2013)
        limiteBeneficio: {
          valor_maximo: 2000,
          unidade: "reais",
          percentual: 50,
          quantidade_maxima: 1,
        },
      },
      // Resfriador de Leite a Granel
      {
        tipoRegra: "equipamento",
        parametro: {
          modalidade: "RESFRIADOR",
          descricao: "Subsídio 50% na aquisição de resfriador de leite a granel",
          requisitos: [
            "Regularidade com Nota de Produtor",
            "Adimplente com Tesouro Municipal",
            "NF venda mín 70L leite/dia OU mín 10 vacas leiteiras",
            "NF de compra do equipamento",
            "Não ter sido contemplado anteriormente",
          ],
        },
        valorBeneficio: 3000.0,
        limiteBeneficio: {
          valor_maximo: 3000,
          unidade: "reais",
          percentual: 50,
          quantidade_maxima: 1,
        },
      },
    ],
  },

  // ============================================================================
  // 16. MELHORIA DE ACESSOS - Lei 1454/2014 (alterada 1726/2021)
  // ============================================================================
  {
    nome: "Melhoria de Acessos às Propriedades",
    descricao:
      "Fornecimento de pedra poliédrica e horas-máquina para melhoria de acessos às propriedades rurais, comerciais, industriais, turísticas e prestadoras de serviços",
    leiNumero: "1454/2014 (alterada 1726/2021)",
    tipoPrograma: TipoPrograma.MATERIAL,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.UNICO,
    unidadeLimite: "m3",
    limiteMaximoFamilia: 200,
    regras: [
      // Pedra Poliédrica
      {
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "PEDRA_POLIEDRICA",
          descricao: "Até 200m³ de pedra poliédrica para pavimentação de acesso",
          requisitos: [
            "Certidão negativa de tributos municipais",
            "Nota de produtor rural OU alvará de funcionamento",
            "Termo de Compromisso de execução",
            "Parecer da Secretaria de Obras (15 dias úteis)",
          ],
          restricoes: [
            "Assentar pedras em até 90 dias após terraplanagem",
            "Se não executar, ressarcir o Município",
          ],
        },
        valorBeneficio: 0,
        limiteBeneficio: {
          quantidade_maxima: 200, // 200m³ (Lei 1726/2021)
          unidade: "m3",
          prazo_execucao_dias: 90,
        },
      },
      // Hora-Máquina
      {
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "HORA_MAQUINA",
          descricao: "Terraplanagem, rolo compactador e deslocamento de terra",
        },
        valorBeneficio: 0,
        limiteBeneficio: {
          unidade: "horas",
        },
      },
    ],
  },

  // ============================================================================
  // 17. MUDAS FRUTÍFERAS - Lei 1663/2019
  // ============================================================================
  {
    nome: "Mudas Frutíferas",
    descricao:
      "Reembolso parcial de até 50% para aquisição de mudas frutíferas por agricultores familiares",
    leiNumero: "1663/2019",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "reais",
    limiteMaximoFamilia: 500,
    regras: [
      {
        tipoRegra: "equipamento",
        parametro: {
          modalidade: "REEMBOLSO_MUDAS",
          descricao: "Reembolso de até 50% na aquisição de mudas frutíferas",
          especies: "Frutíferas sem impedimento legal, viáveis na Região Oeste do PR",
          acompanhamento: "Emater de Pato Bragado",
          requisitos: [
            "Cadastro atualizado na Secretaria de Agricultura",
            "NF venda produtos agropecuários (origem Pato Bragado)",
            "DAP - Declaração de Aptidão ao PRONAF",
            "NF de aquisição das mudas frutíferas",
            "Regularidade tributária municipal",
          ],
          regra_segundo_pedido:
            "A partir do 2º pedido: NF venda frutas >= valor recebido no ano anterior",
        },
        valorBeneficio: 500.0,
        limiteBeneficio: {
          valor_maximo: 500,
          unidade: "reais",
          percentual: 50,
        },
      },
    ],
  },

  // ============================================================================
  // 18. CONSTRUÇÃO DE PISO DE CONCRETO - Lei 1364/2013 (alterada 1793/2022)
  // ============================================================================
  {
    nome: "Construção de Piso de Concreto",
    descricao:
      "Auxílio para construção de piso de concreto - fornecimento de pedra maroada, horas-máquina e reembolso de materiais",
    leiNumero: "1364/2013 (alterada 1793/2022)",
    tipoPrograma: TipoPrograma.MATERIAL,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.UNICO,
    unidadeLimite: "reais",
    limiteMaximoFamilia: 2700,
    regras: [
      // Fornecimento direto
      {
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "FORNECIMENTO_DIRETO",
          descricao: "Pedra maroada e horas-máquina para preparação do terreno",
          itens: [
            "Até 1 carga caminhão caçamba de pedra maroada",
            "Horas-máquina preparação do terreno (sem limite)",
          ],
        },
        valorBeneficio: 0,
        limiteBeneficio: {
          pedra_maroada_cargas: 1,
          horas_maquina: "sem_limite",
        },
      },
      // Reembolso areia + brita (opção 1)
      {
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "REEMBOLSO_AREIA_BRITA",
          descricao: "Reembolso areia e pedra britada (não cumulativo com concreto usinado)",
          itens: [
            "1m³ areia a cada 20m² de piso",
            "1m³ pedra britada a cada 20m² de piso",
          ],
        },
        valorBeneficio: 9.0, // R$ 9,00/m²
        limiteBeneficio: {
          valor_por_m2: 9.0,
          valor_maximo: 2700,
          unidade: "reais",
          prazo_conclusao_dias: 120,
          atualizacao: "IPCA anual via Decreto",
        },
      },
      // Reembolso concreto usinado (opção 2 - alternativa)
      {
        tipoRegra: "valor_fixo",
        parametro: {
          modalidade: "REEMBOLSO_CONCRETO_USINADO",
          descricao: "Reembolso concreto usinado (não cumulativo com areia/brita)",
          itens: ["1m³ concreto usinado a cada 20m² de piso"],
        },
        valorBeneficio: 9.0,
        limiteBeneficio: {
          valor_por_m2: 9.0,
          valor_maximo: 2700,
          unidade: "reais",
          prazo_conclusao_dias: 120,
          atualizacao: "IPCA anual via Decreto",
        },
      },
    ],
  },

  // ============================================================================
  // 19. INCENTIVO À PRODUÇÃO ORGÂNICA - Lei 1670/2019
  // ============================================================================
  {
    nome: "Incentivo à Produção Orgânica",
    descricao:
      "Reembolso para aquisição de produtos e equipamentos voltados à produção agroecológica - tela sombreamento, plástico estufa, irrigação, agro-transformação e cercas",
    leiNumero: "1670/2019",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "reais",
    limiteMaximoFamilia: 2000, // 2 incentivos/ano, maior valor = R$ 1.000 x 2
    regras: [
      // I - Tela de sombreamento
      {
        tipoRegra: "equipamento",
        parametro: {
          modalidade: "TELA_SOMBREAMENTO",
          descricao: "Reembolso para tela de sombreamento (hortas e pomares)",
          requisitos: [
            "Cadastro atualizado na Secretaria de Agricultura",
            "NF venda produção orgânica (origem Pato Bragado)",
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
      // II - Plástico para estufa
      {
        tipoRegra: "equipamento",
        parametro: {
          modalidade: "PLASTICO_ESTUFA",
          descricao: "Reembolso para plástico transparente para estufa (hortaliças e frutas)",
          requisitos: [
            "Cadastro atualizado na Secretaria de Agricultura",
            "NF venda produção orgânica (origem Pato Bragado)",
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
      // III - Equipamentos de irrigação
      {
        tipoRegra: "equipamento",
        parametro: {
          modalidade: "IRRIGACAO",
          descricao: "Reembolso para equipamentos de irrigação (hortas e pomares)",
          requisitos: [
            "Cadastro atualizado na Secretaria de Agricultura",
            "NF venda produção orgânica (origem Pato Bragado)",
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
      // IV - Utensílios/equipamentos agro-transformação
      {
        tipoRegra: "equipamento",
        parametro: {
          modalidade: "AGRO_TRANSFORMACAO",
          descricao: "Reembolso para utensílios e equipamentos de agro-transformação de alimentos",
          requisitos: [
            "Cadastro atualizado na Secretaria de Agricultura",
            "NF venda produção orgânica (origem Pato Bragado)",
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
      // V - Cercas para hortas e pomares
      {
        tipoRegra: "equipamento",
        parametro: {
          modalidade: "CERCAS",
          descricao: "Reembolso para construção de cercas (hortas e pomares)",
          requisitos: [
            "Cadastro atualizado na Secretaria de Agricultura",
            "NF venda produção orgânica (origem Pato Bragado)",
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
    ],
  },

  // ============================================================================
  // 20. DESCOMPACTAÇÃO DE SOLOS (PÉ DE PATO) - Lei abril/2003
  // Revoga Lei 446/1999
  // ============================================================================
  {
    nome: "Descompactação de Solos (Pé de Pato)",
    descricao:
      "Programa de Descompactação de Solos - serviços de trator traçado com subsolador para romper camada de compactação do solo, aumentando infiltração e evitando erosões",
    leiNumero: "2003 (revoga 446/1999)",
    tipoPrograma: TipoPrograma.SERVICO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "horas",
    limiteMaximoFamilia: 4,
    regras: [
      {
        tipoRegra: "hora_maquina",
        parametro: {
          modalidade: "TRATOR_SUBSOLADOR",
          descricao: "Até 4 horas de trator traçado com subsolador por família/ano",
          equipamento: "Trator traçado com subsolador",
          requisitos: [
            "Conservação de solo adequada",
            "Tríplice lavagem embalagens agrotóxicos + local apropriado",
            "NF venda produtos agropecuários (origem Pato Bragado)",
            "Cadastro atualizado na Secretaria de Agricultura",
            "Adimplente com tributos municipais",
            "Vacinação rebanho bovino contra febre aftosa em dia",
          ],
          penalidade: "Perda do direito a incentivos por 2 anos + possível ressarcimento",
        },
        valorBeneficio: 0,
        limiteBeneficio: {
          quantidade_maxima: 4,
          unidade: "horas",
          periodicidade: "ANUAL",
        },
      },
    ],
  },

  // ============================================================================
  // 21. ATENDIMENTO VETERINÁRIO - Lei 1414/2014 (altera Lei 1182/2011)
  // Acrescenta Art. 2º-A à Lei 1182
  // ============================================================================
  {
    nome: "Atendimento Veterinário",
    descricao:
      "Assistência veterinária aos produtores do Programa de Fomento à Bovinocultura de Leite - município subsidia 70% do valor do procedimento",
    leiNumero: "1414/2014 (altera 1182/2011)",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    secretaria: TipoPerfil.AGRICULTURA,
    periodicidade: Periodicidade.ANUAL,
    unidadeLimite: "procedimentos",
    regras: [
      // Atendimento por servidores municipais
      {
        tipoRegra: "atendimento_veterinario",
        parametro: {
          modalidade: "SERVIDOR_MUNICIPAL",
          descricao: "Assistência veterinária por servidores municipais",
          custo_produtor: 0,
          requisitos: [
            "Participante do Programa de Fomento à Bovinocultura de Leite",
            "Disponibilidade de servidores",
          ],
        },
        valorBeneficio: 0,
        limiteBeneficio: {
          unidade: "procedimentos",
          percentual: 100,
        },
      },
      // Atendimento por empresa contratada (70% subsídio)
      {
        tipoRegra: "atendimento_veterinario",
        parametro: {
          modalidade: "EMPRESA_CONTRATADA",
          descricao: "Assistência veterinária por empresa contratada - 70% subsidiado",
          percentual_municipio: 70,
          percentual_produtor: 30,
          requisitos: [
            "Participante do Programa de Fomento à Bovinocultura de Leite",
            "Disponibilidade orçamentária e financeira",
          ],
        },
        valorBeneficio: 0,
        limiteBeneficio: {
          unidade: "procedimentos",
          percentual: 70,
          custo_produtor_percentual: 30,
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
