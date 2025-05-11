import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { lazyLoad } from "../../../utils/lazyLoad";

// Usando lazy loading para componentes
const TipoVeiculo = lazyLoad(
  () => import("../../../pages/cadastros/obras/TipoVeiculo")
);
const MovimentoObras1 = lazyLoad(
  () => import("../../../pages/movimentos/obras/Obras")
);
const MovimentoObras2 = lazyLoad(
  () => import("../../../pages/movimentos/obras/Obras2")
);
const MovimentoObras3 = lazyLoad(
  () => import("../../../pages/movimentos/obras/Obras3")
);

// Rotas para obras
export const obrasRoutes: RouteObject[] = [
  // Rotas de Cadastros - Obras
  {
    path: "cadastros/obras/tipoVeiculo",
    element: (
      <ProtectedRoute requiredModule="obras" requiredAction="view">
        <TipoVeiculo />
      </ProtectedRoute>
    ),
  },
  // Rotas de Movimentos - Obras
  {
    path: "movimentos/obras/movimento1",
    element: (
      <ProtectedRoute requiredModule="obras" requiredAction="view">
        <MovimentoObras1 />
      </ProtectedRoute>
    ),
  },
  {
    path: "movimentos/obras/movimento2",
    element: (
      <ProtectedRoute requiredModule="obras" requiredAction="view">
        <MovimentoObras2 />
      </ProtectedRoute>
    ),
  },
  {
    path: "movimentos/obras/movimento3",
    element: (
      <ProtectedRoute requiredModule="obras" requiredAction="view">
        <MovimentoObras3 />
      </ProtectedRoute>
    ),
  },
];