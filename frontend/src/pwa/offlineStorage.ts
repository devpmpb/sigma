/**
 * Módulo de armazenamento offline usando IndexedDB
 * Gerencia cache local de dados para funcionamento offline
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

// Tipos para o dashboard
export interface EstatisticasGerais {
  totalInvestido: number;
  totalSolicitacoes: number;
  produtoresAtendidos: number;
  mediaPorProdutor: number;
  ultimaAtualizacao: string;
}

export interface EstatisticaPrograma {
  programaId: number;
  programaNome: string;
  totalSolicitacoes: number;
  totalAprovado: number;
  totalPago: number;
  valorTotal: number;
}

export interface EstatisticaPeriodo {
  ano: number;
  mes: number;
  totalSolicitacoes: number;
  valorTotal: number;
}

export interface TopProdutor {
  pessoaId: number;
  pessoaNome: string;
  totalSolicitacoes: number;
  valorTotal: number;
}

// Schema do IndexedDB
interface SigmaDB extends DBSchema {
  dashboardCache: {
    key: string;
    value: {
      id: string;
      data: unknown;
      timestamp: number;
    };
  };
  pendingOperations: {
    key: string;
    value: {
      id: string;
      type: "solicitacao" | "hora_maquina";
      data: unknown;
      createdAt: number;
      status: "pending" | "syncing" | "failed";
      retryCount: number;
    };
    indexes: { "by-status": string; "by-type": string };
  };
  syncLog: {
    key: string;
    value: {
      id: string;
      operationId: string;
      action: "created" | "synced" | "failed";
      timestamp: number;
      error?: string;
    };
  };
}

const DB_NAME = "sigma-offline-db";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<SigmaDB> | null = null;

/**
 * Inicializa e retorna a instância do banco de dados
 */
export async function getDB(): Promise<IDBPDatabase<SigmaDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SigmaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store para cache do dashboard
      if (!db.objectStoreNames.contains("dashboardCache")) {
        db.createObjectStore("dashboardCache", { keyPath: "id" });
      }

      // Store para operações pendentes (sync offline)
      if (!db.objectStoreNames.contains("pendingOperations")) {
        const pendingStore = db.createObjectStore("pendingOperations", {
          keyPath: "id",
        });
        pendingStore.createIndex("by-status", "status");
        pendingStore.createIndex("by-type", "type");
      }

      // Store para log de sincronização
      if (!db.objectStoreNames.contains("syncLog")) {
        db.createObjectStore("syncLog", { keyPath: "id" });
      }
    },
  });

  return dbInstance;
}

// ========== DASHBOARD CACHE ==========

const CACHE_KEYS = {
  ESTATISTICAS_GERAIS: "estatisticas-gerais",
  POR_PROGRAMA: "por-programa",
  POR_PERIODO: "por-periodo",
  TOP_PRODUTORES: "top-produtores",
} as const;

// Tempo de expiração do cache em ms (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Salva dados do dashboard no cache local
 */
export async function cacheDashboardData<T>(
  key: keyof typeof CACHE_KEYS,
  data: T
): Promise<void> {
  const db = await getDB();
  await db.put("dashboardCache", {
    id: CACHE_KEYS[key],
    data,
    timestamp: Date.now(),
  });
}

/**
 * Recupera dados do dashboard do cache local
 * Retorna null se não existir ou estiver expirado
 */
export async function getCachedDashboardData<T>(
  key: keyof typeof CACHE_KEYS
): Promise<T | null> {
  const db = await getDB();
  const cached = await db.get("dashboardCache", CACHE_KEYS[key]);

  if (!cached) return null;

  // Verificar se expirou
  const isExpired = Date.now() - cached.timestamp > CACHE_EXPIRATION;
  if (isExpired) {
    // Retorna dados expirados mesmo assim (para fallback offline)
    console.log("📦 Cache expirado, retornando dados antigos:", key);
  }

  return cached.data as T;
}

/**
 * Verifica se o cache está válido (não expirado)
 */
export async function isCacheValid(
  key: keyof typeof CACHE_KEYS
): Promise<boolean> {
  const db = await getDB();
  const cached = await db.get("dashboardCache", CACHE_KEYS[key]);

  if (!cached) return false;

  return Date.now() - cached.timestamp <= CACHE_EXPIRATION;
}

/**
 * Limpa todo o cache do dashboard
 */
export async function clearDashboardCache(): Promise<void> {
  const db = await getDB();
  await db.clear("dashboardCache");
}

// ========== OPERAÇÕES OFFLINE ==========

/**
 * Adiciona uma operação à fila de sincronização
 */
export async function addPendingOperation(
  type: "solicitacao" | "hora_maquina",
  data: unknown
): Promise<string> {
  const db = await getDB();
  const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db.add("pendingOperations", {
    id,
    type,
    data,
    createdAt: Date.now(),
    status: "pending",
    retryCount: 0,
  });

  // Registrar no log
  await db.add("syncLog", {
    id: `log-${Date.now()}`,
    operationId: id,
    action: "created",
    timestamp: Date.now(),
  });

  console.log("📥 Operação adicionada à fila offline:", id);
  return id;
}

/**
 * Obtém todas as operações pendentes
 */
export async function getPendingOperations(): Promise<
  SigmaDB["pendingOperations"]["value"][]
> {
  const db = await getDB();
  return await db.getAllFromIndex("pendingOperations", "by-status", "pending");
}

/**
 * Atualiza o status de uma operação
 */
export async function updateOperationStatus(
  id: string,
  status: "pending" | "syncing" | "failed",
  error?: string
): Promise<void> {
  const db = await getDB();
  const operation = await db.get("pendingOperations", id);

  if (operation) {
    operation.status = status;
    if (status === "failed") {
      operation.retryCount += 1;
    }
    await db.put("pendingOperations", operation);

    // Registrar no log
    await db.add("syncLog", {
      id: `log-${Date.now()}`,
      operationId: id,
      action: status === "failed" ? "failed" : "synced",
      timestamp: Date.now(),
      error,
    });
  }
}

/**
 * Remove uma operação da fila (após sincronização bem-sucedida)
 */
export async function removeOperation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("pendingOperations", id);
  console.log("✅ Operação removida da fila:", id);
}

/**
 * Conta operações pendentes
 */
export async function countPendingOperations(): Promise<number> {
  const db = await getDB();
  const pending = await db.getAllFromIndex(
    "pendingOperations",
    "by-status",
    "pending"
  );
  return pending.length;
}

// ========== STATUS DE CONEXÃO ==========

/**
 * Verifica se está online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listener para mudanças de conexão
 */
export function onConnectionChange(
  callback: (online: boolean) => void
): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
