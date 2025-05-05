import React, { useState } from "react";
import { Search, FileText, Download, Filter } from "lucide-react";

const Relatorios: React.FC = () => {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todos");

  // Lista de categorias fictícias para demonstração
  const categorias = [
    { id: "todos", nome: "Todos" },
    { id: "financeiros", nome: "Financeiros" },
    { id: "operacionais", nome: "Operacionais" },
    { id: "comercial", nome: "Comercial" },
  ];

  // Lista de relatórios fictícios para demonstração
  const relatorios = [
    {
      id: 1,
      titulo: "Relatório de Vendas",
      categoria: "comercial",
      descricao: "Vendas por período e vendedor",
    },
    {
      id: 2,
      titulo: "Relatório Financeiro",
      categoria: "financeiros",
      descricao: "Demonstrativo financeiro mensal",
    },
    {
      id: 3,
      titulo: "Relatório de Estoque",
      categoria: "operacionais",
      descricao: "Situação atual do estoque",
    },
    {
      id: 4,
      titulo: "Relatório de Clientes",
      categoria: "comercial",
      descricao: "Lista de clientes ativos",
    },
    {
      id: 5,
      titulo: "Fluxo de Caixa",
      categoria: "financeiros",
      descricao: "Entradas e saídas por período",
    },
    {
      id: 6,
      titulo: "Relatório de Produção",
      categoria: "operacionais",
      descricao: "Produtividade por linha",
    },
    {
      id: 7,
      titulo: "Comissões",
      categoria: "financeiros",
      descricao: "Comissões por vendedor",
    },
    {
      id: 8,
      titulo: "Relatório de Devoluções",
      categoria: "comercial",
      descricao: "Devoluções e trocas",
    },
  ];

  // Filtrar relatórios por categoria selecionada
  const relatoriosFiltrados =
    categoriaSelecionada === "todos"
      ? relatorios
      : relatorios.filter((rel) => rel.categoria === categoriaSelecionada);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="text-sm breadcrumbs">
          <ul className="flex">
            <li className="text-gray-500">Início</li>
            <li className="before:content-['>'] before:mx-2 text-gray-700">
              Relatórios
            </li>
          </ul>
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              placeholder="Buscar relatórios..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search size={18} />
            </div>
          </div>

          <div className="flex items-center">
            <Filter size={18} className="mr-2 text-gray-500" />
            <span className="mr-2 text-gray-700">Filtrar:</span>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs de categorias */}
      <div className="flex border-b border-gray-200 mb-6">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            className={`px-4 py-2 font-medium ${
              categoriaSelecionada === cat.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setCategoriaSelecionada(cat.id)}
          >
            {cat.nome}
          </button>
        ))}
      </div>

      {/* Grid de relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatoriosFiltrados.map((relatorio) => (
          <div
            key={relatorio.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md mr-3">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <h3 className="font-medium">{relatorio.titulo}</h3>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {relatorio.descricao}
              </p>
              <div className="mt-4 flex justify-end">
                <button className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                  <Download size={16} className="mr-1" />
                  Gerar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seção de relatórios favoritos */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Relatórios Favoritos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-md mr-3">
                <FileText size={18} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Vendas Diárias</h3>
                <p className="text-xs text-gray-500">Atualizado hoje</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md mr-3">
                <FileText size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Fluxo de Caixa</h3>
                <p className="text-xs text-gray-500">Atualizado hoje</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
