// frontend/src/services/comum/transferenciaPropiedadeService.ts - VERSÃO CORRIGIDA
import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";
import { SituacaoPropriedade } from "./propriedadeService";

// ========================================
// INTERFACES
// ========================================

export interface NovoProprietarioCondominio {
  pessoaId: number;
  percentual: number;
}

export interface DadosUsufruto {
  usufrutuarioId: number;
  nuProprietarioId: number;
  prazoUsufruto?: string;
}

export interface TransferenciaPropriedade {
  id: number;
  propriedadeId: number;
  situacaoPropriedade: SituacaoPropriedade;
  proprietarioAnteriorId?: number;
  proprietarioNovoId?: number;
  dataTransferencia: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;

  // Relacionamentos
  propriedade?: {
    id: number;
    nome: string;
    tipoPropriedade: string;
    areaTotal: string;
    localizacao?: string;
    matricula?: string;
  };
  proprietarioAnterior?: {
    id: number;
    nome: string;
    cpfCnpj: string;
    telefone?: string;
    email?: string;
  };
  proprietarioNovo?: {
    id: number;
    nome: string;
    cpfCnpj: string;
    telefone?: string;
    email?: string;
  };

  novosProprietariosCondominio?: Array<{
    id: number;
    pessoaId: number;
    percentual: number;
    pessoa: {
      id: number;
      nome: string;
      cpfCnpj: string;
      telefone?: string;
      email?: string;
    };
  }>;

  usufruto?: {
    id: number;
    usufrutuarioId: number;
    nuProprietarioId: number;
    prazoUsufruto?: string;
    usufrutuario: {
      id: number;
      nome: string;
      cpfCnpj: string;
    };
    nuProprietario: {
      id: number;
      nome: string;
      cpfCnpj: string;
    };
  };
}

export interface TransferenciaPropiedadeDTO {
  propriedadeId: number;
  situacaoPropriedade: SituacaoPropriedade;

  // Para PROPRIA
  proprietarioAnteriorId?: number;
  proprietarioNovoId?: number;

  // Para CONDOMINIO
  novosProprietarios?: NovoProprietarioCondominio[];

  // Para USUFRUTO
  usufruto?: DadosUsufruto;

  dataTransferencia: string;
  observacoes?: string;
}

export interface ProprietarioAtual {
  id: number;
  propriedadeId: number;
  pessoaId: number;
  tipoVinculo: "proprietario" | "usufrutuario" | "nu_proprietario";
  percentual?: number;
  dataInicio: string;
  ativo: boolean;
  pessoa: {
    id: number;
    nome: string;
    cpfCnpj: string;
    email?: string;
    telefone?: string;
  };
}

// ========================================
// SERVICE
// ========================================

class TransferenciaPropiedadeService extends BaseApiService<
  TransferenciaPropriedade,
  TransferenciaPropiedadeDTO
