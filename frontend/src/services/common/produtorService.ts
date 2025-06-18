import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// Interface para AreaEfetiva
export interface AreaEfetiva {
  id: number;
  anoReferencia: number;
  areaPropria: string; // Decimal vem como string do backend
  areaArrendadaRecebida: string;
  areaArrendadaCedida: string;
  areaEfetiva: string;
  updatedAt: string;
}

// Interface para AreaEfetiva DTO
export interface AreaEfetivaDTO {
  anoReferencia: number;
  areaPropria: number | string;
  areaArrendadaRecebida: number | string;
  areaArrendadaCedida: number | string;
  areaEfetiva?: number | string; // Calculado automaticamente
}

// Interface para a entidade Produtor
export interface Produtor {
  id: number;
  inscricaoEstadual?: string;
  dap?: string;
  tipoProdutor?: string;
  atividadePrincipal?: string;
  contratoAssistencia: boolean;
  observacoes?: string;
  // Relacionamentos
  pessoa?: {
    id: number;
    nome: string;
    cpfCnpj: string;
    telefone?: string;
    email?: string;
    pessoaFisica?: {
      rg?: string;
      dataNascimento?: string;
    };
  };
  areaEfetiva?: AreaEfetiva;
  // Campos de auditoria (se vier do backend)
  createdAt?: string;
  updatedAt?: string;
}

// Interface para os dados de criação/atualização
export interface ProdutorDTO {
  id?: number; // ID da pessoa física (obrigatório para criação)
  inscricaoEstadual?: string;
  dap?: string;
  tipoProdutor?: string;
  atividadePrincipal?: string;
  contratoAssistencia?: boolean;
  observacoes?: string;
  // AreaEfetiva incluída no mesmo DTO
  areaEfetiva?: AreaEfetivaDTO;
}

/**
 * Serviço para operações com a entidade Produtor
 * Módulo agricultura
 */
class ProdutorService extends BaseApiService<Produtor, ProdutorDTO> {
  constructor() {
    super("/produtores", "comum");
  }

  /**
   * Busca produtores por tipo
   */
  getProdutoresByTipo = async (tipo: string): Promise<Produtor[]> => {
    const response = await apiClient.get(`${this.baseUrl}/tipo/${tipo}`);
    return response.data;
  };

  /**
   * Busca produtores que possuem DAP
   */
  getProdutoresComDAP = async (): Promise<Produtor[]> => {
    const response = await apiClient.get(`${this.baseUrl}/com-dap`);
    return response.data;
  };

  /**
   * Busca produtores com contrato de assistência
   */
  getProdutoresComAssistencia = async (): Promise<Produtor[]> => {
    const response = await apiClient.get(`${this.baseUrl}/com-assistencia`);
    return response.data;
  };

  /**
   * Busca produtor com todos os detalhes (pessoa, área efetiva, propriedades, etc.)
   */
  getProdutorWithDetails = async (id: number): Promise<Produtor> => {
    const response = await apiClient.get(`${this.baseUrl}/${id}/detalhes`);
    return response.data;
  };

  /**
   * Atualiza apenas a área efetiva de um produtor
   */
  updateAreaEfetiva = async (produtorId: number, areaEfetiva: AreaEfetivaDTO): Promise<AreaEfetiva> => {
    const response = await apiClient.put(`${this.baseUrl}/${produtorId}/area-efetiva`, areaEfetiva);
    return response.data;
  };

  /**
   * Calcula a área efetiva automaticamente
   */
  calcularAreaEfetiva = (dados: AreaEfetivaDTO): number => {
    const areaPropria = Number(dados.areaPropria) || 0;
    const areaRecebida = Number(dados.areaArrendadaRecebida) || 0;
    const areaCedida = Number(dados.areaArrendadaCedida) || 0;
    
    return areaPropria + areaRecebida - areaCedida;
  };

  /**
   * Obtém tipos de produtor disponíveis
   */
  getTiposProdutor = (): Array<{ value: string; label: string }> => {
    return [
      { value: "FAMILIAR", label: "Agricultura Familiar" },
      { value: "COMERCIAL", label: "Comercial" },
      { value: "ORGANICO", label: "Orgânico" },
      { value: "COOPERATIVADO", label: "Cooperativado" },
      { value: "ASSENTADO", label: "Assentado" },
      { value: "QUILOMBOLA", label: "Quilombola" },
      { value: "INDIGENA", label: "Indígena" },
      { value: "OUTROS", label: "Outros" },
    ];
  };

  /**
   * Obtém atividades principais disponíveis
   */
  getAtividadesPrincipais = (): Array<{ value: string; label: string }> => {
    return [
      { value: "GRAOS", label: "Grãos (Soja, Milho, etc.)" },
      { value: "HORTALICAS", label: "Hortaliças" },
      { value: "FRUTAS", label: "Frutas" },
      { value: "PECUARIA_LEITE", label: "Pecuária de Leite" },
      { value: "PECUARIA_CORTE", label: "Pecuária de Corte" },
      { value: "SUINOCULTURA", label: "Suinocultura" },
      { value: "AVICULTURA", label: "Avicultura" },
      { value: "PISCICULTURA", label: "Piscicultura" },
      { value: "SILVICULTURA", label: "Silvicultura" },
      { value: "CAFE", label: "Café" },
      { value: "CANA", label: "Cana-de-açúcar" },
      { value: "OUTROS", label: "Outros" },
    ];
  };

  /**
   * Formata área para exibição
   */
  formatarArea = (area: string | number): string => {
    const areaNum = typeof area === "string" ? parseFloat(area) : area;
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(areaNum);
  };

  /**
   * Formata tipo de produtor para exibição
   */
  formatarTipoProdutor = (tipo?: string): string => {
    if (!tipo) return "Não informado";
    
    const tipos = {
      FAMILIAR: "Agricultura Familiar",
      COMERCIAL: "Comercial",
      ORGANICO: "Orgânico",
      COOPERATIVADO: "Cooperativado",
      ASSENTADO: "Assentado",
      QUILOMBOLA: "Quilombola",
      INDIGENA: "Indígena",
      OUTROS: "Outros",
    };
    
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  /**
   * Formata atividade principal para exibição
   */
  formatarAtividadePrincipal = (atividade?: string): string => {
    if (!atividade) return "Não informada";
    
    const atividades = {
      GRAOS: "Grãos",
      HORTALICAS: "Hortaliças", 
      FRUTAS: "Frutas",
      PECUARIA_LEITE: "Pecuária de Leite",
      PECUARIA_CORTE: "Pecuária de Corte",
      SUINOCULTURA: "Suinocultura",
      AVICULTURA: "Avicultura",
      PISCICULTURA: "Piscicultura",
      SILVICULTURA: "Silvicultura",
      CAFE: "Café",
      CANA: "Cana-de-açúcar",
      OUTROS: "Outros",
    };
    
    return atividades[atividade as keyof typeof atividades] || atividade;
  };

  /**
   * Valida DAP (Declaração de Aptidão ao Pronaf)
   */
  validarDAP = (dap: string): boolean => {
    if (!dap) return true; // DAP é opcional
    
    // Remove caracteres não numéricos
    const numeros = dap.replace(/\D/g, "");
    
    // DAP deve ter 11 dígitos
    return numeros.length === 11;
  };

  /**
   * Formata DAP para exibição
   */
  formatarDAP = (dap: string): string => {
    if (!dap) return "";
    
    const numeros = dap.replace(/\D/g, "");
    
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, "$1.$2.$3-$4");
    }
    
    return dap;
  };
}

// Exporta uma instância singleton do serviço
export default new ProdutorService();