// backend/src/utils/areaEfetivaCalculator.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Utilitário para calcular área efetiva automaticamente
 * Área Efetiva = Propriedades Próprias + Arrendamentos Recebidos - Arrendamentos Cedidos
 */

interface AreaEfetivaData {
  areaPropria: number;
  areaArrendadaRecebida: number;
  areaArrendadaCedida: number;
  areaEfetiva: number;
}

/**
 * Calcula a área efetiva de uma pessoa baseada em suas propriedades e arrendamentos
 */
export async function calcularAreaEfetivaPessoa(pessoaId: number): Promise<AreaEfetivaData> {
  // 1. Buscar propriedades próprias da pessoa
  const propriedades = await prisma.propriedade.findMany({
    where: { 
      proprietarioId: pessoaId,
      // Consideramos apenas propriedades rurais para área efetiva
      tipoPropriedade: "RURAL"
    },
    select: {
      areaTotal: true,
    }
  });

  // 2. Buscar arrendamentos onde a pessoa é ARRENDATÁRIA (recebe terra)
  const arrendamentosRecebidos = await prisma.arrendamento.findMany({
    where: {
      arrendatarioId: pessoaId,
      status: "ativo", // Apenas arrendamentos ativos
    },
    select: {
      areaArrendada: true,
    }
  });

  // 3. Buscar arrendamentos onde a pessoa é PROPRIETÁRIA (cede terra)
  const arrendamentosCedidos = await prisma.arrendamento.findMany({
    where: {
      proprietarioId: pessoaId,
      status: "ativo", // Apenas arrendamentos ativos
    },
    select: {
      areaArrendada: true,
    }
  });

  // 4. Calcular totais
  const areaPropria = propriedades.reduce((sum, prop) => {
    return sum + Number(prop.areaTotal);
  }, 0);

  const areaArrendadaRecebida = arrendamentosRecebidos.reduce((sum, arr) => {
    return sum + Number(arr.areaArrendada);
  }, 0);

  const areaArrendadaCedida = arrendamentosCedidos.reduce((sum, arr) => {
    return sum + Number(arr.areaArrendada);
  }, 0);

  const areaEfetiva = areaPropria + areaArrendadaRecebida - areaArrendadaCedida;

  return {
    areaPropria,
    areaArrendadaRecebida,
    areaArrendadaCedida,
    areaEfetiva: Math.max(0, areaEfetiva) // Nunca negativo
  };
}

/**
 * Atualiza a área efetiva de uma pessoa no banco de dados
 */
export async function atualizarAreaEfetivaPessoa(pessoaId: number): Promise<void> {
  // Verificar se a pessoa é produtor rural
  const pessoa = await prisma.pessoa.findUnique({
    where: { id: pessoaId },
    select: { produtorRural: true }
  });

  // Só calcular área efetiva para produtores rurais
  if (!pessoa?.produtorRural) {
    // Se não é produtor rural, remover área efetiva se existir
    await prisma.areaEfetiva.deleteMany({
      where: { pessoaId }
    });
    return;
  }

  // Calcular nova área efetiva
  const novaAreaEfetiva = await calcularAreaEfetivaPessoa(pessoaId);

  // Atualizar ou criar registro de área efetiva
  await prisma.areaEfetiva.upsert({
    where: { pessoaId },
    update: {
      anoReferencia: new Date().getFullYear(),
      areaPropria: novaAreaEfetiva.areaPropria,
      areaArrendadaRecebida: novaAreaEfetiva.areaArrendadaRecebida,
      areaArrendadaCedida: novaAreaEfetiva.areaArrendadaCedida,
      areaEfetiva: novaAreaEfetiva.areaEfetiva,
    },
    create: {
      pessoaId,
      anoReferencia: new Date().getFullYear(),
      areaPropria: novaAreaEfetiva.areaPropria,
      areaArrendadaRecebida: novaAreaEfetiva.areaArrendadaRecebida,
      areaArrendadaCedida: novaAreaEfetiva.areaArrendadaCedida,
      areaEfetiva: novaAreaEfetiva.areaEfetiva,
    }
  });

  console.log(`✅ Área efetiva atualizada para pessoa ${pessoaId}: ${novaAreaEfetiva.areaEfetiva} alqueires`);
}

