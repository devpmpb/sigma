/**
 * Hook para gerenciar funcionalidades PWA
 */

import { useState, useEffect, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  isOnline,
  onConnectionChange,
  countPendingOperations,
} from "./offlineStorage";
import { startAutoSync, syncPendingOperations } from "./syncManager";

interface PWAStatus {
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isOfflineReady: boolean;
  pendingOperations: number;
  needsRefresh: boolean;
}

interface UsePWAReturn {
  status: PWAStatus;
  updateApp: () => void;
  syncNow: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

export function usePWA(): UsePWAReturn {
  const [status, setStatus] = useState<PWAStatus>({
    isOnline: isOnline(),
    isUpdateAvailable: false,
    isOfflineReady: false,
    pendingOperations: 0,
    needsRefresh: false,
  });

  // Registro do Service Worker
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log("📱 Service Worker registrado:", swUrl);

      // Verificar atualizações periodicamente
      if (registration) {
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000
        ); // A cada hora
      }
    },
    onRegisterError(error) {
      console.error("❌ Erro ao registrar Service Worker:", error);
    },
  });

  // Atualizar status quando offline ready
  useEffect(() => {
    setStatus((prev) => ({
      ...prev,
      isOfflineReady: offlineReady,
      needsRefresh: needRefresh,
    }));

    if (offlineReady) {
      console.log("✅ Aplicação pronta para uso offline");
    }
  }, [offlineReady, needRefresh]);

  // Monitorar status de conexão
  useEffect(() => {
    const unsubscribe = onConnectionChange((online) => {
      console.log(online ? "🌐 Online" : "📴 Offline");
      setStatus((prev) => ({ ...prev, isOnline: online }));
    });

    return unsubscribe;
  }, []);

  // Iniciar auto-sync
  useEffect(() => {
    const stopAutoSync = startAutoSync();
    return stopAutoSync;
  }, []);

  // Atualizar contagem de operações pendentes
  const refreshPendingCount = useCallback(async () => {
    const count = await countPendingOperations();
    setStatus((prev) => ({ ...prev, pendingOperations: count }));
  }, []);

  // Atualizar contagem periodicamente
  useEffect(() => {
    refreshPendingCount();

    const intervalId = setInterval(refreshPendingCount, 30000); // A cada 30s
    return () => clearInterval(intervalId);
  }, [refreshPendingCount]);

  // Forçar atualização do app
  const updateApp = useCallback(() => {
    updateServiceWorker(true);
    setNeedRefresh(false);
  }, [updateServiceWorker, setNeedRefresh]);

  // Forçar sincronização
  const syncNow = useCallback(async () => {
    await syncPendingOperations();
    await refreshPendingCount();
  }, [refreshPendingCount]);

  return {
    status,
    updateApp,
    syncNow,
    refreshPendingCount,
  };
}
