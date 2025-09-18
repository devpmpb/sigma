import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// Interface para a entidade AreaRural
export interface AreaRural {
  id: number;
  nome: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para os dados de criação/atualização
export interface AreaRuralDTO {
  nome: string;
  ativo?: boolean;
}

/**
 * Serviço para operações com a entidade AreaRural
 * Módulo comum
 */
class AreaRuralService extends BaseApiService<AreaRural, AreaRuralDTO> {
  constructor() {
    super("/areas-rurais", "comum");
  }

  /**
   * Busca áreas rurais ativas
   */
  getAtivas = async (): Promise<AreaRural[]> => {
    const response = await apiClient.get(`${this.baseUrl}?ativo=true`);
    return response.data;
  };

  /**
   * Busca área rural por nome
   */
  findByNome = async (nome: string): Promise<AreaRural | null> => {
    const response = await apiClient.get(`${this.baseUrl}/buscar`, {
      params: { nome },
    });
    return response.data;
  };

  /**
   * Valida dados da área rural antes do envio
   */
  validarAreaRural = (
    areaRural: AreaRuralDTO
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!areaRural.nome?.trim()) {
      errors.push("Nome da área rural é obrigatório");
    }

    // Verificar se o nome é muito curto
    if (areaRural.nome && areaRural.nome.trim().length < 3) {
      errors.push("Nome da área rural deve ter pelo menos 3 caracteres");
    }

    // Verificar se o nome é muito longo
    if (areaRural.nome && areaRural.nome.length > 100) {
      errors.push("Nome da área rural não pode ter mais de 100 caracteres");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Cria uma nova área rural com validação
   */
  createWithValidation = async (dados: AreaRuralDTO): Promise<AreaRural> => {
    const validation = this.validarAreaRural(dados);

    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(", ")}`);
    }

    return this.create(dados);
  };

  /**
   * Atualiza uma área rural com validação
   */
  updateWithValidation = async (
    id: number,
    dados: AreaRuralDTO
  ): Promise<AreaRural> => {
    const validation = this.validarAreaRural(dados);

    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(", ")}`);
    }

    return this.update(id, dados);
  };
}

// Exporta uma instância singleton do serviço
export default new AreaRuralService();
