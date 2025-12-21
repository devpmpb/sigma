import React from "react";
import { formatarData } from "../../../../utils/formatters";
import { Column } from "../../../../components/comum/DataTable";
import programaService, {
  Programa,
  ProgramaDTO,
  TipoPerfil,
} from "../../../../services/comum/programaService";
import { CadastroBase } from "../../../../components/cadastro";
import ProgramaForm from "./ProgramaForm";

const Programas: React.FC = () => {
  const columns: Column<Programa>[] = [
    {
      title: "ID",
      key: "id",
      width: "80px",
    },
    {
      title: "Nome",
      key: "nome",
      render: (programa) => (
        <div>
          <div className="font-medium">{programa.nome}</div>
          {programa.leiNumero && (
            <div className="text-sm text-gray-500">{programa.leiNumero}</div>
          )}
        </div>
      ),
    },
    {
      title: "Secretaria",
      key: "secretaria",
      render: (programa) => {
        const cor = programaService.getSecretariaColor(programa.secretaria);
        const corClass = {
          green: "bg-green-100 text-green-800",
          blue: "bg-blue-100 text-blue-800",
          purple: "bg-purple-100 text-purple-800",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${corClass[cor]}`}
          >
            {programaService.formatarSecretaria(programa.secretaria)}
          </span>
        );
      },
    },
    {
      title: "Tipo",
      key: "tipoPrograma",
      render: (programa) => {
        const cores = {
          SUBSIDIO: "bg-green-100 text-green-800",
          MATERIAL: "bg-blue-100 text-blue-800",
          SERVICO: "bg-purple-100 text-purple-800",
          CREDITO: "bg-yellow-100 text-yellow-800",
          ASSISTENCIA: "bg-indigo-100 text-indigo-800",
        };

        const cor =
          cores[programa.tipoPrograma as keyof typeof cores] ||
          "bg-gray-100 text-gray-800";

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cor}`}>
            {programa.tipoPrograma.charAt(0).toUpperCase() +
              programa.tipoPrograma.slice(1).toLowerCase()}
          </span>
        );
      },
    },
    {
      title: "Descrição",
      key: "descricao",
      render: (programa) => programa.descricao || "-",
    },
    {
      title: "Regras",
      key: "regras",
      align: "center",
      render: (programa) => (
        <div className="text-center">
          {programa._count?.regras ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {programa._count.regras} regra
              {programa._count.regras !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              0 regras
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Criado em",
      key: "createdAt",
      render: (programa) => formatarData(programa.createdAt, false),
    },
  ];

  // Filtros rápidos - NOVOS FILTROS ADICIONADOS
  const quickFilters = [
    {
      label: "Agricultura",
      filter: (items: Programa[]) =>
        items.filter((p) => p.secretaria === TipoPerfil.AGRICULTURA),
    },
    {
      label: "Obras",
      filter: (items: Programa[]) =>
        items.filter((p) => p.secretaria === TipoPerfil.OBRAS),
    },
    {
      label: "Com Regras",
      filter: (items: Programa[]) =>
        items.filter((p) => (p._count?.regras || 0) > 0),
    },
    {
      label: "Sem Regras",
      filter: (items: Programa[]) =>
        items.filter((p) => (p._count?.regras || 0) === 0),
    },
  ];

  // Função para calcular métricas (simplificada)
  /*const calculateMetrics = (items: Programa[]) => {
    const total = items.length;
    const ativos = items.filter((p) => p.ativo).length;
    const agricultura = items.filter(
      (p) => p.secretaria === TipoPerfil.AGRICULTURA
    ).length;
    const obras = items.filter((p) => p.secretaria === TipoPerfil.OBRAS).length;
    const comRegras = items.filter((p) => (p._count?.regras || 0) > 0).length;
    const semRegras = total - comRegras;

    return {
      total,
      ativos,
      agricultura,
      obras,
      comRegras,
      semRegras,
    };
  };*/

  // Botões de ação adicionais
  const actionButtons = (
    <>
      <button
        onClick={() => window.open("/relatorios/programas", "_blank")}
        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-2"
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
        Relatório
      </button>

      <button
        onClick={() => console.log("Dashboard de programas")}
        className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Dashboard
      </button>
    </>
  );

  return (
    <CadastroBase<Programa, ProgramaDTO>
      title="Programas de Incentivo"
      service={programaService}
      columns={columns}
      rowKey="id"
      baseUrl="/cadastros/comum/programas"
      module="comum"
      FormComponent={ProgramaForm}
      searchPlaceholder="Buscar programas por nome, lei ou descrição..."
      actionButtons={actionButtons}
      enableStatusToggle={true}
      statusColumn={{
        title: "Status",
        activeText: "Ativo",
        inactiveText: "Inativo",
      }}
      // NOVAS PROPS ADICIONADAS
      quickFilters={quickFilters}
      showMetrics={true}
      //calculateMetrics={calculateMetrics}
      //enablePagination={true}
      //initialPageSize={50}
    />
  );
};

export default Programas;
