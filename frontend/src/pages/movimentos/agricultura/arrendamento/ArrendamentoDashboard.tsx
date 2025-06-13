import React, { useState, useEffect } from "react";
import arrendamentoService, { 
  Arrendamento, 
  StatusArrendamento 
} from "../../../../services/agricultura/arrendamentoService";

interface ArrendamentoStats {
  total: number;
  ativos: number;
  vencidos: number;
  proximoVencimento: number;
  areaTotal: number;
  contratos: {
    indeterminados: number;
    temporarios: number;
  };
}

/**
 * Dashboard com resumo executivo dos arrendamentos
 * Mostra estatísticas e alertas importantes
 */
const ArrendamentoDashboard: React.FC = () => {
  const [stats, setStats] = useState<ArrendamentoStats>({
    total: 0,
    ativos: 0,
    vencidos: 0,
    proximoVencimento: 0,
    areaTotal: 0,
    contratos: {
      indeterminados: 0,
      temporarios: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar estatísticas
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        // Buscar todos os arrendamentos com detalhes
        const arrendamentos = await arrendamentoService.getAll();
        
        // Calcular estatísticas
        const stats: ArrendamentoStats = {
          total: arrendamentos.length,
          ativos: 0,
          vencidos: 0,
          proximoVencimento: 0,
          areaTotal: 0,
          contratos: {
            indeterminados: 0,
            temporarios: 0,
          },
        };

        arrendamentos.forEach((arr) => {
          // Área total
          stats.areaTotal += Number(arr.areaArrendada);

          // Status
          if (arr.status === StatusArrendamento.ATIVO) {
            stats.ativos++;
          }

          // Verificar vencimento
          if (arrendamentoService.isVencido(arr)) {
            stats.vencidos++;
          } else if (arrendamentoService.isProximoVencimento(arr)) {
            stats.proximoVencimento++;
          }

          // Tipo de contrato
          if (arr.dataFim) {
            stats.contratos.temporarios++;
          } else {
            stats.contratos.indeterminados++;
          }
        });

        setStats(stats);
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
        setError("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Arrendamentos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-blue-600">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-xs text-blue-500">Arrendamentos</p>
            </div>
          </div>
        </div>

        {/* Arrendamentos Ativos */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">✅</div>
            <div>
              <p className="text-sm font-medium text-green-600">Ativos</p>
              <p className="text-2xl font-bold text-green-900">{stats.ativos}</p>
              <p className="text-xs text-green-500">
                {stats.total > 0 ? `${((stats.ativos / stats.total) * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>

        {/* Arrendamentos Vencidos */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 text-2xl mr-3">⚠️</div>
            <div>
              <p className="text-sm font-medium text-red-600">Vencidos</p>
              <p className="text-2xl font-bold text-red-900">{stats.vencidos}</p>
              <p className="text-xs text-red-500">Requerem atenção</p>
            </div>
          </div>
        </div>

        {/* Área Total */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🏞️</div>
            <div>
              <p className="text-sm font-medium text-purple-600">Área Total</p>
              <p className="text-2xl font-bold text-purple-900">
                {stats.areaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
              </p>
              <p className="text-xs text-purple-500">Hectares</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas e Notificações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas de Vencimento */}
        <div className="bg-white rounded-lg shadow border">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Alertas</h3>
          </div>
          <div className="p-4 space-y-3">
            {/* Vencidos */}
            {stats.vencidos > 0 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-red-600 mr-3">🚨</div>
                <div>
                  <p className="font-medium text-red-900">
                    {stats.vencidos} arrendamento(s) vencido(s)
                  </p>
                  <p className="text-sm text-red-600">
                    Verificar situação e renovar ou finalizar
                  </p>
                </div>
              </div>
            )}

            {/* Próximos do vencimento */}
            {stats.proximoVencimento > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-yellow-600 mr-3">⚠️</div>
                <div>
                  <p className="font-medium text-yellow-900">
                    {stats.proximoVencimento} vencem em até 30 dias
                  </p>
                  <p className="text-sm text-yellow-600">
                    Planejar renovações ou finalizações
                  </p>
                </div>
              </div>
            )}

            {/* Sem alertas */}
            {stats.vencidos === 0 && stats.proximoVencimento === 0 && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded">
                <div className="text-green-600 mr-3">✅</div>
                <div>
                  <p className="font-medium text-green-900">
                    Nenhum alerta no momento
                  </p>
                  <p className="text-sm text-green-600">
                    Todos os arrendamentos estão em dia
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumo por Tipo de Contrato */}
        <div className="bg-white rounded-lg shadow border">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tipos de Contrato</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {/* Contratos Temporários */}
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Prazo Determinado</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{stats.contratos.temporarios}</span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({stats.total > 0 ? `${((stats.contratos.temporarios / stats.total) * 100).toFixed(1)}%` : '0%'})
                  </span>
                </div>
              </div>

              {/* Contratos Indeterminados */}
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Prazo Indeterminado</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{stats.contratos.indeterminados}</span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({stats.total > 0 ? `${((stats.contratos.indeterminados / stats.total) * 100).toFixed(1)}%` : '0%'})
                  </span>
                </div>
              </div>
            </div>

            {/* Gráfico simples com barras */}
            <div className="mt-4 space-y-2">
              <div className="text-xs text-gray-500 mb-1">Distribuição</div>
              
              {/* Barra para temporários */}
              <div className="flex items-center">
                <div className="w-16 text-xs text-gray-500">Temp.</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: stats.total > 0 ? `${(stats.contratos.temporarios / stats.total) * 100}%` : '0%' 
                    }}
                  ></div>
                </div>
                <div className="w-8 text-xs text-gray-500 text-right">
                  {stats.contratos.temporarios}
                </div>
              </div>

              {/* Barra para indeterminados */}
              <div className="flex items-center">
                <div className="w-16 text-xs text-gray-500">Indet.</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: stats.total > 0 ? `${(stats.contratos.indeterminados / stats.total) * 100}%` : '0%' 
                    }}
                  ></div>
                </div>
                <div className="w-8 text-xs text-gray-500 text-right">
                  {stats.contratos.indeterminados}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/movimentos/arrendamentos/novo'}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">➕</div>
                <p className="text-sm font-medium text-gray-700">Novo Arrendamento</p>
              </div>
            </button>

            <button 
              onClick={async () => {
                try {
                  const vencidos = await arrendamentoService.getArrendamentosVencidos();
                  if (vencidos.length > 0) {
                    // Redirecionar para listagem filtrada ou mostrar detalhes
                    alert(`${vencidos.length} arrendamento(s) vencido(s) encontrado(s)`);
                  } else {
                    alert("Nenhum arrendamento vencido");
                  }
                } catch (error) {
                  alert("Erro ao verificar vencimentos");
                }
              }}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📅</div>
                <p className="text-sm font-medium text-gray-700">Verificar Vencimentos</p>
              </div>
            </button>

            <button 
              onClick={() => window.location.href = '/relatorios/arrendamentos'}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-sm font-medium text-gray-700">Relatórios</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrendamentoDashboard;