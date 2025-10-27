import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, FileText, Filter, TrendingUp, Home, Users, Sprout, Building2, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";

const Relatorios: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todos");
  const [busca, setBusca] = useState("");

  // Lista de categorias
  const categorias = [
    { id: "todos", nome: "Todos" },
    { id: "comum", nome: "Comum" },
    { id: "agricultura", nome: "Agricultura" },
    { id: "obras", nome: "Obras" },
  ];

  // Lista de relatórios reais
  const relatorios = [
    // Relatórios de Benefícios (Comum)
    {
      id: "beneficios",
      titulo: "Relatórios de Benefícios",
      categoria: "comum",
      descricao: "Relatórios completos sobre programas de benefícios, produtores beneficiados, investimentos e secretarias",
      icone: DollarSign,
      cor: "blue",
      path: "/movimentos/comum/relatorioBeneficios",
      modulo: "comum" as const,
    },
    // Relatórios de Arrendamentos (Agricultura)
    {
      id: "arrendamentos",
      titulo: "Relatórios de Arrendamentos",
      categoria: "agricultura",
      descricao: "Visão geral, por propriedade, por arrendatário, por atividade produtiva e contratos vencendo",
      icone: Sprout,
      cor: "green",
      path: "/movimentos/agricultura/relatoriosArrendamento",
      modulo: "agricultura" as const,
    },
  ];

  // Filtrar relatórios por categoria e busca
  const relatoriosFiltrados = relatorios.filter((rel) => {
    const matchCategoria =
      categoriaSelecionada === "todos" || rel.categoria === categoriaSelecionada;
    const matchBusca =
      busca === "" ||
      rel.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      rel.descricao.toLowerCase().includes(busca.toLowerCase());
    const hasAccess = hasPermission(rel.modulo, "view");
    return matchCategoria && matchBusca && hasAccess;
  });

  const getCorClasses = (cor: string) => {
    const cores: Record<string, { bg: string; text: string; hover: string }> = {
      blue: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        hover: "hover:bg-blue-50",
      },
      green: {
        bg: "bg-green-100",
        text: "text-green-600",
        hover: "hover:bg-green-50",
      },
      purple: {
        bg: "bg-purple-100",
        text: "text-purple-600",
        hover: "hover:bg-purple-50",
      },
      orange: {
        bg: "bg-orange-100",
        text: "text-orange-600",
        hover: "hover:bg-orange-50",
      },
      red: {
        bg: "bg-red-100",
        text: "text-red-600",
        hover: "hover:bg-red-50",
      },
    };
    return cores[cor] || cores.blue;
  };

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
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
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
      {relatoriosFiltrados.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum relatório encontrado
          </h3>
          <p className="text-gray-600">
            {busca
              ? "Tente ajustar sua busca ou filtros"
              : "Você não tem acesso a relatórios nesta categoria"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatoriosFiltrados.map((relatorio) => {
            const cores = getCorClasses(relatorio.cor);
            const Icone = relatorio.icone;

            return (
              <div
                key={relatorio.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate({ to: relatorio.path })}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${cores.bg} rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icone size={24} className={cores.text} />
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                    {relatorio.titulo}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4">
                    {relatorio.descricao}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {relatorio.categoria}
                    </span>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                      Visualizar
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Seção informativa */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <FileText className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Sobre os Relatórios
            </h3>
            <p className="text-blue-800 mb-3">
              Os relatórios disponíveis nesta seção fornecem análises detalhadas e consolidadas
              dos dados do sistema, permitindo uma visão abrangente das operações municipais.
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>Todos os relatórios podem ser filtrados por período</li>
              <li>Exportação para CSV disponível em cada relatório</li>
              <li>Dados atualizados em tempo real</li>
              <li>Acesso controlado por permissões de módulo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
