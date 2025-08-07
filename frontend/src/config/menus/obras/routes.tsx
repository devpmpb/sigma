import { lazy } from "react";

// Usando lazy loading para componentes

const MovimentoObras1 = lazy(
  () => import("../../../pages/movimentos/obras/Obras")
);
const MovimentoObras2 = lazy(
  () => import("../../../pages/movimentos/obras/Obras2")
);
const MovimentoObras3 = lazy(
  () => import("../../../pages/movimentos/obras/Obras3")
);

// Exportamos os componentes para compatibilidade com código existente
export const obrasComponents = {
  MovimentoObras1,
  MovimentoObras2,
  MovimentoObras3,
};

// Exportamos as configurações das rotas para compatibilidade
export const obrasRouteConfig = [
  {
    path: "/movimentos/obras/movimento1",
    component: MovimentoObras1,
    module: "obras",
    action: "view",
  },
  {
    path: "/movimentos/obras/movimento2",
    component: MovimentoObras2,
    module: "obras",
    action: "view",
  },
  {
    path: "/movimentos/obras/movimento3",
    component: MovimentoObras3,
    module: "obras",
    action: "view",
  },
];
