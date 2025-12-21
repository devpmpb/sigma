// frontend/src/services/comum/programaService.ts - ARQUIVO ATUALIZADO
import BaseApiService from "../baseApiService";
import apiClient from "../apiConfig";

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
  leiNumero?: string | null;
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
    secretaria: TipoPerfil;
    quantidadeRegras: number;
  }>;
}

class ProgramaService extends BaseApiService<Programa, ProgramaDTO> {
  constructor() {
    super("/programas", "comum");
  }

  buscarPorTermo = async (termo: string): Promise<Programa[]> => {
    const response = await apiClient.get(`${this.baseUrl}/busca`, {
      params: { termo },
    });
    return response.data;
  };

  async getBySecretaria(secretaria: string): Promise<Programa[]> {
    const response = await apiClient.get(
      `${this.baseUrl}/secretaria/${secretaria}`
    );
    return response.data;
  }

  async getProgramasAgricultura(): Promise<Programa[]> {
    return this.getBySecretaria("agricultura");
  }

  async getProgramasObras(): Promise<Programa[]> {
    return this.getBySecretaria("obras");
  }

  async getByIdWithRules(id: number | string): Promise<ProgramaComRegras> {
    const response = await apiClient.get(`${this.baseUrl}/${id}/regras`);
    return response.data;
  }

  async getByTipo(tipo: string): Promise<Programa[]> {
    const response = await apiClient.get(`${this.baseUrl}/tipo/${tipo}`);
    return response.data;
  }

  async duplicarPrograma(
    id: number | string,
    dados: DuplicarProgramaDTO
  ): Promise<Programa> {
    const response = await apiClient.post(
      `${this.baseUrl}/${id}/duplicar`,
      dados
    );
    return response.data.programa;
  }
  async getEstatisticas(): Promise<EstatisticasPrograma> {
    const response = await apiClient.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  getSecretarias() {
    return [
      { value: TipoPerfil.OBRAS, label: "Secretaria de Obras" },
      { value: TipoPerfil.AGRICULTURA, label: "Secretaria de Agricultura" },
    ];
  }

  getTiposPrograma() {
    return [
      { value: TipoPrograma.SUBSIDIO, label: "Subsídio" },
      { value: TipoPrograma.MATERIAL, label: "Fornecimento de Material" },
      { value: TipoPrograma.SERVICO, label: "Prestação de Serviço" },
      { value: TipoPrograma.CREDITO, label: "Crédito Rural" },
      { value: TipoPrograma.ASSISTENCIA, label: "Assistência Técnica" },
    ];
  }

  formatarSecretaria(secretaria: TipoPerfil): string {
    const secretariaMap = {
      [TipoPerfil.OBRAS]: "Obras",
      [TipoPerfil.AGRICULTURA]: "Agricultura",
      [TipoPerfil.ADMIN]: "Administração",
    };

    return secretariaMap[secretaria] || secretaria;
  }

  getSecretariaColor(secretaria: TipoPerfil): "green" | "blue" | "purple" {
    const colorMap = {
      [TipoPerfil.OBRAS]: "blue" as const,
      [TipoPerfil.AGRICULTURA]: "green" as const,
      [TipoPerfil.ADMIN]: "purple" as const,
    };

    return colorMap[secretaria] || "blue";
  }

  /*private validateProgramaData(data: ProgramaDTO): string[] {
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
  }*/
}

export default new ProgramaService();
