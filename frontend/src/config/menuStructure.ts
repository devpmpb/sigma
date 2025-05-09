import { MenuGroup } from "./menus/types";

// Interface para itens de submenu

// Estrutura de cadastros
export const cadastrosMenu: MenuGroup[] = [
  {
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
      {
        id: "cadastro-tipo-veiculo", // Novo cadastro
        title: "Tipo de Veículo",
        path: "/cadastros/obras/tipo-veiculo",
        module: "obras",
      },
    ],
  },
  {
    id: "cadastros-agricultura",
    title: "Agricultura",
    module: "agricultura",
    items: [
      {
        id: "cadastro-agricultura-1",
        title: "Cadastro 1",
        path: "/cadastros/agricultura/cadastro1",
        module: "agricultura",
      },
      {
        id: "cadastro-agricultura-2",
        title: "Cadastro 2",
        path: "/cadastros/agricultura/cadastro2",
        module: "agricultura",
      },
      {
        id: "cadastro-agricultura-3",
        title: "Cadastro 3",
        path: "/cadastros/agricultura/cadastro3",
        module: "agricultura",
      },
      {
        id: "cadastro-grupo-produto", // Novo cadastro
        title: "Grupo de Produto",
        path: "/cadastros/agricultura/grupo-produto",
        module: "agricultura",
      },
    ],
  },
  {
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
        id: "cadastro-comum-2",
        title: "Cadastro 2",
        path: "/cadastros/comum/cadastro2",
        module: "comum",
      },
      {
        id: "cadastro-comum-3",
        title: "Cadastro 3",
        path: "/cadastros/comum/cadastro3",
        module: "comum",
      },
    ],
  },
];

// Estrutura de movimentos
export const movimentosMenu: MenuGroup[] = [
  {
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
  },
  {
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
      {
        id: "movimento-agricultura-2",
        title: "Movimento 2",
        path: "/movimentos/agricultura/movimento2",
        module: "agricultura",
      },
      {
        id: "movimento-agricultura-3",
        title: "Movimento 3",
        path: "/movimentos/agricultura/movimento3",
        module: "agricultura",
      },
    ],
  },
  {
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
  },
];
