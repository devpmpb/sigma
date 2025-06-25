import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

export interface Bairro {
  id: number;
  nome: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BairroDTO {
  nome: string;
  ativo?: boolean;
}

class BairroService extends BaseApiService<Bairro, BairroDTO> {
  constructor() {
    super("/bairros", "comum");
  }

  getBairrosAtivos = async (): Promise<Bairro[]> => {
    const response = await apiClient.get(`${this.baseUrl}/ativos`);
    return response.data;
  };
}

// Exporta uma instância singleton do serviço
export default new BairroService();
