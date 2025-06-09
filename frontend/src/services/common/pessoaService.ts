import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

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

// Interface para a entidade Pessoa
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
  enderecos?: any[];
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
