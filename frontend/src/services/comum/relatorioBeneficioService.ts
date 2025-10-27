// frontend/src/services/comum/relatorioBeneficioService.ts
import BaseApiService from "../baseApiService";
import apiClient from "../apiConfig";

export interface RelatorioPorPrograma {
  resumo: {
    programa: string;
    programaId: number;
    totalSolicitacoes: number;
    valorTotal: number;
    porStatus: Record<string, number>;
  }[];
  detalhes: any[];
  totais: {
    totalSolicitacoes: number;
    valorTotal: number;
  };
}

export interface RelatorioProdutores {
  produtores: {
    pessoa: {
      id: number;
      nome: string;
      cpfCnpj: string;
      telefone?: string;
      endereco?: any;
    };
    beneficios: {
      programa: string;
      valor: number;
      data: string;
      status: string;
    }[];
    totalRecebido: number;
    quantidadeBeneficios: number;
  }[];
  totais: {
    totalProdutores: number;
    totalBeneficios: number;
  };
}

export interface RelatorioInvestimento {
  periodos: {
    periodo: string;
    totalInvestido: number;
    quantidadeSolicitacoes: number;
    porPrograma: Record<string, number>;
  }[];
  totais: {
    valorTotal: number;
    quantidadeTotal: number;
  };
}

export interface RelatorioPorSecretaria {
  secretarias: {
    secretaria: string;
    totalInvestido: number;
    quantidadeSolicitacoes: number;
    programas: {
      nome: string;
      total: number;
      quantidade: number;
    }[];
  }[];
  totais: {
    valorTotal: number;
    quantidadeTotal: number;
  };
}

class RelatorioBeneficioService extends BaseApiService {
  constructor() {
    super("/relatorios/beneficios", "comum");
  }

  async porPrograma(params: {
    dataInicio?: string;
    dataFim?: string;
    programaId?: number;
    status?: string;
  }): Promise<RelatorioPorPrograma> {
    const response = await apiClient.get(`${this.baseUrl}/por-programa`, { params });
    return response.data;
  }

  async produtoresBeneficiados(params: {
    dataInicio?: string;
    dataFim?: string;
  }): Promise<RelatorioProdutores> {
    const response = await apiClient.get(`${this.baseUrl}/produtores-beneficiados`, {
      params,
    });
    return response.data;
  }

  async investimentoPorPeriodo(params: {
    dataInicio?: string;
    dataFim?: string;
    agrupamento?: "dia" | "mes" | "ano";
  }): Promise<RelatorioInvestimento> {
    const response = await apiClient.get(`${this.baseUrl}/investimento-periodo`, { params });
    return response.data;
  }

  async porSecretaria(params: {
    dataInicio?: string;
    dataFim?: string;
  }): Promise<RelatorioPorSecretaria> {
    const response = await apiClient.get(`${this.baseUrl}/por-secretaria`, { params });
    return response.data;
  }
}

const relatorioBeneficioService = new RelatorioBeneficioService();
export default relatorioBeneficioService;
