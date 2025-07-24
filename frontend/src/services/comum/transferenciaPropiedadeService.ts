// frontend/src/services/comum/transferenciaPropiedadeService.ts
import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

export interface TransferenciaPropriedade {
  id: number;
  propriedadeId: number;
  proprietarioAnteriorId: number;
  proprietarioNovoId: number;
  dataTransferencia: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;

  // Relacionamentos para exibição
  propriedade?: {
    id: number;
    nome: string;
    tipoPropriedade: string;
    areaTotal: string;
    localizacao?: string;
    matricula?: string;
  };
  proprietarioAnterior?: {
    id: number;
    pessoa?: {
      id: number;
      nome: string;
      cpfCnpj: string;
      telefone?: string;
      email?: string;
    };
  };
  proprietarioNovo?: {
    id: number;
    pessoa?: {
      id: number;
      nome: string;
      cpfCnpj: string;
      telefone?: string;
      email?: string;
    };
  };
}

export interface TransferenciaPropiedadeDTO {
  propriedadeId: number;
  proprietarioAnteriorId: number;
  proprietarioNovoId: number;
  dataTransferencia: string;
  observacoes?: string;
}

/**
 * Serviço para operações com transferência de propriedade
 * Módulo comum - permite transferência de qualquer tipo de propriedade
 */
class TransferenciaPropiedadeService extends BaseApiService<
  TransferenciaPropriedade,
  TransferenciaPropiedadeDTO
> {
  constructor() {
    super("/transferencias-propriedade", "comum");
  }

  /**
   * Sobrescreve o método create para realizar a transferência completa
   * Chama endpoint específico que altera proprietarioId na Propriedade e salva histórico
   */
  transferir = async (
    data: TransferenciaPropiedadeDTO
  ): Promise<TransferenciaPropriedade> => {
    const response = await apiClient.post(`${this.baseUrl}/transferir`, data);
    return response.data;
  };

  /**
   * Busca transferências por propriedade
   */
  getByPropriedade = async (
    propriedadeId: number
  ): Promise<TransferenciaPropriedade[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/propriedade/${propriedadeId}`
    );
    return response.data;
  };

  /**
   * Busca histórico completo de uma propriedade
   */
  getHistorico = async (
    propriedadeId: number
  ): Promise<TransferenciaPropriedade[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/historico/${propriedadeId}`
    );
    return response.data;
  };

  /**
   * Busca transferências recentes (últimos 30 dias)
   */
  getRecentes = async (): Promise<TransferenciaPropriedade[]> => {
    const response = await apiClient.get(`${this.baseUrl}/recentes`);
    return response.data;
  };
}

const transferenciaPropiedadeService = new TransferenciaPropiedadeService();
export default transferenciaPropiedadeService;
