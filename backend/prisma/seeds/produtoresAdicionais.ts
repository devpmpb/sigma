// backend/prisma/seeds/produtoresAdicionais.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedProdutoresAdicionais() {
  console.log("👨‍🌾 Criando produtores adicionais para testes...");

  try {
    // ==================================================
    // PRODUTOR PARA ORDENHADEIRA
    // ==================================================
    const produtorOrdenhadeira = await prisma.pessoa.upsert({
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
        proprietarioId: produtorOrdenhadeira.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorOrdenhadeira.id },
      update: {},
      create: {
        id: produtorOrdenhadeira.id,
        anoReferencia: 2024,
        areaPropria: 5.5,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 5.5
      }
    });

    console.log("✅ Ana Costa criada - Produtora de leite (candidata a ordenhadeira)");

    // ==================================================
    // PRODUTOR PARA RESFRIADOR
    // ==================================================
    const produtorResfriador = await prisma.pessoa.upsert({
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
        proprietarioId: produtorResfriador.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorResfriador.id },
      update: {},
      create: {
        id: produtorResfriador.id,
        anoReferencia: 2024,
        areaPropria: 12.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 12.0
      }
    });

    console.log("✅ Ricardo Souza criado - Produtor de leite (candidato a resfriador)");

    // ==================================================
    // PRODUTOR PARA INSEMINAÇÃO ARTIFICIAL - BOVINOS
    // ==================================================
    const produtorInseminacaoBovinos = await prisma.pessoa.upsert({
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
        proprietarioId: produtorInseminacaoBovinos.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorInseminacaoBovinos.id },
      update: {},
      create: {
        id: produtorInseminacaoBovinos.id,
        anoReferencia: 2024,
        areaPropria: 15.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 15.0
      }
    });

    console.log("✅ Fernando Lima criado - Produtor de bovinos (candidato a inseminação artificial)");

    // ==================================================
    // PRODUTOR PARA INSEMINAÇÃO ARTIFICIAL - SUÍNOS
    // ==================================================
    const produtorInseminacaoSuinos = await prisma.pessoa.upsert({
      where: { cpfCnpj: "901.234.567-89" },
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
        atividadeProdutiva: "PECUARIA",
        proprietarioId: produtorInseminacaoSuinos.id
      }
    });

    await prisma.areaEfetiva.upsert({
      where: { id: produtorInseminacaoSuinos.id },
      update: {},
      create: {
        id: produtorInseminacaoSuinos.id,
        anoReferencia: 2024,
        areaPropria: 7.0,
        areaArrendadaRecebida: 0,
        areaArrendadaCedida: 0,
        areaEfetiva: 7.0
      }
    });

    console.log("✅ Suinocultura Bragado criada - Produtor de suínos (candidato a inseminação artificial)");

    // Relatório final
    const totalProdutores = await prisma.pessoa.count({ where: { isProdutor: true } });

    console.log(`\n📊 Total de produtores cadastrados: ${totalProdutores}`);
    console.log(`\n👨‍🌾 Novos produtores para testes:`);
    console.log(`   6. Ana Costa - 5.5 alqueires (pecuária) → Ordenhadeira`);
    console.log(`   7. Ricardo Souza - 12 alqueires (pecuária) → Resfriador`);
    console.log(`   8. Fernando Lima - 15 alqueires (pecuária) → Inseminação Bovinos`);
    console.log(`   9. Suinocultura Bragado - 7 alqueires (pecuária) → Inseminação Suínos`);

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
