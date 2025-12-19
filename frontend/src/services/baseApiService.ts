import { AxiosResponse } from "axios";
import apiClient from "./apiConfig";
import { ModuleType } from "../types";

/**
 * Interface para resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Classe base para serviços de API genéricos com suporte a módulos
 * Cada serviço deve declarar a qual módulo pertence (obras, agricultura, comum)
 * @template T - Tipo da entidade
 * @template R - Tipo dos dados para criação/atualização (opcional, padrão é T)
 */
export default class BaseApiService<T, R = Partial<T>> {
  /**
   * @param baseUrl - URL base para as requisições deste serviço
   * @param moduleType - Tipo do módulo (obras, agricultura, comum)
   */
  constructor(protected baseUrl: string, protected moduleType: ModuleType) {}

  /**
   * Retorna o tipo do módulo do serviço
   */
  getModuleType(): ModuleType {
    return this.moduleType;
  }

  /**
   * Busca todos os registros (sem paginação)
   * @returns Uma promessa com um array de entidades do tipo T
   */
  getAll = async (): Promise<T[]> => {
    const response: AxiosResponse<T[]> = await apiClient.get(this.baseUrl);
    return response.data;
  };

  /**
   * Busca registros paginados
   * @param page - Número da página (começa em 1)
   * @param pageSize - Tamanho da página
   * @returns Uma promessa com resposta paginada
   */
  getPaginated = async (
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<T>> => {
    const response: AxiosResponse<PaginatedResponse<T>> = await apiClient.get(
      this.baseUrl,
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  };

  /**
   * Busca registros por um termo de busca
   * @param termo - Termo para busca
   * @returns Uma promessa com um array de entidades do tipo T
   */
  buscarPorTermo = async (termo: string): Promise<T[]> => {
    console.log("sdjdslkjdsalkjaskljdaskldklasklasjdlkjdklsjad");
    const response: AxiosResponse<T[]> = await apiClient.get(
      `${this.baseUrl}/busca`,
      {
        params: { termo },
      }
    );
    return response.data;
  };

  /**
   * Busca um registro pelo ID
   * @param id - ID do registro
   * @returns Uma promessa com uma entidade do tipo T
   */
  getById = async (id: number | string): Promise<T> => {
    const response: AxiosResponse<T> = await apiClient.get(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  };

  /**
   * Cria um novo registro
   * @param data - Dados para criação
   * @returns Uma promessa com a entidade criada do tipo T
   */
  create = async (data: R): Promise<T> => {
    const response: AxiosResponse<T> = await apiClient.post(this.baseUrl, data);
    return response.data;
  };

  /**
   * Atualiza um registro existente
   * @param id - ID do registro
   * @param data - Dados para atualização
   * @returns Uma promessa com a entidade atualizada do tipo T
   */
  update = async (id: number | string, data: R): Promise<T> => {
    const response: AxiosResponse<T> = await apiClient.put(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data;
  };

  /**
   * Atualiza parcialmente um registro existente
   * @param id - ID do registro
   * @param data - Dados parciais para atualização
   * @returns Uma promessa com a entidade atualizada do tipo T
   */
  patch = async (id: number | string, data: Partial<R>): Promise<T> => {
    const response: AxiosResponse<T> = await apiClient.patch(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data;
  };

  /**
   * Altera o status (ativo/inativo) de um registro
   * @param id - ID do registro
   * @param ativo - Novo status
   * @returns Uma promessa com a entidade atualizada do tipo T
   */
  alterarStatus = async (id: number | string, ativo: boolean): Promise<T> => {
    const response: AxiosResponse<T> = await apiClient.patch(
      `${this.baseUrl}/${id}/status`,
      { ativo }
    );
    return response.data;
  };

  /**
   * Remove um registro
   * @param id - ID do registro
   * @returns Uma promessa vazia
   */
  delete = async (id: number | string): Promise<void> => {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  };
}
