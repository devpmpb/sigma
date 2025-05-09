import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// Interface para a entidade TipoVeiculo
export interface TipoVeiculo {
  id: number;
  descricao: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para os dados de criação/atualização
export interface TipoVeiculoDTO {
  descricao: string;
  ativo?: boolean;
}

/**
 * Serviço para operações com a entidade TipoVeiculo
 * Específico para a secretaria de Obras
 */
class TipoVeiculoService extends BaseApiService<TipoVeiculo, TipoVeiculoDTO> {
  constructor() {
    super("/tipos-veiculos", "obras"); // URL base para o serviço
  }

  /**
   * Busca os tipos de veículos ativos
   */
  getTiposVeiculosAtivos = async (): Promise<TipoVeiculo[]> => {
    const response = await apiClient.get(`${this.baseUrl}/ativos`);
    return response.data;
  };
}

// Exporta uma instância singleton do serviço
export default new TipoVeiculoService();
