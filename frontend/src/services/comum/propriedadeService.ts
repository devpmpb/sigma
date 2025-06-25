import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// ENUMs do backend
export enum TipoPropriedade {
  RURAL = "RURAL",
  LOTE_URBANO = "LOTE_URBANO",
  COMERCIAL = "COMERCIAL",
  INDUSTRIAL = "INDUSTRIAL",
}

// Interface para a entidade Propriedade
export interface Propriedade {
  id: number;
  nome: string;
  tipoPropriedade: TipoPropriedade;
  areaTotal: string; // Decimal vem como string do backend
  localizacao?: string;
  matricula?: string;
  proprietarioId: number;
  proprietario?: {
    id: number;
    nome: string;
    cpfCnpj: string;
    tipoPessoa: string;
  };
  createdAt: string;
  updatedAt: string;
  // Campos opcionais para relacionamentos
  enderecos?: any[];
  arrendamentos?: any[];
}

// Interface para os dados de criação/atualização
export interface PropriedadeDTO {
  nome: string;
  tipoPropriedade: TipoPropriedade;
  areaTotal: number | string;
  localizacao?: string;
  matricula?: string;
  proprietarioId: number;
}

/**
 * Serviço para operações com a entidade Propriedade
 * Módulo comum
 */
class PropriedadeService extends BaseApiService<Propriedade, PropriedadeDTO> {
  constructor() {
    super("/propriedades", "comum");
  }

  /**
   * Busca propriedades por proprietário
   */
  getPropriedadesByProprietario = async (
    proprietarioId: number
  ): Promise<Propriedade[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/proprietario/${proprietarioId}`
    );
    return response.data;
  };

  /**
   * Busca propriedades por tipo
   */
  getPropriedadesByTipo = async (
    tipo: TipoPropriedade
  ): Promise<Propriedade[]> => {
    const response = await apiClient.get(`${this.baseUrl}/tipo/${tipo}`);
    return response.data;
  };

  /**
   * Busca propriedade com todos os detalhes (endereços, arrendamentos, etc.)
   */
  getPropriedadeWithDetails = async (id: number): Promise<Propriedade> => {
    const response = await apiClient.get(`${this.baseUrl}/${id}/detalhes`);
    return response.data;
  };

  /**
   * Busca tipos de propriedade disponíveis
   */
  getTiposPropriedade = (): Array<{
    value: TipoPropriedade;
    label: string;
  }> => {
    return [
      { value: TipoPropriedade.RURAL, label: "Rural" },
      { value: TipoPropriedade.LOTE_URBANO, label: "Lote Urbano" },
      { value: TipoPropriedade.COMERCIAL, label: "Comercial" },
      { value: TipoPropriedade.INDUSTRIAL, label: "Industrial" },
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
   * Formata tipo de propriedade para exibição
   */
  formatarTipoPropriedade = (tipo: TipoPropriedade): string => {
    const tipos = {
      [TipoPropriedade.RURAL]: "Rural",
      [TipoPropriedade.LOTE_URBANO]: "Lote Urbano",
      [TipoPropriedade.COMERCIAL]: "Comercial",
      [TipoPropriedade.INDUSTRIAL]: "Industrial",
    };
    return tipos[tipo] || tipo;
  };
}

// Exporta uma instância singleton do serviço
export default new PropriedadeService();
