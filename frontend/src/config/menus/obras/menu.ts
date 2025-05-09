import { MenuGroup } from "../../../types/types";

// Menus de cadastro de obras
export const cadastrosObrasMenu: MenuGroup = {
  id: "cadastros-obras",
  title: "Obras",
  module: "obras",
  items: [
    {
      id: "cadastro-obras-1",
      title: "Cadastro 1",
      path: "/cadastros/obras/cadastro1",
      module: "obras",
    },
    {
      id: "cadastro-obras-2",
      title: "Cadastro 2",
      path: "/cadastros/obras/cadastro2",
      module: "obras",
    },
    {
      id: "cadastro-obras-3",
      title: "Cadastro 3",
      path: "/cadastros/obras/cadastro3",
      module: "obras",
    },
  ],
};

// Menus de movimentos de obras
export const movimentosObrasMenu: MenuGroup = {
  id: "movimentos-obras",
  title: "Obras",
  module: "obras",
  items: [
    {
      id: "movimento-obras-1",
      title: "Movimento 1",
      path: "/movimentos/obras/movimento1",
      module: "obras",
    },
    {
      id: "movimento-obras-2",
      title: "Movimento 2",
      path: "/movimentos/obras/movimento2",
      module: "obras",
    },
    {
      id: "movimento-obras-3",
      title: "Movimento 3",
      path: "/movimentos/obras/movimento3",
      module: "obras",
    },
  ],
};
