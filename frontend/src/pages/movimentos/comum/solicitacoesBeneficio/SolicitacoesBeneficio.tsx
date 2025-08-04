// frontend/src/pages/movimentos/comum/SolicitacoesBeneficio.tsx - ARQUIVO COMPLETO SUBSTITUÍDO
import React from "react";
import { formatarData } from "../../../../utils/formatters";
import { Column } from "../../../../components/comum/DataTable";
import solicitacaoBeneficioService, {
  SolicitacaoBeneficio,
  SolicitacaoBeneficioDTO,
  StatusSolicitacao,
} from "../../../../services/comum/solicitacaoBeneficioService";
import programaService, {
  TipoPerfil,
} from "../../../../services/comum/programaService";
import { CadastroBase } from "../../../../components/cadastro";
import SolicitacaoBeneficioForm from "./SolicitacaoBeneficioForm";

const SolicitacoesBeneficio: React.FC = () => {
  // Definição das colunas da tabela
  const columns: Column<SolicitacaoBeneficio>[] = [
    {
      title: "ID",
      key: "id",
      width: "80px",
    },
    {
      title: "Data",
      key: "datasolicitacao",
      render: (solicitacao) => formatarData(solicitacao.datasolicitacao),
    },
    {
      title: "Pessoa",
      key: "pessoa",
      render: (solicitacao) => (
        <div>
          <div className="font-medium">{solicitacao.pessoa.nome}</div>
          <div className="text-sm text-gray-500">
            {solicitacao.pessoa.cpfCnpj}
            {solicitacao.pessoa.produtor && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Produtor
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Programa",
      key: "programa",
      render: (solicitacao) => (
        <div>
          <div className="font-medium">{solicitacao.programa.nome}</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                programaService.getSecretariaColor(
                  solicitacao.programa.secretaria
                ) === "green"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {programaService.formatarSecretaria(
                solicitacao.programa.secretaria
              )}
            </span>
            <span className="text-xs text-gray-500">
              {solicitacao.programa.tipoPrograma}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Valor Solicitado",
      key: "valorSolicitado",
      align: "right",
      render: (solicitacao) => (
        <div className="text-right">
          {solicitacao.valorSolicitado ? (
            <span className="font-medium">
              {solicitacaoBeneficioService.formatarValor(
                solicitacao.valorSolicitado
              )}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      title: "Valor Aprovado",
      key: "valorAprovado",
      align: "right",
      render: (solicitacao) => (
        <div className="text-right">
          {solicitacao.valorAprovado ? (
            <span className="font-medium text-green-600">
              {solicitacaoBeneficioService.formatarValor(
                solicitacao.valorAprovado
              )}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (solicitacao) => {
        const cor = solicitacaoBeneficioService.getStatusColor(
          solicitacao.status
        );
        const corClasses = {
          green: "bg-green-100 text-green-800",
          red: "bg-red-100 text-red-800",
          yellow: "bg-yellow-100 text-yellow-800",
          blue: "bg-blue-100 text-blue-800",
          gray: "bg-gray-100 text-gray-800",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${corClasses[cor]}`}
          >
            {solicitacaoBeneficioService.formatarStatus(solicitacao.status)}
          </span>
        );
      },
    },
  ];

  // Filtros rápidos
  const quickFilters = [
    {
      label: "Pendentes",
      filter: (items: SolicitacaoBeneficio[]) =>
        items.filter((s) => s.status === StatusSolicitacao.PENDENTE),
    },
    {
      label: "Em Análise",
      filter: (items: SolicitacaoBeneficio[]) =>
        items.filter((s) => s.status === StatusSolicitacao.EM_ANALISE),
    },
    {
      label: "Aprovadas",
      filter: (items: SolicitacaoBeneficio[]) =>
        items.filter((s) => s.status === StatusSolicitacao.APROVADA),
    },
    {
      label: "Agricultura",
      filter: (items: SolicitacaoBeneficio[]) =>
        items.filter((s) => s.programa.secretaria === TipoPerfil.AGRICULTURA),
    },
    {
      label: "Obras",
      filter: (items: SolicitacaoBeneficio[]) =>
        items.filter((s) => s.programa.secretaria === TipoPerfil.OBRAS),
    },
    {
      label: "Com Valor",
      filter: (items: SolicitacaoBeneficio[]) =>
        items.filter((s) => s.valorSolicitado && s.valorSolicitado > 0),
    },
  ];

  // Função para calcular métricas
  const calculateMetrics = (items: SolicitacaoBeneficio[]) => {
    const total = items.length;
    const porStatus = {
      pendentes: items.filter((s) => s.status === StatusSolicitacao.PENDENTE)
        .length,
      emAnalise: items.filter((s) => s.status === StatusSolicitacao.EM_ANALISE)
        .length,
      aprovadas: items.filter((s) => s.status === StatusSolicitacao.APROVADA)
        .length,
      rejeitadas: items.filter((s) => s.status === StatusSolicitacao.REJEITADA)
        .length,
    };
    const porSecretaria = {
      agricultura: items.filter(
        (s) => s.programa.secretaria === TipoPerfil.AGRICULTURA
      ).length,
      obras: items.filter((s) => s.programa.secretaria === TipoPerfil.OBRAS)
        .length,
    };
    const valorTotalSolicitado = items
      .filter((s) => s.valorSolicitado)
      .reduce((sum, s) => sum + (s.valorSolicitado || 0), 0);
    const valorTotalAprovado = items
      .filter((s) => s.valorAprovado)
      .reduce((sum, s) => sum + (s.valorAprovado || 0), 0);

    return {
      total,
      porStatus,
      porSecretaria,
      valorTotalSolicitado,
      valorTotalAprovado,
    };
  };

  // Botões de ação adicionais
  const actionButtons = (
    <>
      <button
        onClick={() =>
          window.open("/relatorios/solicitacoes-beneficio", "_blank")
        }
        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Relatório
      </button>

      <button
        onClick={() => console.log("Dashboard de solicitações")}
        className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Dashboard
      </button>

      <button
        onClick={() => window.open("/movimentos/comum/avaliacoes", "_blank")}
        className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-2"
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
        Avaliações
      </button>
    </>
  );

  return (
    <CadastroBase<SolicitacaoBeneficio, SolicitacaoBeneficioDTO>
      title="Solicitações de Benefício"
      service={solicitacaoBeneficioService}
      columns={columns}
      rowKey="id"
      baseUrl="/movimentos/comum/solicitacoes"
      module="comum"
      FormComponent={SolicitacaoBeneficioForm}
      searchPlaceholder="Buscar por pessoa, programa ou observações..."
      actionButtons={actionButtons}
      // Configurações específicas de movimento
      quickFilters={quickFilters}
      showMetrics={true}
      calculateMetrics={calculateMetrics}
      statusConfig={{
        field: "status",
        options: solicitacaoBeneficioService.getStatusOptions(),
      }}
    />
  );
};

export default SolicitacoesBeneficio;
