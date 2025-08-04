// frontend/src/services/common/propriedadeService.ts - ARQUIVO COMPLETO
import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// ENUMs do backend
export enum TipoPropriedade {
  RURAL = "RURAL",
  LOTE_URBANO = "LOTE_URBANO",
  COMERCIAL = "COMERCIAL",
  INDUSTRIAL = "INDUSTRIAL",
}

// NOVO ENUM para situação da propriedade
export enum SituacaoPropriedade {
  PROPRIA = "PROPRIA",
  CONDOMINIO = "CONDOMINIO",
  USUFRUTO = "USUFRUTO",
}

// Interface para a entidade Propriedade ATUALIZADA
export interface Propriedade {
  id: number;
  nome: string;
  tipoPropriedade: TipoPropriedade;

  // NOVOS CAMPOS
  logradouroId?: number; // ID do logradouro da tabela Logradouro
  logradouro?: {
    // Dados do logradouro (quando incluído)
    id: number;
    tipo: string;
    descricao: string;
    cep?: string;
    bairro?: {
      id: number;
      nome: string;
    };
  };
  numero?: string; // Número do lote/chácara

  // Área total com unidade
  areaTotal: string; // Decimal vem como string do backend
  unidadeArea: string; // "alqueires" ou "metros_quadrados"

  // Campos específicos para propriedades rurais
  itr?: string;
  incra?: string;

  // Novos campos obrigatórios
  situacao: SituacaoPropriedade;
  proprietarioResidente: boolean;

  // Campos existentes mantidos
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

// Interface para os dados de criação/atualização ATUALIZADA
export interface PropriedadeDTO {
  nome: string;
  tipoPropriedade: TipoPropriedade;

  // NOVOS CAMPOS
  logradouroId?: number; // ID do logradouro
  numero?: string;

  // Área total
  areaTotal: number | string;
  // unidadeArea será calculada automaticamente baseada no tipo

  // Campos rurais (opcionais)
  itr?: string;
  incra?: string;

  // Novos campos obrigatórios
  situacao: SituacaoPropriedade;
  proprietarioResidente: boolean;

  // Campos existentes
  localizacao?: string;
  matricula?: string;
  proprietarioId: number;
}

/**
 * Serviço para operações com a entidade Propriedade
 * Módulo comum - ATUALIZADO
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
   * NOVA: Busca situações de propriedade disponíveis
   */
  getSituacoesPropriedade = (): Array<{
    value: SituacaoPropriedade;
    label: string;
  }> => {
    return [
      { value: SituacaoPropriedade.PROPRIA, label: "Própria" },
      { value: SituacaoPropriedade.CONDOMINIO, label: "Condomínio" },
      { value: SituacaoPropriedade.USUFRUTO, label: "Usufruto" },
    ];
  };

  /**
   * NOVA: Determina a unidade de área baseada no tipo da propriedade
   */
  getUnidadeArea = (tipoPropriedade: TipoPropriedade): string => {
    return tipoPropriedade === TipoPropriedade.RURAL
      ? "alqueires"
      : "metros_quadrados";
  };

  /**
   * NOVA: Obtém o sufixo da unidade para exibição
   */
  getSufixoUnidade = (tipoPropriedade: TipoPropriedade): string => {
    return tipoPropriedade === TipoPropriedade.RURAL ? "alq" : "m²";
  };

  /**
   * Formata área para exibição ATUALIZADA
   */
  formatarArea = (
    area: string | number,
    tipoPropriedade?: TipoPropriedade
  ): string => {
    const areaNum = typeof area === "string" ? parseFloat(area) : area;
    const areaFormatada = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(areaNum);

    if (tipoPropriedade) {
      const sufixo = this.getSufixoUnidade(tipoPropriedade);
      return `${areaFormatada} ${sufixo}`;
    }

    return areaFormatada;
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

  /**
   * NOVA: Formata situação da propriedade para exibição
   */
  formatarSituacaoPropriedade = (situacao: SituacaoPropriedade): string => {
    const situacoes = {
      [SituacaoPropriedade.PROPRIA]: "Própria",
      [SituacaoPropriedade.CONDOMINIO]: "Condomínio",
      [SituacaoPropriedade.USUFRUTO]: "Usufruto",
    };
    return situacoes[situacao] || situacao;
  };

  /**
   * NOVA: Valida se os campos rurais são obrigatórios
   */
  isRural = (tipoPropriedade: TipoPropriedade): boolean => {
    return tipoPropriedade === TipoPropriedade.RURAL;
  };
}

// Exporta uma instância singleton do serviço
export default new PropriedadeService();
