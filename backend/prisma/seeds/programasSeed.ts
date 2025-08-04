// backend/prisma/seeds/programasSeed.ts
import { PrismaClient, TipoPrograma, TipoPerfil } from '@prisma/client';

const prisma = new PrismaClient();
export async function seedProgramas() {
  console.log('🌱 Criando programas de exemplo com secretarias...');

  // Programas da Secretaria de Agricultura
  const programasAgricultura = [
    {
      nome: 'Subsídio para Sementes',
      descricao: 'Programa de fornecimento de sementes subsidiadas para pequenos produtores rurais',
      leiNumero: 'LEI Nº 1234/2023',
      tipoPrograma: TipoPrograma.SUBSIDIO,
      secretaria: TipoPerfil.AGRICULTURA,
      ativo: true,
    },
    {
      nome: 'Assistência Técnica Rural',
      descricao: 'Programa de assistência técnica gratuita para produtores rurais',
      leiNumero: 'LEI Nº 1235/2023',
      tipoPrograma: TipoPrograma.ASSISTENCIA,
      secretaria: TipoPerfil.AGRICULTURA,
      ativo: true,
    },
    {
      nome: 'Crédito Rural Municipal',
      descricao: 'Programa de microcrédito para investimentos na propriedade rural',
      leiNumero: 'LEI Nº 1236/2023',
      tipoPrograma: TipoPrograma.CREDITO,
      secretaria: TipoPerfil.AGRICULTURA,
      ativo: true,
    }
  ];

  // Programas da Secretaria de Obras  
  const programasObras = [
    {
      nome: 'Carga de Terra Gratuita',
      descricao: 'Fornecimento gratuito de terra para construção de residências',
      leiNumero: 'LEI Nº 2001/2023',
      tipoPrograma: TipoPrograma.MATERIAL,
      secretaria: TipoPerfil.OBRAS,
      ativo: true,
    },
    {
      nome: 'Abertura de Ruas',
      descricao: 'Serviço gratuito de abertura e nivelamento de ruas em loteamentos',
      leiNumero: 'LEI Nº 2002/2023',
      tipoPrograma: TipoPrograma.SERVICO,
      secretaria: TipoPerfil.OBRAS,
      ativo: true,
    },
    {
      nome: 'Material de Construção Subsidiado',
      descricao: 'Fornecimento de material de construção com desconto para famílias de baixa renda',
      leiNumero: 'LEI Nº 2003/2023',
      tipoPrograma: TipoPrograma.MATERIAL,
      secretaria: TipoPerfil.OBRAS,
      ativo: true,
    },
    {
      nome: 'Reforma de Calçadas',
      descricao: 'Serviço gratuito de reforma e construção de calçadas',
      tipoPrograma: TipoPrograma.SERVICO,
      secretaria: TipoPerfil.OBRAS,
      ativo: true,
    }
  ];

  // Criar programas de agricultura
  for (const programa of programasAgricultura) {
    // Verificar se já existe
    const programaExistente = await prisma.programa.findFirst({
      where: { nome: programa.nome }
    });
    
    if (!programaExistente) {
      await prisma.programa.create({
        data: programa,
      });
    }
  }

  // Criar programas de obras
  for (const programa of programasObras) {
    // Verificar se já existe
    const programaExistente = await prisma.programa.findFirst({
      where: { nome: programa.nome }
    });
    
    if (!programaExistente) {
      await prisma.programa.create({
        data: programa,
      });
    }
  }

  console.log('✅ Programas de exemplo criados com sucesso!');
  console.log(`   - ${programasAgricultura.length} programas de Agricultura`);
  console.log(`   - ${programasObras.length} programas de Obras`);
}

// Função para criar algumas solicitações de exemplo
export async function seedSolicitacoesBeneficio() {
  console.log('🌱 Criando solicitações de benefício de exemplo...');

  // Buscar algumas pessoas e programas para criar solicitações
  const pessoas = await prisma.pessoa.findMany({
    take: 5
  });

  const programas = await prisma.programa.findMany({
    where: { ativo: true },
    take: 3
  });

  if (pessoas.length === 0 || programas.length === 0) {
    console.log('⚠️ Nenhuma pessoa ou programa encontrado para criar solicitações');
    return;
  }

  const solicitacoesExemplo = [
    {
      pessoaId: pessoas[0].id,
      programaId: programas[0].id,
      observacoes: 'Solicitação para programa de agricultura',
      status: 'pendente',
    },
    {
      pessoaId: pessoas[1]?.id,
      programaId: programas[1]?.id,
      observacoes: 'Necessário assistência técnica para manejo da propriedade',
      status: 'em_analise',
    },
    {
      pessoaId: pessoas[2]?.id,
      programaId: programas[2]?.id,
      observacoes: 'Solicitação para programa de obras',
      status: 'aprovada',
    }
  ];

  for (const solicitacao of solicitacoesExemplo) {
    if (solicitacao.pessoaId && solicitacao.programaId) {
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId: solicitacao.pessoaId,
          programaId: solicitacao.programaId,
          observacoes: solicitacao.observacoes,
          status: solicitacao.status,
        }
      });
    }
  }

  console.log('✅ Solicitações de benefício de exemplo criadas!');
}

// Função principal de seed
export default async function runProgramasSeed() {
  try {
    await seedProgramas();
    await seedSolicitacoesBeneficio();
  } catch (error) {
    console.error('❌ Erro ao executar seed de programas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}