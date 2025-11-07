import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";

// Interface para a entidade Veiculo
export interface Veiculo {
  id: number;
  tipoVeiculoId: number;
  tipoVeiculo?: {
    id: number;
    descricao: string;
  };
  descricao: string;
  placa: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para os dados de criação/atualização
export interface VeiculoDTO {
  tipoVeiculoId: number;
  descricao: string;
  placa: string;
  ativo?: boolean;
}

class VeiculoService extends BaseApiService<Veiculo, VeiculoDTO> {
  constructor() {
    super("/veiculos", "comum");
  }

  getAtivos = async (): Promise<Veiculo[]> => {
    const response = await apiClient.get(`${this.baseUrl}?ativo=true`);
    return response.data;
  };

  formatarPlaca = (placa: string): string => {
    if (!placa) return "";
    
    // Remove caracteres especiais
    const placaLimpa = placa.replace(/[^A-Z0-9]/g, "");
    
    // Formato Mercosul: AAA0A00
    if (placaLimpa.length === 7 && /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(placaLimpa)) {
      return `${placaLimpa.substring(0, 3)}-${placaLimpa.substring(3)}`;
    }
    
    // Formato antigo: AAA0000
    if (placaLimpa.length === 7 && /^[A-Z]{3}[0-9]{4}$/.test(placaLimpa)) {
      return `${placaLimpa.substring(0, 3)}-${placaLimpa.substring(3)}`;
    }
    
    return placaLimpa;
  };

  /**
   * Validar formato da placa
   */
  validarPlaca = (placa: string): { valida: boolean; erro?: string } => {
    if (!placa) {
      return { valida: false, erro: "Placa é obrigatória" };
    }

    const placaLimpa = placa.replace(/[^A-Z0-9]/g, "").toUpperCase();
    
    // Formato Mercosul ou padrão brasileiro
    const formatoValido = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(placaLimpa) || 
                         /^[A-Z]{3}[0-9]{4}$/.test(placaLimpa);
    
    if (!formatoValido) {
      return { 
        valida: false, 
        erro: "Formato inválido. Use AAA-0000 ou AAA-0A00" 
      };
    }
    
    return { valida: true };
  };

  /**
   * Normalizar placa antes de enviar para o backend
   */
  normalizarPlaca = (placa: string): string => {
    return placa.replace(/[^A-Z0-9]/g, "").toUpperCase();
  };
}

// Exporta uma instância singleton do serviço
export default new VeiculoService();