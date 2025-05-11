import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// Interface para a entidade GrupoProduto
export interface GrupoProduto {
  id: number;
  descricao: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para os dados de criação/atualização
export interface GrupoProdutoDTO {
  descricao: string;
  ativo?: boolean;
}

/**
 * Serviço para operações com a entidade GrupoProduto
 * Específico para a secretaria de Agricultura
 */
class GrupoProdutoService extends BaseApiService<
  GrupoProduto,
  GrupoProdutoDTO
> {
  constructor() {
    super("/grupoProdutos", "agricultura"); // URL base para o serviço
  }

  /**
   * Busca os grupos de produtos ativos
   */
  getGruposProdutosAtivos = async (): Promise<GrupoProduto[]> => {
    const response = await apiClient.get(`${this.baseUrl}/ativos`);
    return response.data;
  };
}

// Exporta uma instância singleton do serviço
export default new GrupoProdutoService();
