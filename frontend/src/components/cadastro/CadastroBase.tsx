// frontend/src/components/cadastro/CadastroBase.tsx - VERSÃO ESTENDIDA
import React, { useEffect, useState, ReactNode } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import SearchBar from "../common/SearchBar";
import DataTable, { Column } from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";
import BaseApiService from "../../services/baseApiService";
import useApiService from "../../hooks/useApiService";
import usePermissions from "../../hooks/usePermissions";
import { ModuleType } from "../../types";

interface CadastroBaseProps<T, R> {
  /**
   * Page title
   */
  title: string;

  /**
   * API service for the registration
   */
  service: BaseApiService<T, R>;

  /**
   * Table columns
   */
  columns: Column<T>[];

  /**
   * Unique key for each row
   */
  rowKey: string | ((item: T, index: number) => string | number);

  /**
   * Base URL for navigation (ex: "/cadastros/produtos")
   */
  baseUrl: string;

  /**
   * Module (obras, agricultura or comum)
   */
  module: ModuleType;

  /**
   * Form component
   */
  FormComponent?: React.ComponentType<{
    id?: string | number;
    onSave: () => void;
    module?: ModuleType;
  }>;

  /**
   * Whether to show the search bar
   */
  showSearch?: boolean;

  /**
   * Placeholder for the search bar
   */
  searchPlaceholder?: string;

  /**
   * Additional buttons for the action bar
   */
  actionButtons?: ReactNode;

  /**
   * Enable status toggle functionality
   * Automatically adds a status column with toggle button
   */
  enableStatusToggle?: boolean;

  /**
   * Custom status column configuration
   */
  statusColumn?: {
    title?: string;
    activeText?: string;
    inactiveText?: string;
  };

  // 🆕 NOVAS PROPS PARA MOVIMENTOS
  /**
   * Mostrar dashboard na parte superior
   */
  showDashboard?: boolean;

  /**
   * Componente de dashboard
   */
  DashboardComponent?: React.ComponentType;

  /**
   * Filtros rápidos por status/categoria
   */
  quickFilters?: Array<{
    label: string;
    filter: (items: T[]) => T[];
    color?: string;
  }>;

  /**
   * Exibir métricas resumidas
   */
  showMetrics?: boolean;

  /**
   * Função para calcular métricas
   */
  calculateMetrics?: (items: T[]) => Record<string, any>;

  /**
   * Configuração de status personalizada para movimentos
   */
  statusConfig?: {
    field: string;
    options: Array<{
      value: string;
      label: string;
      color: "green" | "red" | "yellow" | "blue" | "gray";
    }>;
  };
}

/**
 * Base component for registration screens
 * Manages listing and navigation to the form
 * AGORA SUPORTA MOVIMENTOS TAMBÉM!
 */
