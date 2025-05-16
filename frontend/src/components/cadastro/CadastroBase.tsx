import React, { useEffect, useState, ReactNode } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import SearchBar from "../common/SearchBar";
import DataTable, { Column } from "../common/DataTable";
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
}

/**
 * Base component for registration screens
 * Manages listing and navigation to the form
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
  const params = useParams();

  // Permission check
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(module, "create");
  const canEdit = hasPermission(module, "edit");
  const canDelete = hasPermission(module, "delete");

  // API hook
  const { data, loading, error, fetchAll, searchByTerm } = useApiService<T, R>(
    service
  );

  // Load initial data
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Check if in form view mode
  const isFormView = params && params.id !== undefined;

  // Function to handle search
  const handleSearch = (termo: string) => {
    setTermoBusca(termo);
    searchByTerm(termo);
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

  // Add action column if user has permission
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
                e.stopPropagation(); // Prevent click from propagating to row
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
                e.stopPropagation(); // Prevent click from propagating to row
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

  // Return FormComponent if in form view mode
  if (isFormView && FormComponent) {
    return (
      <FormComponent
        id={params.id !== "novo" ? params.id : undefined}
        onSave={() => {
          navigate({ to: baseUrl });
          fetchAll();
        }}
        module={module}
      />
    );
  }

  // Otherwise, show the listing
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

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Action bar */}
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

        {/* Data table */}
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