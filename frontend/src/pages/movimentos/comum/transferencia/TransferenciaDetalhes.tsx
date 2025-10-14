import React, { useEffect, useState } from "react";
import { TransferenciaPropriedade } from "../../../../services/comum/transferenciaPropiedadeService";
import { formatarData } from "../../../../utils/formatters";
import propriedadeCondominoService, {
  PropriedadeCondomino,
} from "../../../../services/comum/propriedadeCondominoService";

interface TransferenciaDetalhesProps {
  transferencia: TransferenciaPropriedade;
}

const TransferenciaDetalhes: React.FC<TransferenciaDetalhesProps> = ({
  transferencia,
}) => {
  const [condominosAtuais, setCondominosAtuais] = useState<
    PropriedadeCondomino[]
  >([]);
  const [loadingCondominos, setLoadingCondominos] = useState(false);

  useEffect(() => {
    const fetchCondominos = async () => {
      if (transferencia.situacaoPropriedade === "CONDOMINIO") {
        setLoadingCondominos(true);
        try {
          const condominos =
            await propriedadeCondominoService.getCondominos(
              transferencia.propriedadeId,
              true // Apenas ativos
            );
          setCondominosAtuais(condominos);
        } catch (error) {
          console.error("Erro ao carregar condôminos:", error);
        } finally {
          setLoadingCondominos(false);
        }
      }
    };

    fetchCondominos();
  }, [transferencia]);

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

    const situacao =
      situacoes[transferencia.situacaoPropriedade || "PROPRIA"];
    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded-full ${situacao.color}`}
      >
        {situacao.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Informações da Propriedade */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Propriedade
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-blue-700 font-medium">Nome:</p>
            <p className="text-gray-900">
              {transferencia.propriedade?.nome ||
                `ID: ${transferencia.propriedadeId}`}
            </p>
          </div>
          {transferencia.propriedade?.matricula && (
            <div>
              <p className="text-sm text-blue-700 font-medium">Matrícula:</p>
              <p className="text-gray-900">
                {transferencia.propriedade.matricula}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-blue-700 font-medium">Tipo:</p>
            <p className="text-gray-900">
              {transferencia.propriedade?.tipoPropriedade || "-"}
            </p>
          </div>
          {transferencia.propriedade?.areaTotal && (
            <div>
              <p className="text-sm text-blue-700 font-medium">Área:</p>
              <p className="text-gray-900">
                {transferencia.propriedade.areaTotal}{" "}
                {transferencia.propriedade.unidadeArea || "alqueires"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dados da Transferência */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          Detalhes da Transferência
        </h4>

        <div className="space-y-4">
          {/* Data */}
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-gray-400"
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
            <div>
              <p className="text-sm text-gray-500">Data da Transferência:</p>
              <p className="font-medium text-gray-900">
                {formatarData(transferencia.dataTransferencia, false)}
              </p>
            </div>
          </div>

          {/* Situação */}
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm text-gray-500">
                Situação após transferência:
              </p>
              <div className="mt-1">{getSituacaoBadge()}</div>
            </div>
          </div>

          {/* Proprietários */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Proprietário Anterior */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">
                Proprietário Anterior:
              </p>
              <p className="font-semibold text-gray-900">
                {transferencia.proprietarioAnterior?.nome ||
                  `ID: ${transferencia.proprietarioAnteriorId}`}
              </p>
              {transferencia.proprietarioAnterior?.cpfCnpj && (
                <p className="text-sm text-gray-600 mt-1">
                  CPF/CNPJ: {transferencia.proprietarioAnterior.cpfCnpj}
                </p>
              )}
            </div>

            {/* Proprietário Novo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-2">Novo Proprietário:</p>
              <p className="font-semibold text-gray-900">
                {transferencia.proprietarioNovo?.nome ||
                  `ID: ${transferencia.proprietarioNovoId}`}
              </p>
              {transferencia.proprietarioNovo?.cpfCnpj && (
                <p className="text-sm text-gray-600 mt-1">
                  CPF/CNPJ: {transferencia.proprietarioNovo.cpfCnpj}
                </p>
              )}
            </div>
          </div>

          {/* Nu-Proprietário (se for USUFRUTO) */}
          {transferencia.situacaoPropriedade === "USUFRUTO" &&
            transferencia.nuProprietarioNovo && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-700 mb-2">Nu-Proprietário:</p>
                <p className="font-semibold text-gray-900">
                  {transferencia.nuProprietarioNovo.nome}
                </p>
                {transferencia.nuProprietarioNovo.cpfCnpj && (
                  <p className="text-sm text-gray-600 mt-1">
                    CPF/CNPJ: {transferencia.nuProprietarioNovo.cpfCnpj}
                  </p>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Condôminos (se for CONDOMÍNIO) */}
      {transferencia.situacaoPropriedade === "CONDOMINIO" && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Condôminos Atuais
          </h4>

          {loadingCondominos ? (
            <p className="text-gray-500">Carregando condôminos...</p>
          ) : condominosAtuais.length > 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-yellow-200">
                <thead className="bg-yellow-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-900 uppercase">
                      Condômino
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-900 uppercase">
                      Percentual
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-900 uppercase">
                      Data Início
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-200">
                  {condominosAtuais.map((condomino) => (
                    <tr key={condomino.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {condomino.condomino?.nome || `ID: ${condomino.condominoId}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {condomino.percentual ? `${condomino.percentual}%` : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {condomino.dataInicio
                          ? formatarData(condomino.dataInicio, false)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">Nenhum condômino cadastrado.</p>
          )}
        </div>
      )}

      {/* Observações */}
      {transferencia.observacoes && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Observações
          </h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {transferencia.observacoes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferenciaDetalhes;
