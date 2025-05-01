import { createBrowserRouter } from "react-router-dom";

import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Configuracoes from "./pages/Configutacoes";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Usuarios from "./pages/Usuarios";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "usuarios",
        element: <Usuarios />,
      },
      {
        path: "produtos",
        element: <Produtos />,
      },
      {
        path: "configuracoes",
        element: <Configuracoes />,
      },
    ],
  },
]);

export default router;
