import { Outlet, redirect, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { useAuth } from './context/AuthContext';
import { usePermissions } from './hooks/usePermissions';
import { ModuleType, ActionType } from './types';

// Importando as configurações de rotas de cada módulo
import { obrasRouteConfig, obrasComponents } from './config/menus/obras/routes';
import { agriculturaRouteConfig, agriculturaComponents } from './config/menus/agricultura/routes';
import { comunRouteConfig, comunComponents } from './config/menus/comum/routes';

// Pages
import Login from './pages/Login';
import AcessoNegado from './pages/AcessoNegado';
import NotFound from './pages/NotFound';
import Layout from './components/layout/Layout';
import Inicio from './pages/Inicio';
import Relatorios from './pages/Relatorios';
import Dashboards from './pages/Dashboards';
import Configuracoes from './pages/Configuracoes';

// Define route context type
interface RouterContext {
  auth: ReturnType<typeof useAuth>;
  permissions: ReturnType<typeof usePermissions>;
}

// Auth guard for protected routes
function authGuard({ context }: { context: RouterContext }) {
  if (!context.auth.isAuthenticated) {
    // Save the current location and redirect to login
    const from = window.location.pathname;
    return redirect({
      to: '/login',
      search: {
        from,
      },
    });
  }
  return;
}

// Permission guard for module-specific routes
function permissionGuard({ 
  context, 
  requiredModule, 
  requiredAction = 'view' 
}: { 
  context: RouterContext,
  requiredModule?: ModuleType,
  requiredAction?: ActionType
}) {
  // If no module is required or user has permission, allow access
  if (!requiredModule || context.permissions.hasPermission(requiredModule, requiredAction)) {
    return;
  }
  
  // Otherwise redirect to access denied page
  return redirect({
    to: '/acesso-negado',
  });
}

// Create root route
const rootRoute = createRootRoute({
  component: () => <Outlet />
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

// Access denied route
const acessoNegadoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/acesso-negado',
  component: AcessoNegado,
});

// Not found route
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/not-found',
  component: NotFound,
});

// Layout route - parent for authenticated routes
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: Layout,
  beforeLoad: authGuard,
});

// Main pages
const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: Inicio,
});

const relatoriosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/relatorios',
  component: Relatorios,
});

const dashboardsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/dashboards',
  component: Dashboards,
});

const configuracoesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/configuracoes',
  component: Configuracoes,
});

// Criar rotas para cada módulo a partir das configurações
const createModuleRoutes = (layoutParent: any) => {
  const moduleRoutes: any = {};
  
  // Criar rotas para Obras
  obrasRouteConfig.forEach(routeConfig => {
    const routeName = routeConfig.path.split('/').pop()!;
    moduleRoutes[routeName] = createRoute({
      getParentRoute: () => layoutParent,
      path: routeConfig.path,
      component: routeConfig.component,
      beforeLoad: ({ context }) => permissionGuard({
        context,
        requiredModule: routeConfig.module as ModuleType,
        requiredAction: routeConfig.action as ActionType
      })
    });
  });
  
  // Criar rotas para Agricultura
  agriculturaRouteConfig.forEach(routeConfig => {
    const routeName = routeConfig.path.split('/').pop()!;
    moduleRoutes[routeName] = createRoute({
      getParentRoute: () => layoutParent,
      path: routeConfig.path,
      component: routeConfig.component,
      beforeLoad: ({ context }) => permissionGuard({
        context,
        requiredModule: routeConfig.module as ModuleType,
        requiredAction: routeConfig.action as ActionType
      })
    });
  });
  
  // Criar rotas para Comum
  comunRouteConfig.forEach(routeConfig => {
    const routeName = routeConfig.path.split('/').pop()!.replace(/:\w+/, 'Form');
    moduleRoutes[routeName] = createRoute({
      getParentRoute: () => layoutParent,
      path: routeConfig.path,
      component: routeConfig.component,
      beforeLoad: ({ context }) => permissionGuard({
        context,
        requiredModule: routeConfig.module as ModuleType,
        requiredAction: routeConfig.action as ActionType
      })
    });
  });
  
  return moduleRoutes;
};

// Criar todas as rotas de módulos
const moduleRoutes = createModuleRoutes(layoutRoute);

// Catch-all route for 404
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  beforeLoad: () => {
    return redirect({
      to: '/not-found',
    });
  },
});

// Criar children routes para o layout
const layoutChildren = [
  indexRoute,
  relatoriosRoute,
  dashboardsRoute,
  configuracoesRoute,
  ...Object.values(moduleRoutes)
];

// Create the route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  acessoNegadoRoute,
  notFoundRoute,
  layoutRoute.addChildren(layoutChildren),
  catchAllRoute,
]);

// Create the router instance
export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    permissions: undefined!,
  },
  defaultPreload: 'intent',
  // This is optional, but recommended for single-page applications
  defaultErrorComponent: ({ error }) => {
    console.error(error);
    return <div>Erro: {error.message || 'Ocorreu um erro desconhecido'}</div>;
  },
});

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Create a RouterContext provider component
export function RouterProvider() {
  const auth = useAuth();
  const permissions = usePermissions();
  
  return (
    <router.Provider context={{ auth, permissions }}>
      <router.Outlet />
    </router.Provider>
  );
}

// Export routes for type safety in links
export const routes = {
  root: rootRoute,
  login: loginRoute,
  acessoNegado: acessoNegadoRoute,
  notFound: notFoundRoute,
  layout: layoutRoute,
  index: indexRoute,
  relatorios: relatoriosRoute,
  dashboards: dashboardsRoute,
  configuracoes: configuracoesRoute,
  // Module routes
  ...moduleRoutes
};