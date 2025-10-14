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

export enum AtividadeProdutiva {
  AGRICULTURA = "AGRICULTURA",
  PECUARIA = "PECUARIA",
  AGRICULTURA_PECUARIA = "AGRICULTURA_PECUARIA",
  SILVICULTURA = "SILVICULTURA",
  AQUICULTURA = "AQUICULTURA",
  HORTIFRUTI = "HORTIFRUTI",
  AVICULTURA = "AVICULTURA",
  SUINOCULTURA = "SUINOCULTURA",
  OUTROS = "OUTROS",
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
  atividadeProdutiva?: AtividadeProdutiva;
  
  // Novos campos obrigatórios
  situacao: SituacaoPropriedade;
  isproprietarioResidente: boolean;

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
  nuProprietarioId?: number;
  nuProprietario?: {
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
  atividadeProdutiva?: AtividadeProdutiva;

  // Novos campos obrigatórios
  situacao: SituacaoPropriedade;
  isproprietarioResidente: boolean;

  // Campos existentes
  localizacao?: string;
  matricula?: string;
  proprietarioId: number;
  nuProprietarioId?: number
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

  buscarPorTermo = async (termo: string): Promise<Propriedade[]> => {
    const response = await apiClient.get(`${this.baseUrl}/busca`, {
      params: { termo },
    });
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

  /**
   * Formata a exibição do proprietário/usufrutuário
   */
  formatarProprietarioDisplay = (propriedade: Propriedade): string => {
    if (propriedade.situacao === SituacaoPropriedade.USUFRUTO) {
      const usufruto = propriedade.proprietario?.nome || "Não informado";
      const nu = propriedade.nuProprietario?.nome || "Não informado";
      return `Usufrutuário: ${usufruto} | Nu-proprietário: ${nu}`;
    }
    return propriedade.proprietario?.nome || "Não informado";
  };

  /**
   * Verifica se a propriedade tem usufruto
   */
  hasUsufruto = (propriedade: Propriedade): boolean => {
    return propriedade.situacao === SituacaoPropriedade.USUFRUTO;
  };

  /**
   * NOVO: Busca atividades produtivas disponíveis
   */
  getAtividadesProdutivas = (): Array<{
    value: AtividadeProdutiva;
    label: string;
  }> => {
    return [
      { value: AtividadeProdutiva.AGRICULTURA, label: "Agricultura" },
      { value: AtividadeProdutiva.PECUARIA, label: "Pecuária" },
      { value: AtividadeProdutiva.AGRICULTURA_PECUARIA, label: "Agricultura e Pecuária" },
      { value: AtividadeProdutiva.SILVICULTURA, label: "Silvicultura" },
      { value: AtividadeProdutiva.AQUICULTURA, label: "Aquicultura" },
      { value: AtividadeProdutiva.HORTIFRUTI, label: "Hortifrutigranjeiros" },
      { value: AtividadeProdutiva.AVICULTURA, label: "Avicultura" },
      { value: AtividadeProdutiva.SUINOCULTURA, label: "Suinocultura" },
      { value: AtividadeProdutiva.OUTROS, label: "Outros" },
    ];
  };

  /**
   * NOVO: Formata atividade produtiva para exibição
   */
  formatarAtividadeProdutiva = (atividade?: AtividadeProdutiva): string => {
    if (!atividade) return "-";
    
    const atividades = this.getAtividadesProdutivas();
    const found = atividades.find(a => a.value === atividade);
    return found?.label || atividade;
  };

}



// Exporta uma instância singleton do serviço
export default new PropriedadeService();
