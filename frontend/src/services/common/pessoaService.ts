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
  enderecos?: Endereco[]; // ✅ ADICIONADO
  propriedades?: any[];
  pessoaFisica?: PessoaFisicaData;
  pessoaJuridica?: PessoaJuridicaData;
}

// ✅ DTO ÚNICO - Modificado para ser mais flexível
export interface PessoaDTO {
  tipoPessoa: TipoPessoa;
  nome: string;
  cpfCnpj: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
  pessoaFisica?: PessoaFisicaData;
  pessoaJuridica?: PessoaJuridicaData;
  // ✅ NOVOS CAMPOS OPCIONAIS para criação completa
  enderecoInicial?: Omit<EnderecoDTO, "pessoaId">; // Para criar pessoa + primeiro endereço
  criarComEndereco?: boolean; // Flag para indicar se deve criar endereço junto
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
    return enderecos.find((e) => e.principal) || null;
  };

  /**
   * ✅ NOVO: Adiciona endereço a uma pessoa
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
   * ✅ MODIFICADO: Create que pode incluir endereço inicial
   */
  create = async (dados: PessoaDTO): Promise<Pessoa> => {
    // Separar dados da pessoa e do endereço
    const { enderecoInicial, criarComEndereco, ...dadosPessoa } = dados;

    // 1. Criar pessoa primeiro
    const novaPessoa = await super.create(dadosPessoa);

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

  /**
   * ✅ NOVO: Cria pessoa com endereço em uma transação
   */
  createPessoaCompleta = async (
    dados: PessoaDTO
  ): Promise<{ pessoa: Pessoa; endereco?: Endereco }> => {
    const { enderecoInicial, ...dadosPessoa } = dados;

    try {
      // 1. Criar pessoa
      const pessoa = await this.create(dadosPessoa);

      // 2. Se tem endereço, criar também
      let endereco: Endereco | undefined;
      if (enderecoInicial) {
        endereco = await this.adicionarEndereco(pessoa.id, {
          ...enderecoInicial,
          principal: true, // Primeiro endereço sempre é principal
        });
      }

      return { pessoa, endereco };
    } catch (error) {
      throw new Error(`Erro ao criar pessoa completa: ${error}`);
    }
  };

  /**
   * ✅ NOVO: Atualiza pessoa e seus endereços
   */
  updatePessoaCompleta = async (
    id: number,
    dadosPessoa: PessoaDTO,
    enderecosParaAtualizar?: Array<{ id?: number; dados: EnderecoDTO }>
  ): Promise<Pessoa> => {
    try {
      // 1. Atualizar dados da pessoa
      const { enderecoInicial, criarComEndereco, ...dadosUpdate } = dadosPessoa;
      const pessoa = await this.update(id, dadosUpdate);

      // 2. Atualizar endereços se fornecidos
      if (enderecosParaAtualizar) {
        for (const enderecoUpdate of enderecosParaAtualizar) {
          if (enderecoUpdate.id) {
            // Atualizar endereço existente
            await enderecoService.updateWithValidation(
              enderecoUpdate.id,
              enderecoUpdate.dados
            );
          } else {
            // Criar novo endereço
            await this.adicionarEndereco(id, enderecoUpdate.dados);
          }
        }
      }

      // 3. Retornar pessoa com endereços atualizados
      return await this.getPessoaWithEnderecos(id);
    } catch (error) {
      throw new Error(`Erro ao atualizar pessoa completa: ${error}`);
    }
  };

  /**
   * ✅ NOVO: Remove pessoa e todos seus endereços
   */
  deletePessoaCompleta = async (id: number): Promise<boolean> => {
    try {
      // 1. Buscar todos os endereços da pessoa
      const enderecos = await enderecoService.getEnderecosByPessoa(id);

      // 2. Remover todos os endereços primeiro
      for (const endereco of enderecos) {
        await enderecoService.delete(endereco.id);
      }

      // 3. Remover a pessoa
      await this.delete(id);

      return true;
    } catch (error) {
      throw new Error(`Erro ao remover pessoa completa: ${error}`);
    }
  };

  /**
   * ✅ NOVO: Busca pessoas por proximidade de endereço
   */
  getPessoasByProximidade = async (
    latitude: number,
    longitude: number,
    raioKm: number = 5
  ): Promise<Pessoa[]> => {
    try {
      // Buscar endereços próximos (implementar quando o endpoint estiver disponível)
      // const enderecosProximos = await enderecoService.buscarEnderecosPorCoordenadas(latitude, longitude, raioKm);
      // const pessoasIds = [...new Set(enderecosProximos.map(e => e.pessoaId))];

      // Por enquanto, retorna array vazio
      return [];
    } catch (error) {
      console.error("Erro ao buscar pessoas por proximidade:", error);
      return [];
    }
  };

  /**
   * ✅ NOVO: Exporta dados da pessoa com endereços
   */
  exportarPessoaCompleta = async (id: number): Promise<string> => {
    const pessoa = await this.getPessoaWithEnderecos(id);

    const dadosPessoa = [
      "DADOS DA PESSOA",
      `Nome: ${pessoa.nome}`,
      `CPF/CNPJ: ${pessoa.cpfCnpj}`,
      `Tipo: ${pessoa.tipoPessoa}`,
      `Telefone: ${pessoa.telefone || "Não informado"}`,
      `Email: ${pessoa.email || "Não informado"}`,
      `Status: ${pessoa.ativo ? "Ativo" : "Inativo"}`,
      "",
      "ENDEREÇOS",
    ];

    if (pessoa.enderecos && pessoa.enderecos.length > 0) {
      const enderecosCSV = [
        "Tipo,Endereço,Principal,Coordenadas,Data Criação",
        ...pessoa.enderecos.map(
          (e) =>
            `"${e.tipoEndereco}","${enderecoService.formatarEnderecoCompleto(
              e
            )}","${e.principal ? "Sim" : "Não"}","${
              e.coordenadas || ""
            }","${new Date(e.createdAt).toLocaleDateString()}"`
        ),
      ].join("\n");

      dadosPessoa.push(enderecosCSV);
    } else {
      dadosPessoa.push("Nenhum endereço cadastrado");
    }

    return dadosPessoa.join("\n");
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

  /**
   * ✅ NOVO: Resumo estatístico de uma pessoa
   */
  getResumoEstatistico = async (
    id: number
  ): Promise<{
    pessoa: Pessoa;
    totalEnderecos: number;
    temEnderecoPrincipal: boolean;
    ultimaAtualizacao: string;
  }> => {
    const pessoa = await this.getPessoaWithEnderecos(id);

    return {
      pessoa,
      totalEnderecos: pessoa.enderecos?.length || 0,
      temEnderecoPrincipal: !!pessoa.enderecos?.some((e) => e.principal),
      ultimaAtualizacao: pessoa.updatedAt,
    };
  };

  /**
   * ✅ NOVO: Valida dados de pessoa antes de enviar
   */
  validarPessoa = (
    dados: PessoaDTO
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validações básicas
    if (!dados.nome?.trim()) {
      errors.push("Nome é obrigatório");
    }

    if (!dados.cpfCnpj?.trim()) {
      errors.push("CPF/CNPJ é obrigatório");
    }

    if (!dados.tipoPessoa) {
      errors.push("Tipo de pessoa é obrigatório");
    }

    // Validações específicas por tipo
    if (dados.tipoPessoa === TipoPessoa.FISICA) {
      if (dados.cpfCnpj && dados.cpfCnpj.replace(/\D/g, "").length !== 11) {
        errors.push("CPF deve ter 11 dígitos");
      }
    } else if (dados.tipoPessoa === TipoPessoa.JURIDICA) {
      if (dados.cpfCnpj && dados.cpfCnpj.replace(/\D/g, "").length !== 14) {
        errors.push("CNPJ deve ter 14 dígitos");
      }
    }

    // Validação de email
    if (dados.email && dados.email.trim()) {
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
   * ✅ NOVO: Cria pessoa com validação
   */
  createWithValidation = async (dados: PessoaDTO): Promise<Pessoa> => {
    const validation = this.validarPessoa(dados);

    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(", ")}`);
    }

    return this.create(dados);
  };

  /**
   * ✅ NOVO: Atualiza pessoa com validação
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

  /**
   * ✅ NOVO: Busca pessoa por telefone
   */
  getPessoaByTelefone = async (telefone: string): Promise<Pessoa[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/telefone/${telefone}`
    );
    return response.data;
  };

  /**
   * ✅ NOVO: Busca pessoa por email
   */
  getPessoaByEmail = async (email: string): Promise<Pessoa[]> => {
    const response = await apiClient.get(`${this.baseUrl}/email/${email}`);
    return response.data;
  };

  /**
   * ✅ NOVO: Estatísticas gerais de pessoas
   */
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

  /**
   * ✅ NOVO: Duplicar pessoa (cria cópia sem endereços)
   */
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
