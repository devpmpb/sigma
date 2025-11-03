// backend/prisma/seeds/programasLegaisCompleto.ts
// SEED COMPLETO - TODOS OS 24 PROGRAMAS LEGAIS DO MUNICÍPIO DE PATO BRAGADO
// Baseado na análise completa de 23 documentos legais (PDFs + JPG)
// Arquivo gerado em: 2025-10-27

import { PrismaClient, TipoPrograma, TipoPerfil } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedProgramasLegais() {
  console.log("🌱 Iniciando cadastro COMPLETO dos programas legais municipais...");
  console.log("📋 Total de programas a cadastrar: 24 programas ativos");

  try {
    // ==================================================
    // CRIAR PRODUTORES DE EXEMPLO
    // ==================================================
    console.log("\n👨‍🌾 Criando produtores de exemplo...");

    // Produtor 1: Pequeno produtor (≤ 6 alqueires)
    const produtor1 = await prisma.pessoa.upsert({
      where: { cpfCnpj: "123.456.789-01" },
      update: {},
      create: {
        nome: "João da Silva",
        cpfCnpj: "123.456.789-01",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4321",
        email: "joao.silva@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-001-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "12.345.678-9",
            dataNascimento: new Date("1975-05-15")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nome: "Sítio Boa Vista",
        tipoPropriedade: "RURAL",
        areaTotal: 4.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha São Francisco",
        atividadeProdutiva: "AGRICULTURA",
        proprietarioId: produtor1.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtor1.id },
      update: {},
      create: {
        id: produtor1.id,
        anoReferencia: 2024,
        areaPropria: 4.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 4.0
      }
    });

    // Produtor 2: Médio produtor (> 6 alqueires)
    const produtor2 = await prisma.pessoa.upsert({
      where: { cpfCnpj: "234.567.890-12" },
      update: {},
      create: {
        nome: "Maria Oliveira",
        cpfCnpj: "234.567.890-12",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4322",
        email: "maria.oliveira@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-002-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "23.456.789-0",
            dataNascimento: new Date("1980-08-20")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 2 },
      update: {},
      create: {
        nome: "Fazenda Santa Helena",
        tipoPropriedade: "RURAL",
        areaTotal: 10.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha Santa Rita",
        atividadeProdutiva: "AGRICULTURA_PECUARIA",
        proprietarioId: produtor2.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtor2.id },
      update: {},
      create: {
        id: produtor2.id,
        anoReferencia: 2024,
        areaPropria: 10.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 10.0
      }
    });

    // Produtor 3: Com arrendamento
    const produtor3 = await prisma.pessoa.upsert({
      where: { cpfCnpj: "345.678.901-23" },
      update: {},
      create: {
        nome: "Carlos Santos",
        cpfCnpj: "345.678.901-23",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4323",
        email: "carlos.santos@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-003-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "34.567.890-1",
            dataNascimento: new Date("1985-03-10")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 3 },
      update: {},
      create: {
        nome: "Chácara Recanto Verde",
        tipoPropriedade: "RURAL",
        areaTotal: 3.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Estrada do Açude",
        atividadeProdutiva: "HORTIFRUTI",
        proprietarioId: produtor3.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtor3.id },
      update: {},
      create: {
        id: produtor3.id,
        anoReferencia: 2024,
        areaPropria: 3.0,
        areaArrendadaRecebida: 4.0,
        areaArrendadaCedida: 0,
        areaEfetiva: 7.0
      }
    });

    // Produtor 4: Produtor de leite
    const produtor4 = await prisma.pessoa.upsert({
      where: { cpfCnpj: "456.789.012-34" },
      update: {},
      create: {
        nome: "Pedro Ferreira",
        cpfCnpj: "456.789.012-34",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4324",
        email: "pedro.ferreira@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-004-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "45.678.901-2",
            dataNascimento: new Date("1970-11-25")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 4 },
      update: {},
      create: {
        nome: "Granja Leiteira Ferreira",
        tipoPropriedade: "RURAL",
        areaTotal: 8.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha dos Alemães",
        atividadeProdutiva: "PECUARIA",
        proprietarioId: produtor4.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtor4.id },
      update: {},
      create: {
        id: produtor4.id,
        anoReferencia: 2024,
        areaPropria: 8.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 8.0
      }
    });

    // Produtor 5: Grande produtor / Pessoa Jurídica
    const produtor5 = await prisma.pessoa.upsert({
      where: { cpfCnpj: "12.345.678/0001-90" },
      update: {},
      create: {
        nome: "Agropecuária Campos Verdes LTDA",
        cpfCnpj: "12.345.678/0001-90",
        tipoPessoa: "JURIDICA",
        telefone: "(45) 3055-1234",
        email: "contato@camposverdes.com.br",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-005-2024",
        ativo: true,
        pessoaJuridica: {
          create: {
            nomeFantasia: "Campos Verdes",
            inscricaoEstadual: "123456789",
            inscricaoMunicipal: "987654",
            dataFundacao: new Date("2010-01-15"),
            representanteLegal: "Roberto Campos"
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 5 },
      update: {},
      create: {
        nome: "Fazenda Campos Verdes",
        tipoPropriedade: "RURAL",
        areaTotal: 50.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: false,
        localizacao: "Zona Rural",
        atividadeProdutiva: "AGRICULTURA_PECUARIA",
        proprietarioId: produtor5.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtor5.id },
      update: {},
      create: {
        id: produtor5.id,
        anoReferencia: 2024,
        areaPropria: 50.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 50.0
      }
    });

    console.log("✅ 5 produtores criados com sucesso");

    // ==================================================
    // PROGRAMA 1: LEI 797/2006 - PRÓ-ORGÂNICO
    // Alterada por: Lei 1563/2017, Lei 1723/2021
    // ==================================================
    console.log("\n📋 Cadastrando programas...");
    console.log("1/24: Pró-Orgânico (Adubo Orgânico)...");

    const proOrganico = await prisma.programa.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nome: "Programa de Incentivo ao Uso de Adubo Orgânico - Pró-Orgânico",
        descricao: "Subsídio para aquisição de adubo orgânico visando melhorar a fertilidade do solo e fixar o produtor rural no campo. Base Legal: Lei 797/2006, alterada pelas Leis 1319/2013, 1563/2017 e 1723/2021.",
        leiNumero: "LEI Nº 797/2006",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: proOrganico.id,
          tipoRegra: "area_propriedade",
          parametro: {
            condicao: "menor_igual",
            valor: 6,
            unidade: "alqueires",
            incluiArrendamento: true,
            descricao: "Propriedades com até 6 alqueires (área efetiva)",
          },
          valorBeneficio: 70.0,
          limiteBeneficio: {
            tipo: "quantidade_periodo",
            limite: 15,
            unidade: "toneladas",
            periodo: "bienal",
            intersticio: "2_anos",
            descricao: "Máximo 15 toneladas a cada 2 anos",
          },
        },
        {
          programaId: proOrganico.id,
          tipoRegra: "area_propriedade",
          parametro: {
            condicao: "maior",
            valor: 6,
            unidade: "alqueires",
            incluiArrendamento: true,
            descricao: "Propriedades acima de 6 alqueires (área efetiva)",
          },
          valorBeneficio: 50.0,
          limiteBeneficio: {
            tipo: "quantidade_percentual_periodo",
            limite: 15,
            unidade: "toneladas",
            percentual: 50,
            periodo: "bienal",
            intersticio: "2_anos",
            descricao: "Máximo 15 toneladas (pago 50% da NF) a cada 2 anos",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 2: LEI 798/2006 - PRÓSOLOS (Calcário)
    // Alterada por: Lei 1319/2013, Lei 1587/2018
    // ==================================================
    console.log("2/24: Prósolos (Calcário)...");

    const prosolos = await prisma.programa.upsert({
      where: { id: 2 },
      update: {},
      create: {
        nome: "Programa de Correção de Solos com Calcário - Prósolos",
        descricao: "Subsídio para correção da acidez do solo através de calcário agrícola. Base Legal: Lei 798/2006, alterada pelas Leis 1319/2013 e 1587/2018.",
        leiNumero: "LEI Nº 798/2006",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: prosolos.id,
          tipoRegra: "area_propriedade",
          parametro: {
            condicao: "menor_igual",
            valor: 4,
            unidade: "alqueires",
            descricao: "Propriedades até 4 alqueires",
          },
          valorBeneficio: 105.0,
          limiteBeneficio: {
            tipo: "toneladas_por_alqueire",
            limite: 5,
            unidade: "toneladas_por_alqueire",
            intersticio: "3_anos",
            descricao: "Máximo 5 toneladas por alqueire, interstício de 3 anos",
          },
        },
        {
          programaId: prosolos.id,
          tipoRegra: "area_propriedade",
          parametro: {
            condicao: "entre",
            valorMinimo: 4,
            valorMaximo: 18,
            unidade: "alqueires",
            descricao: "Propriedades entre 4 e 18 alqueires",
          },
          valorBeneficio: 65.0,
          limiteBeneficio: {
            tipo: "toneladas_por_alqueire_com_teto",
            limite: 5,
            unidade: "toneladas_por_alqueire",
            limiteTotal: 50,
            intersticio: "3_anos",
            descricao: "Máximo 5 ton/alqueire, limitado a 50 toneladas totais, interstício 3 anos",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 3: LEI 829/2006 - ORDENHADEIRAS E RESFRIADORES
    // Alterada por: Lei 1319/2013
    // ==================================================
    console.log("3/24: Ordenhadeiras e Resfriadores...");

    const equipamentosLeite = await prisma.programa.upsert({
      where: { id: 3 },
      update: {},
      create: {
        nome: "Auxílio Financeiro para Ordenhadeiras e Resfriadores de Leite",
        descricao: "Subsídio de 50% para aquisição de ordenhadeiras mecânicas e resfriadores de leite a granel. Base Legal: Lei 829/2006, alterada pela Lei 1319/2013.",
        leiNumero: "LEI Nº 829/2006",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: equipamentosLeite.id,
          tipoRegra: "equipamento_ordenhadeira",
          parametro: {
            tipoEquipamento: "ordenhadeira",
            requisitosMinimos: {
              condicao: "ou",
              opcoes: [
                { tipo: "producao_diaria", valor: 70, unidade: "litros" },
                { tipo: "vacas_leiteiras", valor: 6, unidade: "animais" },
              ],
            },
          },
          valorBeneficio: 2000.0,
          limiteBeneficio: {
            tipo: "percentual_com_teto",
            percentual: 50,
            limite: 2000,
            unidade: "reais",
            usoUnico: true,
            descricao: "50% do valor da NF, máximo R$ 2.000,00 - benefício único por produtor",
          },
        },
        {
          programaId: equipamentosLeite.id,
          tipoRegra: "equipamento_resfriador",
          parametro: {
            tipoEquipamento: "resfriador",
            requisitosMinimos: {
              condicao: "ou",
              opcoes: [
                { tipo: "producao_diaria", valor: 70, unidade: "litros" },
                { tipo: "vacas_leiteiras", valor: 10, unidade: "animais" },
              ],
            },
          },
          valorBeneficio: 3000.0,
          limiteBeneficio: {
            tipo: "percentual_com_teto",
            percentual: 50,
            limite: 3000,
            unidade: "reais",
            usoUnico: true,
            descricao: "50% do valor da NF, máximo R$ 3.000,00 - benefício único por produtor",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 4: LEI 749/2005 - PRÓ-SUÍNOS
    // ==================================================
    console.log("4/24: Pró-Suínos (Construção)...");

    const proSuinos = await prisma.programa.upsert({
      where: { id: 4 },
      update: {},
      create: {
        nome: "Programa de Incentivo à Construção de Instalações para Suinocultura - Pró-Suínos",
        descricao: "Fornecimento de materiais de construção para instalações destinadas à suinocultura. Base Legal: Lei 749/2005.",
        leiNumero: "LEI Nº 749/2005",
        tipoPrograma: TipoPrograma.MATERIAL,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.create({
      data: {
        programaId: proSuinos.id,
        tipoRegra: "material_construcao",
        parametro: {
          tipo: "fornecimento_material",
          materiais: {
            areia: { quantidade: 0.08, unidade: "m3_por_m2", maximo: 33 },
            pedra_brita: { quantidade: 0.05, unidade: "m3_por_m2", maximo: 21 },
            tijolos: { quantidade: 16, unidade: "unidades_por_m2", maximo: 7200 },
            cimento: { quantidade: 6, unidade: "kg_por_m2", maximo: 2700 },
            terraplanagem: { descricao: "Abertura de vala e terraplanagem" },
            frete: { descricao: "Frete de areia e pedra" },
          },
          area_maxima: 450,
          unidade_area: "metros_quadrados",
        },
        valorBeneficio: 0,
        limiteBeneficio: {
          tipo: "beneficio_unico",
          intersticio: "3_anos",
          usoUnico: true,
          descricao: "1 benefício por proprietário, interstício de 3 anos",
        },
      },
    });

    // ==================================================
    // PROGRAMA 5: LEI 1182/2011 - INSEMINAÇÃO ARTIFICIAL BOVINOS
    // Alterada por: Leis 1390/2014, 1414/2014, 1563/2017
    // ==================================================
    console.log("5/24: Inseminação Artificial - Bovinos...");

    const inseminacaoBovinos = await prisma.programa.upsert({
      where: { id: 5 },
      update: {},
      create: {
        nome: "Programa de Fomento à Bovinocultura - Inseminação Artificial",
        descricao: "Programa de melhoria genética através de inseminação artificial em bovinos, com 3 modalidades de atendimento. Base Legal: Lei 1182/2011, alterada pelas Leis 1390/2014, 1414/2014, 1465/2015 e 1563/2017.",
        leiNumero: "LEI Nº 1182/2011",
        tipoPrograma: TipoPrograma.SERVICO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        // Modalidade 1: Fornecimento + Aplicação (70% subsidiada)
        {
          programaId: inseminacaoBovinos.id,
          tipoRegra: "inseminacao_bovinos_fornecimento",
          parametro: {
            tipoAnimal: "bovino",
            modalidade: "fornecimento_aplicacao_municipio",
            descricao: "Município fornece sêmen e realiza aplicação",
            percentualSubsidiado: 70,
            percentualProdutor: 30,
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "quantidade_anual_animal",
            limite: 1,
            unidade: "dose_por_animal_por_ano",
            taxaRepeticao: 30,
            descricao: "1 inseminação por animal por ano + 30% taxa de repetição",
          },
        },
        // Modalidade 2: Retirada sêmen pelo produtor capacitado
        {
          programaId: inseminacaoBovinos.id,
          tipoRegra: "inseminacao_bovinos_retirada",
          parametro: {
            tipoAnimal: "bovino",
            modalidade: "retirada_secretaria",
            descricao: "Produtor capacitado retira sêmen e aplica por conta própria",
            requisitos: [
              "Certificado capacitação técnica",
              "Tanque de refrigeração próprio",
              "Curso de manejo de gado (Secretaria/Sindicato/SEAB)",
            ],
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "quantidade_anual_animal",
            limite: 1,
            unidade: "dose_por_animal_por_ano",
            taxaRepeticao: 30,
            descricao: "Sêmen fornecido gratuitamente, aplicação por conta do produtor",
          },
        },
        // Modalidade 3: Reembolso (Lei 1563/2017)
        {
          programaId: inseminacaoBovinos.id,
          tipoRegra: "inseminacao_bovinos_reembolso",
          parametro: {
            tipoAnimal: "bovino",
            modalidade: "reembolso",
            descricao: "Produtor compra sêmen e solicita reembolso",
            requisitos: [
              "Nota fiscal aquisição sêmen",
              "Exames brucelose e tuberculose (anuais)",
            ],
          },
          valorBeneficio: 35.0,
          limiteBeneficio: {
            tipo: "valor_por_dose_animal",
            limite: 35,
            unidade: "reais_por_dose_por_animal",
            quantidadeAnual: 1,
            taxaRepeticao: 30,
            descricao: "Até R$ 35,00 por dose por animal por ano + 30% repetição",
          },
        },
        // Assistência Veterinária (Lei 1414/2014)
        {
          programaId: inseminacaoBovinos.id,
          tipoRegra: "assistencia_veterinaria",
          parametro: {
            tipoServico: "assistencia_veterinaria",
            modalidade: "subsidio",
            percentualMunicipio: 70,
            percentualProdutor: 30,
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "percentual",
            percentual: 70,
            descricao: "Município custeia 70%, produtor 30%",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 6: LEI 1182/2011 - INSEMINAÇÃO ARTIFICIAL SUÍNOS
    // Alterada por: Lei 1465/2015, Lei 1563/2017, Lei 1723/2021
    // ==================================================
    console.log("6/24: Inseminação Artificial - Suínos...");

    const inseminacaoSuinos = await prisma.programa.upsert({
      where: { id: 6 },
      update: {},
      create: {
        nome: "Programa de Melhoria Genética de Suínos - Inseminação Artificial",
        descricao: "Reembolso para aquisição de sêmen suíno. Base Legal: Lei 1182/2011, alterada pelas Leis 1465/2015, 1563/2017 e 1723/2021.",
        leiNumero: "LEI Nº 1182/2011",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.create({
      data: {
        programaId: inseminacaoSuinos.id,
        tipoRegra: "inseminacao_suinos",
        parametro: {
          tipoAnimal: "suino",
          modalidade: "reembolso",
          requisitos: [
            "Nota fiscal aquisição sêmen",
            "Relatório ADAPAR comprovando quantidade de matrizes",
          ],
        },
        valorBeneficio: 34.0,
        limiteBeneficio: {
          tipo: "valor_por_matriz_ano",
          limite: 34,
          unidade: "reais_por_matriz_por_ano",
          descricao: "Até R$ 34,00 por matriz por ano",
        },
      },
    });

    // ==================================================
    // PROGRAMA 7: LEI 1321/2013 - AVEIA (Sementes)
    // Alterada por: Lei 1563/2017, Lei 1723/2021
    // ==================================================
    console.log("7/24: Aveia (Sementes)...");

    const aveia = await prisma.programa.upsert({
      where: { id: 7 },
      update: {},
      create: {
        nome: "Programa de Incentivo à Aquisição de Sementes de Aveia",
        descricao: "Subsídio para compra de sementes de aveia para cobertura de solo. Base Legal: Lei 1321/2013, alterada pelas Leis 1563/2017 e 1723/2021.",
        leiNumero: "LEI Nº 1321/2013",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: aveia.id,
          tipoRegra: "area_propriedade",
          parametro: {
            condicao: "menor_igual",
            valor: 6,
            unidade: "alqueires",
            descricao: "Propriedades até 6 alqueires",
          },
          valorBeneficio: 1.25,
          limiteBeneficio: {
            tipo: "quantidade",
            limite: 450,
            unidade: "quilogramas",
            descricao: "Máximo 450 kg por produtor",
          },
        },
        {
          programaId: aveia.id,
          tipoRegra: "area_propriedade",
          parametro: {
            condicao: "maior",
            valor: 6,
            unidade: "alqueires",
            descricao: "Propriedades acima de 6 alqueires",
          },
          valorBeneficio: 1.15,
          limiteBeneficio: {
            tipo: "quantidade",
            limite: 450,
            unidade: "quilogramas",
            descricao: "Máximo 450 kg por produtor",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 8: LEI 014/2025 - PISCICULTURA SUSTENTÁVEL (NOVA)
    // Revoga: Leis 815/2006, 1413/2014, 1587/2018, 1723/2021, 1746/2021
    // ==================================================
    console.log("8/24: Piscicultura Sustentável (NOVA)...");

    const piscicultura = await prisma.programa.upsert({
      where: { id: 8 },
      update: {},
      create: {
        nome: "Programa de Apoio à Piscicultura Sustentável",
        descricao: "Programa reformulado de apoio à piscicultura, incluindo alevinos, pedra rachão e hora-máquina. Base Legal: Projeto de Lei 014/2025 (em aprovação). Revoga as Leis 815/2006, 1413/2014, 1587/2018, 1723/2021 e 1746/2021.",
        leiNumero: "PROJETO LEI Nº 014/2025",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        // Alevinos
        {
          programaId: piscicultura.id,
          tipoRegra: "alevinos",
          parametro: {
            tipo: "alevinos",
            descricao: "Subsídio para aquisição de alevinos",
          },
          valorBeneficio: 72.5,
          limiteBeneficio: {
            tipo: "percentual_com_limite_quantidade",
            percentual: 50,
            valorMaximo: 72.5,
            unidade: "reais_por_milheiro",
            limite: 10000,
            unidadeLimite: "alevinos_por_ano",
            descricao: "50% do custo, máximo R$ 72,50/milheiro, limite 10.000 alevinos/ano",
          },
        },
        // Pedra rachão
        {
          programaId: piscicultura.id,
          tipoRegra: "pedra_rachao",
          parametro: {
            tipo: "pedra_rachao",
            descricao: "Fornecimento de pedra rachão para taipa",
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "quantidade_periodo",
            limite: 300,
            unidade: "metros_cubicos",
            periodo: "bienal",
            descricao: "Até 300m³ a cada 2 anos",
          },
        },
        // Hora-máquina - 1ª-10ª hora (50%)
        {
          programaId: piscicultura.id,
          tipoRegra: "hora_maquina_1_10",
          parametro: {
            tipo: "hora_maquina",
            faixa: "1_a_10",
            descricao: "Subsídio de 50% nas primeiras 10 horas/ano",
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "percentual_hora",
            percentual: 50,
            horaInicio: 1,
            horaFim: 10,
            descricao: "50% de subsídio na 1ª à 10ª hora/ano",
          },
        },
        // Hora-máquina - 11ª-20ª hora (30%)
        {
          programaId: piscicultura.id,
          tipoRegra: "hora_maquina_11_20",
          parametro: {
            tipo: "hora_maquina",
            faixa: "11_a_20",
            descricao: "Subsídio de 30% da 11ª à 20ª hora/ano",
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "percentual_hora",
            percentual: 30,
            horaInicio: 11,
            horaFim: 20,
            descricao: "30% de subsídio na 11ª à 20ª hora/ano",
          },
        },
        // Hora-máquina - 21ª-30ª hora (15%)
        {
          programaId: piscicultura.id,
          tipoRegra: "hora_maquina_21_30",
          parametro: {
            tipo: "hora_maquina",
            faixa: "21_a_30",
            descricao: "Subsídio de 15% da 21ª à 30ª hora/ano",
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "percentual_hora",
            percentual: 15,
            horaInicio: 21,
            horaFim: 30,
            descricao: "15% de subsídio na 21ª à 30ª hora/ano",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 9: LEI 889/2007 - CAPTAÇÃO DE ÁGUA
    // Alterada por: Lei 1746/2021
    // ==================================================
    console.log("9/24: Captação de Água (Cisternas tubos)...");

    const captacaoAgua = await prisma.programa.upsert({
      where: { id: 9 },
      update: {},
      create: {
        nome: "Programa de Captação de Água em Propriedades Rurais",
        descricao: "Reembolso para aquisição de tubos de concreto para captação de água. Base Legal: Lei 889/2007, alterada pela Lei 1746/2021.",
        leiNumero: "LEI Nº 889/2007",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.create({
      data: {
        programaId: captacaoAgua.id,
        tipoRegra: "tubos_captacao",
        parametro: {
          tipo: "tubos_concreto",
          diametro: "1.20m",
          descricao: "Tubos de concreto Ø 1,20m para captação",
        },
        valorBeneficio: 500.0,
        limiteBeneficio: {
          tipo: "quantidade_por_captacao",
          limite: 3,
          unidade: "tubos_por_captacao",
          valorUnitario: 500,
          descricao: "Até 3 tubos por captação, R$ 500,00 por tubo",
        },
      },
    });

    // ==================================================
    // PROGRAMA 10: LEI 1611/2018 - ESTERCO LÍQUIDO
    // Alterada por: Lei 1746/2021
    // ==================================================
    console.log("10/24: Adubação Orgânica Líquida (Esterco)...");

    const estercoLiquido = await prisma.programa.upsert({
      where: { id: 10 },
      update: {},
      create: {
        nome: "Programa de Adubação Orgânica Líquida - Esterco Líquido",
        descricao: "Subsídio para aquisição, distribuição e aspergimento de adubo orgânico líquido. Base Legal: Lei 1611/2018, alterada pela Lei 1746/2021.",
        leiNumero: "LEI Nº 1611/2018",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: estercoLiquido.id,
          tipoRegra: "area_propriedade",
          parametro: {
            condicao: "menor_igual",
            valor: 6,
            unidade: "alqueires",
            descricao: "Propriedades até 6 alqueires",
            cargaMinima: 15000,
            unidadeCarga: "litros",
          },
          valorBeneficio: 32.5,
          limiteBeneficio: {
            tipo: "quantidade_anual_perfil",
            limiteGeral: 10,
            limiteLeiteGado: 23,
            unidade: "tanques_por_ano",
            descricao: "10 tanques/ano (agrícola) ou 23 tanques/ano (leite/gado corte)",
          },
        },
        {
          programaId: estercoLiquido.id,
          tipoRegra: "area_propriedade",
          parametro: {
            condicao: "entre",
            valorMinimo: 6,
            valorMaximo: 18,
            unidade: "alqueires",
            descricao: "Propriedades entre 6 e 18 alqueires",
            cargaMinima: 15000,
            unidadeCarga: "litros",
          },
          valorBeneficio: 13.0,
          limiteBeneficio: {
            tipo: "quantidade_anual_perfil",
            limiteGeral: 10,
            limiteLeiteGado: 23,
            unidade: "tanques_por_ano",
            descricao: "10 tanques/ano (agrícola) ou 23 tanques/ano (leite/gado corte)",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 11: LEI 1667/2019 - APICULTURA
    // Alterada por: Lei 1746/2021
    // ==================================================
    console.log("11/24: Apicultura...");

    const apicultura = await prisma.programa.upsert({
      where: { id: 11 },
      update: {},
      create: {
        nome: "Programa de Incentivo à Apicultura",
        descricao: "Reembolso para aquisição de equipamentos apícolas. Base Legal: Lei 1667/2019, alterada pela Lei 1746/2021.",
        leiNumero: "LEI Nº 1667/2019",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: apicultura.id,
          tipoRegra: "apicultura_primeira",
          parametro: {
            tipo: "primeira_solicitacao",
            descricao: "Primeira solicitação do produtor",
          },
          valorBeneficio: 1200.0,
          limiteBeneficio: {
            tipo: "valor_fixo_anual",
            limite: 1200,
            unidade: "reais_por_ano",
            descricao: "R$ 1.200,00 por produtor por ano na primeira solicitação",
          },
        },
        {
          programaId: apicultura.id,
          tipoRegra: "apicultura_subsequente",
          parametro: {
            tipo: "solicitacao_subsequente",
            descricao: "A partir da 2ª solicitação",
            requisitos: [
              "NF de venda de mel ≥ valor recebido ano anterior",
            ],
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "percentual_vendas",
            percentual: 10,
            descricao: "10% do valor das NFs de venda de mel apresentadas",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 12: LEI 1669/2019 - PESCADOR PROFISSIONAL
    // Alterada por: Lei 1746/2021
    // ==================================================
    console.log("12/24: Pescador Profissional...");

    const pescador = await prisma.programa.upsert({
      where: { id: 12 },
      update: {},
      create: {
        nome: "Programa de Incentivo à Pesca Artesanal Profissional",
        descricao: "Reembolso para aquisição de materiais de pesca. Base Legal: Lei 1669/2019, alterada pela Lei 1746/2021.",
        leiNumero: "LEI Nº 1669/2019",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: pescador.id,
          tipoRegra: "pescador_primeira",
          parametro: {
            tipo: "primeira_solicitacao",
            descricao: "Primeira solicitação do pescador profissional",
            requisitos: ["Licença de pescador profissional"],
          },
          valorBeneficio: 1000.0,
          limiteBeneficio: {
            tipo: "valor_fixo_anual",
            limite: 1000,
            unidade: "reais_por_ano",
            descricao: "R$ 1.000,00 por pescador por ano na primeira solicitação",
          },
        },
        {
          programaId: pescador.id,
          tipoRegra: "pescador_subsequente",
          parametro: {
            tipo: "solicitacao_subsequente",
            descricao: "A partir da 2ª solicitação",
            requisitos: [
              "NF de venda de pescado ≥ valor recebido ano anterior",
            ],
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "percentual_vendas",
            percentual: 10,
            descricao: "10% do valor das NFs de venda de pescado apresentadas",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 13: LEI 1663/2019 - MUDAS FRUTÍFERAS
    // ==================================================
    console.log("13/24: Mudas Frutíferas...");

    const mudasFrutiferas = await prisma.programa.upsert({
      where: { id: 13 },
      update: {},
      create: {
        nome: "Programa de Incentivo à Fruticultura - Mudas Frutíferas",
        descricao: "Reembolso para aquisição de mudas frutíferas. Base Legal: Lei 1663/2019.",
        leiNumero: "LEI Nº 1663/2019",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.create({
      data: {
        programaId: mudasFrutiferas.id,
        tipoRegra: "mudas_frutiferas",
        parametro: {
          tipo: "mudas",
          descricao: "Reembolso para mudas de espécies viáveis na Região Oeste do Paraná",
          requisitos: [
            "DAP (Declaração de Aptidão ao PRONAF)",
            "NF de compra das mudas",
            "Acompanhamento técnico EMATER",
          ],
        },
        valorBeneficio: 500.0,
        limiteBeneficio: {
          tipo: "percentual_com_teto",
          percentual: 50,
          limite: 500,
          unidade: "reais_por_ano",
          descricao: "50% do valor da NF, máximo R$ 500,00 por produtor por ano",
        },
      },
    });

    // ==================================================
    // PROGRAMA 14: LEI 1670/2019 - PRODUÇÃO ORGÂNICA
    // ==================================================
    console.log("14/24: Produção Orgânica...");

    const producaoOrganica = await prisma.programa.upsert({
      where: { id: 14 },
      update: {},
      create: {
        nome: "Programa de Incentivo à Produção Agroecológica e Orgânica",
        descricao: "Reembolso para aquisição de equipamentos e materiais para produção orgânica. Base Legal: Lei 1670/2019.",
        leiNumero: "LEI Nº 1670/2019",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: producaoOrganica.id,
          tipoRegra: "tela_sombreamento",
          parametro: {
            tipo: "tela_sombreamento",
            descricao: "Tela de sombreamento",
          },
          valorBeneficio: 500.0,
          limiteBeneficio: {
            tipo: "valor_anual",
            limite: 500,
            limiteIncentivosAno: 2,
            descricao: "R$ 500,00/ano - máximo 2 incentivos/ano/produtor",
          },
        },
        {
          programaId: producaoOrganica.id,
          tipoRegra: "plastico_estufa",
          parametro: {
            tipo: "plastico_transparente",
            descricao: "Plástico transparente para estufa",
          },
          valorBeneficio: 700.0,
          limiteBeneficio: {
            tipo: "valor_anual",
            limite: 700,
            limiteIncentivosAno: 2,
            descricao: "R$ 700,00/ano - máximo 2 incentivos/ano/produtor",
          },
        },
        {
          programaId: producaoOrganica.id,
          tipoRegra: "irrigacao",
          parametro: {
            tipo: "equipamentos_irrigacao",
            descricao: "Equipamentos de irrigação",
          },
          valorBeneficio: 1000.0,
          limiteBeneficio: {
            tipo: "valor_anual",
            limite: 1000,
            limiteIncentivosAno: 2,
            descricao: "R$ 1.000,00/ano - máximo 2 incentivos/ano/produtor",
          },
        },
        {
          programaId: producaoOrganica.id,
          tipoRegra: "agrotransformacao",
          parametro: {
            tipo: "equipamentos_agrotransformacao",
            descricao: "Equipamentos de agrotransformação",
          },
          valorBeneficio: 1000.0,
          limiteBeneficio: {
            tipo: "valor_anual",
            limite: 1000,
            limiteIncentivosAno: 2,
            descricao: "R$ 1.000,00/ano - máximo 2 incentivos/ano/produtor",
          },
        },
        {
          programaId: producaoOrganica.id,
          tipoRegra: "cercas",
          parametro: {
            tipo: "cercas_protecao",
            descricao: "Cercas de proteção",
          },
          valorBeneficio: 500.0,
          limiteBeneficio: {
            tipo: "valor_anual",
            limite: 500,
            limiteIncentivosAno: 2,
            descricao: "R$ 500,00/ano - máximo 2 incentivos/ano/produtor",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 15: LEI 1672/2019 - BOVINOCULTURA DE CORTE
    // ==================================================
    console.log("15/24: Bovinocultura de Corte (Sêmen)...");

    const gadoCorte = await prisma.programa.upsert({
      where: { id: 15 },
      update: {},
      create: {
        nome: "Programa de Melhoria Genética da Bovinocultura de Corte",
        descricao: "Reembolso para aquisição de sêmen para gado de corte. Base Legal: Lei 1672/2019.",
        leiNumero: "LEI Nº 1672/2019",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: gadoCorte.id,
          tipoRegra: "gado_corte_exclusivo",
          parametro: {
            tipo: "bovinocultor_gado_corte",
            descricao: "Produtor exclusivo de gado de corte",
          },
          valorBeneficio: 20.0,
          limiteBeneficio: {
            tipo: "dose_por_animal",
            limite: 1,
            unidade: "dose_por_animal_por_ano",
            limiteAnimais: 50,
            descricao: "1 dose/ano/animal, máximo 50 animais",
          },
        },
        {
          programaId: gadoCorte.id,
          tipoRegra: "gado_leite_secundario",
          parametro: {
            tipo: "bovinocultor_gado_leite",
            descricao: "Produtor de gado leiteiro com rebanho de corte secundário",
          },
          valorBeneficio: 20.0,
          limiteBeneficio: {
            tipo: "dose_por_animal_percentual",
            limite: 1,
            unidade: "dose_por_animal_por_ano",
            percentualRebanho: 30,
            descricao: "1 dose/ano/animal, máximo 30% do rebanho",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 16: LEI 1671/2019 - SÊMEN SEXADO (Leite)
    // Complementa Lei 1182/2011
    // ==================================================
    console.log("16/24: Sêmen Sexado para Gado Leiteiro...");

    const semenSexado = await prisma.programa.upsert({
      where: { id: 16 },
      update: {},
      create: {
        nome: "Programa de Sêmen Sexado para Bovinos Leiteiros",
        descricao: "Reembolso para aquisição de sêmen sexado para bovinos de leite. Base Legal: Lei 1671/2019 (complementa Lei 1182/2011).",
        leiNumero: "LEI Nº 1671/2019",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: semenSexado.id,
          tipoRegra: "semen_sexado_ate_25",
          parametro: {
            tipo: "semen_sexado",
            descricao: "Produtor com até 25 vacas leiteiras",
            limiteVacas: 25,
          },
          valorBeneficio: 100.0,
          limiteBeneficio: {
            tipo: "doses_anuais",
            limite: 5,
            unidade: "doses_por_ano",
            valorDose: 100,
            descricao: "Até 5 doses/ano, R$ 100,00/dose",
          },
        },
        {
          programaId: semenSexado.id,
          tipoRegra: "semen_sexado_26_49",
          parametro: {
            tipo: "semen_sexado",
            descricao: "Produtor com 26 a 49 vacas leiteiras",
            limiteVacasMin: 26,
            limiteVacasMax: 49,
          },
          valorBeneficio: 75.0,
          limiteBeneficio: {
            tipo: "doses_anuais",
            limite: 5,
            unidade: "doses_por_ano",
            valorDose: 75,
            descricao: "Até 5 doses/ano, R$ 75,00/dose",
          },
        },
        {
          programaId: semenSexado.id,
          tipoRegra: "semen_sexado_50_mais",
          parametro: {
            tipo: "semen_sexado",
            descricao: "Produtor com 50 ou mais vacas leiteiras",
            limiteVacasMin: 50,
          },
          valorBeneficio: 50.0,
          limiteBeneficio: {
            tipo: "doses_anuais",
            limite: 5,
            unidade: "doses_por_ano",
            valorDose: 50,
            descricao: "Até 5 doses/ano, R$ 50,00/dose",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 17: LEI 1648/2019 - ULTRASSOM (Leite)
    // Complementa Lei 1182/2011
    // ==================================================
    console.log("17/24: Ultrassom Bovinos Leiteiros...");

    const ultrassom = await prisma.programa.upsert({
      where: { id: 17 },
      update: {},
      create: {
        nome: "Programa de Exames de Ultrassom para Bovinos Leiteiros",
        descricao: "Subsídio para exames de ultrassom em bovinos leiteiros. Base Legal: Lei 1648/2019 (complementa Lei 1182/2011).",
        leiNumero: "LEI Nº 1648/2019",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.create({
      data: {
        programaId: ultrassom.id,
        tipoRegra: "ultrassom_bovino",
        parametro: {
          tipo: "exame_ultrassom",
          descricao: "Exames de ultrassom para diagnóstico gestação",
          requisitos: [
            "Mesmos requisitos Art. 4º Lei 1182/2011",
            "Comprovar venda mensal de leite últimos 6 meses",
          ],
        },
        valorBeneficio: 5.0,
        limiteBeneficio: {
          tipo: "exames_por_animal",
          limite: 2,
          unidade: "exames_por_animal_por_ano",
          limiteTotal: 100,
          unidadeTotal: "exames_por_produtor_por_ano",
          percentual: 50,
          valorMaximo: 5,
          descricao: "Até 2 exames/animal/ano, máx 100 exames/produtor/ano, 50% do valor, máx R$ 5,00/exame",
        },
      },
    });

    // ==================================================
    // PROGRAMA 18: LEI 1454/2014 - PEDRAS PARA PÁTIOS
    // Alterada por: Lei 1726/2021
    // ==================================================
    console.log("18/24: Pedras para Pátios...");

    const pedrasPatio = await prisma.programa.upsert({
      where: { id: 18 },
      update: {},
      create: {
        nome: "Programa de Fornecimento de Pedra Poliédrica para Pátios",
        descricao: "Fornecimento de pedra poliédrica para pavimentação de pátios. Base Legal: Lei 1454/2014, alterada pela Lei 1726/2021.",
        leiNumero: "LEI Nº 1454/2014",
        tipoPrograma: TipoPrograma.MATERIAL,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.create({
      data: {
        programaId: pedrasPatio.id,
        tipoRegra: "fornecimento_pedra",
        parametro: {
          tipo: "pedra_poliedrica",
          descricao: "Pedra poliédrica para pátio",
        },
        valorBeneficio: 0,
        limiteBeneficio: {
          tipo: "quantidade",
          limite: 200,
          unidade: "metros_cubicos",
          descricao: "Até 200m³ de pedra poliédrica por produtor",
        },
      },
    });

    // ==================================================
    // PROGRAMA 19: LEI 1364/2013 - PISO SALA DE ORDENHA
    // Alterada por: Lei 1793/2022
    // ==================================================
    console.log("19/24: Piso Sala de Ordenha...");

    const pisoOrdenha = await prisma.programa.upsert({
      where: { id: 19 },
      update: {},
      create: {
        nome: "Programa de Construção de Piso de Sala de Ordenha",
        descricao: "Auxílio para construção de piso de concreto em sala de ordenha. Base Legal: Lei 1364/2013, alterada pela Lei 1793/2022.",
        leiNumero: "LEI Nº 1364/2013",
        tipoPrograma: TipoPrograma.MATERIAL,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: pisoOrdenha.id,
          tipoRegra: "pedra_maroada",
          parametro: {
            tipo: "pedra_maroada",
            descricao: "Pedra maroada para base",
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "quantidade",
            limite: 1,
            unidade: "carga_caminhao",
            descricao: "1 carga de caminhão de pedra maroada",
          },
        },
        {
          programaId: pisoOrdenha.id,
          tipoRegra: "hora_maquina_preparacao",
          parametro: {
            tipo: "hora_maquina",
            descricao: "Hora-máquina para preparação do terreno",
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "sem_limite",
            descricao: "SEM LIMITE de horas-máquina",
          },
        },
        {
          programaId: pisoOrdenha.id,
          tipoRegra: "reembolso_materiais",
          parametro: {
            tipo: "materiais_concreto",
            descricao: "Reembolso de materiais (areia, brita, concreto)",
            opcoes: [
              "Areia: 1m³/20m²",
              "Pedra britada: 1m³/20m²",
              "Concreto usinado: 1m³/20m² (exclui areia/brita)",
            ],
          },
          valorBeneficio: 9.0,
          limiteBeneficio: {
            tipo: "valor_por_m2",
            valorMetroQuadrado: 9,
            limite: 2700,
            unidade: "reais",
            correcaoAnual: "IPCA",
            descricao: "R$ 9,00/m², máximo R$ 2.700,00, corrigido anualmente pelo IPCA",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 20: LEI 1676/2019 - CISTERNA
    // Alterada por: Lei 1746/2021
    // ==================================================
    console.log("20/24: Cisterna (Construção)...");

    const cisterna = await prisma.programa.upsert({
      where: { id: 20 },
      update: {},
      create: {
        nome: "Programa de Construção de Cisternas",
        descricao: "Reembolso para construção de cisternas em propriedades rurais. Base Legal: Lei 1676/2019, alterada pela Lei 1746/2021.",
        leiNumero: "LEI Nº 1676/2019",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.create({
      data: {
        programaId: cisterna.id,
        tipoRegra: "construcao_cisterna",
        parametro: {
          tipo: "cisterna",
          descricao: "Construção de cisterna",
          requisitos: [
            "Projeto técnico",
            "NFs de materiais e equipamentos",
            "Cadastro atualizado",
            "Regularidade tributária",
            "Verificação de equipamentos",
          ],
        },
        valorBeneficio: 5500.0,
        limiteBeneficio: {
          tipo: "percentual_com_teto",
          percentual: 50,
          limite: 5500,
          unidade: "reais_por_produtor",
          descricao: "50% do valor, máximo R$ 5.500,00 por produtor",
        },
      },
    });

    // ==================================================
    // PROGRAMA 21: LEI 1788/2022 - ADUBAÇÃO DE PASTAGENS
    // Revoga: Lei 1655/2019
    // ==================================================
    console.log("21/24: Adubação de Pastagens...");

    const pastagens = await prisma.programa.upsert({
      where: { id: 21 },
      update: {},
      create: {
        nome: "Programa de Adubação de Pastagens para Bovinocultura Leiteira",
        descricao: "Reembolso para aquisição de fertilizantes para pastagens. Base Legal: Lei 1788/2022 (revoga Lei 1655/2019).",
        leiNumero: "LEI Nº 1788/2022",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: pastagens.id,
          tipoRegra: "pequeno_produtor_leite",
          parametro: {
            tipo: "categoria_pequena",
            descricao: "Pequenos produtores: ≤6 alqueires E ≤50 vacas (residentes)",
            condicoes: {
              areaMaxima: 6,
              vacasMaxima: 50,
              residente: true,
            },
          },
          valorBeneficio: 2050.0,
          limiteBeneficio: {
            tipo: "area_fertilizante_com_limite_vagas",
            areaMaxima: 1.0,
            unidadeArea: "hectares",
            limite: 2050,
            unidade: "reais",
            vagasAno: 15,
            intersticio: "3_anos",
            correcaoAnual: "INPC",
            descricao: "Até 1,0 ha, máx R$ 2.050,00, 15 produtores/ano, interstício 3 anos",
          },
        },
        {
          programaId: pastagens.id,
          tipoRegra: "demais_produtores_leite",
          parametro: {
            tipo: "categoria_geral",
            descricao: "Demais produtores residentes",
            condicoes: {
              residente: true,
            },
          },
          valorBeneficio: 2050.0,
          limiteBeneficio: {
            tipo: "area_fertilizante_com_limite_vagas",
            areaMaxima: 1.0,
            unidadeArea: "hectares",
            limite: 2050,
            unidade: "reais",
            vagasAno: 10,
            intersticio: "3_anos",
            correcaoAnual: "INPC",
            descricao: "Até 1,0 ha, máx R$ 2.050,00, 10 produtores/ano, interstício 3 anos",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 22: LEI 1744/2021 - AUXÍLIO SIM
    // Alterada por: Lei 1791/2022
    // ==================================================
    console.log("22/24: Auxílio SIM (Serviço Inspeção Municipal)...");

    const auxilioSIM = await prisma.programa.upsert({
      where: { id: 22 },
      update: {},
      create: {
        nome: "Programa de Auxílio ao Serviço de Inspeção Municipal (SIM)",
        descricao: "Subsídio para exames laboratoriais de produtos registrados no SIM. Base Legal: Lei 1744/2021, alterada pela Lei 1791/2022.",
        leiNumero: "LEI Nº 1744/2021",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        // Pessoa Física - Registro
        {
          programaId: auxilioSIM.id,
          tipoRegra: "sim_pf_registro",
          parametro: {
            tipo: "registro",
            categoria: "pessoa_fisica",
            descricao: "Registro inicial - Pessoa Física",
            limiteProdutos: 10,
            limiteAmostras: 3,
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "percentual_exames",
            percentual: 100,
            descricao: "100% dos exames, máx 3 amostras/produto, até 10 produtos",
          },
        },
        // Pessoa Física - Manutenção
        {
          programaId: auxilioSIM.id,
          tipoRegra: "sim_pf_manutencao",
          parametro: {
            tipo: "manutencao",
            categoria: "pessoa_fisica",
            descricao: "Manutenção anual - Pessoa Física",
          },
          valorBeneficio: 500.0,
          limiteBeneficio: {
            tipo: "percentual_com_teto",
            percentual: 50,
            limite: 500,
            unidade: "reais_por_ano",
            descricao: "50% dos exames, máximo R$ 500,00/ano",
          },
        },
        // Pequena Indústria - Registro
        {
          programaId: auxilioSIM.id,
          tipoRegra: "sim_pi_registro",
          parametro: {
            tipo: "registro",
            categoria: "pequena_industria",
            descricao: "Registro inicial - Pequena Indústria",
            limiteProdutos: 15,
            limiteAmostras: 3,
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "percentual_exames",
            percentual: 100,
            descricao: "100% dos exames, máx 3 amostras/produto, até 15 produtos",
          },
        },
        // Pequena Indústria - Manutenção
        {
          programaId: auxilioSIM.id,
          tipoRegra: "sim_pi_manutencao",
          parametro: {
            tipo: "manutencao",
            categoria: "pequena_industria",
            descricao: "Manutenção anual - Pequena Indústria",
          },
          valorBeneficio: 500.0,
          limiteBeneficio: {
            tipo: "percentual_com_teto",
            percentual: 50,
            limite: 500,
            unidade: "reais_por_ano",
            descricao: "50% dos exames, máximo R$ 500,00/ano",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 23: LEI 1880/2025 - AVEIA COBERTURA SOLO
    // Status: EM ANÁLISE
    // ==================================================
    console.log("23/24: Aveia Cobertura Solo (NOVA)...");

    const aveiaCobertura = await prisma.programa.upsert({
      where: { id: 23 },
      update: {},
      create: {
        nome: "Programa de Cobertura e Recuperação da Fertilidade do Solo - Aveia",
        descricao: "Programa de subsídio para sementes de aveia, nabo e braquiária para cobertura de solo. Base Legal: Lei 1880/2025 (em análise).",
        leiNumero: "LEI Nº 1880/2025",
        tipoPrograma: TipoPrograma.SUBSIDIO,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: aveiaCobertura.id,
          tipoRegra: "aveia_sementes",
          parametro: {
            tipo: "aveia",
            descricao: "Sementes de aveia",
            limiteKgAlqueire: 150,
            limiteKgFamilia: 450,
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "quantidade_fornecimento",
            limite: 150,
            unidade: "kg_por_alqueire",
            limiteTotal: 450,
            unidadeTotal: "kg_por_familia",
            frequencia: "anual",
            descricao: "Até 150 kg/alqueire, máximo 450 kg/família, 1 vez ao ano",
          },
        },
        {
          programaId: aveiaCobertura.id,
          tipoRegra: "nabo_braquiaria",
          parametro: {
            tipo: "nabo_braquiaria",
            descricao: "Sementes de nabo forrageiro ou braquiária",
            limiteKgAlqueire: 100,
            limiteKgFamilia: 100,
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "quantidade_fornecimento",
            limite: 100,
            unidade: "kg_por_alqueire",
            limiteTotal: 100,
            unidadeTotal: "kg_por_familia",
            frequencia: "anual",
            descricao: "Até 100 kg/alqueire, máximo 100 kg/família, 1 vez ao ano",
          },
        },
      ],
    });

    // ==================================================
    // PROGRAMA 24: LEI 1104/2010 - SILO E SALA ORDENHA
    // Alterada por: Lei 1723/2021
    // ==================================================
    console.log("24/24: Silo e Sala de Ordenha (Construção)...");

    const siloSalaOrdenha = await prisma.programa.upsert({
      where: { id: 24 },
      update: {},
      create: {
        nome: "Programa de Construção e Reforma de Silos e Salas de Ordenha",
        descricao: "Auxílio para construção, reforma e ampliação de sala de ordenha e silos. Base Legal: Lei 1104/2010, alterada pela Lei 1723/2021.",
        leiNumero: "LEI Nº 1104/2010",
        tipoPrograma: TipoPrograma.MATERIAL,
        secretaria: TipoPerfil.AGRICULTURA,
        ativo: true,
      },
    });

    await prisma.regrasNegocio.createMany({
      data: [
        {
          programaId: siloSalaOrdenha.id,
          tipoRegra: "sala_ordenha_construcao",
          parametro: {
            tipo: "sala_ordenha",
            descricao: "Construção, reforma ou ampliação de sala de ordenha",
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "beneficio_unico",
            limite: 1,
            descricao: "1 incentivo por produtor para sala de ordenha",
          },
        },
        {
          programaId: siloSalaOrdenha.id,
          tipoRegra: "silos_construcao",
          parametro: {
            tipo: "silos",
            descricao: "Construção de silos",
          },
          valorBeneficio: 0,
          limiteBeneficio: {
            tipo: "quantidade",
            limite: 2,
            descricao: "2 incentivos por produtor para silos",
          },
        },
      ],
    });

    console.log("\n✅ Todos os 24 programas cadastrados com sucesso!");

    // ==================================================
    // RELATÓRIO FINAL
    // ==================================================
    const totalProgramas = await prisma.programa.count();
    const totalRegras = await prisma.regrasNegocio.count();
    const totalProdutores = await prisma.pessoa.count({ where: { isProdutor: true } });

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO FINAL DO CADASTRAMENTO");
    console.log("=".repeat(60));
    console.log(`\n👨‍🌾 Produtores cadastrados: ${totalProdutores}`);
    console.log(`📋 Programas cadastrados: ${totalProgramas}`);
    console.log(`⚙️  Regras de negócio configuradas: ${totalRegras}`);

    console.log("\n📂 Programas por tipo:");
    const programasSubsidio = await prisma.programa.count({ where: { tipoPrograma: "SUBSIDIO" } });
    const programasMaterial = await prisma.programa.count({ where: { tipoPrograma: "MATERIAL" } });
    const programasServico = await prisma.programa.count({ where: { tipoPrograma: "SERVICO" } });
    console.log(`   • Subsídios/Reembolsos: ${programasSubsidio}`);
    console.log(`   • Fornecimento de Material: ${programasMaterial}`);
    console.log(`   • Serviços: ${programasServico}`);

    console.log("\n🎯 Principais programas:");
    console.log("   1. Pró-Orgânico (Adubo Orgânico)");
    console.log("   2. Prósolos (Calcário)");
    console.log("   3. Ordenhadeiras e Resfriadores");
    console.log("   4. Pró-Suínos (Construção)");
    console.log("   5. Inseminação Artificial (Bovinos e Suínos)");
    console.log("   6. Aveia (Sementes)");
    console.log("   7. Piscicultura Sustentável (NOVA)");
    console.log("   8. Captação de Água");
    console.log("   9. Esterco Líquido");
    console.log("   10. Apicultura");
    console.log("   11. Pescador Profissional");
    console.log("   12. Mudas Frutíferas");
    console.log("   13. Produção Orgânica");
    console.log("   14. Bovinocultura de Corte");
    console.log("   15. Sêmen Sexado (Leite)");
    console.log("   16. Ultrassom (Leite)");
    console.log("   17. Pedras para Pátios");
    console.log("   18. Piso Sala de Ordenha");
    console.log("   19. Cisterna");
    console.log("   20. Adubação de Pastagens");
    console.log("   21. Auxílio SIM");
    console.log("   22. Aveia Cobertura Solo (NOVA)");
    console.log("   23. Silo e Sala Ordenha");
    console.log("\n" + "=".repeat(60));

  } catch (error) {
    console.error("❌ Erro ao cadastrar programas:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ==================================================
// FUNÇÕES AUXILIARES
// ==================================================

export async function limparProgramasAntigos() {
  console.log("🧹 Limpando programas anteriores...");

  await prisma.regrasNegocio.deleteMany({});
  await prisma.solicitacaoBeneficio.deleteMany({});
  await prisma.programa.deleteMany({});

  console.log("✅ Dados anteriores removidos");
}

export async function removerProgramasDuplicados() {
  console.log("🧹 Removendo programas duplicados...");

  const programas = await prisma.programa.findMany({
    orderBy: { id: 'asc' }
  });

  const programasUnicos = new Map<string, number>();
  const idsParaRemover: number[] = [];

  for (const programa of programas) {
    if (programasUnicos.has(programa.nome)) {
      idsParaRemover.push(programa.id);
    } else {
      programasUnicos.set(programa.nome, programa.id);
    }
  }

  if (idsParaRemover.length > 0) {
    console.log(`   Encontrados ${idsParaRemover.length} programas duplicados`);

    await prisma.regrasNegocio.deleteMany({
      where: { programaId: { in: idsParaRemover } }
    });

    await prisma.solicitacaoBeneficio.deleteMany({
      where: { programaId: { in: idsParaRemover } }
    });

    await prisma.programa.deleteMany({
      where: { id: { in: idsParaRemover } }
    });

    console.log(`✅ ${idsParaRemover.length} programas duplicados removidos`);
  } else {
    console.log("✅ Nenhum programa duplicado encontrado");
  }
}

// ==================================================
// EXECUÇÃO PRINCIPAL
// ==================================================
async function main() {
  try {
    // Opcional: limpar dados anteriores (descomente se necessário)
    // await limparProgramasAntigos();

    // Cadastrar programas legais completos
    await seedProgramasLegais();

    console.log("\n🎉 Seed dos programas legais concluído com sucesso!");
    console.log("💾 Todos os 24 programas estão prontos para uso no sistema\n");
  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  main();
}

export default seedProgramasLegais;
