import BaseApiService from "../baseApiService";

// Enum para o tipo de pessoa (Física ou Jurídica)
export enum TipoPessoa {
  FISICA = "FISICA",
  JURIDICA = "JURIDICA",
}

// Interface para o modelo de Pessoa vindo da API
export interface Pessoa {
  id: number;
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  dataNascimento?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// DTO para criação/atualização de Pessoa
export interface PessoaDTO {
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  dataNascimento?: string;
  ativo: boolean;
}

// Classe do serviço de API para Pessoas
class PessoaService extends BaseApiService<Pessoa, PessoaDTO> {
  constructor() {
    super("/pessoas", "comum");
  }
}

// Exporta uma instância única do serviço
const pessoaService = new PessoaService();
export default pessoaService;

// Exporta as interfaces e o serviço no mesmo arquivo para facilitar importações
export { PessoaService };