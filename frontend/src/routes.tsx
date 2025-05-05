import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import AcessoNegado from "./pages/AcessoNegado";

// Página Dashboard/Início
import Inicio from "./pages/Inicio";
import Relatorios from "./pages/Relatorios";
import Dashboards from "./pages/Dashboards";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

// Páginas de Cadastros - Obras
import CadastroObras1 from "./pages/cadastros/obras/Cadastro1";
import CadastroObras2 from "./pages/cadastros/obras/Cadastro2";
import CadastroObras3 from "./pages/cadastros/obras/Cadastro3";

// Páginas de Cadastros - Agricultura
import CadastroAgricultura1 from "./pages/cadastros/agricultura/Agricultura";
import CadastroAgricultura2 from "./pages/cadastros/agricultura/Agricultura2";
import CadastroAgricultura3 from "./pages/cadastros/agricultura/Agricultura3";

// Páginas de Cadastros - Comum
import CadastroComum1 from "./pages/cadastros/comum/Comum";
import CadastroComum2 from "./pages/cadastros/comum/Comum2";
import CadastroComum3 from "./pages/cadastros/comum/Comum3";

// Páginas de Movimentos - Obras
import MovimentoObras1 from "./pages/movimentos/obras/Obras";
import MovimentoObras2 from "./pages/movimentos/obras/Obras2";
import MovimentoObras3 from "./pages/movimentos/obras/Obras3";

// Páginas de Movimentos - Agricultura
import MovimentoAgricultura1 from "./pages/movimentos/agricultura/Agricultura";
import MovimentoAgricultura2 from "./pages/movimentos/agricultura/Agricultura2";
import MovimentoAgricultura3 from "./pages/movimentos/agricultura/Agricultura3";

// Páginas de Movimentos - Comum
import MovimentoComum1 from "./pages/movimentos/comum/Comum";
import MovimentoComum2 from "./pages/movimentos/comum/Comum2";
import MovimentoComum3 from "./pages/movimentos/comum/Comum3";

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

      // Rotas de Cadastros - Agricultura
      {
        path: "cadastros/agricultura/cadastro1",
        element: (
          <ProtectedRoute requiredModule="agricultura" requiredAction="view">
            <CadastroAgricultura1 />
          </ProtectedRoute>
        ),
      },
      {
        path: "cadastros/agricultura/cadastro2",
        element: (
          <ProtectedRoute requiredModule="agricultura" requiredAction="view">
            <CadastroAgricultura2 />
          </ProtectedRoute>
        ),
      },
      {
        path: "cadastros/agricultura/cadastro3",
        element: (
          <ProtectedRoute requiredModule="agricultura" requiredAction="view">
            <CadastroAgricultura3 />
          </ProtectedRoute>
        ),
      },

      // Rotas de Cadastros - Comum
      {
        path: "cadastros/comum/cadastro1",
        element: (
          <ProtectedRoute requiredModule="comum" requiredAction="view">
            <CadastroComum1 />
          </ProtectedRoute>
        ),
      },
      {
        path: "cadastros/comum/cadastro2",
        element: (
          <ProtectedRoute requiredModule="comum" requiredAction="view">
            <CadastroComum2 />
          </ProtectedRoute>
        ),
      },
      {
        path: "cadastros/comum/cadastro3",
        element: (
          <ProtectedRoute requiredModule="comum" requiredAction="view">
            <CadastroComum3 />
          </ProtectedRoute>
        ),
      },

      // Rotas de Movimentos - Obras
      {
        path: "movimentos/obras/movimento1",
        element: (
          <ProtectedRoute requiredModule="obras" requiredAction="view">
            <MovimentoObras1 />
          </ProtectedRoute>
        ),
      },
      {
        path: "movimentos/obras/movimento2",
        element: (
          <ProtectedRoute requiredModule="obras" requiredAction="view">
            <MovimentoObras2 />
          </ProtectedRoute>
        ),
      },
      {
        path: "movimentos/obras/movimento3",
        element: (
          <ProtectedRoute requiredModule="obras" requiredAction="view">
            <MovimentoObras3 />
          </ProtectedRoute>
        ),
      },

      // Rotas de Movimentos - Agricultura
      {
        path: "movimentos/agricultura/movimento1",
        element: (
          <ProtectedRoute requiredModule="agricultura" requiredAction="view">
            <MovimentoAgricultura1 />
          </ProtectedRoute>
        ),
      },
      {
        path: "movimentos/agricultura/movimento2",
        element: (
          <ProtectedRoute requiredModule="agricultura" requiredAction="view">
            <MovimentoAgricultura2 />
          </ProtectedRoute>
        ),
      },
      {
        path: "movimentos/agricultura/movimento3",
        element: (
          <ProtectedRoute requiredModule="agricultura" requiredAction="view">
            <MovimentoAgricultura3 />
          </ProtectedRoute>
        ),
      },

      // Rotas de Movimentos - Comum
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
    ],
  },
  {
    path: "*",
    element: <Navigate to="/not-found" replace />,
  },
]);

export default router;
