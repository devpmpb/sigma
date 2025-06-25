import React from "react";

interface StatusBadgeProps {
  /**
   * Indica se o status está ativo
   */
  ativo: boolean;

  /**
   * Texto para exibir quando ativo (default: "Ativo")
   */
  textoAtivo?: string;

  /**
   * Texto para exibir quando inativo (default: "Inativo")
   */
  textoInativo?: string;

  /**
   * Função chamada quando o botão de alternar é clicado
   */
  onToggle?: (event?: React.MouseEvent) => void;

  /**
   * Se deve mostrar o botão de alternar (default: true)
   */
  showToggle?: boolean;

  /**
   * Classes CSS adicionais para o componente
   */
  className?: string;
}

/**
 * Componente para exibir o status de um item (ativo/inativo)
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  ativo,
  textoAtivo = "Ativo",
  textoInativo = "Inativo",
  onToggle,
  showToggle = true,
  className = "",
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {ativo ? textoAtivo : textoInativo}
      </span>

      {showToggle && onToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevenir propagação para evitar redirecionamento
            onToggle(e);
          }}
          className="ml-2 text-xs text-blue-600 hover:text-blue-900"
          title={`Alternar para ${ativo ? textoInativo : textoAtivo}`}
        >
          Alternar
        </button>
      )}
    </div>
  );
};

export default StatusBadge;