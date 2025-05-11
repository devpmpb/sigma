import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { lazyLoad } from "../../../utils/lazyLoad";

// Usando lazy loading para componentes
const Bairro = lazyLoad(
  () => import("../../../pages/cadastros/comum/Bairro")
);
const Logradouros = lazyLoad(
  () => import("../../../pages/cadastros/comum/logradouro/Logradouros")
);
const LogradouroForm = lazyLoad(
  () => import("../../../pages/cadastros/comum/Logradouro/LogradouroForm")
);
const MovimentoComum1 = lazyLoad(
  () => import("../../../pages/movimentos/comum/Comum")
);
const MovimentoComum2 = lazyLoad(
  () => import("../../../pages/movimentos/comum/Comum2")
);
const MovimentoComum3 = lazyLoad(
  () => import("../../../pages/movimentos/comum/Comum3")
);

// Rotas para módulo comum
export const comunRoutes: RouteObject[] = [
  // Cadastros
  {
    path: "cadastros/comum/bairros",
    element: (
      <ProtectedRoute requiredModule="comum" requiredAction="view">
        <Bairro />
      </ProtectedRoute>
    ),
  },
  {
    path: "cadastros/comum/logradouros",
    element: (
      <ProtectedRoute requiredModule="comum" requiredAction="view">
        <Logradouros />
      </ProtectedRoute>
    ),
  },
  {
    path: "cadastros/comum/logradouros/:id",
    element: (
      <ProtectedRoute requiredModule="comum" requiredAction="view">
        <LogradouroForm onSave={() => null} />
      </ProtectedRoute>
    ),
  },
  // Movimentos
  {
    path: "movimentos/comum/movimento1",
    element: (
      <ProtectedRoute requiredModule="comum" requiredAction="view">
        <MovimentoComum1 />
      </ProtectedRoute>
    ),
  },
  {
    path: "movimentos/comum/movimento2",
    element: (
      <ProtectedRoute requiredModule="comum" requiredAction="view">
        <MovimentoComum2 />
      </ProtectedRoute>
    ),
  },
  {
    path: "movimentos/comum/movimento3",
    element: (
      <ProtectedRoute requiredModule="comum" requiredAction="view">
        <MovimentoComum3 />
      </ProtectedRoute>
    ),
  },
];