// frontend/src/services/common/pessoaService.ts
import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";
import enderecoService, { Endereco, EnderecoDTO } from "./enderecoService";

// ENUMs do backend
export enum TipoPessoa {
  FISICA = "FISICA",
  JURIDICA = "JURIDICA",
}

// Interface para PessoaFisica
export interface PessoaFisicaData {
  rg?: string;
  dataNascimento?: string;
}

// Interface para PessoaJuridica
export interface PessoaJuridicaData {
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  dataFundacao?: string;
  representanteLegal?: string;
}

// Interface para a entidade Pessoa (ATUALIZADA)
export interface Pessoa {
  id: number;
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  // Relacionamentos opcionais
  enderecos?: Endereco[]; // ✅ TIPADO CORRETAMENTE
  propriedades?: any[];
  pessoaFisica?: PessoaFisicaData;
  pessoaJuridica?: PessoaJuridicaData;
}

// Interface para os dados de criação/atualização
export interface PessoaDTO {
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
  pessoaFisica?: PessoaFisicaData;
  pessoaJuridica?: PessoaJuridicaData;
}

// Interface para criação completa (pessoa + endereço)
export interface PessoaCompletaDTO {
  pessoa: PessoaDTO;
  endereco?: Omit<EnderecoDTO, 'pessoaId'>;
}

/**
 * Serviço para operações com a entidade Pessoa
 * Módulo comum
 */
class PessoaService extends BaseApiService<Pessoa, PessoaDTO> {
  constructor() {
    super("/pessoas", "comum");
  }

  /**
   * Busca pessoa por CPF/CNPJ
   */
  getPessoaByCpfCnpj = async (cpfCnpj: string): Promise<Pessoa> => {
    const response = await apiClient.get(`${this.baseUrl}/cpfCnpj/${cpfCnpj}`);
    return response.data;
  };

  /**
   * Busca pessoas por tipo (FISICA ou JURIDICA)
   */
  getPessoasByTipo = async (tipo: TipoPessoa): Promise<Pessoa[]> => {
    const response = await apiClient.get(`${this.baseUrl}/tipo/${tipo}`);
    return response.data;
  };

  /**
   * Busca pessoa com todos os detalhes
   */
  getPessoaWithDetails = async (id: number): Promise<Pessoa> => {
    const response = await apiClient.get(`${this.baseUrl}/${id}/detalhes`);
    return response.data;
  };

  /**
   * Busca pessoas com endereços
   */
  getPessoasWithEnderecos = async (tipo?: TipoPessoa): Promise<Pessoa[]> => {
    const params = tipo ? { tipo } : {};
    const response = await apiClient.get(`${this.baseUrl}/enderecos`, {
      params,
    });
    return response.data;
  };

  /**
   * ✅ NOVO: Busca pessoa com endereços completos
   */
  getPessoaWithEnderecos = async (id: number): Promise<Pessoa> => {
    const pessoa = await this.getPessoaWithDetails(id);
    
    if (pessoa) {
      // Buscar endereços separadamente com dados completos
      pessoa.enderecos = await enderecoService.getEnderecosByPessoa(id);
    }
    
    return pessoa;
  };

  /**
   * ✅ NOVO: Busca endereço principal de uma pessoa
   */
  getEnderecoPrincipal = async (pessoaId: number): Promise<Endereco | null> => {
    const enderecos = await enderecoService.getEnderecosByPessoa(pessoaId);
    return enderecos.find(e => e.principal) || null;
  };

  /**
   * ✅ NOVO: Adiciona endereço a uma pessoa
   */
  adicionarEndereco = async (pessoaId: number, dadosEndereco: Omit<EnderecoDTO, 'pessoaId'>): Promise<Endereco> => {
    const enderecoData: EnderecoDTO = {
      ...dadosEndereco,
      pessoaId
    };
    
    return enderecoService.createWithValidation(enderecoData);
  };

  /**
   * ✅ NOVO: Define endereço principal para uma pessoa
   */
  definirEnderecoPrincipal = async (enderecoId: number): Promise<void> => {
    await enderecoService.setPrincipal(enderecoId);
  };

  /**
   * ✅ NOVO: Formata endereço principal para exibição rápida
   */
  getEnderecoFormatado = async (pessoaId: number): Promise<string> => {
    const enderecoPrincipal = await this.getEnderecoPrincipal(pessoaId);
    
    if (!enderecoPrincipal) {
      return "Endereço não cadastrado";
    }
    
    return enderecoService.formatarEnderecoCompleto(enderecoPrincipal);
  };

  /**
   * ✅ NOVO: Valida se pessoa pode ter um novo endereço
   */
  podeAdicionarEndereco = async (pessoaId: number): Promise<{ pode: boolean; motivo?: string }> => {
    try {
      const enderecos = await enderecoService.getEnderecosByPessoa(pessoaId);
      
      // Limite de 5 endereços por pessoa (regra de negócio configurável)
      if (enderecos.length >= 5) {
        return {
          pode: false,
          motivo: "Pessoa já possui o máximo de 5 endereços cadastrados"
        };
      }
      
      return { pode: true };
    } catch (error) {
      return {
        pode: false,
        motivo: "Erro ao verificar endereços existentes"
      };
    }
  };

  /**
   * Altera status de uma pessoa
   */
  alterarStatusPessoa = async (id: number): Promise<Pessoa> => {
    const response = await apiClient.patch(`${this.baseUrl}/${id}/status`);
    return response.data;
  };

  /**
   * Obtém tipos de pessoa disponíveis
   */
  getTiposPessoa = (): Array<{ value: TipoPessoa; label: string }> => {
    return [
      { value: TipoPessoa.FISICA, label: "Pessoa Física" },
      { value: TipoPessoa.JURIDICA, label: "Pessoa Jurídica" },
    ];
  };
}

// Exporta uma instância singleton do serviço
export default new PessoaService();