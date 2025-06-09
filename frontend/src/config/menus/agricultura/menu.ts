import { MenuGroup } from "../../../types";

// Menus de cadastro de agricultura
export const cadastrosAgriculturaMenu: MenuGroup = {
  id: "cadastros-agricultura",
  title: "Agricultura",
  module: "agricultura",
  items: [
    {
      id: "cadastro-grupo-produto",
      title: "Grupos de Produto",
      path: "/cadastros/agricultura/grupoProdutos",
      module: "agricultura",
    },
    {
      id: "cadastro-produtor",
      title: "Produtor",
      path: "/cadastros/agricultura/produtores",
      module: "comum",
    },
  ],
};

// Menus de movimentos de agricultura
export const movimentosAgriculturaMenu: MenuGroup = {
  id: "movimentos-agricultura",
  title: "Agricultura",
  module: "agricultura",
  items: [
    
  ],
};