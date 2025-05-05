import { useMemo } from "react";
import { menuItems as sidebarMenuItems } from "../config/menuConfig";
import {
  cadastrosMenu,
  movimentosMenu,
  MenuGroup,
  SubMenuItem,
} from "../config/menuStructure";
import usePermissions from "./usePermissions";

const useMenuItems = () => {
  const { hasModuleAccess, filterMenuItems } = usePermissions();

  // Items do menu lateral (já definidos em menuConfig.ts)
  const sidebarItems = useMemo(() => sidebarMenuItems, []);

  // Filtra os grupos de menu baseados nas permissões do usuário
  const filteredCadastrosGroups = useMemo(() => {
    return cadastrosMenu
      .filter((group) => hasModuleAccess(group.module))
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => hasModuleAccess(item.module)),
      }));
  }, [hasModuleAccess]);

  const filteredMovimentosGroups = useMemo(() => {
    return movimentosMenu
      .filter((group) => hasModuleAccess(group.module))
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => hasModuleAccess(item.module)),
      }));
  }, [hasModuleAccess]);

  // Verifica se os menus devem ser exibidos
  const showCadastrosMenu = useMemo(() => {
    return filteredCadastrosGroups.some((group) => group.items.length > 0);
  }, [filteredCadastrosGroups]);

  const showMovimentosMenu = useMemo(() => {
    return filteredMovimentosGroups.some((group) => group.items.length > 0);
  }, [filteredMovimentosGroups]);

  // Aplainar todos os itens para uso em outras partes (como rotas)
  const allCadastrosItems = useMemo(() => {
    return filteredCadastrosGroups.flatMap((group) => group.items);
  }, [filteredCadastrosGroups]);

  const allMovimentosItems = useMemo(() => {
    return filteredMovimentosGroups.flatMap((group) => group.items);
  }, [filteredMovimentosGroups]);

  return {
    sidebarItems,
    cadastrosGroups: filteredCadastrosGroups,
    movimentosGroups: filteredMovimentosGroups,
    cadastrosItems: allCadastrosItems,
    movimentosItems: allMovimentosItems,
    showCadastrosMenu,
    showMovimentosMenu,
  };
};

export default useMenuItems;
