import { Outlet, redirect, createRootRoute, createRoute, createRouter, RouterProvider as TanStackRouterProvider } from '@tanstack/react-router';
import { useAuth } from './context/AuthContext';
import { usePermissions } from './hooks/usePermissions';
import { ModuleType, ActionType } from './types';

// Pages
import Login from './pages/Login';
import AcessoNegado from './pages/AcessoNegado';
import NotFound from './pages/NotFound';
import Layout from './components/layout/Layout';
import Inicio from './pages/Inicio';
import Relatorios from './pages/Relatorios';
import Dashboards from './pages/Dashboards';
import Configuracoes from './pages/Configuracoes';
import AlterarSenha from './pages/AlterarSenha';

// Importar configurações de rotas dos módulos
import { obrasRouteConfig, obrasComponents } from './config/menus/obras/routes';
import { agriculturaRouteConfig, agriculturaComponents } from './config/menus/agricultura/routes';
import { comunRouteConfig, comunComponents } from './config/menus/comum/routes';
import React from 'react';

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

// Função auxiliar para criar rotas a partir da configuração
function createRoutesFromConfig(configs, parentRoute) {
  return configs.map(config => {
    // Lidar com rotas com parâmetros dinâmicos
    const hasParams = config.path.includes('/:');
    
    if (hasParams) {
      // Extrair nome do parâmetro
      const paramName = config.path.split('/:').pop();
      // Converter path de '/:id' para '/$id'
      const tanStackPath = config.path.replace('/:' + paramName, '/$' + paramName);
      
      return createRoute({
        getParentRoute: () => parentRoute,
        path: tanStackPath,
        component: ({ params }) => {
          const paramValue = params && params[paramName] ? params[paramName] : undefined;
          
          const finalId = paramValue === "novo" ? undefined : paramValue;
          
          return React.createElement(config.component, { 
            id: finalId, 
            onSave: () => null 
          });
        },
        beforeLoad: ({ context }) => permissionGuard({ 
          context, 
          requiredModule: config.module, 
          requiredAction: config.action 
        }),
      });
    }
    
    return createRoute({
      getParentRoute: () => parentRoute,
      path: config.path,
      component: config.component,
      beforeLoad: ({ context }) => permissionGuard({ 
        context, 
        requiredModule: config.module, 
        requiredAction: config.action 
      }),
    });
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

// Change password route
const alterarSenhaRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/alterar-senha',
  component: AlterarSenha,
});

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

// Criar rotas a partir das configurações
const obrasRoutes = createRoutesFromConfig(obrasRouteConfig, layoutRoute);
const agriculturaRoutes = createRoutesFromConfig(agriculturaRouteConfig, layoutRoute);
const comunRoutes = createRoutesFromConfig(comunRouteConfig, layoutRoute);

// Create the route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  acessoNegadoRoute,
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

// Create the router instance
export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    permissions: undefined!,
  },
  defaultPreload: 'intent',
  // Este é opcional, mas recomendado para aplicações de página única
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
    <TanStackRouterProvider 
      router={router} 
      context={{ auth, permissions }}
    />
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
  alterarSenha: alterarSenhaRoute,
  // As rotas modulares estarão disponíveis de outra forma
};