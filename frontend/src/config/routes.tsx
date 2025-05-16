import { router } from "../router";
import { obrasRouteConfig } from "./menus/obras/routes";
import { agriculturaRouteConfig } from "./menus/agricultura/routes";
import { comunRouteConfig } from "./menus/comum/routes";

// Este objeto simula o export original do createBrowserRouter do React Router
// para manter compatibilidade com código existente
const routerCompatibility = {
  ...router,
  // Propriedades adicionais que o código existente possa usar
  navigate: router.navigate
};

// Exportamos as configurações das rotas modulares para compatibilidade
export const obrasRoutes = obrasRouteConfig;
export const agriculturaRoutes = agriculturaRouteConfig;
export const comunRoutes = comunRouteConfig;

export default routerCompatibility;