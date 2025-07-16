import { useAuth } from "../context/AuthContext";
import { ModuleType, ActionType } from "../types";

export const usePermissions = () => {
  const { user } = useAuth();

  // Verifica se o usuário tem permissão específica
  const hasPermission = (module: ModuleType, action: ActionType): boolean => {
    if (!user) return false;

    // Usuários com setor 'admin' têm acesso a tudo
    if (user.sector === "admin") return true;

    if (
      module === "comum" &&
      (user.sector === "obras" || user.sector === "agricultura")
    ) {
      return true;
    }

    // Verifica se o usuário tem a permissão específica
    return user.permissions.some(
      (permission) =>
        permission.module === module && permission.action === action
    );
  };

  // Verifica se o usuário tem acesso a um módulo (qualquer permissão)
  const hasModuleAccess = (module: ModuleType): boolean => {
    if (!user) return false;

    // Usuários admin têm acesso a tudo
    if (user.sector === "admin") return true;

    if (
      module === "comum" &&
      (user.sector === "obras" || user.sector === "agricultura")
    ) {
      return true;
    }

    // Verifica se o usuário tem pelo menos uma permissão para o módulo
    return user.permissions.some((permission) => permission.module === module);
  };

  // Filtra itens baseados nas permissões do usuário
  const filterMenuItems = <T extends { module?: ModuleType }>(
    items: T[]
  ): T[] => {
    if (!user) return [];

    // Admin vê tudo
    if (user.sector === "admin") return items;

    // Filtra itens que o usuário tem acesso
    return items.filter((item) => {
      // Se não tiver módulo definido, é um item geral
      if (!item.module) return true;

      return hasModuleAccess(item.module);
    });
  };

  return {
    currentUser: user,
    hasPermission,
    hasModuleAccess,
    filterMenuItems,
  };
};

export default usePermissions;
