// frontend/src/pages/relatorios/RelatoriosArrendamento.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import relatorioArrendamentoService, {
  type RelatorioArrendamentoGeral,
  type RelatorioPorPropriedade,
  type RelatorioPorArrendatario,
  type RelatorioPorAtividade,
  type RelatorioVencendo
} from "../../services/agricultura/relatorioArrendamentoService";
import propriedadeService from "../../services/comum/propriedadeService";
import {
  FileText,
  Download,
  Filter,
  Home,
  Users,
  Sprout,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import {
  exportRelatorioGeralPDF,
  exportRelatorioPorPropriedadePDF,
  exportRelatorioPorArrendatarioPDF,
  exportRelatorioPorAtividadePDF,
  exportRelatorioVencendoPDF,
} from "../../utils/exportRelatorioArrendamentoPDF";

type TipoRelatorio = "geral" | "porPropriedade" | "porArrendatario" | "porAtividade" | "vencendo";

const RelatoriosArrendamento: React.FC = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>("geral");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [propriedadeId, setPropriedadeId] = useState<string>("");
  const [diasVencimento, setDiasVencimento] = useState<string>("30");

  // Buscar lista de propriedades para o filtro
  const { data: propriedades } = useQuery({
    queryKey: ["propriedades"],
    queryFn: () => propriedadeService.getAll(),
  });

  // Query para relatório geral
  const { data: relatorioGeral, isLoading: loadingGeral } = useQuery({
    queryKey: ["relatorio-arrendamento-geral", dataInicio, dataFim, status, propriedadeId],
    queryFn: () => relatorioArrendamentoService.geral({
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      status: status || undefined,
      propriedadeId: propriedadeId ? Number(propriedadeId) : undefined,
    }),
    enabled: tipoRelatorio === "geral",
  });

  // Query para relatório por propriedade
  const { data: relatorioPorPropriedade, isLoading: loadingPorPropriedade } = useQuery({
    queryKey: ["relatorio-arrendamento-propriedade", dataInicio, dataFim],
    queryFn: () => relatorioArrendamentoService.porPropriedade({
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    }),
    enabled: tipoRelatorio === "porPropriedade",
  });

  // Query para relatório por arrendatário
  const { data: relatorioPorArrendatario, isLoading: loadingPorArrendatario } = useQuery({
    queryKey: ["relatorio-arrendamento-arrendatario", dataInicio, dataFim],
    queryFn: () => relatorioArrendamentoService.porArrendatario({
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    }),
    enabled: tipoRelatorio === "porArrendatario",
  });

  // Query para relatório por atividade
  const { data: relatorioPorAtividade, isLoading: loadingPorAtividade } = useQuery({
    queryKey: ["relatorio-arrendamento-atividade", dataInicio, dataFim],
    queryFn: () => relatorioArrendamentoService.porAtividadeProdutiva({
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    }),
    enabled: tipoRelatorio === "porAtividade",
  });

  // Query para relatório de vencendo
  const { data: relatorioVencendo, isLoading: loadingVencendo } = useQuery({
    queryKey: ["relatorio-arrendamento-vencendo", diasVencimento],
    queryFn: () => relatorioArrendamentoService.vencendo({
      dias: diasVencimento ? Number(diasVencimento) : undefined,
    }),
    enabled: tipoRelatorio === "vencendo",
  });

  const isLoading = loadingGeral || loadingPorPropriedade || loadingPorArrendatario || loadingPorAtividade || loadingVencendo;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Indeterminado";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatArea = (area: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(area) + " ha";
  };

  const exportToPDF = () => {
    const filtros = {
      dataInicio,
      dataFim,
      status,
      propriedadeId,
      dias: diasVencimento,
    };

    switch (tipoRelatorio) {
      case "geral":
        if (relatorioGeral) {
          exportRelatorioGeralPDF(relatorioGeral, filtros);
        }
        break;
      case "porPropriedade":
        if (relatorioPorPropriedade) {
          exportRelatorioPorPropriedadePDF(relatorioPorPropriedade, filtros);
        }
        break;
      case "porArrendatario":
        if (relatorioPorArrendatario) {
          exportRelatorioPorArrendatarioPDF(relatorioPorArrendatario, filtros);
        }
        break;
      case "porAtividade":
        if (relatorioPorAtividade) {
          exportRelatorioPorAtividadePDF(relatorioPorAtividade, filtros);
        }
        break;
      case "vencendo":
        if (relatorioVencendo) {
          exportRelatorioVencendoPDF(relatorioVencendo, filtros);
        }
        break;
    }
  };

  const renderRelatorioGeral = (data: RelatorioArrendamentoGeral) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total de Arrendamentos</p>
              <p className="text-2xl font-bold text-blue-900">{data.estatisticas.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Área Total</p>
              <p className="text-2xl font-bold text-green-900">{formatArea(data.estatisticas.areaTotal)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Propriedades Únicas</p>
              <p className="text-2xl font-bold text-purple-900">{data.estatisticas.propriedadesUnicas}</p>
            </div>
            <Home className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Arrendatários Únicos</p>
              <p className="text-2xl font-bold text-orange-900">{data.estatisticas.arrendatariosUnicos}</p>
            </div>
            <Users className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {data.estatisticas.porStatus.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-md font-semibold mb-3">Distribuição por Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.estatisticas.porStatus.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-600">{item.status}</p>
                <p className="text-lg font-bold">{item.quantidade} arrendamentos</p>
                <p className="text-sm text-gray-500">{formatArea(item.areaTotal)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propriedade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Arrendatário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Período
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.arrendamentos.map((item: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.propriedade?.inscricaoCadastral || "N/A"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.arrendatario?.nome || "N/A"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatArea(item.areaArrendada)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(item.dataInicio)} até {formatDate(item.dataFim)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRelatorioPorPropriedade = (data: RelatorioPorPropriedade) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total de Propriedades</p>
              <p className="text-2xl font-bold text-blue-900">{data.totais.totalPropriedades}</p>
            </div>
            <Home className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total de Arrendamentos</p>
              <p className="text-2xl font-bold text-green-900">{data.totais.totalArrendamentos}</p>
            </div>
            <FileText className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data.propriedades.map((item, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Inscrição Cadastral: {item.propriedade.inscricaoCadastral}
                </h3>
                <p className="text-sm text-gray-600">
                  Proprietário: {item.propriedade.proprietario}
                </p>
                <p className="text-sm text-gray-600">
                  Logradouro: {item.propriedade.logradouro}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Área Total</p>
                <p className="text-xl font-bold text-gray-900">{formatArea(item.propriedade.area)}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-xs text-blue-600">Arrendamentos</p>
                  <p className="text-lg font-bold text-blue-900">{item.quantidadeArrendamentos}</p>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <p className="text-xs text-green-600">Área Arrendada Total</p>
                  <p className="text-lg font-bold text-green-900">{formatArea(item.areaArrendadaTotal)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Arrendatário</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Área</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Período</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {item.arrendamentos.map((arr, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">{arr.arrendatario}</td>
                        <td className="px-4 py-2">{formatArea(arr.areaArrendada)}</td>
                        <td className="px-4 py-2">
                          {formatDate(arr.dataInicio)} - {formatDate(arr.dataFim)}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {arr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRelatorioPorArrendatario = (data: RelatorioPorArrendatario) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total de Arrendatários</p>
              <p className="text-2xl font-bold text-purple-900">{data.totais.totalArrendatarios}</p>
            </div>
            <Users className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total de Arrendamentos</p>
              <p className="text-2xl font-bold text-blue-900">{data.totais.totalArrendamentos}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Área Total</p>
              <p className="text-2xl font-bold text-green-900">{formatArea(data.totais.areaTotal)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data.arrendatarios.map((item, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.arrendatario.nome}</h3>
                <p className="text-sm text-gray-600">CPF/CNPJ: {item.arrendatario.cpfCnpj}</p>
                {item.arrendatario.telefone && (
                  <p className="text-sm text-gray-600">Telefone: {item.arrendatario.telefone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Área Total</p>
                <p className="text-xl font-bold text-gray-900">{formatArea(item.areaTotal)}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  Quantidade de Arrendamentos: <strong>{item.quantidadeArrendamentos}</strong>
                </p>
                {item.atividadesProdutivas.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Atividades: {item.atividadesProdutivas.join(", ")}
                  </p>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Propriedade</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Proprietário</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Área</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Período</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {item.arrendamentos.map((arr, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">{arr.propriedade}</td>
                        <td className="px-4 py-2">{arr.proprietario}</td>
                        <td className="px-4 py-2">{formatArea(arr.areaArrendada)}</td>
                        <td className="px-4 py-2">
                          {formatDate(arr.dataInicio)} - {formatDate(arr.dataFim)}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {arr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRelatorioPorAtividade = (data: RelatorioPorAtividade) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total de Arrendamentos</p>
              <p className="text-2xl font-bold text-blue-900">{data.totais.totalArrendamentos}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Área Total</p>
              <p className="text-2xl font-bold text-green-900">{formatArea(data.totais.areaTotal)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Atividade Produtiva
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Arrendatários Únicos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propriedades Únicas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.atividades.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Sprout className="h-5 w-5 text-green-600 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{item.atividade || "Não especificada"}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.quantidadeArrendamentos}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatArea(item.areaTotal)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.arrendatariosUnicos}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.propriedadesUnicas}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRelatorioVencendo = (data: RelatorioVencendo) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Total Vencendo</p>
              <p className="text-2xl font-bold text-yellow-900">{data.estatisticas.total}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Urgentes (≤ 7 dias)</p>
              <p className="text-2xl font-bold text-red-900">{data.estatisticas.urgentes}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Área Total</p>
              <p className="text-2xl font-bold text-blue-900">{formatArea(data.estatisticas.areaTotal)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propriedade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Arrendatário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Fim
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dias Restantes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.arrendamentos.map((item: any, index: number) => {
              const dataFim = new Date(item.dataFim);
              const hoje = new Date();
              const diasRestantes = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
              const isUrgente = diasRestantes <= 7;

              return (
                <tr key={index} className={`hover:bg-gray-50 ${isUrgente ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.propriedade?.inscricaoCadastral || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.arrendatario?.nome || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatArea(item.areaArrendada)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(item.dataFim)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isUrgente
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Relatórios de Arrendamento</h1>
          <div className="text-sm breadcrumbs">
            <ul className="flex">
              <li className="text-gray-500">Início</li>
              <li className="before:content-['>'] before:mx-2 text-gray-500">Movimentos</li>
              <li className="before:content-['>'] before:mx-2 text-gray-500">Agricultura</li>
              <li className="before:content-['>'] before:mx-2 text-gray-700">
                Relatórios de Arrendamento
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
                <option value="geral">Relatório Geral</option>
                <option value="porPropriedade">Por Propriedade</option>
                <option value="porArrendatario">Por Arrendatário</option>
                <option value="porAtividade">Por Atividade Produtiva</option>
                <option value="vencendo">Contratos Vencendo</option>
              </select>
            </div>

            {/* Filtros específicos por tipo */}
            {tipoRelatorio !== "vencendo" && (
              <>
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
              </>
            )}

            {tipoRelatorio === "geral" && (
              <>
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
                    <option value="ATIVO">Ativo</option>
                    <option value="FINALIZADO">Finalizado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propriedade
                  </label>
                  <select
                    value={propriedadeId}
                    onChange={(e) => setPropriedadeId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Todas</option>
                    {propriedades?.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.inscricaoCadastral}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {tipoRelatorio === "vencendo" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vencendo em (dias)
                </label>
                <input
                  type="number"
                  value={diasVencimento}
                  onChange={(e) => setDiasVencimento(e.target.value)}
                  min="1"
                  max="365"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
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
        ) : (
          <>
            {tipoRelatorio === "geral" && relatorioGeral && renderRelatorioGeral(relatorioGeral)}
            {tipoRelatorio === "porPropriedade" && relatorioPorPropriedade && renderRelatorioPorPropriedade(relatorioPorPropriedade)}
            {tipoRelatorio === "porArrendatario" && relatorioPorArrendatario && renderRelatorioPorArrendatario(relatorioPorArrendatario)}
            {tipoRelatorio === "porAtividade" && relatorioPorAtividade && renderRelatorioPorAtividade(relatorioPorAtividade)}
            {tipoRelatorio === "vencendo" && relatorioVencendo && renderRelatorioVencendo(relatorioVencendo)}
          </>
        )}
      </div>
    </div>
  );
};

export default RelatoriosArrendamento;
