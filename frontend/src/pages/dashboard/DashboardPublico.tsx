/**
 * Dashboard Público para Prefeito/Secretário
 * Acesso sem login - PWA standalone
 */

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  RefreshCw,
  Calendar,
  Filter,
  X,
  Search,
} from "lucide-react";
import dashboardPublicoService, {
  type DashboardResumoPublico,
  type ProgramaFiltro,
  type ProdutorFiltro,
} from "../../services/comum/dashboardPublicoService";

// Cores para gráficos
const COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#ca8a04",
  "#9333ea",
  "#0891b2",
  "#ea580c",
  "#4f46e5",
  "#db2777",
  "#059669",
];

// Nomes dos meses
const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

// Formatador de moeda
const formatarMoeda = (valor: any) => {
  if (typeof valor !== "number") return "R$ 0,00"; // Ou retornar string vazia ""

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

// Componente Card de Estatística
interface StatCardProps {
  titulo: string;
  valor: string | number;
  icone: React.ReactNode;
  corIcone: string;
  subtitulo?: string;
}

function StatCard({
  titulo,
  valor,
  icone,
  corIcone,
  subtitulo,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
            {titulo}
          </p>
          <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900 truncate">
            {valor}
          </p>
          {subtitulo && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500 truncate">
              {subtitulo}
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-full ${corIcone} flex-shrink-0`}>
          {icone}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPublico() {
  const [dados, setDados] = useState<DashboardResumoPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [ano, setAno] = useState<number | "todos">(new Date().getFullYear());
  const [anos, setAnos] = useState<number[]>([]);
  const [programas, setProgramas] = useState<ProgramaFiltro[]>([]);
  const [programaId, setProgramaId] = useState<number | null>(null);
  const [produtores, setProdutores] = useState<ProdutorFiltro[]>([]);
  const [produtorId, setProdutorId] = useState<number | null>(null);
  const [produtorNome, setProdutorNome] = useState("");
  const [buscaProdutor, setBuscaProdutor] = useState("");
  const [showProdutores, setShowProdutores] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);

  // Carregar anos e programas iniciais
  useEffect(() => {
    const carregarFiltros = async () => {
      try {
        const [anosData, programasData] = await Promise.all([
          dashboardPublicoService.getAnos(),
          dashboardPublicoService.getProgramas(),
        ]);
        setAnos(anosData);
        setProgramas(programasData);
      } catch (error) {
        console.error("Erro ao carregar filtros:", error);
      }
    };
    carregarFiltros();
  }, []);

  // Buscar produtores quando digitar
  useEffect(() => {
    const buscar = async () => {
      if (buscaProdutor.length >= 2) {
        try {
          const data = await dashboardPublicoService.buscarProdutores(
            buscaProdutor
          );
          setProdutores(data);
          setShowProdutores(true);
        } catch (error) {
          console.error("Erro ao buscar produtores:", error);
        }
      } else {
        setProdutores([]);
        setShowProdutores(false);
      }
    };

    const timeout = setTimeout(buscar, 300);
    return () => clearTimeout(timeout);
  }, [buscaProdutor]);

  // Carregar dados
  const carregarDados = async () => {
    setLoading(true);
    setErro(null);

    try {
      const resumo = await dashboardPublicoService.getResumoPublico(
        ano,
        programaId || undefined,
        produtorId || undefined
      );
      setDados(resumo);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      setErro("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [ano, programaId, produtorId]);

  // Selecionar produtor
  const selecionarProdutor = (produtor: ProdutorFiltro) => {
    setProdutorId(produtor.id);
    setProdutorNome(produtor.nome);
    setBuscaProdutor("");
    setShowProdutores(false);
  };

  // Limpar filtro de produtor
  const limparProdutor = () => {
    setProdutorId(null);
    setProdutorNome("");
    setBuscaProdutor("");
  };

  // Limpar todos os filtros
  const limparFiltros = () => {
    setProgramaId(null);
    limparProdutor();
  };

  // Preparar dados para gráficos
  const dadosPorMes = dados?.porMes.map((m) => ({
    nome: MESES[m.mes - 1],
    valor: m.valor,
    quantidade: m.quantidade,
  }));

  const dadosPorPrograma = dados?.porPrograma.slice(0, 6).map((p, index) => ({
    nome: p.nome.length > 15 ? p.nome.substring(0, 15) + "..." : p.nome,
    valor: p.valor,
    fill: COLORS[index % COLORS.length],
  }));

  const filtrosAtivos = programaId || produtorId;

  if (loading && !dados) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (erro && !dados) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <p className="text-red-600 text-lg">{erro}</p>
          <button
            onClick={carregarDados}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header fixo */}
      <header className="bg-blue-700 text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-bold">SIGMA</h1>
              <p className="text-xs sm:text-sm text-blue-200">
                Dashboard Executivo
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão filtros (mobile) */}
              <button
                onClick={() => setShowFiltros(!showFiltros)}
                className={`p-2 rounded-lg transition-colors ${
                  filtrosAtivos
                    ? "bg-yellow-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                <Filter className="h-5 w-5" />
              </button>

              {/* Botão atualizar */}
              <button
                onClick={carregarDados}
                disabled={loading}
                className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
              >
                <RefreshCw
                  className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Painel de filtros (expandível) */}
      {showFiltros && (
        <div className="bg-white border-b shadow-md">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Ano */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Ano
              </label>
              <select
                value={ano}
                onChange={(e) => setAno(e.target.value === "todos" ? "todos" : Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os anos</option>
                {anos.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Programa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Programa
              </label>
              <select
                value={programaId || ""}
                onChange={(e) =>
                  setProgramaId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os programas</option>
                {programas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Produtor */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produtor
              </label>
              {produtorId ? (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="flex-1 text-blue-800">{produtorNome}</span>
                  <button
                    onClick={limparProdutor}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={buscaProdutor}
                    onChange={(e) => setBuscaProdutor(e.target.value)}
                    placeholder="Buscar produtor..."
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {showProdutores && produtores.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {produtores.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selecionarProdutor(p)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                        >
                          <div className="font-medium">{p.nome}</div>
                          <div className="text-xs text-gray-500">
                            {p.cpfCnpj}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botão limpar filtros */}
            {filtrosAtivos && (
              <button
                onClick={limparFiltros}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Indicador de filtros ativos */}
      {filtrosAtivos && !showFiltros && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="container mx-auto flex items-center gap-2 text-sm text-yellow-800">
            <Filter className="h-4 w-4" />
            <span>Filtros ativos:</span>
            {programaId && (
              <span className="bg-yellow-200 px-2 py-0.5 rounded">
                {programas.find((p) => p.id === programaId)?.nome}
              </span>
            )}
            {produtorId && (
              <span className="bg-yellow-200 px-2 py-0.5 rounded">
                {produtorNome}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard
            titulo="Total Investido"
            valor={formatarMoeda(dados?.estatisticas.totalInvestido || 0)}
            icone={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
            corIcone="bg-green-600"
            subtitulo={ano === "todos" ? "todos os anos" : `em ${ano}`}
          />
          <StatCard
            titulo="Solicitações"
            valor={dados?.estatisticas.totalSolicitacoes || 0}
            icone={<FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
            corIcone="bg-blue-600"
            subtitulo="aprovadas"
          />
          <StatCard
            titulo="Produtores"
            valor={dados?.estatisticas.produtoresAtendidos || 0}
            icone={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
            corIcone="bg-purple-600"
            subtitulo="atendidos"
          />
          <StatCard
            titulo="Média"
            valor={formatarMoeda(dados?.estatisticas.mediaPorProdutor || 0)}
            icone={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
            corIcone="bg-orange-600"
            subtitulo="por produtor"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Linha - Por Mês */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Investimento Mensal
            </h2>
            {dadosPorMes && dadosPorMes.some((m) => m.valor > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dadosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("pt-BR", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(value)
                    }
                  />
                  <Tooltip
                    formatter={(value: any) => [formatarMoeda(value), "Valor"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </div>

          {/* Gráfico de Pizza - Por Programa */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Por Programa
            </h2>
            {dadosPorPrograma && dadosPorPrograma.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dadosPorPrograma}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ percent }) =>
                      `${(percent || 0 * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {dadosPorPrograma.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatarMoeda(value)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Barras - Por Programa (detalhado) */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Valor por Programa
          </h2>
          {dados?.porPrograma && dados.porPrograma.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={Math.max(300, dados.porPrograma.length * 50)}
            >
              <BarChart
                data={dados.porPrograma.map((p, i) => ({
                  nome:
                    p.nome.length > 20
                      ? p.nome.substring(0, 20) + "..."
                      : p.nome,
                  valor: p.valor,
                  fill: COLORS[i % COLORS.length],
                }))}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(value)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={95}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: any) => [
                    formatarMoeda(value),
                    "Valor Total",
                  ]}
                />
                <Bar dataKey="valor" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Top Produtores */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Top 10 Produtores Beneficiados
          </h2>
          {dados?.topProdutores && dados.topProdutores.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Produtor
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Qtd
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dados.topProdutores.map((produtor, index) => (
                    <tr key={produtor.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-sm font-medium text-gray-900">
                        {produtor.nome}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-sm text-gray-500 text-right">
                        {produtor.quantidade}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-sm text-gray-900 text-right font-medium">
                        {formatarMoeda(produtor.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Status por fase */}
        {dados?.porStatus && Object.keys(dados.porStatus).length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Por Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(dados.porStatus).map(([status, quantidade]) => {
                const cores: Record<string, string> = {
                  pendente: "bg-yellow-100 text-yellow-800",
                  em_analise: "bg-blue-100 text-blue-800",
                  aprovada: "bg-green-100 text-green-800",
                  rejeitada: "bg-red-100 text-red-800",
                  paga: "bg-purple-100 text-purple-800",
                  cancelada: "bg-gray-100 text-gray-800",
                };

                const nomes: Record<string, string> = {
                  pendente: "Pendentes",
                  em_analise: "Em Análise",
                  aprovada: "Aprovadas",
                  rejeitada: "Rejeitadas",
                  paga: "Pagas",
                  cancelada: "Canceladas",
                };

                return (
                  <div
                    key={status}
                    className={`rounded-lg p-3 text-center ${
                      cores[status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-xl sm:text-2xl font-bold">
                      {quantidade}
                    </p>
                    <p className="text-xs sm:text-sm">
                      {nomes[status] || status}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Última atualização */}
        {dados?.ultimaAtualizacao && (
          <div className="text-center text-xs sm:text-sm text-gray-500 pb-4">
            Atualizado em:{" "}
            {new Date(dados.ultimaAtualizacao).toLocaleString("pt-BR")}
          </div>
        )}
      </main>
    </div>
  );
}
