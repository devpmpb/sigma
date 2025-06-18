import { ReactNode } from "react";

// Tipo para definição de coluna
export interface Column<T> {
  /**
   * Título da coluna
   */
  title: string;

  /**
   * Chave para acessar o valor no objeto de dados
   * Pode ser um caminho aninhado como "user.name"
   */
  key?: string;

  /**
   * Função de renderização personalizada
   * Recebe o item completo e retorna o conteúdo da célula
   */
  render?: (item: T, index: number) => ReactNode;

  /**
   * Largura da coluna (CSS)
   */
  width?: string;

  /**
   * Alinhamento do texto
   */
  align?: "left" | "center" | "right";

  /**
   * Classes CSS adicionais para a coluna
   */
  className?: string;
}

interface DataTableProps<T> {
  /**
   * Definições das colunas
   */
  columns: Column<T>[];

  /**
   * Dados a serem exibidos
   */
  data: T[];

  /**
   * Chave única para cada linha (função ou string)
   */
  rowKey: ((item: T, index: number) => string | number) | string;

  /**
   * Se está carregando dados
   */
  loading?: boolean;

  /**
   * Texto a ser exibido quando não há dados
   */
  emptyText?: string;

  /**
   * Função chamada quando uma linha é clicada
   */
  onRowClick?: (item: T, index: number) => void;

  /**
   * Classes CSS adicionais para o componente
   */
  className?: string;
}

/**
 * Componente de tabela de dados genérica
 */
function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyText = "Nenhum registro encontrado.",
  onRowClick,
  className = "",
}: DataTableProps<T>) {
  // Função para obter o valor de uma propriedade aninhada
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getNestedValue = (obj: any, path: string): any => {
    if (!path || typeof path !== "string") {
      return null;
    }
    return path.split(".").reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, obj);
  };
  // Função para obter a chave única de uma linha
  const getRowKey = (item: T, index: number): string | number => {
    if (typeof rowKey === "function") {
      return rowKey(item, index);
    }

    if (!rowKey || typeof rowKey !== "string") {
      console.warn("DataTable: rowKey inválido:", rowKey);
      return index;
    }

    return getNestedValue(item, rowKey) || index;
  };

  // Renderização da tabela
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-${
                  column.align || "left"
                } text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.className || ""
                }`}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                Carregando...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={getRowKey(item, index)}
                className={`hover:bg-gray-50 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={onRowClick ? () => onRowClick(item, index) : undefined}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                        ? "text-center"
                        : "text-left"
                    } ${
                      column.key === "id" ? "text-gray-500" : "text-gray-900"
                    }`}
                  >
                    {column.render
                      ? column.render(item, index)
                      : column.key
                      ? getNestedValue(item, column.key)
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
