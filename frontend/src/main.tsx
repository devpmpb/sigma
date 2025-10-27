import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { RouterProvider } from "./router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Configurar o QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Componente para mostrar o carregamento de componentes lazy
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      <p className="mt-2 text-gray-600">Carregando...</p>
    </div>
  </div>
);

// Inicializando aplicação
console.log("Inicializando aplicação com Tailwind CSS e TanStack Router");
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <RouterProvider />
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);