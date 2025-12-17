/**
 * Gerenciador de sincronização offline
 * Processa a fila de operações pendentes quando online
 */

import {
  getPendingOperations,
  updateOperationStatus,
  removeOperation,
  isOnline,
  onConnectionChange,
} from "./offlineStorage";
import axios from "axios";

// Flag para evitar múltiplas sincronizações simultâneas
let isSyncing = false;

// Configuração de retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 segundos

/**
 * Mapeia tipos de operação para endpoints de API
 */
const OPERATION_ENDPOINTS: Record<string, string> = {
  solicitacao: "/api/comum/solicitacoes-beneficio",
  hora_maquina: "/api/obras/horas-maquina",
};

/**
 * Processa uma única operação pendente
 */
async function processOperation(
  operation: Awaited<ReturnType<typeof getPendingOperations>>[0]
): Promise<boolean> {
  const endpoint = OPERATION_ENDPOINTS[operation.type];

  if (!endpoint) {
    console.error("❌ Tipo de operação desconhecido:", operation.type);
    return false;
  }

  try {
    await updateOperationStatus(operation.id, "syncing");

    // Enviar para o servidor
    const response = await axios.post(endpoint, operation.data);

    if (response.status >= 200 && response.status < 300) {
      console.log("✅ Operação sincronizada:", operation.id);
      await removeOperation(operation.id);
      return true;
    }

    throw new Error(`Status inesperado: ${response.status}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ Erro ao sincronizar operação:", operation.id, errorMessage);

    // Verificar se deve tentar novamente
    if (operation.retryCount < MAX_RETRIES) {
      await updateOperationStatus(operation.id, "pending", errorMessage);
    } else {
      await updateOperationStatus(operation.id, "failed", errorMessage);
      console.warn(
        "⚠️ Operação falhou após máximo de tentativas:",
        operation.id
      );
    }

    return false;
  }
}

/**
 * Sincroniza todas as operações pendentes
 */
export async function syncPendingOperations(): Promise<{
  synced: number;
  failed: number;
}> {
  if (isSyncing) {
    console.log("🔄 Sincronização já em andamento...");
    return { synced: 0, failed: 0 };
  }

  if (!isOnline()) {
    console.log("📴 Offline - sincronização adiada");
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const operations = await getPendingOperations();

    if (operations.length === 0) {
      console.log("✨ Nenhuma operação pendente");
      return { synced: 0, failed: 0 };
    }

    console.log(`🔄 Sincronizando ${operations.length} operações...`);

    for (const operation of operations) {
      const success = await processOperation(operation);
      if (success) {
        synced++;
      } else {
        failed++;
      }

      // Pequeno delay entre operações para não sobrecarregar
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Sincronização concluída: ${synced} ok, ${failed} falhas`);
    return { synced, failed };
  } finally {
    isSyncing = false;
  }
}

/**
 * Inicia o monitoramento automático de conexão para sincronização
 */
export function startAutoSync(): () => void {
  console.log("🚀 Auto-sync iniciado");

  // Sincronizar imediatamente se online
  if (isOnline()) {
    syncPendingOperations();
  }

  // Sincronizar quando voltar online
  const unsubscribe = onConnectionChange((online) => {
    if (online) {
      console.log("🌐 Conexão restaurada - iniciando sincronização");
      // Pequeno delay para garantir que a conexão está estável
      setTimeout(() => syncPendingOperations(), 1000);
    } else {
      console.log("📴 Conexão perdida - operações serão enfileiradas");
    }
  });

  // Sincronização periódica (a cada 5 minutos)
  const intervalId = setInterval(
    () => {
      if (isOnline()) {
        syncPendingOperations();
      }
    },
    5 * 60 * 1000
  );

  // Retorna função de cleanup
  return () => {
    unsubscribe();
    clearInterval(intervalId);
    console.log("🛑 Auto-sync parado");
  };
}

/**
 * Força retry de operações que falharam
 */
export async function retryFailedOperations(): Promise<void> {
  // Aqui implementaria a lógica de retry manual
  console.log("🔄 Retry manual não implementado ainda");
}
