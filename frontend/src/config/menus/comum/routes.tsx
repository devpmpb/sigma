import { lazy } from "react";
import RegrasNegocioPage from "../../../pages/cadastros/comum/regrasNegocio";

// Usando lazy loading para componentes
const Bairro = lazy(() => import("../../../pages/cadastros/comum/Bairro"));
const Logradouros = lazy(
  () => import("../../../pages/cadastros/comum/logradouro/Logradouros")
);
const LogradouroForm = lazy(
  () => import("../../../pages/cadastros/comum/Logradouro/LogradouroForm")
);
const Pessoa = lazy(
  () => import("../../../pages/cadastros/comum/pessoa/Pessoas")
);
const PessoaForm = lazy(
  () => import("../../../pages/cadastros/comum/pessoa/PessoaForm")
);
const Programas = lazy(
  () => import("../../../pages/cadastros/comum/programa/Programas")
);
const ProgramaForm = lazy(
  () => import("../../../pages/cadastros/comum/programa/ProgramaForm")
);
const AvaliacoesBeneficio = lazy(
  () => import("../../../pages/movimentos/comum/AvaliacoesBeneficio")
);
const RelatoriosBeneficio = lazy(
  () => import("../../../pages/movimentos/comum/RelatoriosBeneficio")
);
const SolicitacoesBeneficio = lazy(
  () => import("../../../pages/movimentos/comum/SolicitacoesBeneficio")
);

// Exportamos os componentes para compatibilidade com código existente
export const comunComponents = {
  Pessoa,
  PessoaForm,
  Bairro,
  Logradouros,
  LogradouroForm,
  Programas,
  ProgramaForm,
  AvaliacoesBeneficio,
  RelatoriosBeneficio,
  SolicitacoesBeneficio,
};

// Exportamos as configurações das rotas para compatibilidade
export const comunRouteConfig = [
  {
    path: "/cadastros/comum/pessoas",
    component: Pessoa,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/pessoas/:id",
    component: Pessoa,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/bairros",
    component: Bairro,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/bairros/:id",
    component: Bairro,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/logradouros",
    component: Logradouros,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/logradouros/:id",
    component: Logradouros,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/programas",
    component: Programas,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/programas/:id",
    component: Programas,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/regrasNegocio",
    component: RegrasNegocioPage,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/regrasNegocio:id",
    component: RegrasNegocioPage,
    module: "comum",
    action: "view",
  },
  {
    path: "/movimentos/comum/avaliacoesBeneficio",
    component: AvaliacoesBeneficio,
    module: "comum",
    action: "view",
  },
  {
    path: "/movimentos/comum/relatoriosBeneficio",
    component: RelatoriosBeneficio,
    module: "comum",
    action: "view",
  },
  {
    path: "/movimentos/comum/solicitacoesBeneficio",
    component: SolicitacoesBeneficio,
    module: "comum",
    action: "view",
  },
];
