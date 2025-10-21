// backend/src/services/historicoService.ts
import prisma from "../utils/prisma";

/**
 * Cria um registro no histórico de mudança de status
 */
export async function registrarMudancaStatus(
  solicitacaoId: number,
  statusAnterior: string | null,
  statusNovo: string,
  usuarioId?: number,
  motivo?: string,
  observacoes?: string
) {
  return await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId,
      statusAnterior,
      statusNovo,
      usuarioId,
      motivo,
      observacoes
    }
  });
}

/**
 * Busca o histórico completo de uma solicitação
 */
export async function buscarHistorico(solicitacaoId: number) {
  return await prisma.historicoSolicitacao.findMany({
    where: { solicitacaoId },
    orderBy: { createdAt: 'asc' }
  });
}

/**
 * Busca o histórico formatado com informações adicionais
 */
export async function buscarHistoricoFormatado(solicitacaoId: number) {
  const historico = await prisma.historicoSolicitacao.findMany({
    where: { solicitacaoId },
    orderBy: { createdAt: 'asc' }
  });

  return historico.map(registro => ({
    id: registro.id,
    statusAnterior: formatarStatus(registro.statusAnterior),
    statusNovo: formatarStatus(registro.statusNovo),
    usuario: registro.usuarioId || "Sistema",
    motivo: registro.motivo,
    observacoes: registro.observacoes,
    data: registro.createdAt,
    descricao: gerarDescricao(registro)
  }));
}

/**
 * Formata o status para exibição
 */
function formatarStatus(status: string | null): string {
  if (!status) return "-";

  const statusMap: Record<string, string> = {
    'pendente': 'Pendente',
    'em_analise': 'Em Análise',
    'aprovada': 'Aprovada',
    'rejeitada': 'Rejeitada',
    'cancelada': 'Cancelada'
  };

  return statusMap[status] || status;
}

/**
 * Gera descrição amigável da mudança
 */
function gerarDescricao(registro: any): string {
  const statusAnterior = formatarStatus(registro.statusAnterior);
  const statusNovo = formatarStatus(registro.statusNovo);

  if (!registro.statusAnterior) {
    return `Solicitação criada com status "${statusNovo}"`;
  }

  let descricao = `Status alterado de "${statusAnterior}" para "${statusNovo}"`;

  if (registro.motivo) {
    descricao += ` - ${registro.motivo}`;
  }

  return descricao;
}
