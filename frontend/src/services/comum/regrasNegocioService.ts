// frontend/src/services/agricultura/regrasNegocioService.ts
import BaseApiService from "../baseApiService";

export enum TipoRegra {
  AREA_EFETIVA = "area_efetiva",
  AREA_CONSTRUCAO = "area_construcao",
  TIPO_PRODUTOR = "tipo_produtor", 
  RENDA_FAMILIAR = "renda_familiar",
  TEMPO_ATIVIDADE = "tempo_atividade",
  CULTIVO_ORGANICO = "cultivo_organico",
  POSSUI_DAP = "possui_dap",
  IDADE_PRODUTOR = "idade_produtor",
  LOCALIZACAO = "localizacao",
  CUSTOM = "custom"
}

export enum CondicaoRegra {
  MENOR_QUE = "menor_que",
  MAIOR_QUE = "maior_que",
  IGUAL_A = "igual_a",
  ENTRE = "entre",
  CONTEM = "contem",
  NAO_CONTEM = "nao_contem"
}

export enum TipoLimite {
  QUANTIDADE = "quantidade",
  VALOR = "valor",
  PERCENTUAL = "percentual",
  AREA = "area"
}

export interface ParametroRegra {
  condicao: CondicaoRegra;
  valor?: number | string | boolean;
  valorMinimo?: number;
  valorMaximo?: number;
  unidade?: string;
  descricao?: string;
}

export interface LimiteBeneficio {
  tipo: TipoLimite;
  limite: number;
  unidade?: string;
  limitePorPeriodo?: {
    periodo: "anual" | "bienal" | "mensal";
    quantidade: number;
  };
  multiplicador?: {
    base: "area" | "renda" | "fixo";
    fator: number;
  };
}

export interface RegrasNegocio {
  id: number;
  programaId: number;
  tipoRegra: string;
  parametro: ParametroRegra;
  valorBeneficio: number;
  limiteBeneficio: LimiteBeneficio | null;
  createdAt: string;
  updatedAt: string;
  // Relacionamentos opcionais
  programa?: {
    id: number;
    nome: string;
    tipoPrograma: string;
    ativo?: boolean;
  };
}

export interface RegrasNegocioDTO {
  programaId: number;
  tipoRegra: string;
  parametro: ParametroRegra;
  valorBeneficio: number;
  limiteBeneficio?: LimiteBeneficio;
}

export interface TipoRegraOption {
  valor: string;
  label: string;
  descricao: string;
}

export interface TemplateRegra {
  parametro: ParametroRegra;
  limiteBeneficio: LimiteBeneficio;
}

export interface ValidacaoRegra {
  regraId: number;
  programa: string;
  tipoRegra: string;
  atende: boolean;
  motivo: string;
  valorCalculado: number;
  limiteCalculado: number;
}

export interface ProdutorData {
  areaEfetiva?: number;
  rendaFamiliar?: number;
  tipoProdutor?: string;
  tempoAtividade?: number;
  possuiDAP?: boolean;
  idade?: number;
  localizacao?: string;
  [key: string]: any;
}

class RegrasNegocioService extends BaseApiService<RegrasNegocio, RegrasNegocioDTO> {
  constructor() {
    super("/regrasNegocio", "comum");
  }

  /**
   * Busca regras por programa
   */
  async getByPrograma(programaId: number | string): Promise<RegrasNegocio[]> {
    const response = await this.api.get(`${this.baseUrl}/programa/${programaId}`);
    return response.data;
  }

  /**
   * Busca regras por tipo
   */
  async getByTipo(tipo: string): Promise<RegrasNegocio[]> {
    const response = await this.api.get(`${this.baseUrl}/tipo/${tipo}`);
    return response.data;
  }

  /**
   * Busca tipos de regra disponíveis
   */
  async getTiposRegra(): Promise<TipoRegraOption[]> {
    const response = await this.api.get(`${this.baseUrl}/tipos`);
    return response.data;
  }

  /**
   * Busca template de regra por tipo
   */
  async getTemplateRegra(tipo: string): Promise<TemplateRegra> {
    const response = await this.api.get(`${this.baseUrl}/template/${tipo}`);
    return response.data;
  }

  /**
   * Valida se produtor atende uma regra
   */
  async validarRegra(regraId: number | string, produtorData: ProdutorData): Promise<ValidacaoRegra> {
    const response = await this.api.post(`${this.baseUrl}/${regraId}/validar`, {
      produtorData
    });
    return response.data;
  }

  /**
   * Obter opções de condições para regras
   */
  getCondicoes() {
    return [
      { value: CondicaoRegra.MENOR_QUE, label: "Menor que" },
      { value: CondicaoRegra.MAIOR_QUE, label: "Maior que" },
      { value: CondicaoRegra.IGUAL_A, label: "Igual a" },
      { value: CondicaoRegra.ENTRE, label: "Entre" },
      { value: CondicaoRegra.CONTEM, label: "Contém" },
      { value: CondicaoRegra.NAO_CONTEM, label: "Não contém" }
    ];
  }

