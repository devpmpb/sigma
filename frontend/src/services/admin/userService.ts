// frontend/src/services/admin/userService.ts - ARQUIVO COMPLETO
import apiClient from "../apiConfig";
import BaseApiService from "../baseApiService";
import {
  UsuarioDTO,
  ChangePasswordDTO,
  Profile,
  TipoPerfilBackend,
  UsuarioBackend,
} from "../../types";

export interface UsuarioComPerfil extends UsuarioBackend {
  perfil: {
    id: number;
    nome: TipoPerfilBackend;
    descricao: string | null;
  };
}

export interface UsuarioStats {
  total: number;
  ativos: number;
  inativos: number;
  porPerfil: Array<{
    perfil: TipoPerfilBackend;
    count: number;
  }>;
}

export interface PermissaoDisponivel {
  id: number;
  modulo: string;
  acao: string;
  descricao: string;
}

export interface UsuarioComPermissoesDTO extends UsuarioDTO {
  permissoesCustomizadas?: number[]; // IDs das permissões selecionadas
  usarPerfilBase?: boolean; // Se true, usa perfil padrão; se false, cria perfil customizado
}

class UserService extends BaseApiService<UsuarioComPerfil, UsuarioDTO> {
  constructor() {
    super("/usuarios", "admin");
  }

  getAllPermissions = async (): Promise<PermissaoDisponivel[]> => {
    const response = await apiClient.get("/admin/permissoes");
    return response.data;
  };

  /**
   * Busca permissões de um perfil específico
   */
  getProfilePermissions = async (
    perfilId: number
  ): Promise<PermissaoDisponivel[]> => {
    const response = await apiClient.get(`/perfis/${perfilId}/permissoes`);
    return response.data;
  };

  /**
   * Cria usuário com permissões customizadas
   */
  createWithCustomPermissions = async (
    userData: UsuarioComPermissoesDTO
  ): Promise<UsuarioComPerfil> => {
    const response = await apiClient.post(
      `${this.baseUrl}/with-permissions`,
      userData
    );
    return response.data;
  };

  /**
   * Atualiza usuário com permissões customizadas
   */
  updateWithCustomPermissions = async (
    id: string | number,
    userData: UsuarioComPermissoesDTO
  ): Promise<UsuarioComPerfil> => {
    const response = await apiClient.put(
      `${this.baseUrl}/${id}/with-permissions`,
      userData
    );
    return response.data;
  };

  /**
   * Busca detalhes completos do usuário incluindo todas as permissões
   */
  getUserWithFullPermissions = async (
    id: string | number
  ): Promise<
    UsuarioComPerfil & {
      permissions: PermissaoDisponivel[];
    }
  > => {
    const response = await apiClient.get(
      `${this.baseUrl}/${id}/full-permissions`
    );
    return response.data;
  };

  /**
   * Verifica se um perfil é customizado
   */
  isCustomProfile = (profile: Profile): boolean => {
    return profile.nome.toString().startsWith("CUSTOM_");
  };

  /**
   * Busca usuários com perfis customizados
   */
  getUsersWithCustomProfiles = async (): Promise<UsuarioComPerfil[]> => {
    const allUsers = await this.getAll();
    return allUsers.filter((user) => this.isCustomProfile(user.perfil));
  };

  /**
   * Busca todos os perfis disponíveis
   */
  getProfiles = async (): Promise<Profile[]> => {
    const response = await apiClient.get("/perfis");
    return response.data;
  };

  /**
   * Busca perfis ativos
   */
  getActiveProfiles = async (): Promise<Profile[]> => {
    const response = await apiClient.get("/perfis/ativos");
    return response.data;
  };

  /**
   * Busca usuários por perfil usando ENUM
   */
  getUsersByProfile = async (
    perfilNome: TipoPerfilBackend
  ): Promise<UsuarioComPerfil[]> => {
    const response = await apiClient.get(
      `${this.baseUrl}/perfil/${perfilNome}`
    );
    return response.data;
  };

  /**
   * Busca usuários administradores
   */
  getAdminUsers = async (): Promise<UsuarioComPerfil[]> => {
    return this.getUsersByProfile(TipoPerfilBackend.ADMIN);
  };

  /**
   * Busca usuários de obras
   */
  getObrasUsers = async (): Promise<UsuarioComPerfil[]> => {
    return this.getUsersByProfile(TipoPerfilBackend.OBRAS);
  };

  /**
   * Busca usuários de agricultura
   */
  getAgriculturaUsers = async (): Promise<UsuarioComPerfil[]> => {
    return this.getUsersByProfile(TipoPerfilBackend.AGRICULTURA);
  };

