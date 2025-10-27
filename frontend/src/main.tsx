import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { RouterProvider } from "./router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Configurar o QueryClient com retry inteligente e error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache e refetch
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados "frescos"
      gcTime: 10 * 60 * 1000, // 10 minutos - tempo no cache após inativo (antes era cacheTime)
      refetchOnWindowFocus: false, // Não refetch ao voltar pra aba
      refetchOnReconnect: true, // Refetch ao reconectar internet

      // Retry inteligente
      retry: (failureCount, error: any) => {
        // Não retry em erros 4xx (cliente)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry até 3 vezes em erros 5xx (servidor) ou network
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      // Retry para mutations (create, update, delete)
      retry: (failureCount, error: any) => {
        // Não retry em conflitos ou validações
        if (error?.response?.status === 409 || error?.response?.status === 422) {
          return false;
        }
        // Retry apenas 1 vez em erros de rede
        return failureCount < 1;
      },
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
      {/* DevTools - só aparece em desenvolvimento */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);