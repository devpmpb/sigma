import { MenuGroup } from "../../../types";

// Menus de cadastro comum
export const cadastrosComunMenu: MenuGroup = {
  id: "cadastros-comum",
  title: "Comum",
  module: "comum",
  items: [
    {
      id: "cadastro-pessoas",
      title: "Pessoas",
      path: "/cadastros/comum/pessoas",
      module: "comum",
    },
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
      id: "cadastro-programa",
      title: "Programas de Incentivo",
      path: "/cadastros/agricultura/programas",
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
      id: "solicitacao-beneficio",
      title: "Solicitações de Benefício",
      path: "/movimentos/comum/solicitacoesBeneficios",
      module: "comum",
    },
    {
      id: "avaliacao-beneficio",
      title: "Avaliação de Benefícios",
      path: "/movimentos/comum/avaliacoesBeneficios",
      module: "comum",
    },
    {
      id: "relatorio-beneficios",
      title: "Relatório de Benefícios",
      path: "/movimentos/comum/relatoriosBeneficios",
      module: "comum",
    },
  ],
};
