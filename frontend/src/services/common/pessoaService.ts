import { AxiosResponse } from "axios";
import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// Enum para o tipo de pessoa (Física ou Jurídica)
export enum TipoPessoa {
  FISICA = "FISICA",
  JURIDICA = "JURIDICA",
}

// Interface para dados específicos de Pessoa Física
export interface PessoaFisicaData {
  rg?: string;
  dataNascimento?: string;
}

// Interface para dados específicos de Pessoa Jurídica
export interface PessoaJuridicaData {
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  dataFundacao?: string;
  representanteLegal?: string;
}

// Interface para o modelo de Pessoa vindo da API
export interface Pessoa {
  id: number;
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  // Dados específicos retornados pelo backend
  pessoaFisica?: PessoaFisicaData;
  pessoaJuridica?: PessoaJuridicaData;
}

// DTO para criação/atualização de Pessoa
export interface PessoaDTO {
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  // Dados específicos para cada tipo
  pessoaFisica?: PessoaFisicaData;
  pessoaJuridica?: PessoaJuridicaData;
}

// Classe do serviço de API para Pessoas
class PessoaService extends BaseApiService<Pessoa, PessoaDTO> {
  constructor() {
    super("/pessoas", "comum");
  }

  /**
   * Busca pessoa por CPF/CNPJ
   */
  buscarPorCpfCnpj = async (cpfCnpj: string): Promise<Pessoa> => {
    const response = await this.getById(`cpfCnpj/${cpfCnpj}`);
    return response;
  };

  /**
   * Busca pessoas por tipo
   */
  buscarPorTipo = async (tipo: TipoPessoa): Promise<Pessoa[]> => {
    const response = await this.getAll();
    // Se precisar de uma rota específica, pode implementar aqui
    return response.filter(pessoa => pessoa.tipoPessoa === tipo);
  };



  getByIdWithDetails = async (id: number | string): Promise<Pessoa> => {
    const response: AxiosResponse<Pessoa> = await apiClient.get(
      `${this.baseUrl}/${id}/detalhes`
    );
    return response.data;
  };
}

// Exporta uma instância única do serviço
const pessoaService = new PessoaService();
export default pessoaService;

// Exporta as interfaces e o serviço no mesmo arquivo para facilitar importações
export { PessoaService };