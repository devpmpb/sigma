// frontend/src/components/movimento/FormularioMovimento.tsx
import React, { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import useForm from "../../hooks/useForm";
import BaseApiService from "../../services/baseApiService";

interface FormularioMovimentoProps<T, R> {
  /**
   * Título do formulário
   */
  title: string;

  /**
   * Serviço de API para o movimento
   */
  service: BaseApiService<T, R>;

  /**
   * ID do registro (undefined para novo registro)
   */
  id?: string | number;

  /**
   * Valores iniciais para o formulário
   */
  initialValues: R;

  /**
   * Função de validação
   */
  validate?: (values: R) => Promise<Record<string, string> | null> | Record<string, string> | null;

  /**
   * Função chamada após salvar com sucesso
   */
  onSave?: () => void;

  /**
   * URL para retornar após cancelar
   */
  returnUrl: string;

  /**
   * Seções do formulário
   */
  sections: Array<{
    title: string;
    description?: string;
    content: ReactNode | ((formProps: {
      values: R;
      errors: Record<string, string>;
      touched: Record<string, boolean>;
      handleChange: (e: React.ChangeEvent<any>) => void;
      setValue: (name: string, value: any) => void;
      setFieldTouched: (name: string, touched?: boolean) => void;
    }) => ReactNode);
    className?: string;
  }>;

  /**
   * Alertas ou avisos a serem exibidos
   */
  alerts?: Array<{
    type: 'info' | 'warning' | 'error' | 'success';
    title?: string;
    message: string;
    show: boolean;
  }>;

  /**
   * Ações customizadas no rodapé
   */
  customActions?: ReactNode;

  /**
   * Mostrar loading state
   */
  loading?: boolean;
}

/**
 * Componente base para formulários de movimento
 */
function FormularioMovimento<T extends Record<string, any>, R>({
  title,
  service,
  id,
  initialValues,
  validate,
  onSave,
  returnUrl,
  sections,
  alerts = [],
  customActions,
  loading: externalLoading = false,
}: FormularioMovimentoProps<T, R>) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<T | null>(null);

  // Configuração do formulário
  const form = useForm<R>({
    initialValues,
    validate,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        if (id && id !== "novo") {
          // Atualizar registro existente
          await service.update(id, values);
          alert("Registro atualizado com sucesso!");
        } else {
          // Criar novo registro
          await service.create(values);
          alert("Registro criado com sucesso!");
        }

        if (onSave) {
          onSave();
        } else {
          navigate({ to: returnUrl });
        }

        return true;
      } catch (err: any) {
        console.error("Erro ao salvar registro:", err);

        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.response?.status === 409) {
          setError("Já existe um registro com estes dados.");
        } else {
          setError("Erro ao salvar. Tente novamente.");
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
  });

  // Carregar dados existentes para edição
  useEffect(() => {
    const loadData = async () => {
      if (id && id !== "novo") {
        setLoading(true);
        try {
          const data = await service.getById(id);
          setOriginalData(data);
          
          // Preencher formulário com dados existentes
          Object.keys(initialValues).forEach((key) => {
            if (data[key] !== undefined) {
              form.setValue(key, data[key]);
            }
          });
        } catch (err) {
          console.error("Erro ao carregar dados:", err);
          setError("Erro ao carregar dados do registro");
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [id, service]);

  // Função para cancelar e voltar
  const handleCancel = () => {
    if (window.confirm("Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.")) {
      navigate({ to: returnUrl });
    }
  };

  const isLoading = loading || externalLoading;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {id && id !== "novo" && (
          <p className="text-gray-600 mt-1">
            Editando registro #{id}
          </p>
        )}
      </div>

      {/* Alertas */}
      {alerts.filter(alert => alert.show).map((alert, index) => (
        <div
          key={index}
          className={`mb-6 p-4 rounded-lg border ${
            alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {alert.title && (
            <h4 className="font-medium mb-1">{alert.title}</h4>
          )}
          <p className="text-sm">{alert.message}</p>
        </div>
      ))}

      {/* Erro de carregamento/salvamento */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={form.handleSubmit} className="space-y-8">
        {/* Seções do formulário */}
        {sections.map((section, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg shadow p-6 ${section.className || ''}`}
          >
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">{section.title}</h2>
              {section.description && (
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              )}
            </div>

            <div className="space-y-4">
              {typeof section.content === 'function' 
                ? section.content({
                    values: form.values,
                    errors: form.errors,
                    touched: form.touched,
                    handleChange: form.handleChange,
                    setValue: form.setValue,
                    setFieldTouched: form.setFieldTouched,
                  })
                : section.content
              }
            </div>
          </div>
        ))}

        {/* Rodapé com ações */}
        <div className="bg-gray-50 px-6 py-4 rounded-lg flex justify-between items-center">
          <div>
            {customActions}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isLoading || !form.isValid}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvando...' : (id && id !== "novo" ? 'Atualizar' : 'Salvar')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default FormularioMovimento;