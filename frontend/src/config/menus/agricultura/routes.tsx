// frontend/src/config/menus/agricultura/routes.tsx - ARQUIVO ATUALIZADO
import { lazy } from "react";

// Usando lazy loading para componentes
const GrupoProduto = lazy(() => import("../../../pages/cadastros/agricultura/produto/GrupoProduto"));
const Programas = lazy(() => import("../../../pages/cadastros/comum/programa/Programas"));
const ProgramaForm = lazy(() => import("../../../pages/cadastros/comum/programa/ProgramaForm"));
const RegrasNegocio = lazy(() => import("../../../pages/cadastros/comum/regrasNegocio/RegrasNegocio"));
const RegrasNegocioForm = lazy(() => import("../../../pages/cadastros/comum/regrasNegocio/RegrasNegocioForm"));

// Componentes de movimentos (placeholder)
const SolicitacoesBeneficio = lazy(() => import("../../../pages/movimentos/comum/SolicitacoesBeneficio"));
const AvaliacoesBeneficio = lazy(() => import("../../../pages/movimentos/comum/AvaliacoesBeneficio"));
const RelatoriosBeneficio = lazy(() => import("../../../pages/movimentos/comum/RelatoriosBeneficio"));

// Exportamos os componentes para compatibilidade com código existente
export const agriculturaComponents = {
  GrupoProduto,
  Programas,
  ProgramaForm,
  RegrasNegocio,
  RegrasNegocioForm,
  SolicitacoesBeneficio,
  AvaliacoesBeneficio,
  RelatoriosBeneficio,
};

// Exportamos as configurações das rotas para compatibilidade
export const agriculturaRouteConfig = [
  // Cadastros
  {
    path: "/cadastros/agricultura/grupoProdutos",
    component: GrupoProduto,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/cadastros/agricultura/programas",
    component: Programas,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/cadastros/agricultura/programas/:id",
    component: ProgramaForm,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/cadastros/agricultura/regrasNegocio",
    component: RegrasNegocio,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/cadastros/agricultura/regrasNegocio/:id",
    component: RegrasNegocioForm,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/cadastros/agricultura/regrasNegocio/programa/:programaId",
    component: RegrasNegocio,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/cadastros/agricultura/regrasNegocio/programa/:programaId/:id",
    component: RegrasNegocioForm,
    module: "agricultura",
    action: "view"
  },
  // Movimentos
  {
    path: "/movimentos/agricultura/solicitacoes",
    component: SolicitacoesBeneficio,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/movimentos/agricultura/avaliacoes",
    component: AvaliacoesBeneficio,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/movimentos/agricultura/relatorios",
    component: RelatoriosBeneficio,
    module: "agricultura",
    action: "view"
  }
];