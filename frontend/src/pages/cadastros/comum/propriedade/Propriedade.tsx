import React from "react";
import { CadastroBase } from "../../../../components/cadastro";
import { Column } from "../../../../components/common/DataTable";
import propriedadeService, { Propriedade } from "../../../../services/common/propriedadeService";
import PropriedadeForm from "./PropriedadeForm";

/**
 * Página de listagem de propriedades
 */
const PropriedadePage: React.FC = () => {
  // Definição das colunas da tabela
  const columns: Column<Propriedade>[] = [
    { 
      title: "ID", 
      key: "id", 
      width: "80px" 
    },
    {
      title: "Nome",
      key: "nome",
      render: (propriedade) => (
        <div>
          <div className="font-medium text-gray-900">{propriedade.nome}</div>
          {propriedade.matricula && (
            <div className="text-sm text-gray-500">Matrícula: {propriedade.matricula}</div>
          )}
        </div>
      ),
    },
    {
      title: "Tipo",
      key: "tipoPropriedade",
      render: (propriedade) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {propriedadeService.formatarTipoPropriedade(propriedade.tipoPropriedade)}
        </span>
      ),
    },
    {
      title: "Área Total",
      key: "areaTotal",
      align: "right",
      render: (propriedade) => (
        <div className="text-right">
          <div className="font-medium">{propriedadeService.formatarArea(propriedade.areaTotal)} alq</div>
        </div>
      ),
    },
    {
      title: "Proprietário",
      key: "proprietario",
      render: (propriedade) => (
        <div>
          {propriedade.proprietario ? (
            <>
              <div className="font-medium text-gray-900">{propriedade.proprietario.nome}</div>
              <div className="text-sm text-gray-500">{propriedade.proprietario.cpfCnpj}</div>
            </>
          ) : (
            <span className="text-gray-400">Não informado</span>
          )}
        </div>
      ),
    },
    {
      title: "Localização",
      key: "localizacao",
      render: (propriedade) => (
        <div className="max-w-xs truncate" title={propriedade.localizacao}>
          {propriedade.localizacao || <span className="text-gray-400">Não informada</span>}
        </div>
      ),
    },
  ];

  // Botões de ação adicionais
  const actionButtons = (
    <>
      <button
        onClick={() => window.open('/relatorios/propriedades', '_blank')}
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
    </>
  );

  return (
    <CadastroBase
      title="Propriedades"
      service={propriedadeService}
      columns={columns}
      rowKey="id"
      baseUrl="/cadastros/comum/propriedades"
      module="comum"
      FormComponent={PropriedadeForm}
      searchPlaceholder="Buscar por nome, matrícula ou proprietário..."
      actionButtons={actionButtons}
    />
  );
};

export default PropriedadePage;