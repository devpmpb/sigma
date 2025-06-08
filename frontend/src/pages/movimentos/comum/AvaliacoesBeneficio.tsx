// frontend/src/pages/movimentos/agricultura/AvaliacoesBeneficio.tsx
import React from "react";

/**
 * Página de Avaliação de Benefícios
 * Placeholder para futuro desenvolvimento
 */
const AvaliacoesBeneficio: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Avaliação de Benefícios</h1>
          <div className="text-sm breadcrumbs">
            <ul className="flex">
              <li className="text-gray-500">Início</li>
              <li className="before:content-['>'] before:mx-2 text-gray-500">
                Movimentos
              </li>
              <li className="before:content-['>'] before:mx-2 text-gray-500">
                Agricultura
              </li>
              <li className="before:content-['>'] before:mx-2 text-gray-700">
                Avaliação de Benefícios
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-yellow-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          
          <h3 className="text-lg font-medium text-yellow-900 mb-2">
            Dashboard de Avaliações Técnicas
          </h3>
          
          <p className="text-yellow-700 mb-4">
            Esta área será dedicada à avaliação técnica das solicitações de benefícios,
            com ferramentas especializadas para análise e tomada de decisão pelos técnicos da secretaria.
          </p>

          <div className="text-sm text-yellow-600 space-y-1">
            <p><strong>Funcionalidades planejadas:</strong></p>
            <ul className="list-disc list-inside text-left max-w-md mx-auto">
              <li>Fila de solicitações pendentes por prioridade</li>
              <li>Ferramentas de análise técnica integradas</li>
              <li>Calculadora automática de benefícios</li>
              <li>Validação de documentos obrigatórios</li>
              <li>Sistema de pareceres técnicos</li>
              <li>Histórico completo de avaliações</li>
              <li>Relatórios de produtividade da equipe</li>
              <li>Workflow de aprovação em níveis</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-yellow-100">
            <h4 className="font-medium text-yellow-900 mb-2">⚡ Automação Inteligente</h4>
            <p className="text-sm text-yellow-700">
              O sistema utilizará as <strong>Regras de Negócio</strong> configuradas para pré-validar
              automaticamente as solicitações, calculando valores e identificando possíveis
              inconsistências antes da análise técnica manual.
            </p>
          </div>
        </div>

        {/* Mockup do Dashboard de Avaliação */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Preview do Dashboard de Avaliação
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Cards de estatísticas */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="bg-blue-500 rounded-full p-2 mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-600">Pendentes</p>
                  <p className="text-2xl font-bold text-blue-900">23</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="bg-yellow-500 rounded-full p-2 mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-yellow-600">Em Análise</p>
                  <p className="text-2xl font-bold text-yellow-900">8</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="bg-green-500 rounded-full p-2 mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-600">Aprovadas Hoje</p>
                  <p className="text-2xl font-bold text-green-900">12</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de solicitações para avaliação */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">🔍 Próximas Avaliações</h4>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm opacity-50 cursor-not-allowed" disabled>
                  Filtrar
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm opacity-50 cursor-not-allowed" disabled>
                  Iniciar Avaliação
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { 
                  id: "#2024001", 
                  produtor: "João Silva", 
                  programa: "Grão de Aveia", 
                  area: "4.5 alq", 
                  valorSolicitado: "R$ 360,00",
                  prioridade: "Alta",
                  dias: "3 dias"
                },
                { 
                  id: "#2024002", 
                  produtor: "Maria Santos", 
                  programa: "Adubo Orgânico", 
                  area: "8.2 alq", 
                  valorSolicitado: "R$ 500,00",
                  prioridade: "Média",
                  dias: "5 dias"
                },
                { 
                  id: "#2024003", 
                  produtor: "Pedro Oliveira", 
                  programa: "Grão de Aveia", 
                  area: "2.8 alq", 
                  valorSolicitado: "R$ 224,00",
                  prioridade: "Baixa",
                  dias: "1 dia"
                },
              ].map((item, index) => (
                <div key={index} className="bg-white p-4 rounded border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="font-medium text-gray-900">{item.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.prioridade === 'Alta' ? 'bg-red-100 text-red-800' :
                          item.prioridade === 'Média' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.prioridade}
                        </span>
                        <span className="text-xs text-gray-500">há {item.dias}</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        <strong>{item.produtor}</strong> • {item.programa}
                      </p>
                      <p className="text-xs text-gray-500">
                        Área: {item.area} • Solicitado: {item.valorSolicitado}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm opacity-50 cursor-not-allowed" disabled>
                        Avaliar
                      </button>
                      <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm opacity-50 cursor-not-allowed" disabled>
                        Ver Docs
                      </button>
                    </div>
                  </div>
                  
                  {/* Validação automática simulada */}
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
                    <p className="text-xs text-blue-700">
                      <strong>✓ Validação Automática:</strong> Atende aos critérios do programa. 
                      Área elegível, documentos básicos OK. Valor calculado: {item.valorSolicitado}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ferramentas do avaliador */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🛠️ Ferramentas do Avaliador
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="bg-purple-100 rounded-full p-3 mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Calculadora</h4>
              <p className="text-sm text-gray-600">Benefícios e Limites</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="bg-green-100 rounded-full p-3 mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Validador</h4>
              <p className="text-sm text-gray-600">Documentos e Critérios</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="bg-blue-100 rounded-full p-3 mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Histórico</h4>
              <p className="text-sm text-gray-600">Produtor e Propriedade</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="bg-orange-100 rounded-full p-3 mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Parecer</h4>
              <p className="text-sm text-gray-600">Técnico e Justificativa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvaliacoesBeneficio;