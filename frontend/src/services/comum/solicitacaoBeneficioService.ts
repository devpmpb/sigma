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
  observacoes?: string;
  createdAt: string;
  updatedAt: string;

  // NOVOS CAMPOS: Cálculo automático
  regraAplicadaId?: number;
  valorCalculado?: number;
  quantidadeSolicitada?: number;
  calculoDetalhes?: {
    areaEfetiva?: number;
    regraAtendida?: string;
    condicao?: string;
    valorBase?: number;
    quantidadeSolicitada?: number;
    percentualAplicado?: number;
    limiteAplicado?: any;
    observacoes?: string[];
  };

  // Relacionamentos
  pessoa: {
    id: number;
    nome: string;
    cpfCnpj: string;
    telefone?: string;
    email?: string;
    isProdutor?: boolean;
    inscricaoEstadual?: string;
  };
  programa: {
    id: number;
    nome: string;
    tipoPrograma: string;
    secretaria: TipoPerfil;
    ativo: boolean;
  };
  regraAplicada?: {
    id: number;
    tipoRegra: string;
    parametro: any;
    valorBeneficio: number;
    limiteBeneficio: any;
  };
}

export interface SolicitacaoBeneficioDTO {
  pessoaId: number;
  programaId: number;
  quantidadeSolicitada?: number;
  observacoes?: string;
  status?: StatusSolicitacao;
  modalidade?: string; // APLICACAO_SUBSIDIADA, RETIRADA_SEMEN, REEMBOLSO, etc.
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

class SolicitacaoBeneficioService extends BaseApiService<
  SolicitacaoBeneficio,
  SolicitacaoBeneficioDTO
> {
  constructor() {
    super("/solicitacoesBeneficio", "comum");
  }

  /**
   * Sobrescrever create para SEMPRE usar endpoint com cálculo automático
   * O FormBase chama este método normalmente, mas por baixo usa o endpoint inteligente
   */
  create = async (
    data: SolicitacaoBeneficioDTO
  ): Promise<SolicitacaoBeneficio> => {
    console.log("🚀 CREATE chamado com dados:", data);

    // Usar sempre o endpoint com cálculo automático
    const dadosParaEnviar = {
      pessoaId: Number(data.pessoaId),
      programaId: Number(data.programaId),
      quantidadeSolicitada: data.quantidadeSolicitada
        ? Number(data.quantidadeSolicitada)
        : undefined,
      observacoes: data.observacoes,
      modalidade: data.modalidade, // Passar modalidade para o backend
    };

    console.log("📤 Enviando para createComCalculo:", dadosParaEnviar);

    const resultado = await this.createComCalculo(dadosParaEnviar);

    console.log("✅ Resultado do createComCalculo:", resultado);

    return resultado.solicitacao;
  };

  /**
   * Sobrescrever update para garantir conversão de tipos
   */
  async update(
    id: number | string,
    data: Partial<SolicitacaoBeneficioDTO>
  ): Promise<SolicitacaoBeneficio> {
    // Garantir que IDs sejam números se fornecidos
    const processedData = {
      ...data,
      ...(data.pessoaId && { pessoaId: Number(data.pessoaId) }),
      ...(data.programaId && { programaId: Number(data.programaId) }),
    };

    const response = await apiClient.put(
      `${this.baseUrl}/${id}`,
      processedData
    );
    return response.data;
  }

  /**
   * Busca solicitações por pessoa
   */
  async getByPessoa(
    pessoaId: number | string
  ): Promise<SolicitacaoBeneficio[]> {
    const response = await apiClient.get(`${this.baseUrl}/pessoa/${pessoaId}`);
    return response.data;
  }

  /**
   * Busca solicitações por programa
   */
  async getByPrograma(
    programaId: number | string
  ): Promise<SolicitacaoBeneficio[]> {
    const response = await apiClient.get(
      `${this.baseUrl}/programa/${programaId}`
    );
    return response.data;
  }

  /**
   * Busca solicitações por secretaria
   */
  async getBySecretaria(secretaria: string): Promise<SolicitacaoBeneficio[]> {
    const response = await apiClient.get(
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
      observacoes?: string;
    }
  ): Promise<SolicitacaoBeneficio> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/status`, dados);
    return response.data.solicitacao;
  }

  /**
   * Busca estatísticas das solicitações
   */
  async getEstatisticas(): Promise<EstatisticasSolicitacao> {
    const response = await apiClient.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  /**
   * Busca por termo (sobrescreve método da classe base)
   */
  async buscarPorTermo(termo: string): Promise<SolicitacaoBeneficio[]> {
    if (!termo.trim()) {
      return this.getAll();
    }

    const response = await apiClient.get(`${this.baseUrl}`, {
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

  // ==================== NOVOS MÉTODOS ====================

  /**
   * Calcula o benefício sem criar a solicitação
   */
  async calcularBeneficio(dados: {
    pessoaId: number;
    programaId: number;
    quantidadeSolicitada?: number;
    dadosAdicionais?: { quantidadeAnimais?: number };
    modalidade?: string; // Para programas com múltiplas modalidades
  }): Promise<{
    sucesso: boolean;
    calculo: {
      regraAplicadaId: number | null;
      valorCalculado: number;
      calculoDetalhes: any;
      mensagem: string;
      avisos?: string[];
    };
    limitePeriodo: {
      permitido: boolean;
      mensagem: string;
      detalhes?: any;
    } | null;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/calcular`, dados);
    return response.data;
  }

  /**
   * Cria solicitação com cálculo automático
   */
  async createComCalculo(dados: {
    pessoaId: number;
    programaId: number;
    quantidadeSolicitada?: number;
    observacoes?: string;
    modalidade?: string; // Para programas com múltiplas modalidades
  }): Promise<{
    sucesso: boolean;
    mensagem: string;
    solicitacao: SolicitacaoBeneficio;
    calculo: {
      mensagem: string;
      avisos?: string[];
    };
  }> {
    console.log("🎯 createComCalculo chamado com:", dados);
    const response = await apiClient.post(`${this.baseUrl}/com-calculo`, dados);
    console.log("📥 Resposta do backend:", response.data);
    return response.data;
  }

  /**
   * Busca histórico de mudanças de status
   */
  async getHistorico(id: number | string): Promise<{
    historico: Array<{
      id: number;
      statusAnterior: string;
      statusNovo: string;
      usuario: string | number;
      motivo?: string;
      observacoes?: string;
      data: string;
      descricao: string;
    }>;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/${id}/historico`);
    return response.data;
  }

  /**
   * Atualiza status com registro no histórico
   */
  async updateStatusComHistorico(
    id: number | string,
    dados: {
      status: StatusSolicitacao;
      observacoes?: string;
      motivo?: string;
      usuarioId?: number;
    }
  ): Promise<{
    sucesso: boolean;
    mensagem: string;
    solicitacao: SolicitacaoBeneficio;
  }> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/status`, dados);
    return response.data;
  }
}

export default new SolicitacaoBeneficioService();
