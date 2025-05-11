import React, { useEffect, useState, ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SearchBar from "../common/SearchBar";
import DataTable, { Column } from "../common/DataTable";
import BaseApiService from "../../services/baseApiService";
import useApiService from "../../hooks/useApiService";
import usePermissions from "../../hooks/usePermissions";
import { ModuleType } from "../../types";

interface CadastroBaseProps<T, R> {
  /**
   * Título da página
   */
  title: string;

  /**
   * Serviço para API do cadastro
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
   * URL base para navegação (ex: "/cadastros/produtos")
   */
  baseUrl: string;

  /**
   * Módulo do cadastro (obras, agricultura ou comum)
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
   * Se deve mostrar a barra de busca
   */
  showSearch?: boolean;

  /**
   * Placeholder para a barra de busca
   */
  searchPlaceholder?: string;

  /**
   * Botões adicionais para a barra de ações
   */
  actionButtons?: ReactNode;
}

/**
 * Componente base para telas de cadastro
 * Gerencia a listagem e navegação para o formulário
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
}: CadastroBaseProps<T, R>) {
  const [termoBusca, setTermoBusca] = useState("");
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  // Verificação de permissões
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(module, "create");
  const canEdit = hasPermission(module, "edit");
  const canDelete = hasPermission(module, "delete");

  // Hook para API
  const { data, loading, error, fetchAll, searchByTerm } = useApiService<T, R>(
    service
  );

  // Carrega os dados iniciais
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Verifica se está no modo de visualização de formulário
  const isFormView = params.id !== undefined;

  // Função para tratar a busca
  const handleSearch = (termo: string) => {
    setTermoBusca(termo);
    searchByTerm(termo);
  };

  // Função para criar novo registro
  const handleCreate = () => {
    navigate(`${baseUrl}/novo`);
  };

  // Função para editar um registro
  const handleEdit = (item: T) => {
    const id = typeof rowKey === "function" ? rowKey(item, 0) : item[rowKey];
    navigate(`${baseUrl}/${id}`);
  };

  // Função para excluir um registro
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

  // Adiciona a coluna de ações se o usuário tiver permissão
  const finalColumns = [...columns];

  if (canEdit || canDelete) {
    const actionsColumn: Column<T> = {
      title: "Ações",
      align: "right",
      render: (item) => (
        <div className="flex justify-end space-x-2">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Evita propagar o clique para a linha
                handleEdit(item);
              }}
              className="text-blue-600 hover:text-blue-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Evita propagar o clique para a linha
                handleDelete(item);
              }}
              className="text-red-600 hover:text-red-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      ),
    };

    finalColumns.push(actionsColumn);
  }

  // Retorna o componente FormComponent se estiver no modo de visualização de formulário
  if (isFormView && FormComponent) {
    return (
      <FormComponent
        id={params.id !== "novo" ? params.id : undefined}
        onSave={() => {
          navigate(baseUrl);
          fetchAll();
        }}
        module={module}
      />
    );
  }

  // Caso contrário, mostra a listagem
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="text-sm breadcrumbs">
            <ul className="flex">
              <li className="text-gray-500">Início</li>
              <li className="before:content-['>'] before:mx-2 text-gray-500">
                Cadastros
              </li>
              <li className="before:content-['>'] before:mx-2 text-gray-500">
                {module === "comum"
                  ? "Comum"
                  : module === "obras"
                  ? "Obras"
                  : module === "agricultura"
                  ? "Agricultura"
                  : "Outro"}
              </li>
              <li className="before:content-['>'] before:mx-2 text-gray-700">
                {title}
              </li>
            </ul>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Barra de ações */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            {showSearch && (
              <SearchBar
                placeholder={searchPlaceholder}
                initialValue={termoBusca}
                onSearch={handleSearch}
                loading={loading}
              />
            )}
          </div>

          <div className="flex space-x-2 ml-4">
            {actionButtons}

            {canCreate && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Novo
              </button>
            )}
          </div>
        </div>

        {/* Tabela de dados */}
        <DataTable
          columns={finalColumns}
          data={data}
          rowKey={rowKey}
          loading={loading}
          onRowClick={canEdit ? handleEdit : undefined}
          emptyText={`Nenhum registro encontrado.`}
        />
      </div>
    </div>
  );
}

export default CadastroBase;
