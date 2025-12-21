import { useState, useCallback, ChangeEvent, FormEvent } from "react";

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<string, string> | null;
  onSubmit?: (values: T) => Promise<any> | any;
}

function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Função para atualizar valores do formulário
   */
  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { name, value, type } = e.target;

      setValues((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));
    },
    []
  );

  /**
   * Função para atualizar um valor específico do formulário
   */
  const setValue = useCallback((name: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /**
   * Função para atualizar vários valores do formulário
   */
  const setMultipleValues = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  /**
   * Função para marcar um campo como tocado
   */
  const setFieldTouched = useCallback((name: string, isTouched = true) => {
    setTouched((prev) => ({
      ...prev,
      [name]: isTouched,
    }));
  }, []);

  /**
   * Função para marcar todos os campos como tocados
   */
  const setAllTouched = useCallback(() => {
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);

    setTouched(allTouched);
  }, [values]);

  /**
   * Função para validar o formulário
   */
  const validateForm = useCallback(() => {
    if (!validate) return null;

    const validationErrors = validate(values);
    setErrors(validationErrors || {});

    return validationErrors;
  }, [values, validate]);

  /**
   * Função para lidar com o submit do formulário
   */
  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setAllTouched();

      const validationErrors = validateForm();
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        return false;
      }

      setIsSubmitting(true);

      try {
        if (onSubmit) {
          await onSubmit(values);
        }
        return true;
      } catch (error) {
        console.error("Erro ao submeter formulário:", error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, setAllTouched, onSubmit]
  );

  /**
   * Função para resetar o formulário
   */
  const resetForm = useCallback(
    (newValues?: T) => {
      setValues(newValues || initialValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [initialValues]
  );

  /**
   * Função para verificar se o formulário está válido
   */
  const isValid = useCallback(() => {
    const validationErrors = validate ? validate(values) : null;
    return !validationErrors || Object.keys(validationErrors).length === 0;
  }, [values, validate]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    setValue,
    setMultipleValues,
    setFieldTouched,
    validateForm,
    handleSubmit,
    resetForm,
    isValid,
  };
}

export default useForm;
