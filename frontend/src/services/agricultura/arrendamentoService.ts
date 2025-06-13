import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// Interface para a entidade Arrendamento
export interface Arrendamento {
  id: number;
  propriedadeId: number;
  proprietarioId: number;
  arrendatarioId: number;
  areaArrendada: string; // Decimal vem como string do backend
  dataInicio: string;
  dataFim?: string;
  status: string;
  documentoUrl?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos (quando incluídos)
  propriedade?: {
    id: number;
    nome: string;
    tipoPropriedade: string;
    areaTotal: string;
    localizacao?: string;
    matricula?: string;
  };
  proprietario?: {
    id: number;
    pessoa?: {
      id: number;
      nome: string;
      cpfCnpj: string;
      telefone?: string;
      email?: string;
    };
  };
  arrendatario?: {
    id: number;
    pessoa?: {
      id: number;
      nome: string;
      cpfCnpj: string;
      telefone?: string;
      email?: string;
    };
  };
}

// Interface para os dados de criação/atualização
export interface ArrendamentoDTO {
  propriedadeId: number;
  proprietarioId: number;
  arrendatarioId: number;
  areaArrendada: number | string;
  dataInicio: string;
  dataFim?: string;
  status?: string;
  documentoUrl?: string;
}

// Status disponíveis para arrendamento
export const StatusArrendamento = {
  ATIVO: "ativo",
  INATIVO: "inativo",
  VENCIDO: "vencido",
  CANCELADO: "cancelado",
} as const;

export type StatusArrendamentoType = typeof StatusArrendamento[keyof typeof StatusArrendamento];

class ArrendamentoService extends BaseApiService<Arrendamento, ArrendamentoDTO> {
  constructor() {
    super("/arrendamentos", "agricultura");
  }

