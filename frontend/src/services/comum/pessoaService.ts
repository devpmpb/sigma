import BaseApiService from "../baseApiService";

export enum TipoPessoa {
  FISICA = "FISICA",
  JURIDICA = "JURIDICA",
}

// 🆕 Interface para área efetiva
export interface AreaEfetiva {
  id?: number;
  pessoaId: number;
  anoReferencia: number;
  areaPropria: number;
  areaArrendadaRecebida: number;
  areaArrendadaCedida: number;
  areaEfetiva: number;
  updatedAt?: string;
}

// 🆕 DTO para área efetiva
export interface AreaEfetivaDTO {
  anoReferencia: number;
  areaPropria: number;
  areaArrendadaRecebida: number;
  areaArrendadaCedida: number;
  areaEfetiva: number;
}

export interface PessoaFisicaData {
  rg?: string;
  dataNascimento?: string;
}

export interface PessoaJuridicaData {
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  dataFundacao?: string;
  representanteLegal?: string;
}

// Interface principal da Pessoa atualizada
export interface Pessoa {
  id: number;
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  
  // 🆕 NOVOS CAMPOS
  produtorRural: boolean;
  inscricaoEstadual?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  pessoaFisica?: PessoaFisicaData;
  pessoaJuridica?: PessoaJuridicaData;
  areaEfetiva?: AreaEfetiva; // 🆕 Área efetiva
  
  // Helper para o frontend
  isProdutor?: boolean;
  areaEfetivaData?: AreaEfetiva;
}

// DTO para criação/edição
export interface PessoaDTO {
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
  
  // 🆕 NOVOS CAMPOS
  produtorRural?: boolean;
  inscricaoEstadual?: string;
  
  pessoaFisica?: PessoaFisicaData;
  pessoaJuridica?: PessoaJuridicaData;
  areaEfetiva?: AreaEfetivaDTO; // 🆕 Área efetiva
}

class PessoaService extends BaseApiService<Pessoa, PessoaDTO> {
  constructor() {
    super("/pessoas");
  }

  // 🆕 Método para buscar apenas produtores rurais
  async getProdutoresRurais(): Promise<Pessoa[]> {
    try {
      const response = await this.api.get(`${this.baseUrl}/produtores-rurais`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar produtores rurais:", error);
      throw error;
    }
  }

  // Método existente atualizado para incluir área efetiva
  async getPessoasByTipo(tipo: TipoPessoa): Promise<Pessoa[]> {
    try {
      const response = await this.api.get(`${this.baseUrl}/tipo/${tipo}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar pessoas do tipo ${tipo}:`, error);
      throw error;
    }
  }

  // 🆕 Método para buscar pessoa com área efetiva
  async getPessoaWithAreaEfetiva(id: number): Promise<Pessoa> {
    try {
      const response = await this.api.get(`${this.baseUrl}/${id}/area-efetiva`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar pessoa com área efetiva:", error);
      throw error;
    }
  }

  // 🆕 Métodos utilitários para produtor rural
  formatarTipoProdutor(tipo?: string): string {
    const tipos: Record<string, string> = {
      "FAMILIAR": "Agricultura Familiar",
      "PATRONAL": "Agricultura Patronal",
      "AGRONEGOCIO": "Agronegócio",
      "ORGANICO": "Agricultura Orgânica",
      "ASSENTADO": "Assentado Rural",
    };
    return tipos[tipo || ""] || tipo || "Não informado";
  }

  formatarAtividadePrincipal(atividade?: string): string {
    const atividades: Record<string, string> = {
      "GRAOS": "Cultivo de Grãos",
      "HORTALICAS": "Cultivo de Hortaliças",
      "FRUTAS": "Fruticultura",
      "BOVINOS": "Bovinocultura",
      "SUINOS": "Suinocultura",
      "AVES": "Avicultura",
      "PEIXES": "Piscicultura",
      "MISTA": "Atividade Mista",
    };
    return atividades[atividade || ""] || atividade || "Não informado";
  }

  formatarDAP(dap?: string): string {
    if (!dap) return "Não possui";
    // Formatar DAP se necessário
    return dap;
  }

  // 🆕 Métodos para área efetiva
  calcularAreaEfetiva(areaEfetiva: AreaEfetivaDTO): number {
    const areaPropria = Number(areaEfetiva.areaPropria) || 0;
    const areaRecebida = Number(areaEfetiva.areaArrendadaRecebida) || 0;
    const areaCedida = Number(areaEfetiva.areaArrendadaCedida) || 0;
    
    return areaPropria + areaRecebida - areaCedida;
  }

  formatarArea(area: number | string): string {
    const areaNum = Number(area);
    if (isNaN(areaNum)) return "0 alqueires";
    
    return `${areaNum.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} alqueires`;
  }

  // 🆕 Validações específicas
  validarInscricaoEstadual(inscricao: string): boolean {
    // Implementar validação de inscrição estadual
    // Por enquanto, validação básica
    return inscricao && inscricao.trim().length >= 3;
  }

  // 🆕 Filtros úteis
  filtrarProdutoresRurais(pessoas: Pessoa[]): Pessoa[] {
    return pessoas.filter(pessoa => pessoa.produtorRural);
  }

  filtrarPorTipoEProdutor(pessoas: Pessoa[], tipo?: TipoPessoa, somenteProdutor = false): Pessoa[] {
    let resultado = pessoas;
    
    if (tipo) {
      resultado = resultado.filter(pessoa => pessoa.tipoPessoa === tipo);
    }
    
    if (somenteProdutor) {
      resultado = resultado.filter(pessoa => pessoa.produtorRural);
    }
    
    return resultado;
  }

  // 🆕 Método para remover/migrar dados de produtor (para migration)
  async migrarDadosProdutor(): Promise<void> {
    try {
      // Este método seria usado durante a migração se necessário
      const response = await this.api.post(`${this.baseUrl}/migrar-produtores`);
      return response.data;
    } catch (error) {
      console.error("Erro ao migrar dados de produtor:", error);
      throw error;
    }
  }

  // 🆕 Métodos de busca específicos
  async buscarPorCpfCnpj(cpfCnpj: string): Promise<Pessoa | null> {
    try {
      const pessoas = await this.searchByTerm(cpfCnpj);
      return pessoas.find(p => p.cpfCnpj === cpfCnpj) || null;
    } catch (error) {
      console.error("Erro ao buscar por CPF/CNPJ:", error);
      return null;
    }
  }

  async buscarProdutoresPorNome(nome: string): Promise<Pessoa[]> {
    try {
      const pessoas = await this.searchByTerm(nome);
      return pessoas.filter(p => p.produtorRural);
    } catch (error) {
      console.error("Erro ao buscar produtores por nome:", error);
      return [];
    }
  }

  // 🆕 Estatísticas
  async getEstatisticasProdutores(): Promise<{
    total: number;
    comAreaEfetiva: number;
    porTipo: Record<TipoPessoa, number>;
  }> {
    try {
      const produtores = await this.getProdutoresRurais();
      
      return {
        total: produtores.length,
        comAreaEfetiva: produtores.filter(p => p.areaEfetiva).length,
        porTipo: {
          [TipoPessoa.FISICA]: produtores.filter(p => p.tipoPessoa === TipoPessoa.FISICA).length,
          [TipoPessoa.JURIDICA]: produtores.filter(p => p.tipoPessoa === TipoPessoa.JURIDICA).length,
        }
      };
    } catch (error) {
      console.error("Erro ao calcular estatísticas de produtores:", error);
      throw error;
    }
  }
}

// Instância padrão do serviço
export default new PessoaService();