// frontend/src/config/menus/comum/menu.ts - ARQUIVO ATUALIZADO
import { MenuGroup } from "../../../types";

// Menus de cadastro comum
export const cadastrosComunMenu: MenuGroup = {
  id: "cadastros-comum",
  title: "Comum",
  module: "comum",
  items: [
    {
      id: "cadastro-bairro",
      title: "Bairros",
      path: "/cadastros/comum/bairros",
      module: "comum",
    },
    {
      id: "cadastro-logradouro",
      title: "Logradouros",
      path: "/cadastros/comum/logradouros",
      module: "comum",
    },
    {
      id: "cadastro-pessoa",
      title: "Pessoas",
      path: "/cadastros/comum/pessoas",
      module: "comum",
    },
    {
      id: "cadastro-propriedade",
      title: "Propriedades",
      path: "/cadastros/comum/propriedades",
      module: "comum",
    },
    {
      id: "cadastro-logradouros",
      title: "Logradouros",
      path: "/cadastros/comum/logradouros",
      module: "comum",
    },
    {
      id: "cadastro-programa",
      title: "Programas",
      path: "/cadastros/comum/programas",
      module: "comum",
    },
    {
      id: "cadastro-regras-negocio",
      title: "Regras de Negócio",
      path: "/cadastros/comum/regrasNegocio",
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
      id: "movimento-solicitacoes-beneficio",
      title: "Solicitações de Benefício",
      path: "/movimentos/comum/solicitacoesBeneficios",
      module: "comum",
    },
    {
      id: "movimento-avaliacoes-beneficio",
      title: "Avaliações de Benefício",
      path: "/movimentos/comum/avaliacoesBeneficios",
      module: "comum",
    },
    {
      id: "movimento-relatorios-beneficio",
      title: "Relatórios de Benefício",
      path: "/movimentos/comum/relatorioBeneficios",
      module: "comum",
    },
  ],
};
