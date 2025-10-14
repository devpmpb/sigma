import apiClient from "../apiConfig";

export interface PropriedadeCondomino {
  id: number;
  propriedadeId: number;
  condominoId: number;
  percentual?: number;
  dataInicio: string;
  dataFim?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  condomino?: {
    id: number;
    nome: string;
    cpfCnpj: string;
  };
}

export interface PropriedadeCondominoDTO {
  condominoId: number;
  percentual?: number;
  observacoes?: string;
}

class PropriedadeCondominoService {
  /**p
   * Adicionar condômino a propriedade
   */
  addCondomino = async (
    propriedadeId: number,
    data: PropriedadeCondominoDTO
  ): Promise<PropriedadeCondomino> => {
    const response = await apiClient.post(
      `/propriedades/${propriedadeId}/condominos`,
      data
    );
    return response.data;
  };

  /**
   * Listar condôminos de uma propriedade
   */
  getCondominos = async (
    propriedadeId: number,
    ativos: boolean = true
  ): Promise<PropriedadeCondomino[]> => {
    const response = await apiClient.get(
      `/propriedades/${propriedadeId}/condominos`,
      { params: { ativos } }
    );
    return response.data;
  };

  /**
   * Remover condômino
   */
  removeCondomino = async (
    propriedadeId: number,
    condominoId: number
  ): Promise<void> => {
    await apiClient.delete(
      `/propriedades/${propriedadeId}/condominos/${condominoId}`
    );
  };

  /**
   * Atualizar dados do condômino
   */
  updateCondomino = async (
    propriedadeId: number,
    condominoId: number,
    data: Partial<PropriedadeCondominoDTO>
  ): Promise<PropriedadeCondomino> => {
    const response = await apiClient.patch(
      `/propriedades/${propriedadeId}/condominos/${condominoId}`,
      data
    );
    return response.data;
  };

  transferirCondomino = async (
    propriedadeId: number,
    data: {
      condominoSaiId: number;
      condominoEntraId: number;
      dataTransferencia?: string;
      observacoes?: string;
    }
  ): Promise<PropriedadeCondomino> => {
    const response = await apiClient.post(
      `/propriedades/${propriedadeId}/condominos/transferir`,
      data
    );
    return response.data;
  };
}

export default new PropriedadeCondominoService();
