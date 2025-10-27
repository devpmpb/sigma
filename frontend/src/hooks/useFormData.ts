/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import BaseApiService from "../services/baseApiService";

/**
 * Hook para carregar dados auxiliares em formulários (dropdowns, selects, etc.)
 * Otimizado com cache longo pois dados auxiliares raramente mudam
 *
 * @example
 * ```tsx
 * const { data: logradouros, isLoading } = useFormData('logradouros', logradouroService);
 * const { data: bairros } = useFormData('bairros', bairroService);
 * ```
 */
export function useFormData<T>(
  key: string,
  service: BaseApiService<T, any>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      return await service.getAll();
    },
    staleTime: options?.staleTime || 10 * 60 * 1000, // 10 minutos (dados raramente mudam)
    enabled: options?.enabled !== false, // Habilitado por padrão
  });
}

/**
 * Hook para carregar um item específico para edição
 *
 * @example
 * ```tsx
 * const { data: pessoa, isLoading } = useFormItem('pessoa', pessoaId, pessoaService);
 * ```
 */
export function useFormItem<T>(
  key: string,
  id: string | number | undefined,
  service: BaseApiService<T, any>
) {
  return useQuery({
    queryKey: [key, id],
    queryFn: async () => {
      if (!id || id === 'novo') return null;
      return await service.getById(id);
    },
    enabled: !!id && id !== 'novo', // Só busca se tiver ID válido
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook combinado para formulários completos
 * Carrega tanto o item para edição quanto os dados auxiliares
 *
 * @example
 * ```tsx
 * const {
 *   item: pessoa,
 *   auxiliaryData: { logradouros, bairros },
 *   isLoading
 * } = useFormWithAuxiliary('pessoa', pessoaId, pessoaService, {
 *   logradouros: logradouroService,
 *   bairros: bairroService,
 * });
 * ```
 */
export function useFormWithAuxiliary<T>(
  key: string,
  id: string | number | undefined,
  service: BaseApiService<T, any>,
  auxiliaryServices: Record<string, BaseApiService<any, any>>
) {
  // Carrega item principal
  const itemQuery = useFormItem(key, id, service);

  // Carrega dados auxiliares
  const auxiliaryQueries = Object.entries(auxiliaryServices).reduce(
    (acc, [auxKey, auxService]) => {
      acc[auxKey] = useFormData(auxKey, auxService);
      return acc;
    },
    {} as Record<string, any>
  );

  // Extrai dados dos queries auxiliares
  const auxiliaryData = Object.entries(auxiliaryQueries).reduce(
    (acc, [auxKey, query]) => {
      acc[auxKey] = query.data || [];
      return acc;
    },
    {} as Record<string, any[]>
  );

  // Loading geral (true se qualquer um estiver carregando)
  const isLoading =
    itemQuery.isLoading ||
    Object.values(auxiliaryQueries).some((q) => q.isLoading);

  return {
    item: itemQuery.data,
    auxiliaryData,
    isLoading,
    error: itemQuery.error,
  };
}
