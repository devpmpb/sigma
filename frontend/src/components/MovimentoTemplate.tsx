import React from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp, ArrowDown, BarChart } from "lucide-react";

interface MovimentoTemplateProps {
  title: string;
  sector: string;
  movimentoType: string;
}

const MovimentoTemplate: React.FC<MovimentoTemplateProps> = ({
  title,
  sector,
  movimentoType,
}) => {
  const location = useLocation();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="text-sm breadcrumbs">
          <ul className="flex">
            <li className="text-gray-500">Início</li>
            <li className="before:content-['>'] before:mx-2 text-gray-500">
              Movimentos
            </li>
            <li className="before:content-['>'] before:mx-2 text-gray-500">
              {sector}
            </li>
            <li className="before:content-['>'] before:mx-2 text-gray-700">
              {movimentoType}
            </li>
          </ul>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="p-3 rounded-full bg-green-100 mr-4">
            <ArrowUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Entradas</div>
            <div className="text-xl font-bold">R$ 12.450,00</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="p-3 rounded-full bg-red-100 mr-4">
            <ArrowDown className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Saídas</div>
            <div className="text-xl font-bold">R$ 8.230,00</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="p-3 rounded-full bg-blue-100 mr-4">
            <BarChart className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Saldo</div>
            <div className="text-xl font-bold">R$ 4.220,00</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Detalhes do Movimento</h2>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Novo
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
              Filtrar
            </button>
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          Esta é a página de {title} para o setor de {sector}.
        </p>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            Caminho atual: <code>{location.pathname}</code>
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium mb-4">Histórico de Movimentos</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">Descrição</th>
                <th className="py-3 px-6 text-left">Data</th>
                <th className="py-3 px-6 text-right">Valor</th>
                <th className="py-3 px-6 text-left">Tipo</th>
                <th className="py-3 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {[1, 2, 3, 4, 5].map((num) => (
                <tr
                  key={num}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-6 text-left">
                    M-{num}00{num}
                  </td>
                  <td className="py-3 px-6 text-left">Movimento {num}</td>
                  <td className="py-3 px-6 text-left">01/0{num}/2025</td>
                  <td className="py-3 px-6 text-right font-medium">
                    <span
                      className={
                        num % 2 === 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {num % 2 === 0 ? "+" : "-"}R${" "}
                      {(num * 1000).toFixed(2).replace(".", ",")}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        num % 2 === 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {num % 2 === 0 ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex item-center justify-end">
                      <button className="w-4 transform hover:text-blue-500 hover:scale-110 mr-3">
                        Detalhes
                      </button>
                      <button className="w-4 transform hover:text-purple-500 hover:scale-110">
                        Imprimir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MovimentoTemplate;