> {
  constructor() {
    super("/transferencias-propriedade", "comum");
  }

  /**
   * MÉTODO PRINCIPAL: Preparar dados antes de enviar
   * Esta é a lógica que prepara os dados conforme a situação
   */
  private prepararDadosTransferencia(dados: TransferenciaPropiedadeDTO): any {
    const dadosBase = {
      propriedadeId: dados.propriedadeId,
      situacaoPropriedade: dados.situacaoPropriedade,
      dataTransferencia: dados.dataTransferencia,
      observacoes: dados.observacoes,
    };

    switch (dados.situacaoPropriedade) {
      case SituacaoPropriedade.PROPRIA:
        return {
          ...dadosBase,
          proprietarioAnteriorId: dados.proprietarioAnteriorId,
          proprietarioNovoId: dados.proprietarioNovoId,
        };

      case SituacaoPropriedade.CONDOMINIO:
        return {
          ...dadosBase,
          novosProprietarios: dados.novosProprietarios,
        };

      case SituacaoPropriedade.USUFRUTO:
        return {
          ...dadosBase,
          usufruto: dados.usufruto,
        };

      default:
        return dadosBase;
    }
  }

  /**
   * Sobrescrever create para preparar dados e chamar transferir
   */
  create = async (
    dados: TransferenciaPropiedadeDTO
  ): Promise<TransferenciaPropriedade> => {
    const dadosPreparados = this.prepararDadosTransferencia(dados);
    return this.transferir(dadosPreparados);
  };

  /**
   * Sobrescrever update para preparar dados e chamar transferir
   */
  update = async (
    id: string | number,
    dados: TransferenciaPropiedadeDTO
  ): Promise<TransferenciaPropriedade> => {
    const dadosPreparados = this.prepararDadosTransferencia(dados);
    return this.transferir(dadosPreparados);
  };

  /**
   * Realizar transferência (PROPRIA, CONDOMINIO ou USUFRUTO)
   */
  transferir = async (data: any): Promise<TransferenciaPropriedade> => {
    const response = await apiClient.post(`${this.baseUrl}/transferir`, data);
    return response.data;
  };

  /**
   * Buscar proprietários atuais de uma propriedade
   */
  getProprietariosAtuais = async (
    propriedadeId: number
  ): Promise<ProprietarioAtual[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/proprietarios/${propriedadeId}`
    );
    return response.data;
  };

  /**
   * Busca histórico completo de uma propriedade
   */
  getHistorico = async (
    propriedadeId: number
  ): Promise<TransferenciaPropriedade[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/historico/${propriedadeId}`
    );
    return response.data;
  };

  /**
   * Busca transferências recentes (últimos 30 dias)
   */
  getRecentes = async (): Promise<TransferenciaPropriedade[]> => {
    const response = await apiClient.get(`${this.baseUrl}/recentes`);
    return response.data;
  };

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  /**
   * Formata situação para exibição
   */
  formatarSituacao = (situacao: SituacaoPropriedade): string => {
    const situacoes = {
      [SituacaoPropriedade.PROPRIA]: "Própria",
      [SituacaoPropriedade.CONDOMINIO]: "Condomínio",
      [SituacaoPropriedade.USUFRUTO]: "Usufruto",
    };
    return situacoes[situacao] || situacao;
  };

  /**
   * Formata tipo de vínculo para exibição
   */
  formatarTipoVinculo = (
    tipo: "proprietario" | "usufrutuario" | "nu_proprietario"
  ): string => {
    const tipos = {
      proprietario: "Proprietário",
      usufrutuario: "Usufrutuário",
      nu_proprietario: "Nu-proprietário",
    };
    return tipos[tipo] || tipo;
  };

  /**
   * Valida dados de transferência PROPRIA
   */
  validarTransferenciaPropria = (
    data: TransferenciaPropiedadeDTO
  ): string[] => {
    const errors = [];

    if (!data.proprietarioAnteriorId) {
      errors.push("Proprietário atual é obrigatório");
    }

    if (!data.proprietarioNovoId) {
      errors.push("Novo proprietário é obrigatório");
    }

    if (data.proprietarioAnteriorId === data.proprietarioNovoId) {
      errors.push("O novo proprietário deve ser diferente do atual");
    }

    return errors;
  };

  /**
   * Valida dados de transferência CONDOMINIO
   */
  validarTransferenciaCondominio = (
    data: TransferenciaPropiedadeDTO
  ): string[] => {
    const errors = [];

    if (!data.novosProprietarios || data.novosProprietarios.length < 2) {
      errors.push("Condomínio requer pelo menos 2 proprietários");
    }

    if (data.novosProprietarios && data.novosProprietarios.length > 0) {
      const somaPercentuais = data.novosProprietarios.reduce(
        (sum, np) => sum + np.percentual,
        0
      );

      if (Math.abs(somaPercentuais - 100) > 0.01) {
        errors.push(
          `A soma dos percentuais deve ser 100% (atual: ${somaPercentuais.toFixed(
            2
          )}%)`
        );
      }

      // Verificar proprietários duplicados
      const pessoasIds = data.novosProprietarios.map((np) => np.pessoaId);
      const pessoasUnicas = new Set(pessoasIds);
      if (pessoasIds.length !== pessoasUnicas.size) {
        errors.push("Não pode haver proprietários duplicados");
      }

      // Verificar se todos os proprietários foram selecionados
      const proprietariosInvalidos = data.novosProprietarios.some(
        (np) => !np.pessoaId || np.pessoaId === 0
      );
      if (proprietariosInvalidos) {
        errors.push("Todos os proprietários devem ser selecionados");
      }
    }

    return errors;
  };

  /**
   * Valida dados de transferência USUFRUTO
   */
  validarTransferenciaUsufruto = (
    data: TransferenciaPropiedadeDTO
  ): string[] => {
    const errors = [];

    if (!data.usufruto) {
      errors.push("Dados de usufruto são obrigatórios");
      return errors;
    }

    if (!data.usufruto.usufrutuarioId) {
      errors.push("Usufrutuário é obrigatório");
    }

    if (!data.usufruto.nuProprietarioId) {
      errors.push("Nu-proprietário é obrigatório");
    }

    if (data.usufruto.usufrutuarioId === data.usufruto.nuProprietarioId) {
      errors.push("Usufrutuário e nu-proprietário devem ser diferentes");
    }

    return errors;
  };
}

const transferenciaPropiedadeService = new TransferenciaPropiedadeService();
export default transferenciaPropiedadeService;
