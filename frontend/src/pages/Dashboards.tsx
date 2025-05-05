import React from "react";
import { BarChart2, PieChart, LineChart, TrendingUp } from "lucide-react";

const Dashboards: React.FC = () => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboards</h1>
        <div className="text-sm breadcrumbs">
          <ul className="flex">
            <li className="text-gray-500">Início</li>
            <li className="before:content-['>'] before:mx-2 text-gray-700">
              Dashboards
            </li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dashboard Setor 1 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Dashboard Setor 1</h2>
              <BarChart2 size={24} className="text-blue-600" />
            </div>
            <p className="text-gray-600 mb-4">
              Visualização dos principais indicadores do Setor 1.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Indicador 1</div>
                <div className="text-xl font-semibold">85%</div>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Indicador 2</div>
                <div className="text-xl font-semibold">R$ 12.450</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Indicador 3</div>
                <div className="text-xl font-semibold">24 un.</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Indicador 4</div>
                <div className="text-xl font-semibold">32%</div>
              </div>
            </div>
            <button className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors">
              Visualizar Dashboard Completo
            </button>
          </div>
        </div>

        {/* Dashboard Setor 2 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Dashboard Setor 2</h2>
              <PieChart size={24} className="text-purple-600" />
            </div>
            <p className="text-gray-600 mb-4">
              Visualização dos principais indicadores do Setor 2.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-3 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Indicador 1</div>
                <div className="text-xl font-semibold">92%</div>
              </div>
              <div className="bg-red-50 p-3 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Indicador 2</div>
                <div className="text-xl font-semibold">R$ 8.720</div>
              </div>
              <div className="bg-pink-50 p-3 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Indicador 3</div>
                <div className="text-xl font-semibold">18 un.</div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Indicador 4</div>
                <div className="text-xl font-semibold">47%</div>
              </div>
            </div>
            <button className="mt-4 w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition-colors">
              Visualizar Dashboard Completo
            </button>
          </div>
        </div>

        {/* Dashboard Comparativo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Dashboard Comparativo</h2>
              <LineChart size={24} className="text-green-600" />
            </div>
            <p className="text-gray-600 mb-4">
              Comparativo entre os indicadores dos setores.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Desempenho</div>
                    <div className="text-xl font-semibold">+12% MoM</div>
                  </div>
                  <TrendingUp size={24} className="text-green-500" />
                </div>
              </div>
            </div>
            <button className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors">
              Visualizar Dashboard Completo
            </button>
          </div>
        </div>

        {/* Dashboard Geral */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Dashboard Geral</h2>
              <BarChart2 size={24} className="text-orange-600" />
            </div>
            <p className="text-gray-600 mb-4">
              Visão geral de todos os indicadores do sistema.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-orange-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Performance Geral
                    </div>
                    <div className="text-xl font-semibold">87.5%</div>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: "87.5%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors">
              Visualizar Dashboard Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboards;
