import React, { ReactNode } from "react";

interface FormFieldProps {
  /**
   * Nome do campo
   */
  name: string;

  /**
   * Texto do label
   */
  label?: string;

  /**
   * Mensagem de erro
   */
  error?: string;

  /**
   * Se o campo foi tocado
   */
  touched?: boolean;

  /**
   * Se o campo é obrigatório
   */
  required?: boolean;

  /**
   * Tipo de campo (para renderizar diferentes campos)
   */
  type?: "text" | "textarea" | "select" | "checkbox" | "radio" | "custom";

  /**
   * Função para renderizar um campo personalizado
   */
  renderField?: () => ReactNode;

  /**
   * Classes CSS adicionais para o componente
   */
  className?: string;

  /**
   * Texto de ajuda
   */
  helpText?: string;

  /**
   * Elementos filhos (o campo em si)
   */
  children: ReactNode;
}

/**
 * Componente de campo de formulário com label e mensagem de erro
 */
const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  error,
  touched,
  required = false,
  type = "text",
  renderField,
  className = "",
  helpText,
  children,
}) => {
  // Determina se deve mostrar o erro
  const showError = touched && error;

  // Classes específicas para diferentes tipos de campos
  const getWrapperClass = () => {
    if (type === "checkbox" || type === "radio") {
      return "flex items-center";
    }
    return "";
  };

  return (
    <div className={`mb-4 ${className}`}>
      {/* Label para campos normais */}
      {label && type !== "checkbox" && type !== "radio" && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Campo personalizado ou filho padrão */}
      <div className={getWrapperClass()}>
        {type === "custom" && renderField ? renderField() : children}

        {/* Label para checkbox e radio */}
        {label && (type === "checkbox" || type === "radio") && (
          <label htmlFor={name} className="ml-2 text-sm text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </div>

      {/* Mensagem de erro */}
      {showError && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Texto de ajuda */}
      {helpText && !showError && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default FormField;