  /**
   * Busca usuários ativos
   */
  getActiveUsers = async (): Promise<UsuarioComPerfil[]> => {
    const response = await apiClient.get(`${this.baseUrl}?ativo=true`);
    return response.data;
  };

  /**
   * Busca usuários inativos
   */
  getInactiveUsers = async (): Promise<UsuarioComPerfil[]> => {
    const response = await apiClient.get(`${this.baseUrl}?ativo=false`);
    return response.data;
  };

  /**
   * Altera senha do usuário
   */
  changePassword = async (
    userId: number | string,
    data: ChangePasswordDTO
  ): Promise<void> => {
    await apiClient.patch(`${this.baseUrl}/${userId}/senha`, data);
  };

  /**
   * Reset de senha (apenas admin)
   */
  resetPassword = async (
    userId: number | string
  ): Promise<{ novaSenha: string }> => {
    const response = await apiClient.patch(
      `${this.baseUrl}/${userId}/reset-senha`
    );
    return response.data;
  };

  /**
   * Alterna status do usuário (ativo/inativo)
   */
  toggleUserStatus = async (userId: number | string): Promise<void> => {
    await apiClient.patch(`${this.baseUrl}/${userId}/status`);
  };

  /**
   * Busca estatísticas de usuários
   */
  getStats = async (): Promise<UsuarioStats> => {
    const response = await apiClient.get(`${this.baseUrl}/stats`);
    return response.data;
  };

  /**
   * Busca usuário com detalhes completos (permissões)
   */
  getUserWithDetails = async (
    userId: number | string
  ): Promise<UsuarioComPerfil> => {
    const response = await apiClient.get(`${this.baseUrl}/${userId}`);
    return response.data;
  };

  /**
   * Valida se email está disponível
   */
  isEmailAvailable = async (
    email: string,
    excludeUserId?: number
  ): Promise<boolean> => {
    try {
      const users = await this.getAll();
      const emailExists = users.some(
        (user) =>
          user.email.toLowerCase() === email.toLowerCase() &&
          (!excludeUserId || user.id !== excludeUserId)
      );
      return !emailExists;
    } catch {
      return false;
    }
  };

  /**
   * Valida dados do usuário antes de salvar
   */
  validateUserData = (
    data: UsuarioDTO
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validar nome
    if (!data.nome || data.nome.trim().length < 2) {
      errors.push("Nome deve ter pelo menos 2 caracteres");
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push("Email inválido");
    }

    // Validar senha (apenas para criação)
    if (data.senha !== undefined && data.senha.length < 6) {
      errors.push("Senha deve ter pelo menos 6 caracteres");
    }

    // Validar perfil
    if (!data.perfilId || data.perfilId <= 0) {
      errors.push("Perfil é obrigatório");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Busca usuários com filtros avançados
   */
  searchUsers = async (filters: {
    nome?: string;
    email?: string;
    perfilId?: number;
    ativo?: boolean;
  }): Promise<UsuarioComPerfil[]> => {
    const params = new URLSearchParams();

    if (filters.nome) params.append("nome", filters.nome);
    if (filters.email) params.append("email", filters.email);
    if (filters.perfilId)
      params.append("perfilId", filters.perfilId.toString());
    if (filters.ativo !== undefined)
      params.append("ativo", filters.ativo.toString());

    const response = await apiClient.get(
      `${this.baseUrl}?${params.toString()}`
    );
    return response.data;
  };

  /**
   * Exporta lista de usuários (para relatórios)
   */
  exportUsers = async (format: "json" | "csv" = "json"): Promise<any> => {
    const users = await this.getAll();

    if (format === "csv") {
      // Converter para CSV
      const headers = [
        "ID",
        "Nome",
        "Email",
        "Perfil",
        "Ativo",
        "Último Login",
      ];
      const rows = users.map((user) => [
        user.id,
        user.nome,
        user.email,
        user.perfil.nome,
        user.ativo ? "Sim" : "Não",
        user.ultimoLogin
          ? new Date(user.ultimoLogin).toLocaleString()
          : "Nunca",
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      return csvContent;
    }

    return users;
  };

  /**
   * Busca últimos usuários criados
   */
  getRecentUsers = async (limit: number = 10): Promise<UsuarioComPerfil[]> => {
    const users = await this.getAll();
    return users
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  };

  /**
   * Busca usuários que fizeram login recentemente
   */
  getRecentlyActiveUsers = async (
    days: number = 7
  ): Promise<UsuarioComPerfil[]> => {
    const users = await this.getAll();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return users.filter(
      (user) => user.ultimoLogin && new Date(user.ultimoLogin) > cutoffDate
    );
  };
}

const userService = new UserService();
export default userService;
