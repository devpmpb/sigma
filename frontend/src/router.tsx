import {
  Outlet,
  redirect,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider as TanStackRouterProvider,
} from "@tanstack/react-router";
import { useAuth } from "./context/AuthContext";
import { usePermissions } from "./hooks/usePermissions";
import { ModuleType, ActionType } from "./types";

// Pages
import Login from "./pages/Login";
import AcessoNegado from "./pages/AcessoNegado";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
import Inicio from "./pages/Inicio";
import Relatorios from "./pages/Relatorios";
import Dashboards from "./pages/Dashboards";
import Configuracoes from "./pages/Configuracoes";
import AlterarSenha from "./pages/AlterarSenha";
import DashboardPublico from "./pages/dashboard/DashboardPublico";

// Importar configurações de rotas dos módulos
import { obrasRouteConfig } from "./config/menus/obras/routes";
import { agriculturaRouteConfig } from "./config/menus/agricultura/routes";
import { comunRouteConfig } from "./config/menus/comum/routes";
import React from "react";

// Define route context type
interface RouterContext {
  auth: ReturnType<typeof useAuth>;
  permissions: ReturnType<typeof usePermissions>;
}

/**
 * Interface flexível para aceitar as configurações dos módulos
 * sem exigir que elas sejam tipadas com enums específicos.
 */
interface RouteConfig {
  path: string;
  component: any;
  module?: string;
  action?: string;
}

// Auth guard for protected routes
function authGuard({ context }: { context: RouterContext }) {
  if (!context.auth.isAuthenticated) {
    const from = window.location.pathname;
    return redirect({
      to: "/login",
      search: {
        from,
      },
    });
  }
}

// Permission guard adaptado para aceitar strings e converter internamente
function permissionGuard({
  context,
  requiredModule,
  requiredAction = "view",
}: {
  context: RouterContext;
  requiredModule?: string;
  requiredAction?: string;
}) {
  if (!requiredModule) return;

  const module = requiredModule as ModuleType;
  const action = (requiredAction || "view") as ActionType;

  if (context.permissions.hasPermission(module, action)) {
    return;
  }

  return redirect({
    to: "/acesso-negado",
  });
}

/**
 * Transforma arrays de objetos em instâncias de rotas do TanStack Router.
 */
function createRoutesFromConfig(configs: any[], parentRoute: any) {
  return (configs as RouteConfig[]).map((config) => {
    let tanStackPath = config.path;

    if (config.path.includes("/:")) {
      const paramMatches = config.path.match(/:(\w+)/g);
      if (paramMatches) {
        paramMatches.forEach((param) => {
          const paramName = param.substring(1);
          tanStackPath = tanStackPath.replace(`:${paramName}`, `$${paramName}`);
        });
      }
    }

    return createRoute({
      getParentRoute: () => parentRoute,
      path: tanStackPath,
      component: (props: any) => {
        const Component = config.component;
        return (
          <Component
            {...props.params}
            onSave={() => window.location.reload()}
          />
        );
      },
      // REMOVIDA A TIPAGEM EXPLÍCITA DO PARÂMETRO PARA EVITAR CONFLITO DE INFERÊNCIA
      beforeLoad: async ({ context }) => {
        const ctx = context as RouterContext;

        const authResult = authGuard({ context: ctx });
        if (authResult) return authResult;

        if (config.module) {
          return permissionGuard({
            context: ctx,
            requiredModule: config.module,
            requiredAction: config.action,
          });
        }
      },
    });
  });
}

// 1. Root Route com o contexto tipado
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});

// Rotas Base do Sistema
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const acessoNegadoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/acesso-negado",
  component: AcessoNegado,
});

const dashboardPublicoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/painel",
  component: DashboardPublico,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/not-found",
  component: NotFound,
});

// Rota de Layout (Protegida)
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: Layout,
  // AQUI TAMBÉM: Usamos o 'as any' ou removemos a tipagem do parâmetro
  beforeLoad: ({ context }) => authGuard({ context: context as RouterContext }),
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: Inicio,
});

const relatoriosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/relatorios",
  component: Relatorios,
});

const dashboardsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/dashboards",
  component: Dashboards,
});

const configuracoesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/configuracoes",
  component: Configuracoes,
});

const alterarSenhaRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/alterar-senha",
  component: AlterarSenha,
});

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  beforeLoad: () => redirect({ to: "/not-found" }),
});

const obrasRoutes = createRoutesFromConfig(obrasRouteConfig, layoutRoute);
const agriculturaRoutes = createRoutesFromConfig(
  agriculturaRouteConfig,
  layoutRoute
);
const comunRoutes = createRoutesFromConfig(comunRouteConfig, layoutRoute);

const routeTree = rootRoute.addChildren([
  loginRoute,
  acessoNegadoRoute,
  dashboardPublicoRoute,
  notFoundRoute,
  layoutRoute.addChildren([
    indexRoute,
    relatoriosRoute,
    dashboardsRoute,
    configuracoesRoute,
    alterarSenhaRoute,
    ...obrasRoutes,
    ...agriculturaRoutes,
    ...comunRoutes,
  ]),
  catchAllRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    permissions: undefined!,
  },
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function RouterProvider() {
  const auth = useAuth();
  const permissions = usePermissions();

  return (
    <TanStackRouterProvider router={router} context={{ auth, permissions }} />
  );
}

export const routes = {
  root: rootRoute,
  login: loginRoute,
  acessoNegado: acessoNegadoRoute,
  dashboardPublico: dashboardPublicoRoute,
  notFound: notFoundRoute,
  layout: layoutRoute,
  index: indexRoute,
  relatorios: relatoriosRoute,
  dashboards: dashboardsRoute,
  configuracoes: configuracoesRoute,
  alterarSenha: alterarSenhaRoute,
};
