import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { lazyLoad } from "../../../utils/lazyLoad";

// Usando lazy loading para componentes
const GrupoProduto = lazyLoad(
  () => import("../../../pages/cadastros/agricultura/produto/GrupoProduto")
);
const MovimentoAgricultura1 = lazyLoad(
  () => import("../../../pages/movimentos/agricultura/Agricultura")
);
const MovimentoAgricultura2 = lazyLoad(
  () => import("../../../pages/movimentos/agricultura/Agricultura2")
);
const MovimentoAgricultura3 = lazyLoad(
  () => import("../../../pages/movimentos/agricultura/Agricultura3")
);

// Rotas para agricultura
export const agriculturaRoutes: RouteObject[] = [
  // Cadastros
  {
    path: "cadastros/agricultura/produto/grupoProduto",
    element: (
      <ProtectedRoute requiredModule="agricultura" requiredAction="view">
        <GrupoProduto />
      </ProtectedRoute>
    ),
  },
  // Movimentos
  {
    path: "movimentos/agricultura/movimento1",
    element: (
      <ProtectedRoute requiredModule="agricultura" requiredAction="view">
        <MovimentoAgricultura1 />
      </ProtectedRoute>
    ),
  },
  {
    path: "movimentos/agricultura/movimento2",
    element: (
      <ProtectedRoute requiredModule="agricultura" requiredAction="view">
        <MovimentoAgricultura2 />
      </ProtectedRoute>
    ),
  },
  {
    path: "movimentos/agricultura/movimento3",
    element: (
      <ProtectedRoute requiredModule="agricultura" requiredAction="view">
        <MovimentoAgricultura3 />
      </ProtectedRoute>
    ),
  },
];
