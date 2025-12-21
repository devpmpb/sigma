import apiClient from "../apiConfig";
import {
  User,
  UsuarioBackend,
  LoginRequest,
  LoginResponse,
  //RefreshTokenRequest,
  RefreshTokenResponse,
  convertBackendUserToFrontend,
} from "../../types";

class AuthService {
  private readonly TOKEN_KEY = "sigma_access_token";
  private readonly REFRESH_TOKEN_KEY = "sigma_refresh_token";
  private readonly USER_KEY = "sigma_user";

  /**
   * Realiza login do usuário
   */
  login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      credentials
    );

    // Converter dados do backend para frontend e salvar
    const frontendUser = convertBackendUserToFrontend(response.data.user);

    // Salvar tokens e dados do usuário
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    this.setUser(frontendUser);

    return response.data;
  };

  /**
   * Renova o token de acesso usando o refresh token
   */
  refreshToken = async (): Promise<RefreshTokenResponse | null> => {
    try {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        throw new Error("Refresh token não encontrado");
      }

      const response = await apiClient.post<RefreshTokenResponse>(
        "/auth/refresh",
        {
          refreshToken,
        }
      );

      // Converter e atualizar tokens e dados do usuário
      const frontendUser = convertBackendUserToFrontend(response.data.user);

      this.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setUser(frontendUser);

      return response.data;
    } catch (error) {
      // Se falhar ao renovar, limpar dados de autenticação
      this.clearAuthData();
      return null;
    }
  };

  /**
   * Verifica se o token atual é válido
   */
  verifyToken = async (): Promise<UsuarioBackend | null> => {
    try {
      const response = await apiClient.get<{ user: UsuarioBackend }>(
        "/auth/verify"
      );

      // Converter e atualizar dados do usuário
      const frontendUser = convertBackendUserToFrontend(response.data.user);
      this.setUser(frontendUser);

      return response.data.user;
    } catch (error) {
      // Token inválido, tentar renovar
      const refreshResult = await this.refreshToken();
      return refreshResult ? refreshResult.user : null;
    }
  };

  /**
   * Faz logout do usuário
   */
  logout = async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      // Mesmo se der erro na API, limpar dados locais
      console.warn("Erro ao fazer logout na API:", error);
    } finally {
      this.clearAuthData();
    }
  };

  /**
   * Salva tokens no localStorage
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Salva dados do usuário no localStorage
   */
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Obtém o token de acesso
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtém o refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Obtém dados do usuário do localStorage
   */
  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getUser();
  }

  /**
   * Limpa todos os dados de autenticação
   */
  clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Obtém informações do perfil do usuário atual
   */
  getCurrentUserProfile(): string | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  hasPermission(module: string, action: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Admin tem todas as permissões
    if (user.sector === "admin") return true;

    return user.permissions.some(
      (permission) =>
        permission.module === module && permission.action === action
    );
  }

  /**
   * Verifica se o usuário tem acesso a um módulo
   */
  hasModuleAccess(module: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Admin tem acesso a tudo
    if (user.sector === "admin") return true;

    return user.permissions.some((permission) => permission.module === module);
  }

  /**
   * Obtém o tempo restante do token (em minutos)
   */
  getTokenTimeRemaining(): number | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      // Decodificar token JWT (parte do payload)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiration = payload.exp * 1000; // Converter para milliseconds
      const now = Date.now();

      return Math.max(0, Math.floor((expiration - now) / 60000)); // Retornar em minutos
    } catch {
      return null;
    }
  }

  /**
   * Verifica se o token está próximo do vencimento (menos de 5 minutos)
   */
  isTokenExpiringSoon(): boolean {
    const timeRemaining = this.getTokenTimeRemaining();
    return timeRemaining !== null && timeRemaining < 5;
  }
}

// Exportar instância única
const authService = new AuthService();
export default authService;
