/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook genérico para consumo de serviços de API
 * Agora usa React Query internamente para cache e sincronização
 * mas mantém a mesma interface externa para compatibilidade
 *
 * @template T - Tipo da entidade
 * @template R - Tipo dos dados para criação/atualização
 * @template S - Tipo do serviço de API
 */
export default function useApiService<
  T,
  R = Partial<T>,
  S extends object = object
>(service: S, usePagination: boolean = false, initialPageSize: number = 50) {
  const queryClient = useQueryClient();

  // Estados locais para compatibilidade (busca por termo e item individual)
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [item, setItem] = useState<T | null>(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  // Estados de paginação
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  // Gera query key única baseada no serviço
  // @ts-ignore
  const queryKey = useMemo(() => [service.baseUrl || 'api-service'], [service]);

  // Query principal para listar todos os dados (com ou sem paginação)
  const {
    data: queryData,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: usePagination ? [...queryKey, 'paginated', page, pageSize] : queryKey,
    queryFn: async () => {
      if (usePagination) {
        // @ts-ignore - Assumimos que o serviço tem um método getPaginated
        const response = await service.getPaginated(page, pageSize);
        // Atualizar estados de paginação
        setTotalPages(response.pagination.totalPages);
        setTotal(response.pagination.total);
        return response.data;
      } else {
        // @ts-ignore - Assumimos que o serviço tem um método getAll
        return await service.getAll();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !searchTerm, // Desabilita se tiver termo de busca ativo
  });

  // Query para busca por termo
  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
  } = useQuery({
    queryKey: [...queryKey, 'search', searchTerm],
    queryFn: async () => {
      // @ts-ignore
      return await service.buscarPorTermo(searchTerm);
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!searchTerm, // Só busca se tiver termo
  });

  // Dados finais (usa busca se tiver termo, senão usa lista completa)
  const data = searchTerm ? searchData : queryData;
  const loading = searchTerm ? searchLoading : queryLoading;
  const error = searchTerm
    ? (searchError as any)?.response?.data?.message || (searchError as any)?.message
    : (queryError as any)?.response?.data?.message || (queryError as any)?.message;

  /**
   * Carrega todos os registros (força refetch)
   */
  const fetchAll = useCallback(async () => {
    setSearchTerm(""); // Limpa termo de busca
    const result = await refetch();
    return result.data || [];
  }, [refetch]);

  /**
   * Carrega registros por termo de busca
   * @param termo - Termo para busca
   */
  const searchByTerm = useCallback(
    
    async (termo: string) => {
      if (!termo.trim()) {
        setSearchTerm("");
        const result = await refetch();
        return result.data || [];
      }

      setSearchTerm(termo);
      return data || [];
    },
    [refetch, data]
  );

  /**
   * Carrega um registro pelo ID
   * @param id - ID do registro
   */
  const fetchById = useCallback(
    async (id: number | string) => {
      setItemLoading(true);
      setItemError(null);

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
        setItemError(errorMessage);
        return null;
      } finally {
        setItemLoading(false);
      }
    },
    [service]
  );

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: async (values: R) => {
      // @ts-ignore
      return await service.create(values);
    },
    onSuccess: (data) => {
      setItem(data);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  /**
   * Cria um novo registro
   * @param values - Dados para criação
   */
  const create = useCallback(
    async (values: R) => {
      try {
        const result = await createMutation.mutateAsync(values);
        return result;
      } catch (err: any) {
        console.error("Erro ao criar item:", err);

        if (err.response?.status === 409) {
          setItemError("Um registro com este nome já existe.");
        } else {
          const errorMessage =
            err.response?.data?.message ||
            "Erro ao criar item. Tente novamente.";
          setItemError(errorMessage);
        }

        return null;
      }
    },
    [createMutation, setItemError]
  );

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number | string; values: R }) => {
      // @ts-ignore
      return await service.update(id, values);
    },
    onSuccess: (data) => {
      setItem(data);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  /**
   * Atualiza um registro existente
   * @param id - ID do registro
   * @param values - Dados para atualização
   */
  const update = useCallback(
    async (id: number | string, values: R) => {
      try {
        const result = await updateMutation.mutateAsync({ id, values });
        return result;
      } catch (err: any) {
        console.error("Erro ao atualizar item:", err);

        if (err.response?.status === 409) {
          setItemError("Um registro com este nome já existe.");
        } else {
          const errorMessage =
            err.response?.data?.message ||
            "Erro ao atualizar item. Tente novamente.";
          setItemError(errorMessage);
        }

        return null;
      }
    },
    [updateMutation, setItemError]
  );

  // Mutation para alternar status com optimistic update
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: number | string; ativo: boolean }) => {
      // @ts-ignore
      return await service.alterarStatus(id, ativo);
    },
    // Optimistic update: atualiza UI antes da resposta do servidor
    onMutate: async ({ id, ativo }) => {
      // Cancela queries em andamento
      await queryClient.cancelQueries({ queryKey });

      // Salva estado anterior para rollback
      const previousData = queryClient.getQueryData<T[]>(queryKey);

      // Atualiza cache otimisticamente
      queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((item: any) =>
          item.id === id ? { ...item, ativo } : item
        );
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  /**
   * Altera o status de um registro
   * @param id - ID do registro
   * @param ativo - Novo status
   */
  const toggleStatus = useCallback(
    async (id: number | string, ativo: boolean) => {
      try {
        const result = await toggleStatusMutation.mutateAsync({ id, ativo });
        return result;
      } catch (err: any) {
        console.error("Erro ao alterar status:", err);
        const errorMessage =
          err.response?.data?.message ||
          "Erro ao alterar status. Tente novamente.";
        setItemError(errorMessage);
        return null;
      }
    },
    [toggleStatusMutation, setItemError]
  );

  // Mutation para deletar com optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      // @ts-ignore
      return await service.delete(id);
    },
    // Optimistic update: remove da UI antes da resposta
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<T[]>(queryKey);

      // Remove otimisticamente
      queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return old;
        return old.filter((item: any) => item.id !== id);
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  /**
   * Remove um registro
   * @param id - ID do registro
   */
  const remove = useCallback(
    async (id: number | string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return true;
      } catch (err: any) {
        console.error("Erro ao excluir item:", err);

        if (err.response?.status === 409) {
          setItemError(
            "Este registro não pode ser excluído pois está vinculado a outros registros."
          );
        } else {
          const errorMessage =
            err.response?.data?.message ||
            "Erro ao excluir item. Tente novamente.";
          setItemError(errorMessage);
        }

        return false;
      }
    },
    [deleteMutation, setItemError]
  );

  /**
   * Limpa o item atual e erros
   */
  const clearItem = useCallback(() => {
    setItem(null);
    setItemError(null);
  }, []);

  /**
   * Navega para uma página específica
   */
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  /**
   * Navega para a próxima página
   */
  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages]);

  /**
   * Navega para a página anterior
   */
  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  /**
   * Altera o tamanho da página
   */
  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Volta para a primeira página
  }, []);

  return {
    // Estados (mantém compatibilidade com interface antiga)
    data: data || [],
    item,
    loading: loading || itemLoading,
    error: error || itemError,

    // Métodos (mesma interface de antes)
    fetchAll,
    fetchById,
    searchByTerm,
    create,
    update,
    toggleStatus,
    remove,
    clearItem,

    // Paginação
    pagination: usePagination ? {
      page,
      pageSize,
      total,
      totalPages,
      goToPage,
      nextPage,
      previousPage,
      changePageSize,
    } : undefined,

    // O próprio serviço, para acesso a métodos específicos
    service,
  };
}
