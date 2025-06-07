// frontend/src/pages/movimentos/agricultura/RelatoriosBeneficio.tsx
import React from "react";

/**
 * Página de Relatórios de Benefícios
 * Placeholder para futuro desenvolvimento
 */
const RelatoriosBeneficio: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Relatórios de Benefícios</h1>
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
                Relatórios de Benefícios
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-green-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          
          <h3 className="text-lg font-medium text-green-900 mb-2">
            Central de Relatórios
          </h3>
          
          <p className="text-green-700 mb-4">
            Esta seção conterá diversos relatórios gerenciais e operacionais
            sobre os programas de incentivo e benefícios concedidos.
          </p>

          <div className="text-sm text-green-600 space-y-1">
            <p><strong>Relatórios planejados:</strong></p>
            <ul className="list-disc list-inside text-left max-w-md mx-auto">
              <li>Benefícios por programa</li>
              <li>Produtores beneficiados</li>
              <li>Valores investidos por período</li>
              <li>Efetividade dos programas</li>
              <li>Análise de impacto social</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosBeneficio;