// frontend/src/components/comum/HistoricoSolicitacao.tsx
import React, { useEffect, useState } from "react";
import solicitacaoBeneficioService from "../../services/comum/solicitacaoBeneficioService";

interface HistoricoItem {
  id: number;
  statusAnterior: string;
  statusNovo: string;
  usuario: string | number;
  motivo?: string;
  observacoes?: string;
  data: string;
  descricao: string;
}

interface HistoricoSolicitacaoProps {
  solicitacaoId: number;
}

/**
 * Componente para exibir o histórico de mudanças de status de uma solicitação
 */
const HistoricoSolicitacao: React.FC<HistoricoSolicitacaoProps> = ({ solicitacaoId }) => {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarHistorico = async () => {
      setLoading(true);
      setError(null);

      try {
        const resultado = await solicitacaoBeneficioService.getHistorico(solicitacaoId);
        setHistorico(resultado.historico);
      } catch (err: any) {
        console.error("Erro ao carregar histórico:", err);
        setError(err.response?.data?.erro || "Erro ao carregar histórico");
      } finally {
        setLoading(false);
      }
    };

    if (solicitacaoId) {
      carregarHistorico();
    }
  }, [solicitacaoId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">❌ {error}</p>
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">📋 Nenhuma mudança de status registrada</p>
      </div>
    );
  }

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(data);
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      "Pendente": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Em Análise": "bg-blue-100 text-blue-800 border-blue-300",
      "Aprovada": "bg-green-100 text-green-800 border-green-300",
      "Rejeitada": "bg-red-100 text-red-800 border-red-300",
      "Cancelada": "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          📜 Histórico de Mudanças
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Registro de todas as alterações de status desta solicitação
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {historico.map((item) => (
            <div
              key={item.id}
              className="relative pl-8 pb-4 border-l-2 border-gray-300 last:border-l-0 last:pb-0"
            >
              {/* Bolinha na linha do tempo */}
              <div className="absolute left-0 top-0 -ml-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>

              {/* Conteúdo do item */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                {/* Data e hora */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-medium">
                    {formatarData(item.data)}
                  </span>
                  <span className="text-xs text-gray-500">
                    por: {typeof item.usuario === 'number' ? `Usuário #${item.usuario}` : item.usuario}
                  </span>
                </div>

                {/* Descrição da mudança */}
                <p className="text-sm text-gray-700 font-medium mb-2">
                  {item.descricao}
                </p>

                {/* Status mudança visual */}
                <div className="flex items-center gap-2 mb-2">
                  {item.statusAnterior && item.statusAnterior !== "-" && (
                    <>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(item.statusAnterior)}`}>
                        {item.statusAnterior}
                      </span>
                      <span className="text-gray-400">→</span>
                    </>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(item.statusNovo)}`}>
                    {item.statusNovo}
                  </span>
                </div>

                {/* Motivo */}
                {item.motivo && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Motivo:</span> {item.motivo}
                    </p>
                  </div>
                )}

                {/* Observações */}
                {item.observacoes && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Observações:</span> {item.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 <strong>Dica:</strong> O histórico registra automaticamente todas as mudanças de status,
            permitindo auditoria completa da solicitação.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HistoricoSolicitacao;
