// frontend/src/components/common/FormSection.tsx
import React, { ReactNode } from "react";

interface FormSectionProps {
  /**
   * Título da seção
   */
  title: string;

  /**
   * Descrição da seção
   */
  description?: string;

  /**
   * Conteúdo da seção
   */
  children: ReactNode;

  /**
   * Classes CSS adicionais
   */
  className?: string;

  /**
   * Se a seção deve ser colapsável
   */
  collapsible?: boolean;
}

/**
 * Componente para organizar formulários em seções
 */
const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = "",
  collapsible = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
      <div
        className={`mb-4 ${collapsible ? "cursor-pointer" : ""}`}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {collapsible && (
            <span className="text-gray-500">{isCollapsed ? "▶" : "▼"}</span>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      {(!collapsible || !isCollapsed) && (
        <div className="space-y-4">{children}</div>
      )}
    </div>
  );
};

export default FormSection;
