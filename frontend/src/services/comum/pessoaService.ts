import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";
import enderecoService, { Endereco, EnderecoDTO } from "./enderecoService";

export enum TipoPessoa {
  FISICA = "FISICA",
  JURIDICA = "JURIDICA",
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
  enderecos?: Endereco[];
  propriedades?: any[];
  pessoaFisica?: PessoaFisicaData;
  pessoaJuridica?: PessoaJuridicaData;
}

export interface PessoaDTO {
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
  pessoaFisica?: PessoaFisicaData;
  pessoaJuridica?: PessoaJuridicaData;
  enderecoInicial?: Omit<EnderecoDTO, "pessoaId">;
  criarComEndereco?: boolean;
}

class PessoaService extends BaseApiService<Pessoa, PessoaDTO> {
  constructor() {
    super("/pessoas", "comum");
  }

  create = async (dados: PessoaDTO): Promise<Pessoa> => {
    const { enderecoInicial, criarComEndereco, ...dadosPessoa } = dados;

    const novaPessoa = await this.createPessoaBasica(dadosPessoa);

    // 2. Se tem endereço inicial, criar também
    if (criarComEndereco && enderecoInicial) {
      try {
        await this.adicionarEndereco(novaPessoa.id, {
          ...enderecoInicial,
          principal: true, // Primeiro endereço sempre é principal
        });
      } catch (error) {
        console.warn("Erro ao criar endereço inicial:", error);
        // Não falha a criação da pessoa por causa do endereço
      }
    }

    return novaPessoa;
  };

  private createPessoaBasica = async (dados: Omit<PessoaDTO, 'enderecoInicial' | 'criarComEndereco'>): Promise<Pessoa> => {
    // Chama diretamente o método original do BaseApiService
    const response = await apiClient.post(this.baseUrl, dados);
    return response.data;
  };

  getPessoaByCpfCnpj = async (cpfCnpj: string): Promise<Pessoa> => {
    const response = await apiClient.get(`${this.baseUrl}/cpfCnpj/${cpfCnpj}`);
    return response.data;
  };

  getPessoasByTipo = async (tipo: TipoPessoa): Promise<Pessoa[]> => {
    const response = await apiClient.get(`${this.baseUrl}/tipo/${tipo}`);
    return response.data;
  };

  getPessoaWithDetails = async (id: number): Promise<Pessoa> => {
    const response = await apiClient.get(`${this.baseUrl}/${id}/detalhes`);
    return response.data;
  };

  getPessoasWithEnderecos = async (tipo?: TipoPessoa): Promise<Pessoa[]> => {
    const params = tipo ? { tipo } : {};
    const response = await apiClient.get(`${this.baseUrl}/enderecos`, {
      params,
    });
    return response.data;
  };

  getPessoaWithEnderecos = async (id: number): Promise<Pessoa> => {
    const pessoa = await this.getPessoaWithDetails(id);

    if (pessoa) {
      // Buscar endereços separadamente com dados completos
      pessoa.enderecos = await enderecoService.getEnderecosByPessoa(id);
    }

    return pessoa;
  };

  /**
   * Busca endereço principal de uma pessoa
   */
  getEnderecoPrincipal = async (pessoaId: number): Promise<Endereco | null> => {
    const enderecos = await enderecoService.getEnderecosByPessoa(pessoaId);
    return enderecos.find((e) => e.principal) || null;
  };

  /**
   * Adiciona endereço a uma pessoa
   */
  adicionarEndereco = async (
    pessoaId: number,
    dadosEndereco: Omit<EnderecoDTO, "pessoaId">
  ): Promise<Endereco> => {
    const enderecoData: EnderecoDTO = {
      ...dadosEndereco,
      pessoaId,
    };

    return enderecoService.createWithValidation(enderecoData);
  };

  /**
   * Define endereço principal para uma pessoa
   */
  definirEnderecoPrincipal = async (enderecoId: number): Promise<void> => {
    await enderecoService.setPrincipal(enderecoId);
  };

