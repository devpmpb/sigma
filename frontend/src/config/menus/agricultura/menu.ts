import { MenuGroup } from "../../../types";

// Menus de cadastro de agricultura
export const cadastrosAgriculturaMenu: MenuGroup = {
  id: "cadastros-agricultura",
  title: "Agricultura",
  module: "agricultura",
  items: [
    {
      id: "cadastro-grupo-produto",
      title: "Cadastro de Grupo de Produto",
      path: "/cadastros/agricultura/produto/grupoProduto",
      module: "agricultura",
    },
  ],
};

// Menus de movimentos de agricultura
export const movimentosAgriculturaMenu: MenuGroup = {
  id: "movimentos-agricultura",
  title: "Agricultura",
  module: "agricultura",
  items: [
    {
      id: "movimento-agricultura-1",
      title: "Movimento 1",
      path: "/movimentos/agricultura/movimento1",
      module: "agricultura",
    },
  ],
};
