// frontend/src/components/movimento/MovimentoBase.tsx
import React, { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import SearchBar from "../common/SearchBar";
import DataTable, { Column } from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";
import BaseApiService from "../../services/baseApiService";
import useApiService from "../../hooks/useApiService";
import usePermissions from "../../hooks/usePermissions";
import { ModuleType } from "../../types";

interface MovimentoBaseProps<T, R> {
  /**
   * Título da página
   */
  title: string;

  /**
   * Serviço de API para o movimento
   */
  service: BaseApiService<T, R>;

  /**
   * Colunas da tabela
   */
  columns: Column<T>[];

  /**
   * Chave única para cada linha
   */
  rowKey: string | ((item: T, index: number) => string | number);

  /**
   * URL base para navegação (ex: "/movimentos/arrendamentos")
   */
  baseUrl: string;

  /**
   * Módulo (obras, agricultura ou comum)
   */
  module: ModuleType;

  /**
   * Componente de formulário
   */
  FormComponent?: React.ComponentType<{
    id?: string | number;
    onSave: () => void;
    module?: ModuleType;
  }>;

  /**
   * Dashboard específico do movimento (opcional)
   */
  DashboardComponent?: React.ComponentType;

  /**
   * Mostrar dashboard na parte superior
   */
  showDashboard?: boolean;

  /**
   * Mostrar barra de pesquisa
   */
  showSearch?: boolean;

  /**
   * Placeholder para a barra de pesquisa
   */
  searchPlaceholder?: string;

  /**
   * Botões adicionais na barra de ações
   */
  actionButtons?: ReactNode;

  /**
   * Configuração de status personalizada
   */
  statusConfig?: {
    field: string; // campo que contém o status
    options: Array<{
      value: string;
      label: string;
      color: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
    }>;
  };

  /**
   * Filtros rápidos para status
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
}

/**
 * Componente base para telas de movimento
 * Gerencia listagem, navegação para formulário, dashboard e métricas
 */
function MovimentoBase<T extends Record<string, any>, R>({
  title,
  service,
  columns,
  rowKey,
  baseUrl,
  module,
  FormComponent,
  DashboardComponent,
  showDashboard = false,
  showSearch = true,
  searchPlaceholder = "Buscar...",
  actionButtons,
  statusConfig,
  quickFilters = [],
  showMetrics = false,
  calculateMetrics,
}: MovimentoBaseProps<T, R>) {
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  // Verificação de permissões
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(module, "create");
  const canEdit = hasPermission(module, "edit");
  const canDelete = hasPermission(module, "delete");

  // Hook da API
  const { data, loading, error, fetchAll, searchByTerm } = useApiService<T, R>(service);

  // Carregar dados iniciais
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Calcular métricas quando dados mudarem
  useEffect(() => {
    if (showMetrics && calculateMetrics && data) {
      const calculatedMetrics = calculateMetrics(data);
      setMetrics(calculatedMetrics);
    }
  }, [data, showMetrics, calculateMetrics]);

  // Função para pesquisar
  const handleSearch = (termo: string) => {
    setTermoBusca(termo);
    setFiltroAtivo(null); // Limpar filtro ativo
    searchByTerm(termo);
  };

  // Função para aplicar filtro rápido
  const handleQuickFilter = (filterLabel: string) => {
    if (filtroAtivo === filterLabel) {
      // Se já está ativo, desativar
      setFiltroAtivo(null);
      fetchAll();
    } else {
      setFiltroAtivo(filterLabel);
      const filter = quickFilters.find(f => f.label === filterLabel);
      if (filter && data) {
        // Aplicar filtro (isso seria melhor fazer no backend em produção)
        const filtered = filter.filter(data);
        // Como o useApiService não tem uma função setData, vamos recarregar
        fetchAll();
      }
    }
  };

  // Função para criar novo registro
  const handleCreate = () => {
    navigate({ to: `${baseUrl}/novo` });
  };

  // Função para editar um registro
  const handleEdit = (item: T) => {
    const id = typeof rowKey === "function" ? rowKey(item, 0) : item[rowKey];
    navigate({ to: `${baseUrl}/${id}` });
  };

  // Renderizar status badge se configurado
  const renderStatusBadge = (item: T) => {
    if (!statusConfig) return null;

    const status = item[statusConfig.field];
    const statusOption = statusConfig.options.find(opt => opt.value === status);
    
    if (!statusOption) return status;

    return (
      <StatusBadge
        status={status}
        activeText={statusOption.label}
        color={statusOption.color}
      />
    );
  };

  // Adicionar coluna de status se configurada
  const enhancedColumns = statusConfig ? [
    ...columns,
    {
      title: "Status",
      key: statusConfig.field,
      render: renderStatusBadge,
      sortable: true,
      width: "120px",
    }
  ] : columns;

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

      {/* Dashboard */}
      {showDashboard && DashboardComponent && (
        <div className="mb-8">
          <DashboardComponent />
        </div>
      )}

      {/* Métricas */}
      {showMetrics && Object.keys(metrics).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros Rápidos */}
      {quickFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleQuickFilter(filter.label)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filtroAtivo === filter.label
                  ? `bg-${filter.color || 'blue'}-600 text-white`
                  : `bg-${filter.color || 'blue'}-100 text-${filter.color || 'blue'}-800 hover:bg-${filter.color || 'blue'}-200`
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Barra de ações */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Pesquisa */}
        {showSearch && (
          <div className="flex-1 max-w-md">
            <SearchBar
              placeholder={searchPlaceholder}
              onSearch={handleSearch}
              initialValue={termoBusca}
            />
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex items-center space-x-3">
          {actionButtons}
          
          {canCreate && (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Novo {title.slice(0, -1)}
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable<T>
          data={data || []}
          columns={enhancedColumns}
          onRowClick={canEdit ? handleEdit : undefined}
          emptyMessage={`Nenhum registro encontrado`}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default MovimentoBase;