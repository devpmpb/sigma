import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// Enum para o tipo de logradouro
export enum TipoLogradouro {
  RUA = "RUA",
  AVENIDA = "AVENIDA",
  LINHA = "LINHA",
}

// Interface para a entidade Logradouro
export interface Logradouro {
  id: number;
  tipo: TipoLogradouro;
  descricao: string;
  cep: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para os dados de criação/atualização
export interface LogradouroDTO {
  tipo: TipoLogradouro;
  descricao: string;
  cep: string;
  ativo?: boolean;
}

/**
 * Serviço para operações com a entidade Logradouro
 * Cadastro comum - acessível por todas as secretarias
 */
class LogradouroService extends BaseApiService<Logradouro, LogradouroDTO> {
  constructor() {
    super("/logradouros"); // URL base para o serviço
  }

  /**
   * Busca os logradouros ativos
   */
  getLogradourosAtivos = async (): Promise<Logradouro[]> => {
    const response = await apiClient.get(`${this.baseUrl}/ativos`);
    return response.data;
  };

  /**
   * Busca logradouros por CEP
   */
  getLogradourosPorCEP = async (cep: string): Promise<Logradouro[]> => {
    const response = await apiClient.get(`${this.baseUrl}/cep/${cep}`);
    return response.data;
  };
}

// Exporta uma instância singleton do serviço
export default new LogradouroService();
