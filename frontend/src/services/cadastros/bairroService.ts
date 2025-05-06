import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// Interface para a entidade Bairro
export interface Bairro {
  id: number;
  nome: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para os dados de criação/atualização de Bairro
export interface BairroDTO {
  nome: string;
  ativo?: boolean;
}

/**
 * Serviço para operações com a entidade Bairro
 */
class BairroService extends BaseApiService<Bairro, BairroDTO> {
  constructor() {
    super("/bairros"); // Passa a URL base para o serviço
  }

  /**
   * Busca os bairros ativos
   * @returns Uma promessa com um array de bairros ativos
   */
  getBairrosAtivos = async (): Promise<Bairro[]> => {
    const response = await apiClient.get(`${this.baseUrl}/ativos`);
    return response.data;
  };

  /**
   * Exemplo de método específico para bairros (se necessário)
   * Busca bairros por região
   * @param regiaoId - ID da região
   * @returns Uma promessa com um array de bairros da região
   */
  getBairrosPorRegiao = async (regiaoId: number): Promise<Bairro[]> => {
    const response = await apiClient.get(`${this.baseUrl}/regiao/${regiaoId}`);
    return response.data;
  };
}

// Exporta uma instância singleton do serviço
export default new BairroService();
