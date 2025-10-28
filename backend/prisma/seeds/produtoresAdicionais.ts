// backend/prisma/seeds/produtoresAdicionais.ts
// PRODUTORES PARA TESTAR TODOS OS 24 PROGRAMAS
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedProdutoresAdicionais() {
  console.log("👨‍🌾 Criando produtores adicionais para testes de TODOS os programas...");

  try {
    // ==================================================
    // PRODUTOR 6: PEQUENO PRODUTOR LEITE (≤6 alqueires, ≤50 vacas)
    // Testa: Pró-Orgânico, Prósolos, Ordenhadeira, Inseminação Bovinos,
    //        Sêmen Sexado, Ultrassom, Pastagens (categoria pequena)
    // ==================================================
    const pequenoProdutorLeite = await prisma.pessoa.upsert({
      where: { cpfCnpj: "678.901.234-56" },
      update: {},
      create: {
        nome: "Ana Costa",
        cpfCnpj: "678.901.234-56",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4325",
        email: "ana.costa@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-006-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "56.789.012-3",
            dataNascimento: new Date("1982-06-12")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 6 },
      update: {},
      create: {
        nome: "Sítio Vale do Leite",
        tipoPropriedade: "RURAL",
        areaTotal: 5.5,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha São Francisco",
        atividadeProdutiva: "PECUARIA",
        proprietarioId: pequenoProdutorLeite.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: pequenoProdutorLeite.id },
      update: {},
      create: {
        id: pequenoProdutorLeite.id,
        anoReferencia: 2024,
        areaPropria: 5.5,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 5.5
      }
    });

    console.log("✅ Ana Costa - Pequeno produtor leite (5.5 alq, ≤50 vacas)");

    // ==================================================
    // PRODUTOR 7: MÉDIO PRODUTOR LEITE (>6 alqueires)
    // Testa: Resfriador, Pró-Orgânico (>6), Aveia (>6), Esterco Líquido,
    //        Pastagens (categoria geral), Piso Sala Ordenha
    // ==================================================
    const medioProdutorLeite = await prisma.pessoa.upsert({
      where: { cpfCnpj: "789.012.345-67" },
      update: {},
      create: {
        nome: "Ricardo Souza",
        cpfCnpj: "789.012.345-67",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4326",
        email: "ricardo.souza@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-007-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "67.890.123-4",
            dataNascimento: new Date("1978-09-08")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 7 },
      update: {},
      create: {
        nome: "Granja Leiteira Souza",
        tipoPropriedade: "RURAL",
        areaTotal: 12.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha Santa Rita",
        atividadeProdutiva: "PECUARIA",
        proprietarioId: medioProdutorLeite.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: medioProdutorLeite.id },
      update: {},
      create: {
        id: medioProdutorLeite.id,
        anoReferencia: 2024,
        areaPropria: 12.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 12.0
      }
    });

    console.log("✅ Ricardo Souza - Médio produtor leite (12 alq)");

    // ==================================================
    // PRODUTOR 8: PRODUTOR GADO DE CORTE
    // Testa: Bovinocultura de Corte, Inseminação Bovinos
    // ==================================================
    const produtorGadoCorte = await prisma.pessoa.upsert({
      where: { cpfCnpj: "890.123.456-78" },
      update: {},
      create: {
        nome: "Fernando Lima",
        cpfCnpj: "890.123.456-78",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4327",
        email: "fernando.lima@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-008-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "78.901.234-5",
            dataNascimento: new Date("1980-12-20")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 8 },
      update: {},
      create: {
        nome: "Fazenda Horizonte Verde",
        tipoPropriedade: "RURAL",
        areaTotal: 15.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Estrada do Açude",
        atividadeProdutiva: "PECUARIA",
        proprietarioId: produtorGadoCorte.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorGadoCorte.id },
      update: {},
      create: {
        id: produtorGadoCorte.id,
        anoReferencia: 2024,
        areaPropria: 15.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 15.0
      }
    });

    console.log("✅ Fernando Lima - Produtor gado corte (15 alq)");

    // ==================================================
    // PRODUTOR 9: SUINOCULTURA
    // Testa: Pró-Suínos, Inseminação Suínos
    // ==================================================
    const produtorSuinos = await prisma.pessoa.upsert({
      where: { cpfCnpj: "23.456.789/0001-01" },
      update: {},
      create: {
        nome: "Suinocultura Bragado LTDA",
        cpfCnpj: "23.456.789/0001-01",
        tipoPessoa: "JURIDICA",
        telefone: "(45) 3055-5678",
        email: "contato@suinobragado.com.br",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-009-2024",
        ativo: true,
        pessoaJuridica: {
          create: {
            nomeFantasia: "Suíno Bragado",
            inscricaoEstadual: "987654321",
            inscricaoMunicipal: "654321",
            dataFundacao: new Date("2015-03-10"),
            representanteLegal: "Marcos Suíno"
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 9 },
      update: {},
      create: {
        nome: "Granja Suína Moderna",
        tipoPropriedade: "RURAL",
        areaTotal: 7.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: false,
        localizacao: "Linha dos Alemães",
        atividadeProdutiva: "SUINOCULTURA",
        proprietarioId: produtorSuinos.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorSuinos.id },
      update: {},
      create: {
        id: produtorSuinos.id,
        anoReferencia: 2024,
        areaPropria: 7.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 7.0
      }
    });

    console.log("✅ Suinocultura Bragado - Produtor suínos (7 alq)");

    // ==================================================
    // PRODUTOR 10: PISCICULTOR
    // Testa: Piscicultura Sustentável (alevinos, pedra rachão, hora-máquina)
    // ==================================================
    const piscicultor = await prisma.pessoa.upsert({
      where: { cpfCnpj: "901.234.567-89" },
      update: {},
      create: {
        nome: "Rogério Pescados",
        cpfCnpj: "901.234.567-89",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4328",
        email: "rogerio.pescados@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-010-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "89.012.345-6",
            dataNascimento: new Date("1975-04-15")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 10 },
      update: {},
      create: {
        nome: "Piscicultura Águas Claras",
        tipoPropriedade: "RURAL",
        areaTotal: 6.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha do Rio",
        atividadeProdutiva: "AQUICULTURA",
        proprietarioId: piscicultor.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: piscicultor.id },
      update: {},
      create: {
        id: piscicultor.id,
        anoReferencia: 2024,
        areaPropria: 6.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 6.0
      }
    });

    console.log("✅ Rogério Pescados - Piscicultor (6 alq)");

    // ==================================================
    // PRODUTOR 11: APICULTOR
    // Testa: Apicultura (equipamentos, primeira e 2ª solicitação)
    // ==================================================
    const apicultor = await prisma.pessoa.upsert({
      where: { cpfCnpj: "012.345.678-90" },
      update: {},
      create: {
        nome: "Helena Mel",
        cpfCnpj: "012.345.678-90",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4329",
        email: "helena.mel@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-011-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "90.123.456-7",
            dataNascimento: new Date("1988-07-22")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 11 },
      update: {},
      create: {
        nome: "Apiário Flor do Campo",
        tipoPropriedade: "RURAL",
        areaTotal: 3.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha das Flores",
        atividadeProdutiva: "OUTROS",
        proprietarioId: apicultor.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: apicultor.id },
      update: {},
      create: {
        id: apicultor.id,
        anoReferencia: 2024,
        areaPropria: 3.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 3.0
      }
    });

    console.log("✅ Helena Mel - Apicultora (3 alq)");

    // ==================================================
    // PRODUTOR 12: PESCADOR PROFISSIONAL
    // Testa: Pescador Profissional (materiais pesca)
    // ==================================================
    const pescador = await prisma.pessoa.upsert({
      where: { cpfCnpj: "123.456.789-01" },
      update: {},
      create: {
        nome: "José Pescador",
        cpfCnpj: "123.456.789-01",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4330",
        email: "jose.pescador@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-012-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "01.234.567-8",
            dataNascimento: new Date("1972-11-05")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 12 },
      update: {},
      create: {
        nome: "Pesca Artesanal São Pedro",
        tipoPropriedade: "RURAL",
        areaTotal: 2.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Beira Rio Paraná",
        atividadeProdutiva: "AQUICULTURA",
        proprietarioId: pescador.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: pescador.id },
      update: {},
      create: {
        id: pescador.id,
        anoReferencia: 2024,
        areaPropria: 2.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 2.0
      }
    });

    console.log("✅ José Pescador - Pescador profissional (2 alq)");

    // ==================================================
    // PRODUTOR 13: FRUTICULTOR
    // Testa: Mudas Frutíferas
    // ==================================================
    const fruticultor = await prisma.pessoa.upsert({
      where: { cpfCnpj: "234.567.890-12" },
      update: {},
      create: {
        nome: "Mariana Frutas",
        cpfCnpj: "234.567.890-12",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4331",
        email: "mariana.frutas@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-013-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "12.345.678-9",
            dataNascimento: new Date("1990-03-18")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 13 },
      update: {},
      create: {
        nome: "Pomar Vida Nova",
        tipoPropriedade: "RURAL",
        areaTotal: 4.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha Bela Vista",
        atividadeProdutiva: "HORTIFRUTI",
        proprietarioId: fruticultor.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: fruticultor.id },
      update: {},
      create: {
        id: fruticultor.id,
        anoReferencia: 2024,
        areaPropria: 4.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 4.0
      }
    });

    console.log("✅ Mariana Frutas - Fruticultora (4 alq)");

    // ==================================================
    // PRODUTOR 14: PRODUTOR ORGÂNICO
    // Testa: Produção Orgânica (tela, plástico, irrigação, agrotransformação, cercas)
    // ==================================================
    const produtorOrganico = await prisma.pessoa.upsert({
      where: { cpfCnpj: "345.678.901-23" },
      update: {},
      create: {
        nome: "Beatriz Orgânicos",
        cpfCnpj: "345.678.901-23",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4332",
        email: "beatriz.organicos@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-014-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "23.456.789-0",
            dataNascimento: new Date("1985-09-30")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 14 },
      update: {},
      create: {
        nome: "Horta Vida Verde",
        tipoPropriedade: "RURAL",
        areaTotal: 3.5,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha Ecológica",
        atividadeProdutiva: "HORTIFRUTI",
        proprietarioId: produtorOrganico.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorOrganico.id },
      update: {},
      create: {
        id: produtorOrganico.id,
        anoReferencia: 2024,
        areaPropria: 3.5,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 3.5
      }
    });

    console.log("✅ Beatriz Orgânicos - Produtora orgânica (3.5 alq)");

    // ==================================================
    // PRODUTOR 15: PRODUTOR PESSOA FÍSICA (SIM)
    // Testa: Auxílio SIM (registro e manutenção pessoa física)
    // ==================================================
    const produtorSIM_PF = await prisma.pessoa.upsert({
      where: { cpfCnpj: "456.789.012-34" },
      update: {},
      create: {
        nome: "Paulo Queijos Artesanais",
        cpfCnpj: "456.789.012-34",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4333",
        email: "paulo.queijos@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-015-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "34.567.890-1",
            dataNascimento: new Date("1978-12-10")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 15 },
      update: {},
      create: {
        nome: "Queijaria São Paulo",
        tipoPropriedade: "RURAL",
        areaTotal: 5.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha Central",
        atividadeProdutiva: "PECUARIA",
        proprietarioId: produtorSIM_PF.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorSIM_PF.id },
      update: {},
      create: {
        id: produtorSIM_PF.id,
        anoReferencia: 2024,
        areaPropria: 5.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 5.0
      }
    });

    console.log("✅ Paulo Queijos - Produtor SIM Pessoa Física (5 alq)");

    // ==================================================
    // PRODUTOR 16: PEQUENA INDÚSTRIA (SIM)
    // Testa: Auxílio SIM (registro e manutenção pequena indústria)
    // ==================================================
    const produtorSIM_PI = await prisma.pessoa.upsert({
      where: { cpfCnpj: "34.567.890/0001-12" },
      update: {},
      create: {
        nome: "Laticínios Vale Verde LTDA",
        cpfCnpj: "34.567.890/0001-12",
        tipoPessoa: "JURIDICA",
        telefone: "(45) 3055-6789",
        email: "contato@valeverde.com.br",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-016-2024",
        ativo: true,
        pessoaJuridica: {
          create: {
            nomeFantasia: "Vale Verde Laticínios",
            inscricaoEstadual: "876543210",
            inscricaoMunicipal: "543210",
            dataFundacao: new Date("2018-05-20"),
            representanteLegal: "Sônia Valle"
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 16 },
      update: {},
      create: {
        nome: "Indústria Vale Verde",
        tipoPropriedade: "COMERCIAL",
        areaTotal: 1.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: false,
        localizacao: "Zona Industrial",
        atividadeProdutiva: "OUTROS",
        proprietarioId: produtorSIM_PI.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorSIM_PI.id },
      update: {},
      create: {
        id: produtorSIM_PI.id,
        anoReferencia: 2024,
        areaPropria: 1.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 1.0
      }
    });

    console.log("✅ Vale Verde Laticínios - Pequena Indústria SIM (1 alq)");

    // ==================================================
    // PRODUTOR 17: PRODUTOR COM ÁREA PEQUENA (≤4 alqueires)
    // Testa: Prósolos (≤4 alq = R$ 105/ton), Captação Água, Cisterna
    // ==================================================
    const produtorPequenoCalcario = await prisma.pessoa.upsert({
      where: { cpfCnpj: "567.890.123-45" },
      update: {},
      create: {
        nome: "Sandra Agricultura",
        cpfCnpj: "567.890.123-45",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4334",
        email: "sandra.agricultura@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-017-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "45.678.901-2",
            dataNascimento: new Date("1992-06-25")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 17 },
      update: {},
      create: {
        nome: "Chácara Pequena Terra",
        tipoPropriedade: "RURAL",
        areaTotal: 3.5,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha Pequenos Produtores",
        atividadeProdutiva: "AGRICULTURA",
        proprietarioId: produtorPequenoCalcario.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorPequenoCalcario.id },
      update: {},
      create: {
        id: produtorPequenoCalcario.id,
        anoReferencia: 2024,
        areaPropria: 3.5,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 3.5
      }
    });

    console.log("✅ Sandra Agricultura - Pequeno produtor ≤4 alq (3.5 alq)");

    // ==================================================
    // PRODUTOR 18: PRODUTOR PARA SILO E SALA ORDENHA
    // Testa: Silo e Sala Ordenha (construção/reforma)
    // ==================================================
    const produtorSilo = await prisma.pessoa.upsert({
      where: { cpfCnpj: "678.901.234-56" },
      update: {},
      create: {
        nome: "Roberto Silagem",
        cpfCnpj: "678.901.234-57",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4335",
        email: "roberto.silagem@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-018-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "56.789.012-4",
            dataNascimento: new Date("1983-08-14")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 18 },
      update: {},
      create: {
        nome: "Fazenda Boa Silagem",
        tipoPropriedade: "RURAL",
        areaTotal: 20.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Estrada Principal",
        atividadeProdutiva: "PECUARIA",
        proprietarioId: produtorSilo.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorSilo.id },
      update: {},
      create: {
        id: produtorSilo.id,
        anoReferencia: 2024,
        areaPropria: 20.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 20.0
      }
    });

    console.log("✅ Roberto Silagem - Produtor silo/sala ordenha (20 alq)");

    // ==================================================
    // PRODUTOR 19: PRODUTOR PARA PEDRAS PÁTIO
    // Testa: Pedras para Pátios
    // ==================================================
    const produtorPedras = await prisma.pessoa.upsert({
      where: { cpfCnpj: "789.012.345-68" },
      update: {},
      create: {
        nome: "Claudio Construções Rurais",
        cpfCnpj: "789.012.345-68",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4336",
        email: "claudio.rural@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-019-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "67.890.123-5",
            dataNascimento: new Date("1976-02-28")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 19 },
      update: {},
      create: {
        nome: "Granja Pátio Novo",
        tipoPropriedade: "RURAL",
        areaTotal: 8.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha do Pátio",
        atividadeProdutiva: "AGRICULTURA_PECUARIA",
        proprietarioId: produtorPedras.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorPedras.id },
      update: {},
      create: {
        id: produtorPedras.id,
        anoReferencia: 2024,
        areaPropria: 8.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 8.0
      }
    });

    console.log("✅ Claudio Construções - Produtor pedras pátio (8 alq)");

    // ==================================================
    // PRODUTOR 20: PRODUTOR PARA AVEIA COBERTURA
    // Testa: Aveia Cobertura Solo (aveia, nabo, braquiária)
    // ==================================================
    const produtorAveia = await prisma.pessoa.upsert({
      where: { cpfCnpj: "890.123.456-79" },
      update: {},
      create: {
        nome: "Marta Cobertura Verde",
        cpfCnpj: "890.123.456-79",
        tipoPessoa: "FISICA",
        telefone: "(45) 98765-4337",
        email: "marta.cobertura@email.com",
        isProdutor: true,
        inscricaoEstadualProdutor: "IE-020-2024",
        ativo: true,
        pessoaFisica: {
          create: {
            rg: "78.901.234-6",
            dataNascimento: new Date("1987-11-12")
          }
        }
      }
    });

    await prisma.propriedade.upsert({
      where: { id: 20 },
      update: {},
      create: {
        nome: "Sítio Solo Fértil",
        tipoPropriedade: "RURAL",
        areaTotal: 5.0,
        unidadeArea: "alqueires",
        situacao: "PROPRIA",
        isproprietarioResidente: true,
        localizacao: "Linha Verde",
        atividadeProdutiva: "AGRICULTURA",
        proprietarioId: produtorAveia.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorAveia.id },
      update: {},
      create: {
        id: produtorAveia.id,
        anoReferencia: 2024,
        areaPropria: 5.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 5.0
      }
    });

    console.log("✅ Marta Cobertura Verde - Produtor aveia cobertura (5 alq)");

    // Relatório final
    const totalProdutores = await prisma.pessoa.count({ where: { isProdutor: true } });

    console.log(`\n📊 Total de produtores cadastrados: ${totalProdutores}`);
    console.log(`\n============================================================`);
    console.log(`👨‍🌾 PRODUTORES PARA TESTAR OS 24 PROGRAMAS:`);
    console.log(`============================================================`);
    console.log(`   6. Ana Costa (5.5 alq) → Pró-Orgânico, Ordenhadeira, Inseminação, Sêmen Sexado, Ultrassom, Pastagens`);
    console.log(`   7. Ricardo Souza (12 alq) → Resfriador, Pró-Orgânico >6, Aveia >6, Esterco, Piso Ordenha`);
    console.log(`   8. Fernando Lima (15 alq) → Gado Corte, Inseminação Bovinos`);
    console.log(`   9. Suinocultura Bragado (7 alq) → Pró-Suínos, Inseminação Suínos`);
    console.log(`   10. Rogério Pescados (6 alq) → Piscicultura (alevinos, pedra, hora-máquina)`);
    console.log(`   11. Helena Mel (3 alq) → Apicultura`);
    console.log(`   12. José Pescador (2 alq) → Pescador Profissional`);
    console.log(`   13. Mariana Frutas (4 alq) → Mudas Frutíferas`);
    console.log(`   14. Beatriz Orgânicos (3.5 alq) → Produção Orgânica (5 tipos incentivos)`);
    console.log(`   15. Paulo Queijos (5 alq) → Auxílio SIM Pessoa Física`);
    console.log(`   16. Vale Verde Laticínios (1 alq) → Auxílio SIM Pequena Indústria`);
    console.log(`   17. Sandra Agricultura (3.5 alq) → Prósolos ≤4 alq, Captação Água, Cisterna`);
    console.log(`   18. Roberto Silagem (20 alq) → Silo e Sala Ordenha`);
    console.log(`   19. Claudio Construções (8 alq) → Pedras Pátios`);
    console.log(`   20. Marta Cobertura (5 alq) → Aveia Cobertura Solo`);
    console.log(`============================================================\n`);

  } catch (error) {
    console.error("❌ Erro ao cadastrar produtores adicionais:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se for chamado diretamente
async function main() {
  try {
    await seedProdutoresAdicionais();
    console.log("\n🎉 Seed de produtores adicionais concluído com sucesso!");
  } catch (error) {
    console.error("Erro durante o seed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default seedProdutoresAdicionais;
