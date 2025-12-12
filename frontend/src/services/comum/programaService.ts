// frontend/src/services/comum/programaService.ts - ARQUIVO ATUALIZADO
import BaseApiService from "../baseApiService";

export enum TipoPrograma {
  SUBSIDIO = "SUBSIDIO",
  MATERIAL = "MATERIAL",
  SERVICO = "SERVICO",
  CREDITO = "CREDITO",
  ASSISTENCIA = "ASSISTENCIA",
}

// NOVO ENUM ADICIONADO
export enum TipoPerfil {
  ADMIN = "ADMIN",
  OBRAS = "OBRAS",
  AGRICULTURA = "AGRICULTURA",
}

export interface Programa {
  id: number;
  nome: string;
  descricao: string | null;
  leiNumero: string | null;
  tipoPrograma: TipoPrograma;
  secretaria: TipoPerfil;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  periodicidade?: string;
  unidadeLimite?: string;
  limiteMaximoFamilia?: number;
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
  secretaria: TipoPerfil; // NOVO CAMPO ADICIONADO
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
  porSecretaria: Array<{
    // NOVO CAMPO ADICIONADO
    secretaria: TipoPerfil;
    _count: { id: number };
  }>;
  comMaisRegras: Array<{
    id: number;
    nome: string;
    secretaria: TipoPerfil; // NOVO CAMPO ADICIONADO
    quantidadeRegras: number;
  }>;
}

class ProgramaService extends BaseApiService<Programa, ProgramaDTO> {
  constructor() {
    super("/programas", "comum");
  }

  /**
   * NOVO MÉTODO: Busca programas por secretaria
   */
  async getBySecretaria(secretaria: string): Promise<Programa[]> {
    const response = await this.api.get(
      `${this.baseUrl}/secretaria/${secretaria}`
    );
    return response.data;
  }

  async getProgramasAgricultura(): Promise<Programa[]> {
    return this.getBySecretaria("agricultura");
  }

  /**
   * NOVO MÉTODO: Busca programas de obras (qualquer pessoa)
   */
  async getProgramasObras(): Promise<Programa[]> {
    return this.getBySecretaria("obras");
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
   * NOVO MÉTODO: Busca secretarias disponíveis
   */
  getSecretarias() {
    return [
      { value: TipoPerfil.OBRAS, label: "Secretaria de Obras" },
      { value: TipoPerfil.AGRICULTURA, label: "Secretaria de Agricultura" },
    ];
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
   * NOVO MÉTODO: Formata secretaria para exibição
   */
  formatarSecretaria(secretaria: TipoPerfil): string {
    const secretariaMap = {
      [TipoPerfil.OBRAS]: "Obras",
      [TipoPerfil.AGRICULTURA]: "Agricultura",
      [TipoPerfil.ADMIN]: "Administração",
    };

    return secretariaMap[secretaria] || secretaria;
  }

  /**
   * NOVO MÉTODO: Retorna cor da secretaria para badges
   */
  getSecretariaColor(secretaria: TipoPerfil): "green" | "blue" | "purple" {
    const colorMap = {
      [TipoPerfil.OBRAS]: "blue" as const,
      [TipoPerfil.AGRICULTURA]: "green" as const,
      [TipoPerfil.ADMIN]: "purple" as const,
    };

    return colorMap[secretaria] || "blue";
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
   * Valida dados do programa antes de enviar - ATUALIZADO
   */
  private validateProgramaData(data: ProgramaDTO): string[] {
    const errors: string[] = [];

    if (!data.nome?.trim()) {
      errors.push("Nome é obrigatório");
    }

    if (!data.tipoPrograma?.trim()) {
      errors.push("Tipo de programa é obrigatório");
    }

    // NOVA VALIDAÇÃO ADICIONADA
    if (!data.secretaria) {
      errors.push("Secretaria é obrigatória");
    }

    if (
      data.secretaria &&
      !Object.values(TipoPerfil).includes(data.secretaria)
    ) {
      errors.push("Secretaria deve ser Obras ou Agricultura");
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
