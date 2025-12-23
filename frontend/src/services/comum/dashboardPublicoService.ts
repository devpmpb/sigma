/**
 * Serviço para o Dashboard Público (sem autenticação)
 * Usado pelo prefeito/secretário via PWA
 */

import axios from "axios";

// Cliente axios separado (sem token de autenticação)
const getBaseUrl = (): string => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Se estiver em produção (domínio ou IP externo), usar mesma origem
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `${protocol}//${hostname}/api`;
  }

  // Desenvolvimento local
  return `http://localhost:3001/api`;
};

const publicClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tipos
export interface DashboardResumoPublico {
  ano: number | "todos";
  filtros: {
    programaId: number | null;
    produtorId: number | null;
  };
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

export interface ProgramaFiltro {
  id: number;
  nome: string;
}

export interface ProdutorFiltro {
  id: number;
  nome: string;
  cpfCnpj: string;
}

const BASE_URL = "/dashboard-publico";

/**
 * Busca resumo completo com filtros opcionais
 * @param ano - Ano específico ou "todos" para todos os anos
 */
export async function getResumoPublico(
  ano?: number | "todos",
  programaId?: number,
  produtorId?: number
): Promise<DashboardResumoPublico> {
  const params: Record<string, string | number> = {};
  if (ano) params.ano = ano;
  if (programaId) params.programaId = programaId;
  if (produtorId) params.produtorId = produtorId;

  const response = await publicClient.get<DashboardResumoPublico>(
    `${BASE_URL}/resumo`,
    { params }
  );
  return response.data;
}

/**
 * Lista programas para filtro
 */
export async function getProgramas(): Promise<ProgramaFiltro[]> {
  const response = await publicClient.get<ProgramaFiltro[]>(
    `${BASE_URL}/programas`
  );
  return response.data;
}

/**
 * Busca produtores para filtro (autocomplete)
 */
export async function buscarProdutores(
  busca?: string
): Promise<ProdutorFiltro[]> {
  const params = busca ? { busca } : {};
  const response = await publicClient.get<ProdutorFiltro[]>(
    `${BASE_URL}/produtores`,
    { params }
  );
  return response.data;
}

/**
 * Lista anos disponíveis
 */
export async function getAnos(): Promise<number[]> {
  const response = await publicClient.get<number[]>(`${BASE_URL}/anos`);
  return response.data;
}

const dashboardPublicoService = {
  getResumoPublico,
  getProgramas,
  buscarProdutores,
  getAnos,
};

export default dashboardPublicoService;
