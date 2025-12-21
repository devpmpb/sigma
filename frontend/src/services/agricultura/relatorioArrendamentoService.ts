// frontend/src/services/agricultura/relatorioArrendamentoService.ts
import BaseApiService from "../baseApiService";
import apiClient from "../apiConfig";
import { Arrendamento, ArrendamentoDTO } from "./arrendamentoService";

export interface RelatorioArrendamentoGeral {
  arrendamentos: any[];
  estatisticas: {
    total: number;
    areaTotal: number;
    porStatus: {
      status: string;
      quantidade: number;
      areaTotal: number;
    }[];
    propriedadesUnicas: number;
    arrendatariosUnicos: number;
  };
}

export interface RelatorioPorPropriedade {
  propriedades: {
    propriedade: {
      id: number;
      area: number;
      proprietario: string;
      logradouro: string;
    };
    arrendamentos: {
      arrendatario: string;
      areaArrendada: number;
      dataInicio: string;
      dataFim?: string;
      status: string;
      atividadeProdutiva?: string;
    }[];
    areaArrendadaTotal: number;
    quantidadeArrendamentos: number;
  }[];
  totais: {
    totalPropriedades: number;
    totalArrendamentos: number;
  };
}

export interface RelatorioPorArrendatario {
  arrendatarios: {
    arrendatario: {
      id: number;
      nome: string;
      cpfCnpj: string;
      telefone?: string;
      endereco?: any;
    };
    arrendamentos: {
      propriedade: string;
      proprietario: string;
      areaArrendada: number;
      dataInicio: string;
      dataFim?: string;
      status: string;
      atividadeProdutiva?: string;
    }[];
    areaTotal: number;
    quantidadeArrendamentos: number;
    atividadesProdutivas: string[];
  }[];
  totais: {
    totalArrendatarios: number;
    totalArrendamentos: number;
    areaTotal: number;
  };
}

export interface RelatorioPorAtividade {
  atividades: {
    atividade: string;
    quantidadeArrendamentos: number;
    areaTotal: number;
    arrendatariosUnicos: number;
    propriedadesUnicas: number;
  }[];
  totais: {
    totalArrendamentos: number;
    areaTotal: number;
  };
}

export interface RelatorioVencendo {
  arrendamentos: any[];
  estatisticas: {
    total: number;
    urgentes: number;
    areaTotal: number;
  };
}

class RelatorioArrendamentoService extends BaseApiService<
  Arrendamento,
  ArrendamentoDTO
> {
  constructor() {
    super("/relatorios/arrendamentos", "agricultura");
  }

  async geral(params: {
    dataInicio?: string;
    dataFim?: string;
    status?: string;
    propriedadeId?: number;
  }): Promise<RelatorioArrendamentoGeral> {
    const response = await apiClient.get(`${this.baseUrl}/geral`, { params });
    return response.data;
  }

  async porPropriedade(params: {
    dataInicio?: string;
    dataFim?: string;
  }): Promise<RelatorioPorPropriedade> {
    const response = await apiClient.get(`${this.baseUrl}/por-propriedade`, {
      params,
    });
    return response.data;
  }

  async porArrendatario(params: {
    dataInicio?: string;
    dataFim?: string;
  }): Promise<RelatorioPorArrendatario> {
    const response = await apiClient.get(`${this.baseUrl}/por-arrendatario`, {
      params,
    });
    return response.data;
  }

  async porAtividadeProdutiva(params: {
    dataInicio?: string;
    dataFim?: string;
  }): Promise<RelatorioPorAtividade> {
    const response = await apiClient.get(`${this.baseUrl}/por-atividade`, {
      params,
    });
    return response.data;
  }

  async vencendo(params: { dias?: number }): Promise<RelatorioVencendo> {
    const response = await apiClient.get(`${this.baseUrl}/vencendo`, {
      params,
    });
    return response.data;
  }
}

const relatorioArrendamentoService = new RelatorioArrendamentoService();
export default relatorioArrendamentoService;
