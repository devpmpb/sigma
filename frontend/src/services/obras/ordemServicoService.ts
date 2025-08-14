import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// Interface para a entidade OrdemServico
export interface OrdemServico {
  id: number;
  numeroOrdem: string;
  pessoaId: number;
  pessoa?: {
    id: number;
    nome: string;
    cpfCnpj: string;
  };
  veiculoId: number;
  veiculo?: {
    id: number;
    descricao: string;
    placa: string;
    tipoVeiculo: {
      id: number;
      descricao: string;
    };
  };
  dataServico: string;
  horaInicio?: string;
  horaFim?: string;
  horasEstimadas?: number;
  valorReferencial: number;
  valorCalculado: number;
  observacoes?: string;
  status: StatusOrdemServico;
  usuarioId?: number;
  enderecoServico?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para os dados de criação/atualização
export interface OrdemServicoDTO {
  pessoaId: number;
  veiculoId: number;
  dataServico: string;
  horaInicio?: string;
  horaFim?: string;
  horasEstimadas?: number;
  valorReferencial?: number;
  observacoes?: string;
  enderecoServico?: string;
}

// Enum para status da ordem de serviço
export enum StatusOrdemServico {
  PENDENTE = "pendente",
  EM_EXECUCAO = "em_execucao", 
  CONCLUIDA = "concluida",
  CANCELADA = "cancelada"
}

// Tipos de veículos e seus custos por hora/carga
export interface CustoVeiculo {
  tipo: string;
  custos: {
    ate3h: number;
    de4a10h: number;
    acima11h: number;
  };
  unidade: "hora" | "carga";
}

export const CUSTOS_VEICULOS: Record<string, CustoVeiculo> = {
  "CAMINHAO TRUCK": {
    tipo: "CAMINHAO TRUCK",
    custos: { ate3h: 0.1, de4a10h: 0.3, acima11h: 0.5 },
    unidade: "carga"
  },
  "PA CARREGADEIRA": {
    tipo: "PA CARREGADEIRA", 
    custos: { ate3h: 0.35, de4a10h: 0.40, acima11h: 0.50 },
    unidade: "hora"
  },
  "PATROLA": {
    tipo: "PATROLA",
    custos: { ate3h: 0.35, de4a10h: 0.40, acima11h: 0.50 },
    unidade: "hora"
  }
};

/**
 * Serviço para operações com a entidade OrdemServico
 * Módulo obras
 */
class OrdemServicoService extends BaseApiService<OrdemServico, OrdemServicoDTO> {
  constructor() {
    super("/ordens-servico", "obras");
  }

  /**
   * Busca ordens de serviço por status
   */
  getByStatus = async (status: StatusOrdemServico): Promise<OrdemServico[]> => {
    const response = await apiClient.get(`${this.baseUrl}/status/${status}`);
    return response.data;
  };

  /**
   * Busca ordens de serviço por pessoa
   */
  getByPessoa = async (pessoaId: number): Promise<OrdemServico[]> => {
    const response = await apiClient.get(`${this.baseUrl}/pessoa/${pessoaId}`);
    return response.data;
  };

  /**
   * Busca ordens de serviço por veículo
   */
  getByVeiculo = async (veiculoId: number): Promise<OrdemServico[]> => {
    const response = await apiClient.get(`${this.baseUrl}/veiculo/${veiculoId}`);
    return response.data;
  };

  /**
   * Atualiza status da ordem de serviço
   */
  updateStatus = async (id: number, status: StatusOrdemServico): Promise<OrdemServico> => {
    const response = await apiClient.patch(`${this.baseUrl}/${id}/status`, { status });
    return response.data;
  };

