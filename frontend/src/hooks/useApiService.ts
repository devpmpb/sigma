/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useCallback } from "react";

/**
 * Hook genérico para consumo de serviços de API
 * @template T - Tipo da entidade
 * @template R - Tipo dos dados para criação/atualização
 * @template S - Tipo do serviço de API
 */
export default function useApiService<
  T,
  R = Partial<T>,
  S extends object = object
>(service: S) {
  // Estados
  const [data, setData] = useState<T[]>([]);
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega todos os registros
   */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // @ts-ignore - Assumimos que o serviço tem um método getAll
      const result = await service.getAll();
      setData(result);
      return result;
    } catch (err: any) {
      console.error("Erro ao buscar dados:", err);
      const errorMessage =
        err.response?.data?.message || "Erro ao buscar dados. Tente novamente.";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Carrega registros por termo de busca
   * @param termo - Termo para busca
   */
  const searchByTerm = useCallback(
    async (termo: string) => {
      if (!termo.trim()) {
        return fetchAll();
      }

      setLoading(true);
      setError(null);

      try {
        // @ts-ignore - Assumimos que o serviço tem um método buscarPorTermo
        const result = await service.buscarPorTermo(termo);
        setData(result);
        return result;
      } catch (err: any) {
        console.error("Erro ao buscar dados:", err);
        const errorMessage =
          err.response?.data?.message ||
          "Erro ao buscar dados. Tente novamente.";
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [service, fetchAll]
  );

  /**
   * Carrega um registro pelo ID
   * @param id - ID do registro
   */
  const fetchById = useCallback(
    async (id: number | string) => {
      setLoading(true);
      setError(null);

      try {
        // @ts-ignore - Assumimos que o serviço tem um método getById
        const result = await service.getById(id);
        setItem(result);
        return result;
      } catch (err: any) {
        console.error("Erro ao buscar item:", err);
        const errorMessage =
          err.response?.data?.message ||
          "Erro ao buscar item. Tente novamente.";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Cria um novo registro
   * @param values - Dados para criação
   */
  const create = useCallback(
    async (values: R) => {
      setLoading(true);
      setError(null);

      try {
        // @ts-ignore - Assumimos que o serviço tem um método create
        const result = await service.create(values);
        setItem(result);
        return result;
      } catch (err: any) {
        console.error("Erro ao criar item:", err);

        if (err.response?.status === 409) {
          setError("Um registro com este nome já existe.");
        } else {
          const errorMessage =
            err.response?.data?.message ||
            "Erro ao criar item. Tente novamente.";
          setError(errorMessage);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Atualiza um registro existente
   * @param id - ID do registro
   * @param values - Dados para atualização
   */
  const update = useCallback(
    async (id: number | string, values: R) => {
      setLoading(true);
      setError(null);

      try {
        // @ts-ignore - Assumimos que o serviço tem um método update
        const result = await service.update(id, values);
        setItem(result);
        return result;
      } catch (err: any) {
        console.error("Erro ao atualizar item:", err);

        if (err.response?.status === 409) {
          setError("Um registro com este nome já existe.");
        } else {
          const errorMessage =
            err.response?.data?.message ||
            "Erro ao atualizar item. Tente novamente.";
          setError(errorMessage);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Altera o status de um registro
   * @param id - ID do registro
   * @param ativo - Novo status
   */
  const toggleStatus = useCallback(
    async (id: number | string, ativo: boolean) => {
      setLoading(true);
      setError(null);

      try {
        // @ts-ignore - Assumimos que o serviço tem um método alterarStatus
        const result = await service.alterarStatus(id, ativo);
        return result;
      } catch (err: any) {
        console.error("Erro ao alterar status:", err);
        const errorMessage =
          err.response?.data?.message ||
          "Erro ao alterar status. Tente novamente.";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Remove um registro
   * @param id - ID do registro
   */
  const remove = useCallback(
    async (id: number | string) => {
      setLoading(true);
      setError(null);

      try {
        // @ts-ignore - Assumimos que o serviço tem um método delete
        await service.delete(id);
        return true;
      } catch (err: any) {
        console.error("Erro ao excluir item:", err);

        if (err.response?.status === 409) {
          setError(
            "Este registro não pode ser excluído pois está vinculado a outros registros."
          );
        } else {
          const errorMessage =
            err.response?.data?.message ||
            "Erro ao excluir item. Tente novamente.";
          setError(errorMessage);
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Limpa o item atual e erros
   */
  const clearItem = useCallback(() => {
    setItem(null);
    setError(null);
  }, []);

  return {
    // Estados
    data,
    item,
    loading,
    error,

    // Métodos
    fetchAll,
    fetchById,
    searchByTerm,
    create,
    update,
    toggleStatus,
    remove,
    clearItem,

    // O próprio serviço, para acesso a métodos específicos
    service,
  };
}
