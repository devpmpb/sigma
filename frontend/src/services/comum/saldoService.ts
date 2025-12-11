// frontend/src/services/comum/saldoService.ts
// Serviço para consulta de saldo de benefícios

import apiClient from "../apiConfig";

// ============================================================================
// INTERFACES
// ============================================================================

export interface SaldoDisponivel {
  programaId: number;
  programaNome: string;
  periodicidade: string;
  anoReferencia: number;

  // Limites
  limiteTotal: number;
  unidade: string;

  // Uso
  jaUtilizado: number;
  saldoDisponivel: number;

  // Valor
  valorPorUnidade: number;
  valorMaximoRestante: number;

  // Status
  podeNovaSolicitacao: boolean;
  proximaLiberacao?: string;
  mensagem: string;

  // Histórico do período
  solicitacoesNoPeriodo: {
    id: number;
    data: string;
    quantidade: number;
    valor: number;
    status: string;
  }[];
}

export interface SaldoRapido {
  disponivel: number;
  unidade: string;
  valorMaximo: number;
  mensagem: string;
}

export interface VerificacaoDisponibilidade {
  permitido: boolean;
  mensagem: string;
  quantidadeMaxima: number;
}

export interface SaldosPorPessoa {
  pessoaId: number;
  programas: Array<{
    programaId: number;
    programaNome: string;
    disponivel: number;
    unidade: string;
    valorMaximo: number;
    mensagem: string;
  }>;
}

// ============================================================================
// SERVIÇO
// ============================================================================

class SaldoService {
  private baseUrl = "/api/comum/saldo";

  /**
   * Consulta saldo completo com histórico
   */
  async getSaldo(
    pessoaId: number,
    programaId: number
  ): Promise<SaldoDisponivel> {
    const response = await apiClient.get(
      `${this.baseUrl}/${pessoaId}/${programaId}`
    );
    return response.data;
  }

  /**
   * Consulta rápida de saldo (para exibição na tela)
   */
  async getSaldoRapido(
    pessoaId: number,
    programaId: number
  ): Promise<SaldoRapido> {
    const response = await apiClient.get(
      `${this.baseUrl}/${pessoaId}/${programaId}/rapido`
    );
    return response.data;
  }

  /**
   * Verifica se uma quantidade está disponível
   */
  async verificarDisponibilidade(
    pessoaId: number,
    programaId: number,
    quantidade: number
  ): Promise<VerificacaoDisponibilidade> {
    const response = await apiClient.post(`${this.baseUrl}/verificar`, {
      pessoaId,
      programaId,
      quantidade,
    });
    return response.data;
  }

  /**
   * Busca saldo de todos os programas para uma pessoa
   */
  async getSaldosPorPessoa(pessoaId: number): Promise<SaldosPorPessoa> {
    const response = await apiClient.get(`${this.baseUrl}/pessoa/${pessoaId}`);
    return response.data;
  }

  /**
   * Formata valor monetário
   */
  formatarValor(valor: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  /**
   * Formata quantidade com unidade
   */
  formatarQuantidade(quantidade: number, unidade: string): string {
    return `${quantidade.toFixed(2)} ${unidade}`;
  }

  /**
   * Formata periodicidade para exibição
   */
  formatarPeriodicidade(periodicidade: string): string {
    const map: Record<string, string> = {
      ANUAL: "Anual",
      BIENAL: "Bienal (2 anos)",
      TRIENAL: "Trienal (3 anos)",
      UNICO: "Único",
    };
    return map[periodicidade] || periodicidade;
  }
}

const saldoService = new SaldoService();
export default saldoService;
