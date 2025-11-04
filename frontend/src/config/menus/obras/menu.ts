import { MenuGroup } from "../../../types";

// Menus de cadastro de obras
export const cadastrosObrasMenu: MenuGroup = {
  id: "cadastros-obras",
  title: "Obras",
  module: "obras",
  items: [
    {
      id: "cadastro-tipo-servico",
      title: "Tipos de Serviço",
      path: "/cadastros/obras/tipos-servico",
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
      id: "movimento-ordem-servico",
      title: "Ordens de Serviço",
      path: "/movimentos/obras/ordens-servico",
      module: "obras",
    },
    
  ],
};
