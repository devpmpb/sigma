/**
 * Dashboard Executivo
 * Visualização para prefeito/secretário dos benefícios concedidos
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
  TrendingDown,
  Users,
  DollarSign,
  FileText,
  RefreshCw,
  Calendar,
  WifiOff,
} from "lucide-react";
import dashboardService, {
  type DashboardResumoCompleto,
} from "../../services/comum/dashboardService";
import { isOnline } from "../../pwa";

// Cores para gráficos
const COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#ca8a04", // yellow-600
  "#9333ea", // purple-600
  "#0891b2", // cyan-600
  "#ea580c", // orange-600
  "#4f46e5", // indigo-600
  "#db2777", // pink-600
  "#059669", // emerald-600
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

// Formatador de moeda resiliente
const formatarMoeda = (valor: any) => {
  const num = Number(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

// Componente Card de Estatística
interface StatCardProps {
  titulo: string;
  valor: string | number;
  icone: React.ReactNode;
  corIcone: string;
  subtitulo?: string;
  variacao?: number;
}

function StatCard({
  titulo,
  valor,
  icone,
  corIcone,
  subtitulo,
  variacao,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{titulo}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{valor}</p>
          {subtitulo && (
            <p className="mt-1 text-sm text-gray-500">{subtitulo}</p>
          )}
          {variacao !== undefined && (
            <div
              className={`mt-1 flex items-center text-sm ${
                variacao >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {variacao >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span>
                {variacao >= 0 ? "+" : ""}
                {variacao.toFixed(1)}% vs ano anterior
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${corIcone}`}>{icone}</div>
      </div>
    </div>
  );
}

export default function DashboardExecutivo() {
  const [dados, setDados] = useState<DashboardResumoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ano, setAno] = useState<number | "todos">(new Date().getFullYear());
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [offline, setOffline] = useState(!isOnline());

  // Carregar anos disponíveis
  useEffect(() => {
    const carregarAnos = async () => {
      const anos = await dashboardService.getAnos();
      setAnosDisponiveis(anos);
    };
    carregarAnos();
  }, []);

  // Carregar dados
  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    setOffline(!isOnline());

    try {
      const resumo = await dashboardService.getResumoCompleto(ano);
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
  }, [ano]);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Preparar dados para gráfico de linha (por mês)
  const dadosPorMes = dados?.porMes.map((m) => ({
    nome: MESES[m.mes - 1],
    valor: m.valor,
    quantidade: m.quantidade,
  }));

  // Preparar dados para gráfico de pizza (por programa)
  const dadosPorPrograma = dados?.porPrograma.slice(0, 6).map((p, index) => ({
    nome: p.nome.length > 20 ? p.nome.substring(0, 20) + "..." : p.nome,
    valor: p.valor,
    fill: COLORS[index % COLORS.length],
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    );
  }

  if (erro && !dados) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{erro}</p>
        <button
          onClick={carregarDados}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Executivo
          </h1>
          <p className="text-gray-500">Visão geral dos benefícios concedidos</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Indicador offline */}
          {offline && (
            <div className="flex items-center text-yellow-600 text-sm">
              <WifiOff className="h-4 w-4 mr-1" />
              <span>Dados em cache</span>
            </div>
          )}

          {/* Seletor de ano */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={ano}
              onChange={(e) => {
                const value = e.target.value;
                setAno(value === "todos" ? "todos" : Number(value));
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os anos</option>
              {anosDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Botão atualizar */}
          <button
            onClick={carregarDados}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          titulo="Total Investido"
          valor={formatarMoeda(dados?.estatisticas.totalInvestido)}
          icone={<DollarSign className="h-6 w-6 text-white" />}
          corIcone="bg-green-600"
          subtitulo={ano === "todos" ? "todos os anos" : `em ${ano}`}
        />
        <StatCard
          titulo="Solicitações Aprovadas"
          valor={dados?.estatisticas.totalSolicitacoes || 0}
          icone={<FileText className="h-6 w-6 text-white" />}
          corIcone="bg-blue-600"
          subtitulo="aprovadas + pagas"
        />
        <StatCard
          titulo="Produtores Atendidos"
          valor={dados?.estatisticas.produtoresAtendidos || 0}
          icone={<Users className="h-6 w-6 text-white" />}
          corIcone="bg-purple-600"
          subtitulo="produtores únicos"
        />
        <StatCard
          titulo="Média por Produtor"
          valor={formatarMoeda(dados?.estatisticas.mediaPorProdutor)}
          icone={<TrendingUp className="h-6 w-6 text-white" />}
          corIcone="bg-orange-600"
          subtitulo="valor médio recebido"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Por Mês */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Investimento Mensal
          </h2>
          {dadosPorMes && dadosPorMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis
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
                <Legend />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Valor (R$)"
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição por Programa
          </h2>
          {dadosPorPrograma && dadosPorPrograma.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPorPrograma}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {dadosPorPrograma.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatarMoeda(value), "Valor"]}
                />
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Valor por Programa
        </h2>
        {dados?.porPrograma && dados.porPrograma.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={dados.porPrograma.map((p, i) => ({
                nome:
                  p.nome.length > 25 ? p.nome.substring(0, 25) + "..." : p.nome,
                valor: p.valor,
                quantidade: p.quantidade,
                fill: COLORS[i % COLORS.length],
              }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
              />
              <YAxis type="category" dataKey="nome" width={140} />
              <Tooltip
                formatter={(value: any, name?: string) => [
                  name === "valor" ? formatarMoeda(value) : value,
                  name === "valor" ? "Valor Total" : "Quantidade",
                ]}
              />
              <Legend />
              <Bar dataKey="valor" fill="#2563eb" name="Valor Total" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Nenhum dado disponível
          </div>
        )}
      </div>

      {/* Top Produtores */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Top 5 Produtores Beneficiados
        </h2>
        {dados?.topProdutores && dados.topProdutores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produtor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitações
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dados.topProdutores.map((produtor, index) => (
                  <tr key={produtor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {produtor.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {produtor.quantidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Solicitações por Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
                  className={`rounded-lg p-4 text-center ${
                    cores[status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-2xl font-bold">{quantidade}</p>
                  <p className="text-sm">{nomes[status] || status}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Última atualização */}
      {dados?.ultimaAtualizacao && (
        <div className="text-center text-sm text-gray-500">
          Última atualização:{" "}
          {new Date(dados.ultimaAtualizacao).toLocaleString("pt-BR")}
        </div>
      )}
    </div>
  );
}