  /**
   * Formata endereço principal para exibição rápida
   */
  getEnderecoFormatado = async (pessoaId: number): Promise<string> => {
    const enderecoPrincipal = await this.getEnderecoPrincipal(pessoaId);

    if (!enderecoPrincipal) {
      return "Endereço não cadastrado";
    }

    return enderecoService.formatarEnderecoCompleto(enderecoPrincipal);
  };

  /**
   * Valida se pessoa pode ter um novo endereço
   */
  podeAdicionarEndereco = async (
    pessoaId: number
  ): Promise<{ pode: boolean; motivo?: string }> => {
    try {
      const enderecos = await enderecoService.getEnderecosByPessoa(pessoaId);

      // Limite de 5 endereços por pessoa (regra de negócio configurável)
      if (enderecos.length >= 5) {
        return {
          pode: false,
          motivo: "Pessoa já possui o máximo de 5 endereços cadastrados",
        };
      }

      return { pode: true };
    } catch (error) {
      return {
        pode: false,
        motivo: "Erro ao verificar endereços existentes",
      };
    }
  };

  /**
   * Validação básica de dados de pessoa
   */
  validarPessoa = (dados: PessoaDTO): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Nome obrigatório
    if (!dados.nome?.trim()) {
      errors.push("Nome é obrigatório");
    }

    // CPF/CNPJ obrigatório e válido
    if (!dados.cpfCnpj?.trim()) {
      errors.push("CPF/CNPJ é obrigatório");
    } else {
      const cpfCnpjLimpo = dados.cpfCnpj.replace(/[^\d]/g, "");
      
      if (dados.tipoPessoa === TipoPessoa.FISICA && cpfCnpjLimpo.length !== 11) {
        errors.push("CPF deve conter 11 dígitos");
      } else if (dados.tipoPessoa === TipoPessoa.JURIDICA && cpfCnpjLimpo.length !== 14) {
        errors.push("CNPJ deve conter 14 dígitos");
      }
    }

    // Email válido se fornecido
    if (dados.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dados.email)) {
        errors.push("Email inválido");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Cria pessoa com validação
   */
  createWithValidation = async (dados: PessoaDTO): Promise<Pessoa> => {
    const validation = this.validarPessoa(dados);

    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(", ")}`);
    }

    return this.create(dados);
  };

  /**
   * Atualiza pessoa com validação
   */
  updateWithValidation = async (
    id: number,
    dados: PessoaDTO
  ): Promise<Pessoa> => {
    const validation = this.validarPessoa(dados);

    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(", ")}`);
    }

    const { enderecoInicial, criarComEndereco, ...dadosUpdate } = dados;
    return this.update(id, dadosUpdate);
  };


  getPessoaByTelefone = async (telefone: string): Promise<Pessoa[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/telefone/${telefone}`
    );
    return response.data;
  };


  getPessoaByEmail = async (email: string): Promise<Pessoa[]> => {
    const response = await apiClient.get(`${this.baseUrl}/email/${email}`);
    return response.data;
  };

  getEstatisticas = async (): Promise<{
    total: number;
    ativas: number;
    inativas: number;
    fisicas: number;
    juridicas: number;
    comEnderecos: number;
    semEnderecos: number;
  }> => {
    const response = await apiClient.get(`${this.baseUrl}/estatisticas`);
    return response.data;
  };

  duplicarPessoa = async (id: number, novoNome?: string): Promise<Pessoa> => {
    const pessoaOriginal = await this.getById(id);

    const dadosDuplicacao: PessoaDTO = {
      tipoPessoa: pessoaOriginal.tipoPessoa,
      nome: novoNome || `${pessoaOriginal.nome} (Cópia)`,
      cpfCnpj: "", // CPF/CNPJ deve ser único, deixar vazio para usuário preencher
      telefone: pessoaOriginal.telefone,
      email: "", // Email deve ser único, deixar vazio
      ativo: true,
      pessoaFisica: pessoaOriginal.pessoaFisica,
      pessoaJuridica: pessoaOriginal.pessoaJuridica,
    };

    return this.create(dadosDuplicacao);
  };
}

// Exporta uma instância singleton do serviço
export default new PessoaService();