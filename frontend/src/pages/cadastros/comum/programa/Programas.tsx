import React from "react";
import { formatarData, formatarMoeda } from "../../../../utils/formatters";
import StatusBadge from "../../../../components/comum/StatusBadge";
import { Column } from "../../../../components/comum/DataTable";
import programaService, {
  Programa,
  ProgramaDTO,
} from "../../../../services/comum/programaService";
import { CadastroBase } from "../../../../components/cadastro";
import ProgramaForm from "./ProgramaForm";

/**
 * Componente de Listagem de Programas de Incentivo
 * Utiliza o CadastroBase para mostrar a listagem
 */
const Programas: React.FC = () => {
  // Definição das colunas da tabela
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
      title: "Tipo",
      key: "tipoPrograma",
      render: (programa) => {
        const cores = {
          subsidio: "bg-green-100 text-green-800",
          material: "bg-blue-100 text-blue-800",
          servico: "bg-purple-100 text-purple-800",
          credito: "bg-yellow-100 text-yellow-800",
          assistencia: "bg-indigo-100 text-indigo-800",
        };

        const cor =
          cores[programa.tipoPrograma as keyof typeof cores] ||
          "bg-gray-100 text-gray-800";

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cor}`}>
            {programa.tipoPrograma.charAt(0).toUpperCase() +
              programa.tipoPrograma.slice(1)}
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
            <span className="text-gray-400">0 regras</span>
          )}
        </div>
      ),
    },
    {
      title: "Solicitações",
      key: "solicitacoes",
      align: "center",
      render: (programa) => (
        <div className="text-center">
          <span className="text-sm text-gray-600">
            {programa._count?.solicitacoes || 0}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      key: "ativo",
      render: (programa) => (
        <StatusBadge ativo={programa.ativo} showToggle={false} />
      ),
    },
    {
      title: "Criado em",
      key: "createdAt",
      render: (programa) => formatarData(programa.createdAt, false),
    },
  ];

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
        onClick={() => window.open("/dashboards/programas", "_blank")}
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
    />
  );
};

export default Programas;
