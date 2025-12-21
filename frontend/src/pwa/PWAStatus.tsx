/**
 * Componente que mostra o status do PWA
 * - Indicador offline/online
 * - Botão de atualização quando disponível
 * - Contador de operações pendentes
 */

import { Wifi, WifiOff, RefreshCw, CloudOff, Check } from "lucide-react";
import { usePWA } from "./usePWA";

export function PWAStatus() {
  const { status, updateApp, syncNow } = usePWA();

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {/* Indicador de atualização disponível */}
      {status.needsRefresh && (
        <button
          onClick={updateApp}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm">Atualização disponível</span>
        </button>
      )}

      {/* Indicador de operações pendentes */}
      {status.pendingOperations > 0 && (
        <button
          onClick={syncNow}
          disabled={!status.isOnline}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors ${
            status.isOnline
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          <CloudOff className="h-4 w-4" />
          <span className="text-sm">
            {status.pendingOperations} pendente
            {status.pendingOperations > 1 ? "s" : ""}
          </span>
        </button>
      )}

      {/* Indicador de status online/offline */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg text-sm ${
          status.isOnline
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {status.isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Offline</span>
          </>
        )}

        {status.isOfflineReady && status.isOnline && (
          <Check
            className="h-4 w-4 text-green-600"
            aria-label="Pronto para offline"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Versão compacta para a barra de navegação
 */
export function PWAStatusCompact() {
  const { status, syncNow } = usePWA();

  if (status.isOnline && status.pendingOperations === 0) {
    return null; // Não mostrar nada se tudo ok
  }

  return (
    <div className="flex items-center gap-2">
      {!status.isOnline && (
        <span className="flex items-center gap-1 text-red-600 text-sm">
          <WifiOff className="h-4 w-4" />
          Offline
        </span>
      )}

      {status.pendingOperations > 0 && (
        <button
          onClick={syncNow}
          disabled={!status.isOnline}
          className="flex items-center gap-1 text-yellow-600 text-sm hover:text-yellow-700"
          title={
            status.isOnline
              ? "Clique para sincronizar"
              : "Aguardando conexão..."
          }
        >
          <CloudOff className="h-4 w-4" />
          {status.pendingOperations}
        </button>
      )}
    </div>
  );
}
