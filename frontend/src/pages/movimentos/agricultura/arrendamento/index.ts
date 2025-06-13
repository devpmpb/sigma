export { default as ArrendamentosPage } from './ArrendamentosPage';
export { default as ArrendamentoForm } from './ArrendamentoForm';
export { default as ArrendamentoDashboard } from './ArrendamentoDashboard';

// Serviço
export { default as arrendamentoService } from '../../../../services/agricultura/arrendamentoService';
export type { 
  Arrendamento, 
  ArrendamentoDTO, 
  StatusArrendamentoType 
} from '../../../../services/agricultura/arrendamentoService';

// Re-exportar constantes úteis
export { StatusArrendamento } from '../../../../services/agricultura/arrendamentoService';
