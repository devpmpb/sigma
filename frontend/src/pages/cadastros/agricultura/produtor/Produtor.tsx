import React from "react";
import { CadastroBase } from "../../../../components/cadastro";
import { Column } from "../../../../components/common/DataTable";
import produtorService, { Produtor } from "../../../../services/common/produtorService";
import ProdutorForm from "./ProdutorForm";

/**
 * Página de listagem de produtores rurais
 */
const ProdutorPage: React.FC = () => {
  // Definição das colunas da tabela
  const columns: Column<Produtor>[] = [
    { 
      title: "ID", 
      key: "id", 
      width: "80px" 
    },
    {
      title: "Produtor",
      key: "pessoa",
      render: (produtor) => (
        <div>
          {produtor.pessoa ? (
            <>
              <div className="font-medium text-gray-900">{produtor.pessoa.nome}</div>
              <div className="text-sm text-gray-500">{produtor.pessoa.cpfCnpj}</div>
              {produtor.pessoa.telefone && (
                <div className="text-xs text-gray-400">{produtor.pessoa.telefone}</div>
              )}
            </>
          ) : (
            <span className="text-gray-400">Dados não encontrados</span>
          )}
        </div>
      ),
    },
    {
      title: "Tipo",
      key: "tipoProdutor",
      render: (produtor) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {produtorService.formatarTipoProdutor(produtor.tipoProdutor)}
        </span>
      ),
    },
    {
      title: "Atividade Principal",
      key: "atividadePrincipal",
      render: (produtor) => (
        <div className="text-sm">
          {produtorService.formatarAtividadePrincipal(produtor.atividadePrincipal)}
        </div>
      ),
    },
    {
      title: "DAP",
      key: "dap",
      render: (produtor) => (
        <div className="text-sm">
          {produtor.dap ? (
            <span className="text-green-600 font-medium">
              {produtorService.formatarDAP(produtor.dap)}
            </span>
          ) : (
            <span className="text-gray-400">Não possui</span>
          )}
        </div>
      ),
    },
    {
      title: "Área Efetiva",
      key: "areaEfetiva",
      align: "right",
      render: (produtor) => (
        <div className="text-right">
          {produtor.areaEfetiva ? (
            <>
              <div className="font-medium">
                {produtorService.formatarArea(produtor.areaEfetiva.areaEfetiva)} alq
              </div>
              <div className="text-xs text-gray-500">
                Ano: {produtor.areaEfetiva.anoReferencia}
              </div>
            </>
          ) : (
            <span className="text-gray-400">Não informada</span>
          )}
        </div>
      ),
    },
    {
      title: "Assistência",
      key: "contratoAssistencia",
      align: "center",
      render: (produtor) => (
        <div className="text-center">
          {produtor.contratoAssistencia ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Sim
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Não
            </span>
          )}
        </div>
      ),
    },
  ];

  // Botões de ação adicionais
  const actionButtons = (
    <>
      <button
        onClick={() => window.open('/relatorios/produtores', '_blank')}
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
        onClick={() => window.open('/relatorios/areas-efetivas', '_blank')}
        className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        Áreas Efetivas
      </button>
    </>
  );

  return (
    <CadastroBase
      title="Produtores Rurais"
      service={produtorService}
      columns={columns}
      rowKey="id"
      baseUrl="/cadastros/agricultura/produtores"
      module="agricultura"
      FormComponent={ProdutorForm}
      searchPlaceholder="Buscar por nome, CPF, DAP ou atividade..."
      actionButtons={actionButtons}
    />
  );
};

export default ProdutorPage;