function CadastroBase<T extends Record<string, any>, R>({
  title,
  service,
  columns,
  rowKey,
  baseUrl,
  module,
  FormComponent,
  showSearch = true,
  searchPlaceholder = "Buscar...",
  actionButtons,
  enableStatusToggle = false,
  statusColumn = {},
  // 🆕 NOVAS PROPS
  showDashboard = false,
  DashboardComponent,
  quickFilters = [],
  showMetrics = false,
  calculateMetrics,
  statusConfig,
}: CadastroBaseProps<T, R>) {
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const navigate = useNavigate();
  const params = useParams({ strict: false });

  // Permission check
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(module, "create");
  const canEdit = hasPermission(module, "edit");
  const canDelete = hasPermission(module, "delete");

  // API hook
  const { data, loading, error, fetchAll, searchByTerm, toggleStatus } =
    useApiService<T, R>(service);

  // Load initial data
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 🆕 Calcular métricas quando dados mudarem
  useEffect(() => {
    if (showMetrics && calculateMetrics && data) {
      const calculatedMetrics = calculateMetrics(data);
      setMetrics(calculatedMetrics);
    }
  }, [data, showMetrics, calculateMetrics]);

  // Check if in form view mode
  const isFormView = params && params.id !== undefined;

  // Function to handle search
  const handleSearch = (termo: string) => {
    setTermoBusca(termo);
    setFiltroAtivo(null); // Limpar filtro ativo
    searchByTerm(termo);
  };

  // 🆕 Função para aplicar filtro rápido
  const handleQuickFilter = (filterLabel: string) => {
    if (filtroAtivo === filterLabel) {
      // Se já está ativo, desativar
      setFiltroAtivo(null);
      fetchAll();
    } else {
      setFiltroAtivo(filterLabel);
      // Em produção, isso seria feito no backend
      fetchAll();
    }
  };

  // Function to create new record
  const handleCreate = () => {
    navigate({ to: `${baseUrl}/novo` });
  };

  // Function to edit a record
  const handleEdit = (item: T) => {
    const id = typeof rowKey === "function" ? rowKey(item, 0) : item[rowKey];
    navigate({ to: `${baseUrl}/${id}` });
  };

  // Function to delete a record
  const handleDelete = async (item: T) => {
    if (!window.confirm(`Tem certeza que deseja excluir este registro?`)) {
      return;
    }

    const id = typeof rowKey === "function" ? rowKey(item, 0) : item[rowKey];

    try {
      await service.delete(id);
      alert("Registro excluído com sucesso!");
      fetchAll();
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      alert("Erro ao excluir registro. Verifique se não existem dependências.");
    }
  };

  // Function to toggle status
  const handleToggleStatus = async (item: T, event?: React.MouseEvent) => {
    // Prevenir propagação do evento para evitar redirecionamento
    if (event) {
      event.stopPropagation();
    }

    try {
      const isAtivo = item.ativo === true;
      const statusText = isAtivo ? "inativar" : "ativar";

      if (
        window.confirm(`Tem certeza que deseja ${statusText} este registro?`)
      ) {
        await toggleStatus(item.id, !isAtivo);
        fetchAll();
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status do registro.");
    }
  };

  // 🆕 Renderizar status badge customizado para movimentos
  const renderCustomStatusBadge = (item: T) => {
    if (!statusConfig) return null;

    const status = item[statusConfig.field];
    const statusOption = statusConfig.options.find(
      (opt) => opt.value === status
    );

    if (!statusOption) return status;

    return (
      <StatusBadge
        status={status}
        activeText={statusOption.label}
        color={statusOption.color}
      />
    );
  };

  // 🆕 Adicionar coluna de status customizada se configurada
  const enhancedColumns = statusConfig
    ? [
        ...columns,
        {
          title: "Status",
          key: statusConfig.field,
          render: renderCustomStatusBadge,
          sortable: true,
          width: "120px",
        },
      ]
    : columns;

  // Add standard status column if enabled
  const finalColumns = enableStatusToggle
    ? [
        ...enhancedColumns,
        {
          title: statusColumn.title || "Status",
          key: "status",
          render: (item: T) => (
            <div
              onClick={(e) => canEdit && handleToggleStatus(item, e)}
              className={canEdit ? "cursor-pointer" : ""}
            >
              <StatusBadge
                status={item.ativo}
                activeText={statusColumn.activeText || "Ativo"}
                inactiveText={statusColumn.inactiveText || "Inativo"}
              />
            </div>
          ),
          sortable: true,
          width: "100px",
        },
      ]
    : enhancedColumns;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erro ao carregar dados: {error}</p>
          <button
            onClick={fetchAll}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      {/* 🆕 Dashboard */}
      {showDashboard && DashboardComponent && (
        <div className="mb-8">
          <DashboardComponent />
        </div>
      )}

      {/* 🆕 Métricas */}
      {showMetrics && Object.keys(metrics).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 🆕 Filtros Rápidos */}
      {quickFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleQuickFilter(filter.label)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filtroAtivo === filter.label
                  ? `bg-${filter.color || "blue"}-600 text-white`
                  : `bg-${filter.color || "blue"}-100 text-${
                      filter.color || "blue"
                    }-800 hover:bg-${filter.color || "blue"}-200`
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        {showSearch && (
          <div className="flex-1 max-w-md">
            <SearchBar
              placeholder={searchPlaceholder}
              onSearch={handleSearch}
              initialValue={termoBusca}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          {actionButtons}

          {canCreate && (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Novo
            </button>
          )}
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable<T>
          data={data || []}
          columns={finalColumns}
          onRowClick={canEdit ? handleEdit : undefined}
          emptyMessage="Nenhum registro encontrado"
          loading={loading}
        />
      </div>
    </div>
  );
}

export default CadastroBase;