  /**
   * Obter opções de tipos de limite
   */
  getTiposLimite() {
    return [
      { value: TipoLimite.QUANTIDADE, label: "Quantidade" },
      { value: TipoLimite.VALOR, label: "Valor" },
      { value: TipoLimite.PERCENTUAL, label: "Percentual" },
      { value: TipoLimite.AREA, label: "Por Área" }
    ];
  }

  /**
   * Obter opções de bases para multiplicador
   */
  getBasesMultiplicador() {
    return [
      { value: "area", label: "Por Área" },
      { value: "renda", label: "Por Renda" },
      { value: "fixo", label: "Valor Fixo" }
    ];
  }

  /**
   * Obter opções de períodos
   */
  getPeriodos() {
    return [
      { value: "anual", label: "Anual" },
      { value: "bienal", label: "Bienal" },
      { value: "mensal", label: "Mensal" }
    ];
  }

  /**
   * Busca por termo (sobrescreve método da classe base)
   */
  async buscarPorTermo(termo: string): Promise<RegrasNegocio[]> {
    if (!termo.trim()) {
      return this.getAll();
    }

    const response = await this.api.get(`${this.baseUrl}`, {
      params: { search: termo }
    });
    return response.data;
  }

  /**
   * Valida dados da regra antes de enviar
   */
  private validateRegraData(data: RegrasNegocioDTO): string[] {
    const errors: string[] = [];

    if (!data.programaId) {
      errors.push("Programa é obrigatório");
    }

    if (!data.tipoRegra?.trim()) {
      errors.push("Tipo de regra é obrigatório");
    }

    if (!data.valorBeneficio || data.valorBeneficio <= 0) {
      errors.push("Valor do benefício deve ser maior que zero");
    }

    if (!data.parametro) {
      errors.push("Parâmetros da regra são obrigatórios");
    } else {
      if (!data.parametro.condicao) {
        errors.push("Condição da regra é obrigatória");
      }

      if (data.parametro.condicao === CondicaoRegra.ENTRE) {
        if (data.parametro.valorMinimo === undefined || data.parametro.valorMaximo === undefined) {
          errors.push("Valor mínimo e máximo são obrigatórios para condição 'entre'");
        } else if (data.parametro.valorMinimo >= data.parametro.valorMaximo) {
          errors.push("Valor mínimo deve ser menor que o valor máximo");
        }
      } else if ([CondicaoRegra.MENOR_QUE, CondicaoRegra.MAIOR_QUE, CondicaoRegra.IGUAL_A].includes(data.parametro.condicao)) {
        if (data.parametro.valor === undefined || data.parametro.valor === "") {
          errors.push("Valor é obrigatório para esta condição");
        }
      }
    }

    return errors;
  }

  /**
   * Sobrescreve create para incluir validação
   */
  async create(data: RegrasNegocioDTO): Promise<RegrasNegocio> {
    const errors = this.validateRegraData(data);
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return super.create(data);
  }

  /**
   * Sobrescreve update para incluir validação
   */
  async update(id: number | string, data: RegrasNegocioDTO): Promise<RegrasNegocio> {
    const errors = this.validateRegraData(data);
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return super.update(id, data);
  }

  /**
   * Formatar valor de benefício para exibição
   */
  formatarValorBeneficio(valor: number, unidade?: string): string {
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);

    return unidade ? `${valorFormatado}/${unidade}` : valorFormatado;
  }

  /**
   * Formatar parâmetro para exibição
   */
  formatarParametro(parametro: ParametroRegra): string {
    const condicoes = this.getCondicoes();
    const condicaoLabel = condicoes.find(c => c.value === parametro.condicao)?.label || parametro.condicao;

    switch (parametro.condicao) {
      case CondicaoRegra.ENTRE:
        return `${condicaoLabel} ${parametro.valorMinimo} e ${parametro.valorMaximo} ${parametro.unidade || ''}`;
      case CondicaoRegra.MENOR_QUE:
      case CondicaoRegra.MAIOR_QUE:
      case CondicaoRegra.IGUAL_A:
        return `${condicaoLabel} ${parametro.valor} ${parametro.unidade || ''}`;
      default:
        return `${condicaoLabel} ${parametro.valor || ''}`;
    }
  }

  /**
   * Formatar limite para exibição
   */
  formatarLimite(limite: LimiteBeneficio | null): string {
    if (!limite) return "Sem limite";

    let texto = `${limite.limite} ${limite.unidade || ''}`;

    if (limite.multiplicador) {
      const bases = this.getBasesMultiplicador();
      const baseLabel = bases.find(b => b.value === limite.multiplicador?.base)?.label || limite.multiplicador.base;
      texto += ` (${limite.multiplicador.fator}x ${baseLabel})`;
    }

    if (limite.limitePorPeriodo) {
      const periodos = this.getPeriodos();
      const periodoLabel = periodos.find(p => p.value === limite.limitePorPeriodo?.periodo)?.label || limite.limitePorPeriodo.periodo;
      texto += ` - Max ${limite.limitePorPeriodo.quantidade} por ${periodoLabel}`;
    }

    return texto;
  }
}

const regrasNegocioService = new RegrasNegocioService();
export default regrasNegocioService;