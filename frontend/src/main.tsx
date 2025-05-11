import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import router from "./config/routes"; // Importando do novo local
import { AuthProvider } from "./context/AuthContext";

// Inicialização da aplicação
console.log("Inicializando aplicação com Tailwind CSS");
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);