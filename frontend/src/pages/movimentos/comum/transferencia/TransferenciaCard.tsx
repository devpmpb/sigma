import React from "react";
import { TransferenciaPropriedade } from "../../../../services/comum/transferenciaPropiedadeService";
import { formatarData } from "../../../../utils/formatters";

interface TransferenciaCardProps {
  transferencia: TransferenciaPropriedade;
  onClick: () => void;
}

const TransferenciaCard: React.FC<TransferenciaCardProps> = ({
  transferencia,
  onClick,
}) => {
  // Determinar o tipo de mudança
  const getTipoMudanca = () => {
    const mudouProprietario =
      transferencia.proprietarioAnteriorId !== transferencia.proprietarioNovoId;

    if (mudouProprietario) {
      return {
        label: "Transferência de Propriedade",
        color: "bg-blue-100 text-blue-800",
      };
    }
    return {
      label: "Alteração de Condôminos",
      color: "bg-purple-100 text-purple-800",
    };
  };

  // Badge para situação
  const getSituacaoBadge = () => {
    const situacoes: Record<string, { label: string; color: string }> = {
      PROPRIA: { label: "Própria", color: "bg-green-100 text-green-800" },
      CONDOMINIO: {
        label: "Condomínio",
        color: "bg-yellow-100 text-yellow-800",
      },
      USUFRUTO: { label: "Usufruto", color: "bg-orange-100 text-orange-800" },
    };

    const situacao = situacoes[transferencia.situacaoPropriedade || "PROPRIA"];
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${situacao.color}`}
      >
        {situacao.label}
      </span>
    );
  };

  const tipoMudanca = getTipoMudanca();

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {transferencia.propriedade?.nome ||
              `Propriedade #${transferencia.propriedadeId}`}
          </h3>
          {transferencia.propriedade?.matricula && (
            <p className="text-sm text-gray-500">
              Matrícula: {transferencia.propriedade.matricula}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${tipoMudanca.color}`}
          >
            {tipoMudanca.label}
          </span>
          {getSituacaoBadge()}
        </div>
      </div>

      {/* Transferência */}
      <div className="flex items-center gap-3 mb-3">
        {/* Proprietário Anterior */}
        <div className="flex-1 bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-500 mb-1">De:</p>
          <p className="font-medium text-gray-900">
            {transferencia.proprietarioAnterior?.nome ||
              `ID: ${transferencia.proprietarioAnteriorId}`}
          </p>
          {transferencia.proprietarioAnterior?.cpfCnpj && (
            <p className="text-xs text-gray-500">
              {transferencia.proprietarioAnterior.cpfCnpj}
            </p>
          )}
        </div>

        {/* Seta */}
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>

        {/* Proprietário Novo */}
        <div className="flex-1 bg-blue-50 rounded-md p-3">
          <p className="text-xs text-blue-600 mb-1">Para:</p>
          <p className="font-medium text-gray-900">
            {transferencia.proprietarioNovo?.nome ||
              `ID: ${transferencia.proprietarioNovoId}`}
          </p>
          {transferencia.proprietarioNovo?.cpfCnpj && (
            <p className="text-xs text-gray-500">
              {transferencia.proprietarioNovo.cpfCnpj}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-500">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {formatarData(transferencia.dataTransferencia, false)}
        </div>

        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
          Ver detalhes →
        </button>
      </div>
    </div>
  );
};

export default TransferenciaCard;
