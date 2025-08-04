import BaseApiService from "../baseApiService";
import apiClient from "../apiConfig";
import { TipoPerfil } from "../comum/programaService";

export enum StatusSolicitacao {
  PENDENTE = "pendente",
  EM_ANALISE = "em_analise",
  APROVADA = "aprovada",
  REJEITADA = "rejeitada",
  CANCELADA = "cancelada"
}

export interface SolicitacaoBeneficio {
  id: number;
  pessoaId: number;
  programaId: number;
  datasolicitacao: string;
  status: StatusSolicitacao;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  
  pessoa: {
    id: number;
    nome: string;
    cpfCnpj: string;
    telefone?: string;
    email?: string;
    produtor?: {
      id: number;
      dap?: string;
      tipoProdutor?: string;
      atividadePrincipal?: string;
    };
  };
  programa: {
    id: number;
    nome: string;
    tipoPrograma: string;
    secretaria: TipoPerfil;
    ativo: boolean;
  };
}

export interface SolicitacaoBeneficioDTO {
  pessoaId: number;
  programaId: number;
  observacoes?: string;
  status?: StatusSolicitacao;
}

export interface EstatisticasSolicitacao {
  totalSolicitacoes: number;
  porStatus: Array<{
    status: string;
    _count: { id: number };
  }>;
  porSecretaria: Array<{
    programaId: number;
    _count: { id: number };
  }>;
  programasMaisSolicitados: Array<{
    programaId: number;
    _count: { id: number };
    programa?: {
      id: number;
      nome: string;
      secretaria: TipoPerfil;
    };
  }>;
}

class SolicitacaoBeneficioService extends BaseApiService<SolicitacaoBeneficio, SolicitacaoBeneficioDTO> {
  constructor() {
    super("/solicitacoesBeneficio", "comum");
  }

  async getByPessoa(pessoaId: number | string): Promise<SolicitacaoBeneficio[]> {
    const response = await apiClient.get(`${this.baseUrl}/pessoa/${pessoaId}`);
    return response.data;
  }

  async getByPrograma(programaId: number | string): Promise<SolicitacaoBeneficio[]> {
    const response = await apiClient.get(`${this.baseUrl}/programa/${programaId}`);
    return response.data;
  }

  async getBySecretaria(secretaria: string): Promise<SolicitacaoBeneficio[]> {
    const response = await apiClient.get(`${this.baseUrl}/secretaria/${secretaria}`);
    return response.data;
  }

  async updateStatus(
    id: number | string, 
    dados: {
      status: StatusSolicitacao;
      observacoes?: string;
    }
  ): Promise<SolicitacaoBeneficio> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/status`, dados);
    return response.data.solicitacao;
  }

  async getEstatisticas(): Promise<EstatisticasSolicitacao> {
    const response = await apiClient.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  async buscarPorTermo(termo: string): Promise<SolicitacaoBeneficio[]> {
    if (!termo.trim()) {
      return this.getAll();
    }

    const response = await apiClient.get(`${this.baseUrl}`, {
      params: { search: termo },
    });
    return response.data;
  }

  getStatusOptions() {
    return [
      { value: StatusSolicitacao.PENDENTE, label: "Pendente", color: "yellow" as const },
      { value: StatusSolicitacao.EM_ANALISE, label: "Em Análise", color: "blue" as const },
      { value: StatusSolicitacao.APROVADA, label: "Aprovada", color: "green" as const },
      { value: StatusSolicitacao.REJEITADA, label: "Rejeitada", color: "red" as const },
      { value: StatusSolicitacao.CANCELADA, label: "Cancelada", color: "gray" as const },
    ];
  }

  formatarStatus(status: string): string {
    const statusMap = {
      [StatusSolicitacao.PENDENTE]: "Pendente",
      [StatusSolicitacao.EM_ANALISE]: "Em Análise",
      [StatusSolicitacao.APROVADA]: "Aprovada",
      [StatusSolicitacao.REJEITADA]: "Rejeitada",
      [StatusSolicitacao.CANCELADA]: "Cancelada",
    };
    
    return statusMap[status as StatusSolicitacao] || status;
  }

  getStatusColor(status: string): "green" | "red" | "yellow" | "blue" | "gray" {
    const colorMap = {
      [StatusSolicitacao.PENDENTE]: "yellow" as const,
      [StatusSolicitacao.EM_ANALISE]: "blue" as const,
      [StatusSolicitacao.APROVADA]: "green" as const,
      [StatusSolicitacao.REJEITADA]: "red" as const,
      [StatusSolicitacao.CANCELADA]: "gray" as const,
    };
    
    return colorMap[status as StatusSolicitacao] || "gray";
  }

  private validateSolicitacaoData(data: SolicitacaoBeneficioDTO): string[] {
    const errors: string[] = [];

    if (!data.pessoaId) {
      errors.push("Pessoa é obrigatória");
    }

    if (!data.programaId) {
      errors.push("Programa é obrigatório");
    }

    return errors;
  }
}

export default new SolicitacaoBeneficioService();