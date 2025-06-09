// frontend/src/config/menus/comum/routes.tsx - ARQUIVO ATUALIZADO
import { lazy } from "react";

// Usando lazy loading para componentes
const Bairro = lazy(() => import("../../../pages/cadastros/comum/Bairro"));
const Logradouro = lazy(
  () => import("../../../pages/cadastros/comum/logradouro/Logradouros")
);
const Pessoa = lazy(
  () => import("../../../pages/cadastros/comum/pessoa/Pessoas")
);
const PessoaForm = lazy(
  () => import("../../../pages/cadastros/comum/pessoa/PessoaForm")
);
const Propriedade = lazy(
  () => import("../../../pages/cadastros/comum/propriedade/Propriedade")
);
const PropriedadeForm = lazy(
  () => import("../../../pages/cadastros/comum/propriedade/PropriedadeForm")
);
const Programas = lazy(
  () => import("../../../pages/cadastros/comum/programa/Programas")
);
const ProgramaForm = lazy(
  () => import("../../../pages/cadastros/comum/programa/ProgramaForm")
);
const RegrasNegocio = lazy(
  () => import("../../../pages/cadastros/comum/regrasNegocio/RegrasNegocio")
);
const RegrasNegocioForm = lazy(
  () => import("../../../pages/cadastros/comum/regrasNegocio/RegrasNegocioForm")
);
const Produtor = lazy(() => import("../../../pages/cadastros/comum/produtor/Produtor"));
const ProdutorForm = lazy(() => import("../../../pages/cadastros/comum/produtor/ProdutorForm"));


// Componentes de movimentos (placeholder)
const SolicitacoesBeneficio = lazy(
  () => import("../../../pages/movimentos/comum/SolicitacoesBeneficio")
);
const AvaliacoesBeneficio = lazy(
  () => import("../../../pages/movimentos/comum/AvaliacoesBeneficio")
);
const RelatoriosBeneficio = lazy(
  () => import("../../../pages/movimentos/comum/RelatoriosBeneficio")
);

// Exportamos os componentes para compatibilidade com código existente
export const comunComponents = {
  Bairro,
  Logradouro,
  Pessoa,
  PessoaForm,
  Propriedade,
  PropriedadeForm,
  Programas,
  ProgramaForm,
  RegrasNegocio,
  RegrasNegocioForm,
  Produtor,
  ProdutorForm,
  SolicitacoesBeneficio,
  AvaliacoesBeneficio,
  RelatoriosBeneficio,
};

// Exportamos as configurações das rotas para compatibilidade
export const comunRouteConfig = [
  // Cadastros básicos
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
    component: Logradouro,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/logradouros/:id",
    component: Logradouro,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/pessoas",
    component: Pessoa,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/pessoas/:id",
    component: PessoaForm,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/propriedades",
    component: Propriedade,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/propriedades/:id",
    component: PropriedadeForm,
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
    component: ProgramaForm,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/regrasNegocio",
    component: RegrasNegocio,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/regrasNegocio/:id",
    component: RegrasNegocioForm,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/agricultura/produtores",
    component: Produtor,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/cadastros/agricultura/produtores/:id",
    component: ProdutorForm,
    module: "agricultura",
    action: "view"
  },
  // Movimentos
  {
    path: "/movimentos/comum/solicitacoes",
    component: SolicitacoesBeneficio,
    module: "comum",
    action: "view",
  },
  {
    path: "/movimentos/comum/avaliacoes",
    component: AvaliacoesBeneficio,
    module: "comum",
    action: "view",
  },
  {
    path: "/movimentos/comum/relatorios",
    component: RelatoriosBeneficio,
    module: "comum",
    action: "view",
  },
];