/**
 * Recalcula área efetiva para todas as pessoas que são produtores rurais
 * Útil para manutenção/migração
 */
export async function recalcularTodasAreasEfetivas(): Promise<void> {
  const produtores = await prisma.pessoa.findMany({
    where: { produtorRural: true },
    select: { id: true, nome: true }
  });

  console.log(`🔄 Recalculando área efetiva para ${produtores.length} produtores...`);

  for (const produtor of produtores) {
    try {
      await atualizarAreaEfetivaPessoa(produtor.id);
      console.log(`✅ ${produtor.nome} - calculado`);
    } catch (error) {
      console.error(`❌ Erro ao calcular área para ${produtor.nome}:`, error);
    }
  }

  console.log(`🎉 Recálculo concluído para ${produtores.length} produtores`);
}

/**
 * Hook para ser chamado após mudanças em propriedades ou arrendamentos
 */
export async function onPropriedadeArrendamentoChange(
  proprietarioId?: number,
  arrendatarioId?: number,
  antigoProprietearioId?: number,
  antigoArrendatarioId?: number
): Promise<void> {
  const pessoasParaRecalcular = new Set<number>();

  // Adicionar pessoas afetadas
  if (proprietarioId) pessoasParaRecalcular.add(proprietarioId);
  if (arrendatarioId) pessoasParaRecalcular.add(arrendatarioId);
  if (antigoProprietearioId) pessoasParaRecalcular.add(antigoProprietearioId);
  if (antigoArrendatarioId) pessoasParaRecalcular.add(antigoArrendatarioId);

  // Recalcular para todas as pessoas afetadas
  for (const pessoaId of pessoasParaRecalcular) {
    await atualizarAreaEfetivaPessoa(pessoaId);
  }
}

/**
 * Middleware para recalcular área efetiva automaticamente
 */
export const areaEfetivaMiddleware = {
  
  // Após criar/atualizar propriedade
  afterPropriedadeChange: async (propriedadeId: number, oldProprietarioId?: number) => {
    const propriedade = await prisma.propriedade.findUnique({
      where: { id: propriedadeId },
      select: { proprietarioId: true }
    });

    await onPropriedadeArrendamentoChange(
      propriedade?.proprietarioId,
      undefined,
      oldProprietarioId
    );
  },

  // Após criar/atualizar arrendamento
  afterArrendamentoChange: async (
    arrendamentoId: number, 
    oldProprietarioId?: number, 
    oldArrendatarioId?: number
  ) => {
    const arrendamento = await prisma.arrendamento.findUnique({
      where: { id: arrendamentoId },
      select: { proprietarioId: true, arrendatarioId: true }
    });

    await onPropriedadeArrendamentoChange(
      arrendamento?.proprietarioId,
      arrendamento?.arrendatarioId,
      oldProprietarioId,
      oldArrendatarioId
    );
  },

  // Após deletar propriedade
  afterPropriedadeDelete: async (proprietarioId: number) => {
    await atualizarAreaEfetivaPessoa(proprietarioId);
  },

  // Após deletar arrendamento
  afterArrendamentoDelete: async (proprietarioId: number, arrendatarioId: number) => {
    await onPropriedadeArrendamentoChange(proprietarioId, arrendatarioId);
  },

  // Quando pessoa vira produtor rural
  afterPessoaVirarProdutor: async (pessoaId: number) => {
    await atualizarAreaEfetivaPessoa(pessoaId);
  },

  // Quando pessoa deixa de ser produtor rural
  afterPessoaDeixarProdutor: async (pessoaId: number) => {
    await prisma.areaEfetiva.deleteMany({
      where: { pessoaId }
    });
  }
};