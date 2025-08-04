// backend/prisma/seeds/programasSeed.ts
import { PrismaClient, TipoPrograma, TipoPerfil } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedProgramas() {
  console.log("🌱 Criando programas de exemplo com secretarias...");

  // Programas da Secretaria de Agricultura
  const programasAgricultura = [
    {
      nome: "Subsídio para Sementes",
      descricao:
        "Programa de fornecimento de sementes subsidiadas para pequenos produtores rurais",
      leiNumero: "LEI Nº 1234/2023",
      tipoPrograma: TipoPrograma.SUBSIDIO,
      secretaria: TipoPerfil.AGRICULTURA,
      ativo: true,
    },
    {
      nome: "Assistência Técnica Rural",
      descricao:
        "Programa de assistência técnica gratuita para produtores rurais",
      leiNumero: "LEI Nº 1235/2023",
      tipoPrograma: TipoPrograma.ASSISTENCIA,
      secretaria: TipoPerfil.AGRICULTURA,
      ativo: true,
    },
    {
      nome: "Crédito Rural Municipal",
      descricao:
        "Programa de microcrédito para investimentos na propriedade rural",
      leiNumero: "LEI Nº 1236/2023",
      tipoPrograma: TipoPrograma.CREDITO,
      secretaria: TipoPerfil.AGRICULTURA,
      ativo: true,
    },
  ];

  // Programas da Secretaria de Obras
  const programasObras = [
    {
      nome: "Carga de Terra Gratuita",
      descricao:
        "Fornecimento gratuito de terra para construção de residências",
      leiNumero: "LEI Nº 2001/2023",
      tipoPrograma: TipoPrograma.MATERIAL,
      secretaria: TipoPerfil.OBRAS,
      ativo: true,
    },
    {
      nome: "Abertura de Ruas",
      descricao:
        "Serviço gratuito de abertura e nivelamento de ruas em loteamentos",
      leiNumero: "LEI Nº 2002/2023",
      tipoPrograma: TipoPrograma.SERVICO,
      secretaria: TipoPerfil.OBRAS,
      ativo: true,
    },
    {
      nome: "Material de Construção Subsidiado",
      descricao:
        "Fornecimento de material de construção com desconto para famílias de baixa renda",
      leiNumero: "LEI Nº 2003/2023",
      tipoPrograma: TipoPrograma.MATERIAL,
      secretaria: TipoPerfil.OBRAS,
      ativo: true,
    },
    {
      nome: "Reforma de Calçadas",
      descricao: "Serviço gratuito de reforma e construção de calçadas",
      tipoPrograma: TipoPrograma.SERVICO,
      secretaria: TipoPerfil.OBRAS,
      ativo: true,
    },
  ];

  // Criar programas de agricultura
  for (const programa of programasAgricultura) {
    await prisma.programa.upsert({
      where: { nome: programa.nome },
      update: {},
      create: programa,
    });
  }

  // Criar programas de obras
  for (const programa of programasObras) {
    await prisma.programa.upsert({
      where: { nome: programa.nome },
      update: {},
      create: programa,
    });
  }

  console.log("✅ Programas de exemplo criados com sucesso!");
  console.log(`   - ${programasAgricultura.length} programas de Agricultura`);
  console.log(`   - ${programasObras.length} programas de Obras`);
}

// Função para criar algumas solicitações de exemplo
export async function seedSolicitacoesBeneficio() {
  console.log("🌱 Criando solicitações de benefício de exemplo...");

  // Buscar algumas pessoas e programas para criar solicitações
  const pessoas = await prisma.pessoa.findMany({
    take: 5,
    include: { produtor: true },
  });

  const programas = await prisma.programa.findMany({
    where: { ativo: true },
    take: 3,
  });

  if (pessoas.length === 0 || programas.length === 0) {
    console.log(
      "⚠️ Nenhuma pessoa ou programa encontrado para criar solicitações"
    );
    return;
  }

  const solicitacoesExemplo = [
    {
      pessoaId: pessoas[0].id,
      programaId: programas[0].id,
      valorSolicitado: 500.0,
      observacoes: "Solicitação para compra de sementes de milho",
      status: "pendente",
    },
    {
      pessoaId: pessoas[1]?.id,
      programaId: programas[1]?.id,
      valorSolicitado: 1000.0,
      observacoes: "Necessário assistência técnica para manejo da propriedade",
      status: "em_analise",
    },
    {
      pessoaId: pessoas[2]?.id,
      programaId: programas[2]?.id,
      valorSolicitado: 2000.0,
      observacoes: "Solicitação de crédito para investimento in infraestrutura",
      status: "aprovada",
      valorAprovado: 1800.0,
    },
  ];

  for (const solicitacao of solicitacoesExemplo) {
    if (solicitacao.pessoaId && solicitacao.programaId) {
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId: solicitacao.pessoaId,
          programaId: solicitacao.programaId,
          valorSolicitado: solicitacao.valorSolicitado,
          valorAprovado: solicitacao.valorAprovado || null,
          observacoes: solicitacao.observacoes,
          status: solicitacao.status,
        },
      });
    }
  }

  console.log("✅ Solicitações de benefício de exemplo criadas!");
}

// Função principal de seed
export async function runProgramasSeed() {
  try {
    await seedProgramas();
    await seedSolicitacoesBeneficio();
  } catch (error) {
    console.error("❌ Erro ao executar seed de programas:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
