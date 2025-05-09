import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../../../components/ProtectedRoute";
//import CadastroObras1 from "../../../pages/cadastros/obras/Cadastro1";
const CadastroObras1 = lazyLoad(
  () => import("../../../pages/cadastros/obras/Cadastro1")
);
const CadastroObras2 = lazyLoad(
  () => import("../../../pages/cadastros/obras/Cadastro1")
);
const CadastroObras3 = lazyLoad(
  () => import("../../../pages/cadastros/obras/Cadastro1")
);
const TipoVeiculo = lazyLoad(
  () => import("../../../pages/cadastros/obras/TipoVeiculo")
);
import { lazyLoad } from "../../../utils/lazyLoad";

// Usando lazy loading para componentes

export const obrasRoutes: RouteObject[] = [
  // Rotas de Cadastros - Obras
  {
    path: "cadastros/obras/cadastro1",
    element: (
      <ProtectedRoute requiredModule="obras" requiredAction="view">
        <CadastroObras1 />
      </ProtectedRoute>
    ),
  },
  {
    path: "cadastros/obras/cadastro2",
    element: (
      <ProtectedRoute requiredModule="obras" requiredAction="view">
        <CadastroObras2 />
      </ProtectedRoute>
    ),
  },
  {
    path: "cadastros/obras/cadastro3",
    element: (
      <ProtectedRoute requiredModule="obras" requiredAction="view">
        <CadastroObras3 />
      </ProtectedRoute>
    ),
  },
  // Novo cadastro de Tipo de Veículo (Obras)
  {
    path: "cadastros/obras/tipo-veiculo",
    element: (
      <ProtectedRoute requiredModule="obras" requiredAction="view">
        <TipoVeiculo />
      </ProtectedRoute>
    ),
  },
];
