import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário já está autenticado (token no localStorage, etc.)
    const checkAuth = async () => {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        // Em produção, valide o token com a API
        setUser(JSON.parse(storedUser));
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Em produção, fazer chamada real para a API
    try {
      setIsLoading(true);

      // Simulação de login
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email === "admin@example.com" && password === "password") {
        const userData: User = {
          id: "1",
          name: "Administrador",
          email: "admin@example.com",
          role: "admin",
          sector: "admin",
          permissions: [
            { module: "obras", action: "view" },
            { module: "obras", action: "create" },
            { module: "obras", action: "edit" },
            { module: "obras", action: "delete" },
            { module: "agricultura", action: "view" },
            { module: "agricultura", action: "create" },
            { module: "agricultura", action: "edit" },
            { module: "agricultura", action: "delete" },
            { module: "comum", action: "view" },
            { module: "comum", action: "create" },
            { module: "comum", action: "edit" },
            { module: "comum", action: "delete" },
          ],
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return true;
      }

      if (email === "obras@example.com" && password === "password") {
        const userData: User = {
          id: "2",
          name: "Usuário Obras",
          email: "obras@example.com",
          role: "user",
          sector: "obras",
          permissions: [
            { module: "obras", action: "view" },
            { module: "obras", action: "create" },
            { module: "obras", action: "edit" },
            { module: "comum", action: "view" },
          ],
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return true;
      }

      if (email === "agricultura@example.com" && password === "password") {
        const userData: User = {
          id: "3",
          name: "Usuário Agricultura",
          email: "agricultura@example.com",
          role: "user",
          sector: "agricultura",
          permissions: [
            { module: "agricultura", action: "view" },
            { module: "agricultura", action: "create" },
            { module: "agricultura", action: "edit" },
            { module: "comum", action: "view" },
          ],
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return true;
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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
