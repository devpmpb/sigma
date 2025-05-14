import React, { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import useForm from "../../hooks/useForm";
import BaseApiService from "../../services/baseApiService";

interface FormBaseProps<T, R> {
  /**
   * Título do formulário
   */
  title: string;

  /**
   * Serviço para API do cadastro
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
  validate?: (values: R) => Record<string, string> | null;

  /**
   * Função chamada após salvar com sucesso
   */
  onSave?: () => void;

  /**
   * URL para retornar após cancelar
   */
  returnUrl: string;

  /**
   * Conteúdo do formulário (campos)
   */
  children:
    | ReactNode
    | ((formProps: {
        values: R;
        errors: Record<string, string>;
        touched: Record<string, boolean>;
        handleChange: (e: React.ChangeEvent<any>) => void;
        setValue: (name: string, value: any) => void;
        setFieldTouched: (name: string, touched?: boolean) => void;
      }) => ReactNode);
}

/**
 * Componente base para formulários
 */
function FormBase<T extends Record<string, any>, R>({
  title,
  service,
  id,
  initialValues,
  validate,
  onSave,
  returnUrl,
  children,
}: FormBaseProps<T, R>) {
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
          // Atualiza o registro existente
          await service.update(id, values);
          alert("Registro atualizado com sucesso!");
          navigate(returnUrl);
        } else {
          // Cria um novo registro
          await service.create(values);
          alert("Registro criado com sucesso!");
          navigate(returnUrl);
        }

        if (onSave) {
          onSave();
        } else {
          navigate(returnUrl);
        }

        return true;
      } catch (err: any) {
        console.error("Erro ao salvar registro:", err);

        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.response?.status === 409) {
          setError("Já existe um registro com este nome ou código.");
        } else {
          setError("Erro ao salvar. Tente novamente.");
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
  });

  // Carrega os dados do registro para edição
  useEffect(() => {
    const fetchData = async () => {
      if (id && id !== "novo") {
        setLoading(true);

        try {
          const data = await service.getById(id);
          setOriginalData(data);

          // Atualiza o formulário com os dados do registro
          const formValues = {} as R;

          // Copia apenas as propriedades que existem em initialValues
          Object.keys(initialValues).forEach((key) => {
            if (data.hasOwnProperty(key)) {
              (formValues as any)[key] = data[key];
            }
          });

          form.setMultipleValues(formValues);
        } catch (err) {
          console.error("Erro ao carregar registro:", err);
          setError("Erro ao carregar os dados. Tente novamente.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [id, service, initialValues, form.setMultipleValues]);

  // Função para cancelar
  const handleCancel = () => {
    navigate(returnUrl);
  };

  // Conteúdo do formulário (função ou elemento)
  const formContent =
    typeof children === "function"
      ? children({
          values: form.values,
          errors: form.errors,
          touched: form.touched,
          handleChange: form.handleChange,
          setValue: form.setValue,
          setFieldTouched: form.setFieldTouched,
        })
      : children;

  // Renderização do componente
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {id && id !== "novo" ? `Editar ${title}` : `Novo ${title}`}
          </h1>

          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Voltar
          </button>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Formulário */}
        {loading && !form.values ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit} className="space-y-4">
            {/* Conteúdo do formulário */}
            {formContent}

            {/* Botões do formulário */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading || form.isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading || form.isSubmitting ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default FormBase;
