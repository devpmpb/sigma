// frontend/src/config/menus/agricultura/routes.tsx - ARQUIVO ATUALIZADO
import { lazy } from "react";

// Usando lazy loading para componentes
const GrupoProduto = lazy(() => import("../../../pages/cadastros/agricultura/produto/GrupoProduto"));

// Componentes de movimentos (placeholder)
const AvaliacoesBeneficio = lazy(() => import("../../../pages/movimentos/comum/AvaliacoesBeneficio"));
const RelatoriosBeneficio = lazy(() => import("../../../pages/movimentos/comum/RelatoriosBeneficio"));

const ArrendamentosPage = lazy(
  () => import("../../../pages/movimentos/agricultura/arrendamento/ArrendamentosPage")
);
const ArrendamentoForm = lazy(
  () => import("../../../pages/movimentos/agricultura/arrendamento/ArrendamentoForm")
);

// Exportamos os componentes para compatibilidade com código existente
export const agriculturaComponents = {
  GrupoProduto,
  AvaliacoesBeneficio,
  RelatoriosBeneficio,
  ArrendamentosPage,
  ArrendamentoForm
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
  // Movimentos
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
  },
   {
    path: "/movimentos/agricultura/arrendamentos",
    component: ArrendamentosPage,
    module: "agricultura",
    action: "view",
  },
  {
    path: "/movimentos/agricultura/arrendamentos/:id",
    component: ArrendamentoForm,
    module: "agricultura",
    action: "view",
  },
];