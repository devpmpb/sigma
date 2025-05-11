import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import AcessoNegado from "../pages/AcessoNegado";
import Layout from "../components/layout/Layout";
import NotFound from "../pages/NotFound";

// Páginas gerais
import Inicio from "../pages/Inicio";
import Relatorios from "../pages/Relatorios";
import Dashboards from "../pages/Dashboards";
import Configuracoes from "../pages/Configuracoes";
import { agriculturaRoutes, comunRoutes, obrasRoutes } from "./menus";

// Importando rotas modulares


// Criando o router com todas as rotas
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/acesso-negado",
    element: <AcessoNegado />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Inicio />,
      },
      {
        path: "relatorios",
        element: <Relatorios />,
      },
      {
        path: "dashboards",
        element: <Dashboards />,
      },
      {
        path: "configuracoes",
        element: <Configuracoes />,
      },
      
      // Adicionando rotas modulares como filhos do Layout
      ...obrasRoutes,
      ...agriculturaRoutes,
      ...comunRoutes,
    ],
  },
  {
    path: "*",
    element: <Navigate to="/not-found" replace />,
  },
]);

export default router;