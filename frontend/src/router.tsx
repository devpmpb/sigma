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

// Lazy-loaded pages
import { lazy } from 'react';

// Obras pages
const TipoVeiculo = lazy(() => import('./pages/cadastros/obras/TipoVeiculo'));
const MovimentoObras1 = lazy(() => import('./pages/movimentos/obras/Obras'));
const MovimentoObras2 = lazy(() => import('./pages/movimentos/obras/Obras2'));
const MovimentoObras3 = lazy(() => import('./pages/movimentos/obras/Obras3'));

// Agricultura pages
const GrupoProduto = lazy(() => import('./pages/cadastros/agricultura/produto/GrupoProduto'));
const MovimentoAgricultura1 = lazy(() => import('./pages/movimentos/agricultura/Agricultura'));
const MovimentoAgricultura2 = lazy(() => import('./pages/movimentos/agricultura/Agricultura2'));
const MovimentoAgricultura3 = lazy(() => import('./pages/movimentos/agricultura/Agricultura3'));

// Comum pages
const Bairro = lazy(() => import('./pages/cadastros/comum/Bairro'));
const Logradouros = lazy(() => import('./pages/cadastros/comum/logradouro/Logradouros'));
const LogradouroForm = lazy(() => import('./pages/cadastros/comum/Logradouro/LogradouroForm'));
const Pessoas = lazy(() => import("./pages/cadastros/comum/pessoa/Pessoas"));
const PessoaForm = lazy(() => import("./pages/cadastros/comum/pessoa/PessoaForm"));
const MovimentoComum1 = lazy(() => import('./pages/movimentos/comum/Comum'));
const MovimentoComum2 = lazy(() => import('./pages/movimentos/comum/Comum2'));
const MovimentoComum3 = lazy(() => import('./pages/movimentos/comum/Comum3'));

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

// Obras routes
const tipoVeiculoRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/cadastros/obras/tipoVeiculo',
  component: TipoVeiculo,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'obras', 
    requiredAction: 'view' 
  }),
});

const movimentoObras1Route = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/movimentos/obras/movimento1',
  component: MovimentoObras1,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'obras', 
    requiredAction: 'view' 
  }),
});

const movimentoObras2Route = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/movimentos/obras/movimento2',
  component: MovimentoObras2,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'obras', 
    requiredAction: 'view' 
  }),
});

const movimentoObras3Route = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/movimentos/obras/movimento3',
  component: MovimentoObras3,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'obras', 
    requiredAction: 'view' 
  }),
});

// Agricultura routes
const grupoProdutoRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/cadastros/agricultura/produto/grupoProduto',
  component: GrupoProduto,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'agricultura', 
    requiredAction: 'view' 
  }),
});

const movimentoAgricultura1Route = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/movimentos/agricultura/movimento1',
  component: MovimentoAgricultura1,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'agricultura', 
    requiredAction: 'view' 
  }),
});

const movimentoAgricultura2Route = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/movimentos/agricultura/movimento2',
  component: MovimentoAgricultura2,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'agricultura', 
    requiredAction: 'view' 
  }),
});

const movimentoAgricultura3Route = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/movimentos/agricultura/movimento3',
  component: MovimentoAgricultura3,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'agricultura', 
    requiredAction: 'view' 
  }),
});

// Comum routes
const bairroRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/cadastros/comum/bairros',
  component: Bairro,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'comum', 
    requiredAction: 'view' 
  }),
});

const logradourosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/cadastros/comum/logradouros',
  component: Logradouros,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'comum', 
    requiredAction: 'view' 
  }),
});

const logradouroFormRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/cadastros/comum/logradouros/$id',
  component: ({ params }) => {
    const { id } = params;
    return <LogradouroForm id={id} onSave={() => null} />;
  },
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'comum', 
    requiredAction: 'view' 
  }),
});


const pessoasRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/cadastros/comum/pessoas',
  component: Pessoas,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'comum', 
    requiredAction: 'view' 
  }),
});

const pessoaFormRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/cadastros/comum/pessoas/$id',
  component: ({ params }) => {
    const { id } = params;
    return <PessoaForm id={id} onSave={() => null} />;
  },
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'comum', 
    requiredAction: 'view' 
  }),
});

const movimentoComum1Route = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/movimentos/comum/movimento1',
  component: MovimentoComum1,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'comum', 
    requiredAction: 'view' 
  }),
});

const movimentoComum2Route = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/movimentos/comum/movimento2',
  component: MovimentoComum2,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'comum', 
    requiredAction: 'view' 
  }),
});

const movimentoComum3Route = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/movimentos/comum/movimento3',
  component: MovimentoComum3,
  beforeLoad: ({ context }) => permissionGuard({ 
    context, 
    requiredModule: 'comum', 
    requiredAction: 'view' 
  }),
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
    // Obras routes
    tipoVeiculoRoute,
    movimentoObras1Route,
    movimentoObras2Route,
    movimentoObras3Route,
    // Agricultura routes
    grupoProdutoRoute,
    movimentoAgricultura1Route,
    movimentoAgricultura2Route,
    movimentoAgricultura3Route,
    // Comum routes
    pessoasRoute,
    pessoaFormRoute,
    bairroRoute,
    logradourosRoute,
    logradouroFormRoute,
    movimentoComum1Route,
    movimentoComum2Route,
    movimentoComum3Route,
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
  // Obras routes
  tipoVeiculo: tipoVeiculoRoute,
  movimentoObras1: movimentoObras1Route,
  movimentoObras2: movimentoObras2Route,
  movimentoObras3: movimentoObras3Route,
  // Agricultura routes
  grupoProduto: grupoProdutoRoute,
  movimentoAgricultura1: movimentoAgricultura1Route,
  movimentoAgricultura2: movimentoAgricultura2Route,
  movimentoAgricultura3: movimentoAgricultura3Route,
  // Comum routes
  bairro: bairroRoute,
  logradouros: logradourosRoute,
  logradouroForm: logradouroFormRoute,
  movimentoComum1: movimentoComum1Route,
  movimentoComum2: movimentoComum2Route,
  movimentoComum3: movimentoComum3Route,
};