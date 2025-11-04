// frontend/src/services/obras/tipoServicoService.ts
import BaseApiService from "../baseApiService";
import apiClient from "../apiConfig";

export interface FaixaPrecoServico {
  id?: number;
  tipoServicoId?: number;
  quantidadeMin: number;
  quantidadeMax: number | null;
  multiplicadorVR: number;
  ativo?: boolean;
  vigenciaInicio?: string;
  vigenciaFim?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TipoServico {
  id: number;
  nome: string;
  unidade: string; // "carga" ou "hora"
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
  faixasPreco?: FaixaPrecoServico[];
}

export interface TipoServicoInput {
  nome: string;
  unidade: string;
  ativo?: boolean;
  faixasPreco?: Omit<FaixaPrecoServico, "id" | "tipoServicoId" | "createdAt" | "updatedAt">[];
}

export interface CalcularValorInput {
  tipoServicoId: number;
  quantidade: number;
  valorReferencial: number;
}

export interface CalcularValorResponse {
  tipoServico: string;
  unidade: string;
  quantidade: number;
  faixaAplicada: {
    quantidadeMin: number;
    quantidadeMax: number | null;
    multiplicadorVR: number;
  };
  valorReferencial: number;
  valorCalculado: number;
}

class TipoServicoService extends BaseApiService<TipoServico, TipoServicoInput> {
  constructor() {
    super("/api/tipos-servico", "obras");
  }

  /**
   * Calcula o valor de um serviço baseado no tipo, quantidade e VR
   */
  async calcularValor(data: CalcularValorInput): Promise<CalcularValorResponse> {
    const response = await apiClient.post<CalcularValorResponse>(
      `${this.baseUrl}/calcular-valor`,
      data
    );
    return response.data;
  }

  /**
   * Busca tipos de serviço ativos (helper method)
   */
  async getAtivos(): Promise<TipoServico[]> {
    const todos = await this.getAll();
    return todos.filter((tipo) => tipo.ativo);
  }
}

const tipoServicoService = new TipoServicoService();
export default tipoServicoService;
