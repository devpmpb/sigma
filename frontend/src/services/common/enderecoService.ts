// frontend/src/services/common/enderecoService.ts
import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// ENUMs do backend
export enum TipoEndereco {
  RESIDENCIAL = "RESIDENCIAL",
  COMERCIAL = "COMERCIAL", 
  RURAL = "RURAL",
  CORRESPONDENCIA = "CORRESPONDENCIA",
}

// Interface para a entidade Endereco
export interface Endereco {
  id: number;
  pessoaId: number;
  
  // Para endereços urbanos
  logradouroId?: number;
  logradouro?: {
    id: number;
    tipo: string;
    descricao: string;
    cep?: string;
    bairro?: {
      id: number;
      nome: string;
    };
  };
  numero?: string;
  complemento?: string;
  bairroId?: number;
  bairro?: {
    id: number;
    nome: string;
  };
  
  // Para endereços rurais
  areaRuralId?: number;
  areaRural?: {
    id: number;
    nome: string;
  };
  referenciaRural?: string;
  
  // Campos comuns
  coordenadas?: string; // Latitude,Longitude
  tipoEndereco: TipoEndereco;
  principal: boolean;
  
  // Relacionamento com propriedade (se este endereço referencia uma propriedade da pessoa)
  propriedadeId?: number;
  propriedade?: {
    id: number;
    nome: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Interface para os dados de criação/atualização
export interface EnderecoDTO {
  pessoaId: number;
  logradouroId?: number;
  numero?: string;
  complemento?: string;
  bairroId?: number;
  areaRuralId?: number;
  referenciaRural?: string;
  coordenadas?: string;
  tipoEndereco: TipoEndereco;
  principal?: boolean;
  propriedadeId?: number;
}

/**
 * Serviço para operações com a entidade Endereco
 * Módulo comum
 */
class EnderecoService extends BaseApiService<Endereco, EnderecoDTO> {
  constructor() {
    super("/enderecos", "comum");
  }

  /**
   * Busca endereços por pessoa
   */
  getEnderecosByPessoa = async (pessoaId: number): Promise<Endereco[]> => {
    const response = await apiClient.get(`${this.baseUrl}/pessoa/${pessoaId}`);
    return response.data;
  };

  /**
   * Busca endereços por propriedade
   */
  getEnderecosByPropriedade = async (propriedadeId: number): Promise<Endereco[]> => {
    const response = await apiClient.get(`${this.baseUrl}/propriedade/${propriedadeId}`);
    return response.data;
  };

  /**
   * Define um endereço como principal
   */
  setPrincipal = async (enderecoId: number): Promise<void> => {
    await apiClient.patch(`${this.baseUrl}/${enderecoId}/principal`);
  };

  /**
   * Obtém tipos de endereço disponíveis
   */
  getTiposEndereco = (): Array<{ value: TipoEndereco; label: string }> => {
    return [
      { value: TipoEndereco.RESIDENCIAL, label: "Residencial" },
      { value: TipoEndereco.COMERCIAL, label: "Comercial" },
      { value: TipoEndereco.RURAL, label: "Rural" },
      { value: TipoEndereco.CORRESPONDENCIA, label: "Correspondência" },
    ];
  };

  /**
   * Valida dados do endereço antes do envio
   */
  validarEndereco = (endereco: EnderecoDTO): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!endereco.pessoaId) {
      errors.push("Pessoa é obrigatória");
    }

    if (!endereco.tipoEndereco) {
      errors.push("Tipo de endereço é obrigatório");
    }

    // Validação para endereços urbanos
    if (endereco.logradouroId && !endereco.bairroId) {
      errors.push("Bairro é obrigatório para endereços urbanos");
    }

    // Validação para endereços rurais
    if (endereco.areaRuralId && !endereco.referenciaRural?.trim()) {
      errors.push("Referência rural é obrigatória para endereços rurais");
    }

    // Validação de coordenadas (se fornecidas)
    if (endereco.coordenadas) {
      const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
      if (!coordPattern.test(endereco.coordenadas)) {
        errors.push("Coordenadas devem estar no formato: latitude,longitude");
      }
    }

    // Pelo menos um tipo de endereço deve estar preenchido
    const temEnderecoUrbano = endereco.logradouroId || endereco.bairroId;
    const temEnderecoRural = endereco.areaRuralId;
    
    if (!temEnderecoUrbano && !temEnderecoRural) {
      errors.push("Informe pelo menos um logradouro ou área rural");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  /**
   * Formata endereço completo para exibição
   */
  formatarEnderecoCompleto = (endereco: Endereco): string => {
    const partes: string[] = [];

    if (endereco.logradouro) {
      // Endereço urbano
      partes.push(`${endereco.logradouro.tipo} ${endereco.logradouro.descricao}`);
      
      if (endereco.numero) {
        partes.push(`nº ${endereco.numero}`);
      }
      
      if (endereco.complemento) {
        partes.push(endereco.complemento);
      }
      
      if (endereco.bairro) {
        partes.push(`- ${endereco.bairro.nome}`);
      }
      
      if (endereco.logradouro.cep) {
        partes.push(`CEP: ${endereco.logradouro.cep}`);
      }
    } else if (endereco.areaRural) {
      // Endereço rural
      partes.push(endereco.areaRural.nome);
      
      if (endereco.referenciaRural) {
        partes.push(`- ${endereco.referenciaRural}`);
      }
    }

    return partes.join(" ");
  };

  /**
   * Formata endereço resumido para listagens
   */
  formatarEnderecoResumido = (endereco: Endereco): string => {
    if (endereco.logradouro) {
      const base = `${endereco.logradouro.descricao}`;
      const numero = endereco.numero ? `, ${endereco.numero}` : '';
      const bairro = endereco.bairro ? ` - ${endereco.bairro.nome}` : '';
      return `${base}${numero}${bairro}`;
    } else if (endereco.areaRural) {
      return endereco.areaRural.nome;
    }
    return 'Endereço não especificado';
  };

  /**
   * Cria um novo endereço com validação
   */
  createWithValidation = async (dados: EnderecoDTO): Promise<Endereco> => {
    const validation = this.validarEndereco(dados);
    
    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(", ")}`);
    }

    return this.create(dados);
  };

  /**
   * Atualiza um endereço com validação
   */
  updateWithValidation = async (id: number, dados: EnderecoDTO): Promise<Endereco> => {
    const validation = this.validarEndereco(dados);
    
    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(", ")}`);
    }

    return this.update(id, dados);
  };

  /**
   * Remove endereço com verificações de segurança
   */
  removeWithValidation = async (id: number): Promise<boolean> => {
    const endereco = await this.getById(id);
    
    if (endereco.principal) {
      // Verificar se existe outro endereço para ser o principal
      const outrosEnderecos = await this.getEnderecosByPessoa(endereco.pessoaId);
      const temOutros = outrosEnderecos.filter(e => e.id !== id).length > 0;
      
      if (!temOutros) {
        throw new Error("Não é possível remover o único endereço da pessoa");
      }
    }

    await this.delete(id);
    return true;
  };
}

// Exporta uma instância singleton do serviço
export default new EnderecoService();