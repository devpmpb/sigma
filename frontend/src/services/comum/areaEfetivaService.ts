import apiClient from "../apiConfig";

// Interfaces
export interface AreaEfetiva {
  id: number;
  pessoaId: number;
  anoReferencia: number;
  areaPropria: number;
  areaArrendadaRecebida: number;
  areaArrendadaCedida: number;
  areaEfetiva: number;
  atividadeProdutiva?: string;
  ramoAtividadeId?: number;
  ramoAtividade?: {
    id: number;
    nome: string;
  };
  updatedAt: string;
}

export interface AreaEfetivaDTO {
  anoReferencia?: number;
  areaPropria?: number;
  areaArrendadaRecebida?: number;
  areaArrendadaCedida?: number;
  atividadeProdutiva?: string;
  ramoAtividadeId?: number;
}

export interface AreaEfetivaRecalculada extends AreaEfetiva {
  detalhes: {
    propriedadesCount: number;
    arrendamentosRecebidosCount: number;
    arrendamentosCedidosCount: number;
  };
}

/**
 * Service para operações de Área Efetiva
 *
 * Nota: AreaEfetiva é acessada via rotas de Pessoa (/pessoas/:id/area-efetiva)
 * por isso não estende BaseApiService diretamente
 */
class AreaEfetivaService {
  private baseUrl = "/pessoas";

  /**
   * Busca área(s) efetiva(s) de uma pessoa
   * @param pessoaId - ID da pessoa
   * @param ano - Ano de referência (opcional, retorna todos se não informado)
   */
  getByPessoa = async (
    pessoaId: number,
    ano?: number
  ): Promise<AreaEfetiva[]> => {
    const params = ano ? { ano } : {};
    const response = await apiClient.get(
      `${this.baseUrl}/${pessoaId}/area-efetiva`,
      { params }
    );
    return response.data;
  };

  /**
   * Busca área efetiva de uma pessoa para um ano específico
   * @param pessoaId - ID da pessoa
   * @param ano - Ano de referência
   */
  getByPessoaAno = async (
    pessoaId: number,
    ano: number
  ): Promise<AreaEfetiva | null> => {
    const areas = await this.getByPessoa(pessoaId, ano);
    return areas.length > 0 ? areas[0] : null;
  };

  /**
   * Cria ou atualiza área efetiva de uma pessoa
   * @param pessoaId - ID da pessoa
   * @param data - Dados da área efetiva
   */
  update = async (
    pessoaId: number,
    data: AreaEfetivaDTO
  ): Promise<AreaEfetiva> => {
    const response = await apiClient.put(
      `${this.baseUrl}/${pessoaId}/area-efetiva`,
      data
    );
    return response.data;
  };

  /**
   * Recalcula área efetiva automaticamente com base em propriedades e arrendamentos
   * @param pessoaId - ID da pessoa
   * @param anoReferencia - Ano de referência (opcional, usa ano atual se não informado)
   */
  recalcular = async (
    pessoaId: number,
    anoReferencia?: number
  ): Promise<AreaEfetivaRecalculada> => {
    const response = await apiClient.post(
      `${this.baseUrl}/${pessoaId}/area-efetiva/recalcular`,
      { anoReferencia }
    );
    return response.data;
  };
}

// Exporta instância singleton
export default new AreaEfetivaService();
