// frontend/src/pages/movimentos/agricultura/SolicitacoesBeneficio.tsx
import React from "react";

/**
 * Página de Solicitações de Benefício
 * Placeholder para futuro desenvolvimento
 */
const SolicitacoesBeneficio: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Solicitações de Benefício</h1>
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
                Solicitações de Benefício
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-blue-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Módulo em Desenvolvimento
          </h3>
          
          <p className="text-blue-700 mb-4">
            Esta funcionalidade permitirá gerenciar solicitações de benefícios dos produtores rurais,
            incluindo análise de elegibilidade baseada nas regras de negócio configuradas.
          </p>

          <div className="text-sm text-blue-600 space-y-1">
            <p><strong>Funcionalidades planejadas:</strong></p>
            <ul className="list-disc list-inside text-left max-w-md mx-auto">
              <li>Registro de solicitações por produtor</li>
              <li>Upload de documentos comprobatórios</li>
              <li>Validação automática contra regras configuradas</li>
              <li>Workflow de aprovação com níveis</li>
              <li>Notificações automáticas</li>
              <li>Histórico completo de solicitações</li>
              <li>Relatórios de benefícios concedidos</li>
              <li>Dashboard de acompanhamento</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-2">🎯 Integração com Sistema Atual</h4>
            <p className="text-sm text-blue-700">
              Este módulo utilizará os <strong>Programas</strong> e <strong>Regras de Negócio</strong> já configurados
              para validar automaticamente a elegibilidade dos produtores, calculando valores e limites
              de acordo com as leis municipais.
            </p>
          </div>
        </div>

        {/* Mockup de como seria a interface */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Preview da Interface Futura
          </h3>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-medium">Solicitações Pendentes</h4>
                <p className="text-sm text-gray-600">23 solicitações aguardando análise</p>
              </div>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md opacity-50 cursor-not-allowed"
                disabled
              >
                Nova Solicitação
              </button>
            </div>
            
            <div className="space-y-2">
              {[
                { produtor: "João Silva", programa: "Grão de Aveia", valor: "R$ 360,00", status: "Pendente" },
                { produtor: "Maria Santos", programa: "Adubo Orgânico", valor: "R$ 420,00", status: "Em Análise" },
                { produtor: "Pedro Oliveira", programa: "Grão de Aveia", valor: "R$ 315,00", status: "Aprovada" },
              ].map((item, index) => (
                <div key={index} className="bg-white p-3 rounded border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.produtor}</span>
                      <span className="text-sm text-gray-600 ml-2">• {item.programa}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-green-600">{item.valor}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'Em Análise' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolicitacoesBeneficio;