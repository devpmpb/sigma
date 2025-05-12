import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

export interface TipoVeiculo {
  id: number;
  descricao: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TipoVeiculoDTO {
  descricao: string;
  ativo?: boolean;
}

class TipoVeiculoService extends BaseApiService<TipoVeiculo, TipoVeiculoDTO> {
  constructor() {
    super("/tipoVeiculos", "obras"); // URL base para o serviço
  }

  getTiposVeiculosAtivos = async (): Promise<TipoVeiculo[]> => {
    const response = await apiClient.get(`${this.baseUrl}/ativos`);
    return response.data;
  };
}

export default new TipoVeiculoService();
