import { MenuGroup } from "../../../types/types";

// Menus de cadastro comum
export const cadastrosComunMenu: MenuGroup = {
  id: "cadastros-comum",
  title: "Comum",
  module: "comum",
  items: [
    {
      id: "cadastro-bairros",
      title: "Bairros",
      path: "/cadastros/comum/bairros",
      module: "comum",
    },
    {
      id: "cadastro-logradouros",
      title: "Logradouros",
      path: "/cadastros/comum/logradouros",
      module: "comum",
    },
    {
      id: "cadastro-comum-3",
      title: "Cadastro 3",
      path: "/cadastros/comum/cadastro3",
      module: "comum",
    },
  ],
};

// Menus de movimentos comum
export const movimentosComunMenu: MenuGroup = {
  id: "movimentos-comum",
  title: "Comum",
  module: "comum",
  items: [
    {
      id: "movimento-comum-1",
      title: "Movimento 1",
      path: "/movimentos/comum/movimento1",
      module: "comum",
    },
    {
      id: "movimento-comum-2",
      title: "Movimento 2",
      path: "/movimentos/comum/movimento2",
      module: "comum",
    },
    {
      id: "movimento-comum-3",
      title: "Movimento 3",
      path: "/movimentos/comum/movimento3",
      module: "comum",
    },
  ],
};
