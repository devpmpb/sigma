// frontend/src/services/common/logradouroService.ts - ARQUIVO COMPLETO
import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// ENUMs do backend
export enum TipoLogradouro {
  RUA = "RUA",
  AVENIDA = "AVENIDA",
  TRAVESSA = "TRAVESSA",
  ALAMEDA = "ALAMEDA",
  RODOVIA = "RODOVIA",
  LINHA = "LINHA",
  ESTRADA = "ESTRADA",
}

// Interface para a entidade Logradouro
export interface Logradouro {
  id: number;
  tipo: TipoLogradouro;
  descricao: string;
  cep?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para os dados de criação/atualização
export interface LogradouroDTO {
  tipo: TipoLogradouro;
  descricao: string;
  cep?: string;
  ativo: boolean;
}

/**
 * Serviço para operações com a entidade Logradouro
 * Módulo comum
 */
class LogradouroService extends BaseApiService<Logradouro, LogradouroDTO> {
  constructor() {
    super("/logradouros", "comum");
  }

  /**
   * Busca logradouros ativos
   */
  getAtivos = async (): Promise<Logradouro[]> => {
    const response = await apiClient.get(`${this.baseUrl}/ativos`);
    return response.data;
  };

  /**
   * Sobrescrever getAll para incluir relacionamentos
   */
  getAll = async (): Promise<Logradouro[]> => {
    const response = await apiClient.get(`${this.baseUrl}`);
    return response.data;
  };

  /**
   * Busca tipos de logradouro disponíveis
   */
  getTiposLogradouro = (): Array<{
    value: TipoLogradouro;
    label: string;
  }> => {
    return [
      { value: TipoLogradouro.RUA, label: "Rua" },
      { value: TipoLogradouro.AVENIDA, label: "Avenida" },
      { value: TipoLogradouro.TRAVESSA, label: "Travessa" },
      { value: TipoLogradouro.ALAMEDA, label: "Alameda" },
      { value: TipoLogradouro.RODOVIA, label: "Rodovia" },
      { value: TipoLogradouro.LINHA, label: "Linha" },
      { value: TipoLogradouro.ESTRADA, label: "Estrada" },
    ];
  };

  /**
   * Formata tipo de logradouro para exibição
   */
  formatarTipoLogradouro = (tipo: TipoLogradouro): string => {
    const tipos = {
      [TipoLogradouro.RUA]: "Rua",
      [TipoLogradouro.AVENIDA]: "Avenida",
      [TipoLogradouro.TRAVESSA]: "Travessa",
      [TipoLogradouro.ALAMEDA]: "Alameda",
      [TipoLogradouro.RODOVIA]: "Rodovia",
      [TipoLogradouro.LINHA]: "Linha",
      [TipoLogradouro.ESTRADA]: "Estrada",
    };
    return tipos[tipo] || tipo;
  };

  /**
   * Formata logradouro completo para exibição
   */
  formatarLogradouroCompleto = (logradouro: Logradouro): string => {
    const tipo = this.formatarTipoLogradouro(logradouro.tipo);
    let texto = `${tipo} ${logradouro.descricao}`;

    if (logradouro.cep) {
      texto += ` (CEP: ${logradouro.cep})`;
    }

    return texto;
  };
}

// Exporta uma instância singleton do serviço
export default new LogradouroService();
