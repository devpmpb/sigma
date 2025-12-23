/**
 * Serviço para o Dashboard Executivo
 * Busca dados de estatísticas para visualização
 */

import apiClient from "../apiConfig";
import {
  cacheDashboardData,
  getCachedDashboardData,
  isOnline,
  //type EstatisticasGerais,
  type EstatisticaPrograma,
  type EstatisticaPeriodo,
  type TopProdutor,
} from "../../pwa";

// Tipos de resposta da API
export interface DashboardEstatisticasGerais {
  ano: number;
  totalInvestido: number;
  totalSolicitacoes: number;
  produtoresAtendidos: number;
  mediaPorProdutor: number;
  comparativoAnoAnterior: {
    ano: number;
    totalInvestido: number;
    variacaoPercentual: number;
  };
  ultimaAtualizacao: string;
}

export interface DashboardPorPrograma {
  ano: number;
  programas: EstatisticaPrograma[];
}

export interface DashboardPorPeriodo {
  ano: number;
  meses: EstatisticaPeriodo[];
}

export interface DashboardTopProdutores {
  ano: number;
  produtores: TopProdutor[];
}

export interface DashboardResumoCompleto {
  ano: number | "todos";
  estatisticas: {
    totalInvestido: number;
    totalSolicitacoes: number;
    produtoresAtendidos: number;
    mediaPorProdutor: number;
  };
  porPrograma: Array<{
    id: number;
    nome: string;
    valor: number;
    quantidade: number;
  }>;
  porMes: Array<{
    mes: number;
    valor: number;
    quantidade: number;
  }>;
  topProdutores: Array<{
    id: number;
    nome: string;
    valor: number;
    quantidade: number;
  }>;
  porStatus: Record<string, number>;
  ultimaAtualizacao: string;
}

const BASE_URL = "/dashboard";

/**
 * Busca estatísticas gerais com fallback para cache offline
 */
export async function getEstatisticasGerais(
  ano?: number
): Promise<DashboardEstatisticasGerais | null> {
  try {
    if (!isOnline()) {
      console.log("📴 Offline - buscando cache de estatísticas gerais");
      const cached = await getCachedDashboardData<DashboardEstatisticasGerais>(
        "ESTATISTICAS_GERAIS"
      );
      return cached;
    }

    const params = ano ? { ano } : {};
    const response = await apiClient.get<DashboardEstatisticasGerais>(
      `${BASE_URL}/estatisticas-gerais`,
      { params }
    );

    // Salvar no cache
    await cacheDashboardData("ESTATISTICAS_GERAIS", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas gerais:", error);

    // Tentar cache em caso de erro
    const cached = await getCachedDashboardData<DashboardEstatisticasGerais>(
      "ESTATISTICAS_GERAIS"
    );
    if (cached) {
      console.log("📦 Usando cache de fallback");
      return cached;
    }

    throw error;
  }
}

/**
 * Busca estatísticas por programa com fallback para cache offline
 */
export async function getPorPrograma(
  ano?: number
): Promise<DashboardPorPrograma | null> {
  try {
    if (!isOnline()) {
      console.log("📴 Offline - buscando cache por programa");
      const cached = await getCachedDashboardData<DashboardPorPrograma>(
        "POR_PROGRAMA"
      );
      return cached;
    }

    const params = ano ? { ano } : {};
    const response = await apiClient.get<DashboardPorPrograma>(
      `${BASE_URL}/por-programa`,
      { params }
    );

    await cacheDashboardData("POR_PROGRAMA", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao buscar por programa:", error);
    const cached = await getCachedDashboardData<DashboardPorPrograma>(
      "POR_PROGRAMA"
    );
    if (cached) return cached;
    throw error;
  }
}

/**
 * Busca estatísticas por período com fallback para cache offline
 */
export async function getPorPeriodo(
  ano?: number
): Promise<DashboardPorPeriodo | null> {
  try {
    if (!isOnline()) {
      console.log("📴 Offline - buscando cache por período");
      const cached = await getCachedDashboardData<DashboardPorPeriodo>(
        "POR_PERIODO"
      );
      return cached;
    }

    const params = ano ? { ano } : {};
    const response = await apiClient.get<DashboardPorPeriodo>(
      `${BASE_URL}/por-periodo`,
      { params }
    );

    await cacheDashboardData("POR_PERIODO", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao buscar por período:", error);
    const cached = await getCachedDashboardData<DashboardPorPeriodo>(
      "POR_PERIODO"
    );
    if (cached) return cached;
    throw error;
  }
}

/**
 * Busca top produtores com fallback para cache offline
 */
export async function getTopProdutores(
  ano?: number,
  limite?: number
): Promise<DashboardTopProdutores | null> {
  try {
    if (!isOnline()) {
      console.log("📴 Offline - buscando cache top produtores");
      const cached = await getCachedDashboardData<DashboardTopProdutores>(
        "TOP_PRODUTORES"
      );
      return cached;
    }

    const params: Record<string, number> = {};
    if (ano) params.ano = ano;
    if (limite) params.limite = limite;

    const response = await apiClient.get<DashboardTopProdutores>(
      `${BASE_URL}/top-produtores`,
      { params }
    );

    await cacheDashboardData("TOP_PRODUTORES", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao buscar top produtores:", error);
    const cached = await getCachedDashboardData<DashboardTopProdutores>(
      "TOP_PRODUTORES"
    );
    if (cached) return cached;
    throw error;
  }
}

/**
 * Busca resumo completo (todos os dados em uma chamada)
 * Ideal para carregamento inicial do dashboard
 * @param ano - Número do ano ou "todos" para todos os anos
 */
export async function getResumoCompleto(
  ano?: number | "todos"
): Promise<DashboardResumoCompleto | null> {
  try {
    const params = ano ? { ano } : {};
    const response = await apiClient.get<DashboardResumoCompleto>(
      `${BASE_URL}/resumo-completo`,
      { params }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Erro ao buscar resumo completo:", error);
    throw error;
  }
}

/**
 * Busca anos disponíveis para filtro
 */
export async function getAnos(): Promise<number[]> {
  try {
    const response = await apiClient.get<number[]>(`${BASE_URL}/anos`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao buscar anos:", error);
    // Fallback: retorna ano atual
    return [new Date().getFullYear()];
  }
}

// Export default object para compatibilidade
const dashboardService = {
  getEstatisticasGerais,
  getPorPrograma,
  getPorPeriodo,
  getTopProdutores,
  getResumoCompleto,
  getAnos,
};

export default dashboardService;
