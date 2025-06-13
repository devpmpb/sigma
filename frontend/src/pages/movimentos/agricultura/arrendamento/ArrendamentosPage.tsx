// frontend/src/pages/movimentos/comum/arrendamentos/ArrendamentosPage.tsx
import React from "react";
import { useNavigate } from "@tanstack/react-router";
import arrendamentoService, { 
  Arrendamento, 
  StatusArrendamento 
} from "../../../../services/agricultura/arrendamentoService";
import ArrendamentoForm from "./ArrendamentoForm";
import ArrendamentoDashboard from "./ArrendamentoDashboard";
import { Column } from "../../../../components/common/DataTable";
import { ModuleType } from "../../../../types";
import { MovimentoBase } from "../../../../components/movimento";

/**
 * Página principal de movimentos de arrendamento
 * Usa MovimentoBase para funcionalidades avançadas
 */
const ArrendamentosPage: React.FC = () => {
  const navigate = useNavigate();

  // Definição das colunas da tabela
  const columns: Column<Arrendamento>[] = [
    {
      title: "Propriedade",
      key: "propriedade",
      render: (arrendamento) => (
        <div>
          <div className="font-medium text-gray-900">
            {arrendamento.propriedade?.nome || `Propriedade ${arrendamento.propriedadeId}`}
          </div>
          {arrendamento.propriedade?.localizacao && (
            <div className="text-sm text-gray-500">
              {arrendamento.propriedade.localizacao}
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      title: "Proprietário",
      key: "proprietario",
      render: (arrendamento) => (
        <div>
          <div className="font-medium text-gray-900">
            {arrendamento.proprietario?.pessoa?.nome || `ID: ${arrendamento.proprietarioId}`}
          </div>
          {arrendamento.proprietario?.pessoa?.cpfCnpj && (
            <div className="text-sm text-gray-500">
              {arrendamento.proprietario.pessoa.cpfCnpj}
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      title: "Arrendatário",
      key: "arrendatario", 
      render: (arrendamento) => (
        <div>
          <div className="font-medium text-gray-900">
            {arrendamento.arrendatario?.pessoa?.nome || `ID: ${arrendamento.arrendatarioId}`}
          </div>
          {arrendamento.arrendatario?.pessoa?.cpfCnpj && (
            <div className="text-sm text-gray-500">
              {arrendamento.arrendatario.pessoa.cpfCnpj}
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      title: "Área",
      key: "areaArrendada",
      render: (arrendamento) => (
        <div className="text-right">
          <span className="font-medium">
            {arrendamentoService.formatarArea(arrendamento.areaArrendada)}
          </span>
        </div>
      ),
      sortable: true,
      width: "120px",
    },
    {
      title: "Período",
      key: "periodo",
      render: (arrendamento) => (
        <div className="text-sm">
          <div className="font-medium">
            Início: {new Date(arrendamento.dataInicio).toLocaleDateString('pt-BR')}
          </div>
          {arrendamento.dataFim ? (
            <div>
              Fim: {new Date(arrendamento.dataFim).toLocaleDateString('pt-BR')}
            </div>
          ) : (
            <div className="text-gray-500 italic">Prazo indeterminado</div>
          )}
        </div>
      ),
      sortable: false,
      width: "150px",
    },
    {
      title: "Duração",
      key: "duracao",
      render: (arrendamento) => (
        <div className="text-sm text-gray-600">
          {arrendamentoService.calcularDuracao(arrendamento.dataInicio, arrendamento.dataFim)}
        </div>
      ),
      sortable: false,
      width: "120px",
    },
    {
      title: "Ações",
      key: "acoes",
      render: (arrendamento) => (
        <div className="flex items-center space-x-2">
          {/* Botão para finalizar arrendamento (se ativo) */}
          {arrendamento.status === StatusArrendamento.ATIVO && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (window.confirm("Finalizar este arrendamento?")) {
                  try {
                    await arrendamentoService.finalizarArrendamento(arrendamento.id);
                    window.location.reload();
                  } catch (error) {
                    alert("Erro ao finalizar arrendamento");
                  }
                }
              }}
              className="text-orange-600 hover:text-orange-800 text-sm"
              title="Finalizar arrendamento"
            >
              🏁
            </button>
          )}

          {/* Link para documento (se existir) 
          </div>{arrendamento.documentoUrl && (
            
              href={arrendamento.documentoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 text-sm"
              title="Ver documento"
              onClick={(e) => e.stopPropagation()}
            >
              📄
            </a>
          )}*/}
        </div>
      ),
      sortable: false,
      width: "100px",
    },
  ];

  // Configuração de status
  const statusConfig = {
    field: "status",
    options: arrendamentoService.getStatusOptions(),
  };

  // Filtros rápidos
  const quickFilters = [
    {
      label: "Ativos",
      filter: (items: Arrendamento[]) => items.filter(item => item.status === StatusArrendamento.ATIVO),
      color: "green",
    },
    {
      label: "Vencidos", 
      filter: (items: Arrendamento[]) => items.filter(item => arrendamentoService.isVencido(item)),
      color: "red",
    },
    {
      label: "Próximos Vencimento",
      filter: (items: Arrendamento[]) => items.filter(item => arrendamentoService.isProximoVencimento(item)),
      color: "yellow",
    },
    {
      label: "Indeterminado",
      filter: (items: Arrendamento[]) => items.filter(item => !item.dataFim),
      color: "blue",
    },
  ];

  // Função para calcular métricas
  const calculateMetrics = (items: Arrendamento[]) => {
    const ativos = items.filter(item => item.status === StatusArrendamento.ATIVO);
    const vencidos = items.filter(item => arrendamentoService.isVencido(item));
    const proximosVencimento = items.filter(item => arrendamentoService.isProximoVencimento(item));
    const areaTotal = ativos.reduce((sum, item) => sum + Number(item.areaArrendada), 0);

    return {
      total: items.length,
      ativos: ativos.length,
      vencidos: vencidos.length,
      proximosVencimento: proximosVencimento.length,
      areaTotal: `${areaTotal.toFixed(1)} ha`,
    };
  };

  // Botões adicionais na barra de ações
  const actionButtons = (
    <div className="flex space-x-2">
      <button
        onClick={() => navigate({ to: "/relatorios/arrendamentos" })}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        title="Gerar relatórios"
      >
        📊 Relatórios
      </button>
      
      <button
        onClick={async () => {
          try {
            const vencidos = await arrendamentoService.getArrendamentosVencidos();
            if (vencidos.length > 0) {
              alert(`Há ${vencidos.length} arrendamento(s) vencido(s)`);
            } else {
              alert("Nenhum arrendamento vencido encontrado");
            }
          } catch (error) {
            alert("Erro ao verificar arrendamentos vencidos");
          }
        }}
        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
        title="Verificar vencimentos"
      >
        ⚠️ Vencidos
      </button>
    </div>
  );

  return (
    <MovimentoBase<Arrendamento, any>
      title="Arrendamentos"
      service={arrendamentoService}
      columns={columns}
      rowKey="id"
      baseUrl="/movimentos/arrendamentos"
      module="comum" as ModuleType
      FormComponent={ArrendamentoForm}
      DashboardComponent={ArrendamentoDashboard}
      showDashboard={true}
      showSearch={true}
      searchPlaceholder="Buscar por propriedade, proprietário ou arrendatário..."
      actionButtons={actionButtons}
      statusConfig={statusConfig}
      quickFilters={quickFilters}
      showMetrics={true}
      calculateMetrics={calculateMetrics}
    />
  );
};

export default ArrendamentosPage;