  /**
   * Calcula o valor do serviço baseado no tipo de veículo e horas
   * Usa horasEstimadas se horários reais não estiverem disponíveis
   */
  calcularValorServico = (
    tipoVeiculo: string, 
    horaInicio?: string, 
    horaFim?: string, 
    horasEstimadas?: number,
    valorReferencial: number = 180
  ): number => {
    let horas = 0;
    
    // Se tem horários reais, usar eles
    if (horaInicio && horaFim) {
      horas = this.calcularHorasTrabalhadas(horaInicio, horaFim);
    }
    // Senão, usar horas estimadas
    else if (horasEstimadas) {
      horas = horasEstimadas;
    }
    // Se não tem nenhum, retorna 0
    else {
      return 0;
    }

    const custoVeiculo = CUSTOS_VEICULOS[tipoVeiculo.toUpperCase()];
    
    if (!custoVeiculo) {
      console.warn(`Tipo de veículo não encontrado: ${tipoVeiculo}`);
      return 0;
    }

    let multiplicador = 0;
    
    if (horas <= 3) {
      multiplicador = custoVeiculo.custos.ate3h;
    } else if (horas <= 10) {
      multiplicador = custoVeiculo.custos.de4a10h;
    } else {
      multiplicador = custoVeiculo.custos.acima11h;
    }

    // Se é por carga (caminhão truck), valor é fixo
    if (custoVeiculo.unidade === "carga") {
      return valorReferencial * multiplicador;
    }
    
    // Se é por hora, multiplica pelas horas trabalhadas
    return valorReferencial * multiplicador * horas;
  };

  /**
   * Calcula horas trabalhadas entre dois horários
   */
  calcularHorasTrabalhadas = (horaInicio: string, horaFim: string): number => {
    const [inicioHora, inicioMin] = horaInicio.split(':').map(Number);
    const [fimHora, fimMin] = horaFim.split(':').map(Number);
    
    const inicioEmMinutos = inicioHora * 60 + inicioMin;
    const fimEmMinutos = fimHora * 60 + fimMin;
    
    let diferencaMinutos = fimEmMinutos - inicioEmMinutos;
    
    // Se o horário de fim é menor que início, considera que passou para o dia seguinte
    if (diferencaMinutos < 0) {
      diferencaMinutos += 24 * 60; // 24 horas em minutos
    }
    
    return diferencaMinutos / 60; // Retorna em horas
  };

  /**
   * Gera relatório de ordens de serviço
   */
  gerarRelatorio = async (filtros: {
    dataInicio?: string;
    dataFim?: string;
    status?: StatusOrdemServico;
    veiculoId?: number;
  }): Promise<any> => {
    const response = await apiClient.get(`${this.baseUrl}/relatorio`, { params: filtros });
    return response.data;
  };

  /**
   * Busca estatísticas das ordens de serviço
   */
  getEstatisticas = async (): Promise<{
    total: number;
    pendentes: number;
    emExecucao: number;
    concluidas: number;
    canceladas: number;
    valorTotal: number;
  }> => {
    const response = await apiClient.get(`${this.baseUrl}/stats`);
    return response.data;
  };

  /**
   * Formata status para exibição
   */
  formatarStatus = (status: StatusOrdemServico): string => {
    const statusMap = {
      [StatusOrdemServico.PENDENTE]: "Pendente",
      [StatusOrdemServico.EM_EXECUCAO]: "Em Execução",
      [StatusOrdemServico.CONCLUIDA]: "Concluída",
      [StatusOrdemServico.CANCELADA]: "Cancelada"
    };
    
    return statusMap[status] || status;
  };

  /**
   * Retorna cor do status para badges
   */
  getCorStatus = (status: StatusOrdemServico): "green" | "red" | "yellow" | "blue" | "gray" => {
    const corMap = {
      [StatusOrdemServico.PENDENTE]: "yellow" as const,
      [StatusOrdemServico.EM_EXECUCAO]: "blue" as const,
      [StatusOrdemServico.CONCLUIDA]: "green" as const,
      [StatusOrdemServico.CANCELADA]: "red" as const
    };
    
    return corMap[status] || "gray";
  };
}

// Exporta uma instância singleton do serviço
export default new OrdemServicoService();