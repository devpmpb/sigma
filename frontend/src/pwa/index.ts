// Exportações do módulo PWA

export { usePWA } from "./usePWA";
export { PWAStatus, PWAStatusCompact } from "./PWAStatus";
export {
  // Storage offline
  getDB,
  cacheDashboardData,
  getCachedDashboardData,
  isCacheValid,
  clearDashboardCache,
  // Operações pendentes
  addPendingOperation,
  getPendingOperations,
  updateOperationStatus,
  removeOperation,
  countPendingOperations,
  // Status de conexão
  isOnline,
  onConnectionChange,
  // Tipos
  type EstatisticasGerais,
  type EstatisticaPrograma,
  type EstatisticaPeriodo,
  type TopProdutor,
} from "./offlineStorage";
export {
  syncPendingOperations,
  startAutoSync,
  retryFailedOperations,
} from "./syncManager";
