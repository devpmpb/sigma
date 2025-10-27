// frontend/src/pages/relatorios/RelatoriosBeneficio.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import relatorioBeneficioService, {
  type RelatorioPorPrograma,
  type RelatorioProdutores,
  type RelatorioInvestimento,
  type RelatorioPorSecretaria
} from "../../services/comum/relatorioBeneficioService";
import programaService from "../../services/comum/programaService";
import {
  FileText,
  Download,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Building2
} from "lucide-react";
import {
  exportRelatorioPorProgramaPDF,
  exportRelatorioProdutoresPDF,
  exportRelatorioInvestimentoPDF,
  exportRelatorioSecretariaPDF,
} from "../../utils/exportRelatorioBeneficioPDF";

type TipoRelatorio = "porPrograma" | "produtores" | "investimento" | "porSecretaria";
type AgrupamentoInvestimento = "dia" | "mes" | "ano";

const RelatoriosBeneficio: React.FC = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>("porPrograma");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [programaId, setProgramaId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [agrupamento, setAgrupamento] = useState<AgrupamentoInvestimento>("mes");

  // Buscar lista de programas para o filtro
  const { data: programas } = useQuery({
    queryKey: ["programas"],
    queryFn: () => programaService.getAll(),
  });

  // Query para relatório por programa
  const { data: relatorioPorPrograma, isLoading: loadingPorPrograma, error: errorPorPrograma } = useQuery({
    queryKey: ["relatorio-beneficio-programa", dataInicio, dataFim, programaId, status],
    queryFn: async () => {
      console.log("Buscando relatório por programa...");
      console.log("Params:", { dataInicio, dataFim, programaId, status });
      try {
        const result = await relatorioBeneficioService.porPrograma({
          dataInicio: dataInicio || undefined,
          dataFim: dataFim || undefined,
          programaId: programaId ? Number(programaId) : undefined,
          status: status || undefined,
        });
        console.log("Resultado do relatório:", result);
        return result;
      } catch (error: any) {
        console.error("Erro ao buscar relatório:", error);
        console.error("URL tentada:", error.config?.url);
        console.error("Status:", error.response?.status);
        console.error("Mensagem:", error.response?.data);
        throw error;
      }
    },
    enabled: tipoRelatorio === "porPrograma",
  });

  // Query para relatório de produtores
  const { data: relatorioProdutores, isLoading: loadingProdutores } = useQuery({
    queryKey: ["relatorio-beneficio-produtores", dataInicio, dataFim],
    queryFn: () => relatorioBeneficioService.produtoresBeneficiados({
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    }),
    enabled: tipoRelatorio === "produtores",
  });

  // Query para relatório de investimento
  const { data: relatorioInvestimento, isLoading: loadingInvestimento } = useQuery({
    queryKey: ["relatorio-beneficio-investimento", dataInicio, dataFim, agrupamento],
    queryFn: () => relatorioBeneficioService.investimentoPorPeriodo({
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      agrupamento,
    }),
    enabled: tipoRelatorio === "investimento",
  });

  // Query para relatório por secretaria
  const { data: relatorioPorSecretaria, isLoading: loadingPorSecretaria } = useQuery({
    queryKey: ["relatorio-beneficio-secretaria", dataInicio, dataFim],
    queryFn: () => relatorioBeneficioService.porSecretaria({
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    }),
    enabled: tipoRelatorio === "porSecretaria",
  });

  const isLoading = loadingPorPrograma || loadingProdutores || loadingInvestimento || loadingPorSecretaria;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const exportToPDF = () => {
    const filtros = {
      dataInicio,
      dataFim,
      programaId,
      status,
      agrupamento,
    };

    switch (tipoRelatorio) {
      case "porPrograma":
        if (relatorioPorPrograma) {
          exportRelatorioPorProgramaPDF(relatorioPorPrograma, filtros);
        }
        break;
      case "produtores":
        if (relatorioProdutores) {
          exportRelatorioProdutoresPDF(relatorioProdutores, filtros);
        }
        break;
      case "investimento":
        if (relatorioInvestimento) {
          exportRelatorioInvestimentoPDF(relatorioInvestimento, filtros);
        }
        break;
      case "porSecretaria":
        if (relatorioPorSecretaria) {
          exportRelatorioSecretariaPDF(relatorioPorSecretaria, filtros);
        }
        break;
    }
  };

  const renderRelatorioPorPrograma = (data: RelatorioPorPrograma) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total de Solicitações</p>
              <p className="text-2xl font-bold text-blue-900">{data.totais.totalSolicitacoes}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Valor Total</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(data.totais.valorTotal)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Programa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Solicitações
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Por Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.resumo.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.programa}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.totalSolicitacoes}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatCurrency(item.valorTotal)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.porStatus).map(([status, quantidade]) => (
                      <span
                        key={status}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {status}: {quantidade}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRelatorioProdutores = (data: RelatorioProdutores) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total de Produtores</p>
              <p className="text-2xl font-bold text-purple-900">{data.totais.totalProdutores}</p>
            </div>
            <Users className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total de Benefícios</p>
              <p className="text-2xl font-bold text-green-900">{data.totais.totalBeneficios}</p>
            </div>
            <FileText className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produtor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPF/CNPJ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Recebido
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.produtores.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.pessoa.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.pessoa.cpfCnpj}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.quantidadeBeneficios}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatCurrency(item.totalRecebido)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRelatorioInvestimento = (data: RelatorioInvestimento) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">Quantidade Total</p>
              <p className="text-2xl font-bold text-indigo-900">{data.totais.quantidadeTotal}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Valor Total</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(data.totais.valorTotal)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Período
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Investido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Por Programa
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.periodos.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.periodo}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.quantidadeSolicitacoes}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatCurrency(item.totalInvestido)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.porPrograma).map(([programa, valor]) => (
                      <span
                        key={programa}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {programa}: {formatCurrency(Number(valor))}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRelatorioPorSecretaria = (data: RelatorioPorSecretaria) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Quantidade Total</p>
              <p className="text-2xl font-bold text-orange-900">{data.totais.quantidadeTotal}</p>
            </div>
            <Building2 className="h-8 w-8 text-orange-400" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Valor Total</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(data.totais.valorTotal)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Secretaria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Investido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Programas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.secretarias.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.secretaria}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.quantidadeSolicitacoes}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatCurrency(item.totalInvestido)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {item.programas.map((prog, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-medium">{prog.nome}:</span>{" "}
                        {prog.quantidade} ({formatCurrency(prog.total)})
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Relatórios de Benefícios</h1>
          <div className="text-sm breadcrumbs">
            <ul className="flex">
              <li className="text-gray-500">Início</li>
              <li className="before:content-['>'] before:mx-2 text-gray-500">Movimentos</li>
              <li className="before:content-['>'] before:mx-2 text-gray-500">Comum</li>
              <li className="before:content-['>'] before:mx-2 text-gray-700">
                Relatórios de Benefícios
              </li>
            </ul>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Filtros e Tipo de Relatório</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tipo de Relatório */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Relatório
              </label>
              <select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value as TipoRelatorio)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="porPrograma">Por Programa</option>
                <option value="produtores">Produtores Beneficiados</option>
                <option value="investimento">Investimento por Período</option>
                <option value="porSecretaria">Por Secretaria</option>
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            {/* Filtros específicos por tipo de relatório */}
            {tipoRelatorio === "porPrograma" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Programa
                  </label>
                  <select
                    value={programaId}
                    onChange={(e) => setProgramaId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Todos</option>
                    {programas?.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Todos</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANALISE">Em Análise</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="REPROVADO">Reprovado</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
              </>
            )}

            {tipoRelatorio === "investimento" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agrupar por
                </label>
                <select
                  value={agrupamento}
                  onChange={(e) => setAgrupamento(e.target.value as AgrupamentoInvestimento)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="dia">Dia</option>
                  <option value="mes">Mês</option>
                  <option value="ano">Ano</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Conteúdo do Relatório */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Carregando relatório...</div>
          </div>
        ) : errorPorPrograma ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar relatório</h3>
            <p className="text-red-700">{String(errorPorPrograma)}</p>
          </div>
        ) : (
          <>
            {tipoRelatorio === "porPrograma" && relatorioPorPrograma && renderRelatorioPorPrograma(relatorioPorPrograma)}
            {tipoRelatorio === "produtores" && relatorioProdutores && renderRelatorioProdutores(relatorioProdutores)}
            {tipoRelatorio === "investimento" && relatorioInvestimento && renderRelatorioInvestimento(relatorioInvestimento)}
            {tipoRelatorio === "porSecretaria" && relatorioPorSecretaria && renderRelatorioPorSecretaria(relatorioPorSecretaria)}

            {/* Mensagem quando não há dados */}
            {tipoRelatorio === "porPrograma" && !relatorioPorPrograma && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600">Nenhum dado encontrado para os filtros selecionados</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RelatoriosBeneficio;
