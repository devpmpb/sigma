import { lazy } from "react";

// Usando lazy loading para componentes
const GrupoProduto = lazy(() => import("../../../pages/cadastros/agricultura/produto/GrupoProduto"));
const MovimentoAgricultura1 = lazy(() => import("../../../pages/movimentos/agricultura/Agricultura"));
const MovimentoAgricultura2 = lazy(() => import("../../../pages/movimentos/agricultura/Agricultura2"));
const MovimentoAgricultura3 = lazy(() => import("../../../pages/movimentos/agricultura/Agricultura3"));

// Exportamos os componentes para compatibilidade com código existente
export const agriculturaComponents = {
  GrupoProduto,
  MovimentoAgricultura1,
  MovimentoAgricultura2,
  MovimentoAgricultura3,
};

// Exportamos as configurações das rotas para compatibilidade
export const agriculturaRouteConfig = [
  {
    path: "/cadastros/agricultura/produto/grupoProduto",
    component: GrupoProduto,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/movimentos/agricultura/movimento1",
    component: MovimentoAgricultura1,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/movimentos/agricultura/movimento2",
    component: MovimentoAgricultura2,
    module: "agricultura",
    action: "view"
  },
  {
    path: "/movimentos/agricultura/movimento3",
    component: MovimentoAgricultura3,
    module: "agricultura",
    action: "view"
  }
];