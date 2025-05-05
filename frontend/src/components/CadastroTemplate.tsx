import React from "react";
import { useLocation } from "react-router-dom";

interface CadastroTemplateProps {
  title: string;
  sector: string;
  cadastroType: string;
}

const CadastroTemplate: React.FC<CadastroTemplateProps> = ({
  title,
  sector,
  cadastroType,
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
              Cadastros
            </li>
            <li className="before:content-['>'] before:mx-2 text-gray-500">
              {sector}
            </li>
            <li className="before:content-['>'] before:mx-2 text-gray-700">
              {cadastroType}
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Detalhes do Cadastro</h2>
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
        <h2 className="text-lg font-medium mb-4">Lista de Itens</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">Nome</th>
                <th className="py-3 px-6 text-left">Data</th>
                <th className="py-3 px-6 text-left">Status</th>
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
                    {num}00{num}
                  </td>
                  <td className="py-3 px-6 text-left">Item {num}</td>
                  <td className="py-3 px-6 text-left">01/0{num}/2025</td>
                  <td className="py-3 px-6 text-left">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        num % 2 === 0
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {num % 2 === 0 ? "Ativo" : "Pendente"}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex item-center justify-end">
                      <button className="w-4 transform hover:text-blue-500 hover:scale-110 mr-3">
                        Editar
                      </button>
                      <button className="w-4 transform hover:text-red-500 hover:scale-110">
                        Excluir
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

export default CadastroTemplate;
