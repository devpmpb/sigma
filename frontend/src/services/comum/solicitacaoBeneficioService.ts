// frontend/src/services/comum/solicitacaoBeneficioService.ts
import BaseApiService from "../baseApiService";
import apiClient from "../apiConfig";
import { TipoPerfil } from "../comum/programaService";

export enum StatusSolicitacao {
  PENDENTE = "pendente",
  EM_ANALISE = "em_analise",
  APROVADA = "aprovada",
  REJEITADA = "rejeitada",
  CANCELADA = "cancelada",
}

export interface SolicitacaoBeneficio {
  id: number;
  pessoaId: number;
  programaId: number;
  datasolicitacao: string;
  status: StatusSolicitacao;
  valorSolicitado?: number;
  valorAprovado?: number;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;

  // Relacionamentos
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
  valorSolicitado?: number;
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
    _sum: { valorAprovado: number | null };
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

class SolicitacaoBeneficioService extends BaseApiService<
  SolicitacaoBeneficio,
  SolicitacaoBeneficioDTO
> {
  constructor() {
    super("/solicitacoesBeneficio", "comum");
  }

  /**
   * Busca solicitações por pessoa
   */
  async getByPessoa(
    pessoaId: number | string
  ): Promise<SolicitacaoBeneficio[]> {
    const response = await this.api.get(`${this.baseUrl}/pessoa/${pessoaId}`);
    return response.data;
  }

  /**
   * Busca solicitações por programa
   */
  async getByPrograma(
    programaId: number | string
  ): Promise<SolicitacaoBeneficio[]> {
    const response = await this.api.get(
      `${this.baseUrl}/programa/${programaId}`
    );
    return response.data;
  }

  /**
   * Busca solicitações por secretaria
   */
  async getBySecretaria(secretaria: string): Promise<SolicitacaoBeneficio[]> {
    const response = await this.api.get(
      `${this.baseUrl}/secretaria/${secretaria}`
    );
    return response.data;
  }

  /**
   * Atualiza status da solicitação
   */
  async updateStatus(
    id: number | string,
    dados: {
      status: StatusSolicitacao;
      valorAprovado?: number;
      observacoes?: string;
    }
  ): Promise<SolicitacaoBeneficio> {
    const response = await this.api.put(`${this.baseUrl}/${id}/status`, dados);
    return response.data.solicitacao;
  }

  /**
   * Busca estatísticas das solicitações
   */
  async getEstatisticas(): Promise<EstatisticasSolicitacao> {
    const response = await this.api.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  /**
   * Busca por termo (sobrescreve método da classe base)
   */
  async buscarPorTermo(termo: string): Promise<SolicitacaoBeneficio[]> {
    if (!termo.trim()) {
      return this.getAll();
    }

    const response = await this.api.get(`${this.baseUrl}`, {
      params: { search: termo },
    });
    return response.data;
  }

  /**
   * Opções de status para select
   */
  getStatusOptions() {
    return [
      {
        value: StatusSolicitacao.PENDENTE,
        label: "Pendente",
        color: "yellow" as const,
      },
      {
        value: StatusSolicitacao.EM_ANALISE,
        label: "Em Análise",
        color: "blue" as const,
      },
      {
        value: StatusSolicitacao.APROVADA,
        label: "Aprovada",
        color: "green" as const,
      },
      {
        value: StatusSolicitacao.REJEITADA,
        label: "Rejeitada",
        color: "red" as const,
      },
      {
        value: StatusSolicitacao.CANCELADA,
        label: "Cancelada",
        color: "gray" as const,
      },
    ];
  }

  /**
   * Formata status para exibição
   */
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

  /**
   * Retorna cor do status para badges
   */
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

  /**
   * Valida dados da solicitação
   */
  private validateSolicitacaoData(data: SolicitacaoBeneficioDTO): string[] {
    const errors: string[] = [];

    if (!data.pessoaId) {
      errors.push("Pessoa é obrigatória");
    }

    if (!data.programaId) {
      errors.push("Programa é obrigatório");
    }

    if (
      data.valorSolicitado &&
      (isNaN(Number(data.valorSolicitado)) || Number(data.valorSolicitado) <= 0)
    ) {
      errors.push("Valor solicitado deve ser um número positivo");
    }

    return errors;
  }

  /**
   * Formata valor monetário
   */
  formatarValor(valor?: number): string {
    if (!valor) return "R$ 0,00";

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }
}

export default new SolicitacaoBeneficioService();
