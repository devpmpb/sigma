import { lazy } from "react";

// Usando lazy loading para componentes
const Bairro = lazy(() => import("../../../pages/cadastros/comum/Bairro"));
const Logradouros = lazy(() => import("../../../pages/cadastros/comum/logradouro/Logradouros"));
const LogradouroForm = lazy(() => import("../../../pages/cadastros/comum/Logradouro/LogradouroForm"));
const MovimentoComum1 = lazy(() => import("../../../pages/movimentos/comum/Comum"));
const MovimentoComum2 = lazy(() => import("../../../pages/movimentos/comum/Comum2"));
const MovimentoComum3 = lazy(() => import("../../../pages/movimentos/comum/Comum3"));

// Exportamos os componentes para compatibilidade com código existente
export const comunComponents = {
  Bairro,
  Logradouros,
  LogradouroForm,
  MovimentoComum1,
  MovimentoComum2,
  MovimentoComum3,
};

// Exportamos as configurações das rotas para compatibilidade
export const comunRouteConfig = [
  {
    path: "/cadastros/comum/bairros",
    component: Bairro,
    module: "comum",
    action: "view"
  },
  {
    path: "/cadastros/comum/logradouros",
    component: Logradouros,
    module: "comum",
    action: "view"
  },
  {
    path: "/cadastros/comum/logradouros/:id",
    component: LogradouroForm,
    module: "comum",
    action: "view"
  },
  {
    path: "/movimentos/comum/movimento1",
    component: MovimentoComum1,
    module: "comum",
    action: "view"
  },
  {
    path: "/movimentos/comum/movimento2",
    component: MovimentoComum2,
    module: "comum",
    action: "view"
  },
  {
    path: "/movimentos/comum/movimento3",
    component: MovimentoComum3,
    module: "comum",
    action: "view"
  }
];