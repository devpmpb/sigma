import React from "react";

interface ActionButtonsProps {
  /**
   * Função chamada quando o botão de editar é clicado
   */
  onEdit?: () => void;

  /**
   * Função chamada quando o botão de excluir é clicado
   */
  onDelete?: () => void;

  /**
   * Função chamada quando o botão de visualizar é clicado
   */
  onView?: () => void;

  /**
   * Se o botão de editar deve ser exibido (default: true)
   */
  showEdit?: boolean;

  /**
   * Se o botão de excluir deve ser exibido (default: true)
   */
  showDelete?: boolean;

  /**
   * Se o botão de visualizar deve ser exibido (default: false)
   */
  showView?: boolean;

  /**
   * Alinhamento dos botões (default: "right")
   */
  align?: "left" | "center" | "right";

  /**
   * Classes CSS adicionais para o componente
   */
  className?: string;
}

/**
 * Componente para exibir botões de ações padrão (editar, excluir, visualizar)
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  onView,
  showEdit = true,
  showDelete = true,
  showView = false,
  align = "right",
  className = "",
}) => {
  const alignClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[align];

  return (
    <div className={`flex items-center ${alignClass} ${className}`}>
      {showView && onView && (
        <button
          onClick={onView}
          className="text-gray-600 hover:text-gray-900 mr-3"
          title="Visualizar"
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
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      )}

      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-900 mr-3"
          title="Editar"
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

      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-900"
          title="Excluir"
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
  );
};

export default ActionButtons;
