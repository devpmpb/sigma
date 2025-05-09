import { RouteObject } from "react-router-dom";
import { lazyLoad } from "../../../utils/lazyLoad";

// Usando lazy loading para componentes
const Cadastro1 = lazyLoad(
  () => import("../../../views/agricultura/Cadastro1")
);
const Cadastro2 = lazyLoad(
  () => import("../../../views/agricultura/Cadastro2")
);
const Cadastro3 = lazyLoad(
  () => import("../../../views/agricultura/Cadastro3")
);
const Movimento1 = lazyLoad(
  () => import("../../../views/agricultura/Movimento1")
);
const Movimento2 = lazyLoad(
  () => import("../../../views/agricultura/Movimento2")
);
const Movimento3 = lazyLoad(
  () => import("../../../views/agricultura/Movimento3")
);

export const agriculturaRoutes: RouteObject[] = [
  {
    path: "/cadastros/agricultura/cadastro1",
    element: <Cadastro1 />,
  },
  {
    path: "/cadastros/agricultura/cadastro2",
    element: <Cadastro2 />,
  },
  {
    path: "/cadastros/agricultura/cadastro3",
    element: <Cadastro3 />,
  },
  {
    path: "/movimentos/agricultura/movimento1",
    element: <Movimento1 />,
  },
  {
    path: "/movimentos/agricultura/movimento2",
    element: <Movimento2 />,
  },
  {
    path: "/movimentos/agricultura/movimento3",
    element: <Movimento3 />,
  },
];
