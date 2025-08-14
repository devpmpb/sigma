// frontend/src/pages/movimentos/obras/ordemServico/OrdensServico.tsx
import React from "react";
import { formatarData, formatarMoeda } from "../../../../utils/formatters";
import StatusBadge from "../../../../components/comum/StatusBadge";
import { Column } from "../../../../components/comum/DataTable";
import ordemServicoService, {
  OrdemServico,
  StatusOrdemServico,
} from "../../../../services/obras/ordemServicoService";
import { CadastroBase } from "../../../../components/cadastro";
//import OrdemServicoForm from "./OrdemServicoForm";

const OrdensServico: React.FC = () => {
  // Definição das colunas da tabela
  const columns: Column<OrdemServico>[] = [
    { 
      title: "Nº Ordem", 
      key: "numeroOrdem", 
      width: "120px",
      render: (ordem) => (
        <span className="font-mono font-semibold text-blue-700">
          {ordem.numeroOrdem}
        </span>
      ),
    },
    {
      title: "Solicitante",
      key: "pessoa",
      render: (ordem) => (
        <div>
          <div className="font-medium">{ordem.pessoa?.nome}</div>
          <div className="text-xs text-gray-500">{ordem.pessoa?.cpfCnpj}</div>
        </div>
      ),
    },
    {
      title: "Veículo",
      key: "veiculo",
      render: (ordem) => (
        <div>
          <div className="font-medium">{ordem.veiculo?.descricao}</div>
          <div className="text-xs text-gray-500">
            {ordem.veiculo?.tipoVeiculo?.descricao} • {ordem.veiculo?.placa}
          </div>
        </div>
      ),
    },
    {
      title: "Data/Horário",
      key: "dataServico",
      render: (ordem) => (
        <div>
          <div className="font-medium">{formatarData(ordem.dataServico)}</div>
          <div className="text-xs text-gray-500">
            {ordem.horaInicio && ordem.horaFim ? (
              <span className="text-green-600">
                ✓ {ordem.horaInicio} às {ordem.horaFim}
              </span>
            ) : ordem.horasEstimadas ? (
              <span className="text-blue-600">
                ⏱ {ordem.horasEstimadas}h estimadas
              </span>
            ) : (
              <span className="text-gray-400">Aguardando execução</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Valor",
      key: "valorCalculado",
      render: (ordem) => (
        <div className="text-right">
          <div className="font-bold text-green-700">
            {formatarMoeda(ordem.valorCalculado)}
          </div>
          <div className="text-xs text-gray-500">
            VR: {formatarMoeda(ordem.valorReferencial)}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (ordem) => (
        <StatusBadge
          ativo={ordem.status === StatusOrdemServico.CONCLUIDA}
          showToggle={false}
          customText={ordemServicoService.formatarStatus(ordem.status)}
          customColor={ordemServicoService.getCorStatus(ordem.status)}
        />
      ),
    },
    {
      title: "Criado em",
      key: "createdAt",
      render: (ordem) => formatarData(ordem.createdAt),
      width: "140px",
    },
  ];

  // Filtros rápidos por status
  const quickFilters = [
    {
      label: "Pendentes",
      filter: (items: OrdemServico[]) =>
        items.filter((item) => item.status === StatusOrdemServico.PENDENTE),
      color: "yellow",
    },
    {
      label: "Em Execução",
      filter: (items: OrdemServico[]) =>
        items.filter((item) => item.status === StatusOrdemServico.EM_EXECUCAO),
      color: "blue",
    },
    {
      label: "Concluídas",
      filter: (items: OrdemServico[]) =>
        items.filter((item) => item.status === StatusOrdemServico.CONCLUIDA),
      color: "green",
    },
  ];

  // Função para calcular métricas
  const calculateMetrics = (items: OrdemServico[]) => {
    const total = items.length;
    const pendentes = items.filter((s) => s.status === StatusOrdemServico.PENDENTE).length;
    const emExecucao = items.filter((s) => s.status === StatusOrdemServico.EM_EXECUCAO).length;
    const concluidas = items.filter((s) => s.status === StatusOrdemServico.CONCLUIDA).length;
    const valorTotal = items
      .filter((s) => s.status !== StatusOrdemServico.CANCELADA)
      .reduce((acc, curr) => acc + curr.valorCalculado, 0);

    return {
      total,
      pendentes,
      emExecucao,
      concluidas,
      valorTotal,
    };
  };

  // Configuração de status para movimentos
  const statusConfig = {
    field: "status",
    options: [
      {
        value: StatusOrdemServico.PENDENTE,
        label: "Pendente",
        color: "yellow" as const,
      },
      {
        value: StatusOrdemServico.EM_EXECUCAO,
        label: "Em Execução", 
        color: "blue" as const,
      },
      {
        value: StatusOrdemServico.CONCLUIDA,
        label: "Concluída",
        color: "green" as const,
      },
      {
        value: StatusOrdemServico.CANCELADA,
        label: "Cancelada",
        color: "red" as const,
      },
    ],
  };

  // Botões de ação adicionais
  const actionButtons = (
    <div className="flex gap-2">
      <button
        onClick={() => window.open("/relatorios/ordens-servico", "_blank")}
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
        onClick={async () => {
          try {
            const stats = await ordemServicoService.getEstatisticas();
            alert(
              `Estatísticas:\n` +
              `Total: ${stats.total}\n` +
              `Pendentes: ${stats.pendentes}\n` +
              `Em Execução: ${stats.emExecucao}\n` +
              `Concluídas: ${stats.concluidas}\n` +
              `Valor Total: ${formatarMoeda(stats.valorTotal)}`
            );
          } catch (error) {
            alert("Erro ao buscar estatísticas");
          }
        }}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
      >
        📊 Estatísticas
      </button>
    </div>
  );

  return (
    <CadastroBase<OrdemServico, any>
      title="Ordens de Serviço"
      service={ordemServicoService}
      columns={columns}
      rowKey="id"
      baseUrl="/movimentos/obras/ordens-servico"
      module="obras"
      //FormComponent={OrdemServicoForm}
      showSearch={true}
      searchPlaceholder="Buscar por número da ordem, solicitante ou veículo..."
      actionButtons={actionButtons}
      // Props específicas para movimentos
      showMetrics={true}
      calculateMetrics={calculateMetrics}
      quickFilters={quickFilters}
      statusConfig={statusConfig}
    />
  );
};

export default OrdensServico;