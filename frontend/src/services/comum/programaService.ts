import BaseApiService from "../baseApiService";

export enum TipoPrograma {
  SUBSIDIO = "SUBSIDIO",
  MATERIAL = "MATERIAL",
  SERVICO = "SERVICO",
  CREDITO = "CREDITO",
  ASSISTENCIA = "ASSISTENCIA",
}

export interface Programa {
  id: number;
  nome: string;
  descricao: string | null;
  leiNumero: string | null;
  tipoPrograma: TipoPrograma;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  // Relacionamentos opcionais
  regras?: RegrasNegocio[];
  _count?: {
    solicitacoes: number;
    regras: number;
  };
}

export interface ProgramaDTO {
  nome: string;
  descricao?: string;
  leiNumero?: string;
  tipoPrograma: TipoPrograma;
  ativo?: boolean;
}

export interface RegrasNegocio {
  id: number;
  programaId: number;
  tipoRegra: string;
  parametro: any;
  valorBeneficio: number;
  limiteBeneficio: any;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramaComRegras extends Programa {
  regras: RegrasNegocio[];
}

export interface DuplicarProgramaDTO {
  novoNome: string;
}

export interface EstatisticasPrograma {
  totalProgramas: number;
  programasAtivos: number;
  porTipo: Array<{
    tipoPrograma: TipoPrograma;
    _count: { id: number };
  }>;
  comMaisRegras: Array<{
    id: number;
    nome: string;
    quantidadeRegras: number;
  }>;
}

class ProgramaService extends BaseApiService<Programa, ProgramaDTO> {
  constructor() {
    super("/programas", "comum");
  }

  /**
   * Busca programa com suas regras
   */
  async getByIdWithRules(id: number | string): Promise<ProgramaComRegras> {
    const response = await this.api.get(`${this.baseUrl}/${id}/regras`);
    return response.data;
  }

  /**
   * Busca programas por tipo
   */
  async getByTipo(tipo: string): Promise<Programa[]> {
    const response = await this.api.get(`${this.baseUrl}/tipo/${tipo}`);
    return response.data;
  }

  /**
   * Duplica um programa
   */
  async duplicarPrograma(
    id: number | string,
    dados: DuplicarProgramaDTO
  ): Promise<Programa> {
    const response = await this.api.post(
      `${this.baseUrl}/${id}/duplicar`,
      dados
    );
    return response.data.programa;
  }

  /**
   * Busca estatísticas dos programas
   */
  async getEstatisticas(): Promise<EstatisticasPrograma> {
    const response = await this.api.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  /**
   * Busca tipos de programa disponíveis
   */
  getTiposPrograma() {
    return [
      { value: TipoPrograma.SUBSIDIO, label: "Subsídio" },
      { value: TipoPrograma.MATERIAL, label: "Fornecimento de Material" },
      { value: TipoPrograma.SERVICO, label: "Prestação de Serviço" },
      { value: TipoPrograma.CREDITO, label: "Crédito Rural" },
      { value: TipoPrograma.ASSISTENCIA, label: "Assistência Técnica" },
    ];
  }

  /**
   * Busca por termo (sobrescreve método da classe base)
   */
  async buscarPorTermo(termo: string): Promise<Programa[]> {
    if (!termo.trim()) {
      return this.getAll();
    }

    const response = await this.api.get(`${this.baseUrl}`, {
      params: { search: termo },
    });
    return response.data;
  }

  /**
   * Valida dados do programa antes de enviar
   */
  private validateProgramaData(data: ProgramaDTO): string[] {
    const errors: string[] = [];

    if (!data.nome?.trim()) {
      errors.push("Nome é obrigatório");
    }

    if (!data.tipoPrograma?.trim()) {
      errors.push("Tipo de programa é obrigatório");
    }

    if (
      data.leiNumero &&
      data.leiNumero.trim() &&
      !/^(LEI\s+)?N[°º]?\s*\d+/.test(data.leiNumero.toUpperCase())
    ) {
      errors.push("Formato da lei inválido. Ex: LEI Nº 1234/2023");
    }

    return errors;
  }
}

export default new ProgramaService();
