// frontend/src/components/comum/SaldoCard.tsx
// Componente para exibir saldo disponível de benefícios
// Atualizado com Feature 4: Distribuição proporcional entre arrendatários

import React, { useState, useEffect } from "react";
import saldoService, {
  SaldoProporcional,
  //LimiteProporcional,
} from "../../services/comum/saldoService";

interface SaldoCardProps {
  pessoaId: number;
  programaId: number;
  /** Se true, mostra versão compacta */
  compact?: boolean;
  /** Callback quando o saldo é carregado */
  onSaldoLoaded?: (saldo: SaldoProporcional) => void;
  /** Se true, usa cálculo proporcional (para arrendatários) */
  usarProporcional?: boolean;
}

const SaldoCard: React.FC<SaldoCardProps> = ({
  pessoaId,
  programaId,
  compact = false,
  onSaldoLoaded,
  usarProporcional = true, // Ativo por padrão
}) => {
  const [saldo, setSaldo] = useState<SaldoProporcional | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarDetalhesProporcional, setMostrarDetalhesProporcional] =
    useState(false);

  useEffect(() => {
    const carregarSaldo = async () => {
      if (!pessoaId || !programaId || pessoaId === 0 || programaId === 0) {
        setSaldo(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Usar endpoint proporcional se habilitado
        const resultado = usarProporcional
          ? await saldoService.getSaldoProporcional(pessoaId, programaId)
          : await saldoService.getSaldo(pessoaId, programaId);
        setSaldo(resultado);
        onSaldoLoaded?.(resultado);
      } catch (err: any) {
        console.error("Erro ao carregar saldo:", err);
        setError(err.response?.data?.erro || "Erro ao carregar saldo");
      } finally {
        setLoading(false);
      }
    };

    carregarSaldo();
  }, [pessoaId, programaId, usarProporcional, onSaldoLoaded]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  // No data
  if (!saldo) {
    return null;
  }

  // Verificar se tem limite proporcional aplicado
  const temProporcional =
    saldo.proporcional &&
    saldo.proporcional.propriedadesArrendadas.length > 0;

  // Compact version
  if (compact) {
    return (
      <div
        className={`border rounded-lg p-3 ${
          saldo.podeNovaSolicitacao
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {saldo.podeNovaSolicitacao ? "Saldo:" : "Saldo:"}
          </span>
          <span
            className={`font-bold ${
              saldo.podeNovaSolicitacao ? "text-green-700" : "text-red-700"
            }`}
          >
            {saldo.saldoDisponivel.toFixed(2)} {saldo.unidade}
          </span>
        </div>
        {temProporcional && (
          <p className="text-xs text-purple-600 mt-1">
            Limite proporcional ({saldo.proporcional!.percentualTotal.toFixed(0)}
            %)
          </p>
        )}
        {!saldo.podeNovaSolicitacao && saldo.proximaLiberacao && (
          <p className="text-xs text-red-600 mt-1">
            Próxima liberação: {saldo.proximaLiberacao}
          </p>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div
      className={`border rounded-lg p-4 ${
        saldo.podeNovaSolicitacao
          ? "bg-blue-50 border-blue-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          Saldo Disponível
          {temProporcional && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              Proporcional
            </span>
          )}
        </h4>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            saldo.podeNovaSolicitacao
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {saldo.podeNovaSolicitacao ? "Pode Solicitar" : "Limite Atingido"}
        </span>
      </div>

      {/* Saldo Principal */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-sm text-gray-600">Disponível</p>
          <p
            className={`text-2xl font-bold ${
              saldo.podeNovaSolicitacao ? "text-green-600" : "text-red-600"
            }`}
          >
            {saldo.saldoDisponivel.toFixed(2)}{" "}
            <span className="text-sm font-normal">{saldo.unidade}</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Valor Máximo</p>
          <p className="text-2xl font-bold text-gray-800">
            {saldoService.formatarValor(saldo.valorMaximoRestante)}
          </p>
        </div>
      </div>

      {/* Detalhes */}
      <div className="border-t border-gray-200 pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Limite do período
            {temProporcional && " (proporcional)"}:
          </span>
          <span className="font-medium">
            {saldo.limiteTotal.toFixed(2)} {saldo.unidade}
          </span>
        </div>
        {temProporcional && saldo.proporcional && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Limite original:</span>
            <span className="font-medium text-gray-500">
              {saldo.proporcional.limiteOriginal.toFixed(2)} {saldo.unidade}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Já utilizado:</span>
          <span className="font-medium text-orange-600">
            {saldo.jaUtilizado.toFixed(2)} {saldo.unidade}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Periodicidade:</span>
          <span className="font-medium">
            {saldoService.formatarPeriodicidade(saldo.periodicidade)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Ano referência:</span>
          <span className="font-medium">{saldo.anoReferencia}</span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              saldo.saldoDisponivel > 0 ? "bg-green-500" : "bg-red-500"
            }`}
            style={{
              width: `${Math.min(
                100,
                saldo.limiteTotal > 0
                  ? (saldo.jaUtilizado / saldo.limiteTotal) * 100
                  : 0
              )}%`,
            }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">
          {saldo.limiteTotal > 0
            ? ((saldo.jaUtilizado / saldo.limiteTotal) * 100).toFixed(1)
            : 0}
          % utilizado
        </p>
      </div>

      {/* Mensagem */}
      <p
        className={`mt-3 text-sm ${
          saldo.podeNovaSolicitacao ? "text-blue-700" : "text-red-700"
        }`}
      >
        {saldo.mensagem}
      </p>

      {/* Detalhes de Arrendamento (Feature 4) */}
      {temProporcional && saldo.proporcional && (
        <div className="mt-3 border-t border-purple-200 pt-3">
          <button
            onClick={() =>
              setMostrarDetalhesProporcional(!mostrarDetalhesProporcional)
            }
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            {mostrarDetalhesProporcional ? "▼" : "▶"} Detalhes do limite
            proporcional ({saldo.proporcional.percentualTotal.toFixed(1)}%)
          </button>

          {mostrarDetalhesProporcional && (
            <div className="mt-2 bg-purple-50 rounded p-3 space-y-2">
              <p className="text-xs text-purple-700">
                Limite calculado com base nas áreas arrendadas:
              </p>
              {saldo.proporcional.propriedadesArrendadas.map((prop, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-white rounded p-2 border border-purple-100"
                >
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proprietário:</span>
                    <span className="font-medium">{prop.proprietarioNome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Área arrendada:</span>
                    <span className="font-medium">
                      {prop.areaArrendada.toFixed(2)} de{" "}
                      {prop.areaTotalPropriedade.toFixed(2)} alq (
                      {prop.percentualPropriedade.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-purple-700">
                    <span>Limite contribuído:</span>
                    <span className="font-medium">
                      {prop.limiteContribuido.toFixed(2)} {saldo.unidade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Próxima liberação (se limite atingido) */}
      {!saldo.podeNovaSolicitacao && saldo.proximaLiberacao && (
        <p className="mt-2 text-sm text-gray-600">
          Próxima liberação: <strong>{saldo.proximaLiberacao}</strong>
        </p>
      )}

      {/* Histórico resumido */}
      {saldo.solicitacoesNoPeriodo.length > 0 && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Solicitações no período ({saldo.solicitacoesNoPeriodo.length}):
          </p>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {saldo.solicitacoesNoPeriodo.slice(0, 3).map((sol) => (
              <div
                key={sol.id}
                className="flex justify-between text-xs text-gray-600 bg-white p-2 rounded"
              >
                <span>
                  {new Date(sol.data).toLocaleDateString("pt-BR")} -{" "}
                  {sol.quantidade} {saldo.unidade}
                </span>
                <span
                  className={`font-medium ${
                    sol.status === "aprovada" || sol.status === "paga"
                      ? "text-green-600"
                      : sol.status === "rejeitada"
                        ? "text-red-600"
                        : "text-yellow-600"
                  }`}
                >
                  {sol.status}
                </span>
              </div>
            ))}
            {saldo.solicitacoesNoPeriodo.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{saldo.solicitacoesNoPeriodo.length - 3} mais...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SaldoCard;
