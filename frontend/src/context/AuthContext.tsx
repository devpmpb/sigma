// frontend/src/context/AuthContext.tsx - ARQUIVO COMPLETO
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";
import authService from "../services/auth/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Verifica autenticação ao inicializar o app
   */
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      try {
        // Verificar se há dados salvos no localStorage
        const savedUser = authService.getUser();
        const hasToken = authService.isAuthenticated();

        if (savedUser && hasToken) {
          // Verificar se o token ainda é válido
          const validatedUser = await authService.verifyToken();
          
          if (validatedUser) {
            setUser(validatedUser);
          } else {
            // Token inválido, limpar dados
            authService.clearAuthData();
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        authService.clearAuthData();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Função de login
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await authService.login({ email, password });
      
      // Transformar os dados do backend para o formato do frontend
      // Backend retorna ENUMs em UPPERCASE, frontend espera lowercase
      const userData: User = {
        id: response.user.id.toString(),
        name: response.user.nome,
        email: response.user.email,
        role: response.user.perfil.nome.toLowerCase(), // ADMIN -> admin
        sector: response.user.perfil.nome === "ADMIN" ? "admin" : response.user.perfil.nome.toLowerCase(),
        permissions: response.user.permissions.map(p => ({
          module: p.modulo.toLowerCase() as "obras" | "agricultura" | "comum" | "admin",
          action: p.acao.toLowerCase() as "view" | "create" | "edit" | "delete"
        }))
      };

      setUser(userData);
      return true;
    } catch (error: any) {
      console.error("Erro no login:", error);
      
      // Tratar diferentes tipos de erro
      if (error.response?.status === 401) {
        throw new Error("Email ou senha incorretos");
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Função de logout
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setUser(null);
      setIsLoading(false);
      // Redirecionar para login
      window.location.href = '/login';
    }
  };

  /**
   * Função para atualizar dados do usuário
   */
  const refreshUser = async () => {
    try {
      const updatedUser = await authService.verifyToken();
      
      if (updatedUser) {
        // Transformar dados do backend para formato do frontend
        const userData: User = {
          id: updatedUser.id.toString(),
          name: updatedUser.nome,
          email: updatedUser.email,
          role: updatedUser.perfil.nome.toLowerCase(), // ADMIN -> admin
          sector: updatedUser.perfil.nome === "ADMIN" ? "admin" : updatedUser.perfil.nome.toLowerCase(),
          permissions: updatedUser.permissions.map(p => ({
            module: p.modulo.toLowerCase() as "obras" | "agricultura" | "comum" | "admin",
            action: p.acao.toLowerCase() as "view" | "create" | "edit" | "delete"
          }))
        };
        
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;