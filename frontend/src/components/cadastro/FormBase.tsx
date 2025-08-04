// frontend/src/components/cadastro/FormBase.tsx
import React, { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import useForm from "../../hooks/useForm";
import BaseApiService from "../../services/baseApiService";

interface FormBaseProps<T, R> {
  /**
   * Form title
   */
  title: string;

  /**
   * API service for registration
   */
  service: BaseApiService<T, R>;

  /**
   * Record ID (undefined for new record)
   */
  id?: string | number;

  /**
   * Initial values for the form
   */
  initialValues: R;

  /**
   * Validation function
   */
  validate?: (values: R) => Record<string, string> | null;

  /**
   * Function called after successful save
   * ✅ MODIFICADO - Agora recebe o objeto salvo como parâmetro
   */
  onSave?: (savedItem?: T) => void;

  /**
   * URL to return after cancel
   */
  returnUrl: string;

  /**
   * Form content (fields)
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
 * Base component for forms
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

  // Form configuration
  const form = useForm<R>({
    initialValues,
    validate,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        let savedItem: T;

        if (id && id !== "novo") {
          // Update existing record
          savedItem = await service.update(id, values);
          alert("Registro atualizado com sucesso!");
        } else {
          // Create new record
          savedItem = await service.create(values);
          alert("Registro criado com sucesso!");
        }

        // ✅ CORREÇÃO - Passar o objeto salvo para o onSave
        if (onSave) {
          onSave(savedItem);
        } else {
          navigate({ to: returnUrl });
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

  // Load record data for editing
  useEffect(() => {
    const fetchData = async () => {
      if (id && id !== "novo") {
        setLoading(true);

        try {
          const data = await service.getById(id);
          setOriginalData(data);

          // Update form with record data
          const formValues = {} as R;

          // Copy only properties that exist in initialValues
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

  // Function to cancel
  const handleCancel = () => {
    navigate({ to: returnUrl });
  };

  // Form content (function or element)
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

  // Component rendering
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

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        {loading && !form.values ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit} className="space-y-4">
            {/* Form content */}
            {formContent}

            {/* Form buttons */}
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