  /**
   * Busca arrendamentos por proprietário
   */
  getArrendamentosByProprietario = async (
    proprietarioId: number
  ): Promise<Arrendamento[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/proprietario/${proprietarioId}`
    );
    return response.data;
  };

  getArrendamentosByArrendatario = async (
    arrendatarioId: number
  ): Promise<Arrendamento[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/arrendatario/${arrendatarioId}`
    );
    return response.data;
  };

  /**
   * Busca arrendamentos por propriedade
   */
  getArrendamentosByPropriedade = async (
    propriedadeId: number
  ): Promise<Arrendamento[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/propriedade/${propriedadeId}`
    );
    return response.data;
  };

  /**
   * Busca arrendamentos por status
   */
  getArrendamentosByStatus = async (
    status: StatusArrendamentoType
  ): Promise<Arrendamento[]> => {
    const response = await apiClient.get(`${this.baseUrl}/status/${status}`);
    return response.data;
  };

  /**
   * Busca arrendamentos ativos
   */
  getArrendamentosAtivos = async (): Promise<Arrendamento[]> => {
    return this.getArrendamentosByStatus(StatusArrendamento.ATIVO);
  };

  /**
   * Busca arrendamentos vencidos
   */
  getArrendamentosVencidos = async (): Promise<Arrendamento[]> => {
    return this.getArrendamentosByStatus(StatusArrendamento.VENCIDO);
  };

  /**
   * Busca arrendamento com todos os detalhes (propriedade, pessoas)
   */
  getArrendamentoWithDetails = async (id: number): Promise<Arrendamento> => {
    const response = await apiClient.get(`${this.baseUrl}/${id}/detalhes`);
    return response.data;
  };

  /**
   * Atualiza status do arrendamento
   */
  updateStatus = async (
    id: number,
    novoStatus: StatusArrendamentoType
  ): Promise<Arrendamento> => {
    const response = await apiClient.patch(`${this.baseUrl}/${id}/status`, {
      status: novoStatus,
    });
    return response.data;
  };

  /**
   * Finaliza arrendamento (define data fim e status inativo)
   */
  finalizarArrendamento = async (
    id: number,
    dataFim?: string
  ): Promise<Arrendamento> => {
    const response = await apiClient.patch(`${this.baseUrl}/${id}/finalizar`, {
      dataFim: dataFim || new Date().toISOString().split('T')[0],
    });
    return response.data;
  };

  /**
   * Valida se há conflitos de arrendamento
   * Verifica se a área e período não conflitam com outros arrendamentos
   */
  validarConflito = async (arrendamentoData: {
    propriedadeId: number;
    areaArrendada: number;
    dataInicio: string;
    dataFim?: string;
    arrendamentoId?: number; // Para ignorar o próprio arrendamento na edição
  }): Promise<{ 
    temConflito: boolean; 
    conflitos?: any[]; 
    areaDisponivel?: string;
    areaSolicitada?: string;
    mensagens?: string[];
  }> => {
    const response = await apiClient.post(`${this.baseUrl}/validar-conflito`, arrendamentoData);
    return response.data;
  };

  /**
   * Busca estatísticas para dashboard
   */
  getEstatisticas = async (): Promise<{
    total: number;
    ativos: number;
    vencidos: number;
    proximosVencimento: number;
    areaTotal: string;
  }> => {
    const response = await apiClient.get(`${this.baseUrl}/estatisticas/dashboard`);
    return response.data;
  };

  /**
   * Retorna opções de status disponíveis
   */
  getStatusOptions = (): Array<{
    value: StatusArrendamentoType;
    label: string;
    color: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
  }> => {
    return [
      { value: StatusArrendamento.ATIVO, label: "Ativo", color: "green" },
      { value: StatusArrendamento.INATIVO, label: "Inativo", color: "gray" },
      { value: StatusArrendamento.VENCIDO, label: "Vencido", color: "red" },
      { value: StatusArrendamento.CANCELADO, label: "Cancelado", color: "red" },
    ];
  };

  /**
   * Formata área para exibição
   */
  formatarArea = (area: string | number): string => {
    const areaNum = typeof area === "string" ? parseFloat(area) : area;
    return `${areaNum.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} ha`;
  };

  /**
   * Calcula duração do arrendamento em meses
   */
  calcularDuracao = (dataInicio: string, dataFim?: string): string => {
    const inicio = new Date(dataInicio);
    const fim = dataFim ? new Date(dataFim) : new Date();
    
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const meses = Math.round(diffDays / 30);
    
    if (meses < 1) {
      return `${diffDays} dias`;
    } else if (meses < 12) {
      return `${meses} meses`;
    } else {
      const anos = Math.floor(meses / 12);
      const mesesRestantes = meses % 12;
      return mesesRestantes > 0 
        ? `${anos} anos e ${mesesRestantes} meses`
        : `${anos} anos`;
    }
  };

  /**
   * Verifica se o arrendamento está vencido
   */
  isVencido = (arrendamento: Arrendamento): boolean => {
    if (!arrendamento.dataFim) return false;
    return new Date(arrendamento.dataFim) < new Date();
  };

  /**
   * Verifica se o arrendamento está próximo do vencimento (30 dias)
   */
  isProximoVencimento = (arrendamento: Arrendamento): boolean => {
    if (!arrendamento.dataFim) return false;
    
    const dataFim = new Date(arrendamento.dataFim);
    const hoje = new Date();
    const diasRestantes = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    return diasRestantes <= 30 && diasRestantes > 0;
  };

  /**
   * Valida DAP (se necessário para alguma integração futura)
   */
  validarDAP = (dap: string): boolean => {
    // Remove caracteres não numéricos
    const dapNumerico = dap.replace(/\D/g, '');
    
    // DAP deve ter 11 dígitos
    return dapNumerico.length === 11;
  };

  /**
   * Formata valor monetário
   */
  formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  /**
   * Calcula valor por hectare
   */
  calcularValorPorHectare = (valorTotal: number, area: number): string => {
    if (area === 0) return "R$ 0,00";
    const valorPorHa = valorTotal / area;
    return this.formatarValor(valorPorHa);
  };

  /**
   * Gera resumo textual do arrendamento
   */
  gerarResumo = (arrendamento: Arrendamento): string => {
    const propriedade = arrendamento.propriedade?.nome || `Propriedade ${arrendamento.propriedadeId}`;
    const proprietario = arrendamento.proprietario?.pessoa?.nome || `Proprietário ${arrendamento.proprietarioId}`;
    const arrendatario = arrendamento.arrendatario?.pessoa?.nome || `Arrendatário ${arrendamento.arrendatarioId}`;
    const area = this.formatarArea(arrendamento.areaArrendada);
    const dataInicio = new Date(arrendamento.dataInicio).toLocaleDateString('pt-BR');
    const dataFim = arrendamento.dataFim ? new Date(arrendamento.dataFim).toLocaleDateString('pt-BR') : 'Indeterminado';
    
    return `${proprietario} arrendou ${area} da ${propriedade} para ${arrendatario}, de ${dataInicio} até ${dataFim}.`;
  };
}

// Exporta uma instância singleton do serviço
export default new ArrendamentoService();