import React from "react";
import { CadastroBase } from "../../../../components/cadastro";
import { Column } from "../../../../components/comum/DataTable";
import propriedadeService, {
  Propriedade,
} from "../../../../services/comum/propriedadeService";
import PropriedadeForm from "./PropriedadeForm";

const PropriedadePage: React.FC = () => {
  const columns: Column<Propriedade>[] = [
    {
      title: "ID",
      key: "id",
      width: "60px",
    },
    {
      title: "Nome",
      key: "nome",
      render: (propriedade) => (
        <div>
          <div className="font-medium text-gray-900">{propriedade.nome}</div>
          {propriedade.matricula && (
            <div className="text-sm text-gray-500">
              Matrícula: {propriedade.matricula}
            </div>
          )}
          {/* NOVO: Mostrar logradouro e número */}
          {(propriedade.logradouro || propriedade.numero) && (
            <div className="text-sm text-gray-500">
              {propriedade.logradouro && propriedade.numero
                ? `${propriedade.logradouro.tipo} ${propriedade.logradouro.descricao}, ${propriedade.numero}`
                : propriedade.logradouro
                ? `${propriedade.logradouro.tipo} ${propriedade.logradouro.descricao}`
                : propriedade.numero}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tipo",
      key: "tipoPropriedade",
      render: (propriedade) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {propriedadeService.formatarTipoPropriedade(
            propriedade.tipoPropriedade
          )}
        </span>
      ),
    },
    {
      title: "Área Total",
      key: "areaTotal",
      align: "right",
      render: (propriedade) => (
        <div className="text-right">
          <div className="font-medium">
            {propriedadeService.formatarArea(
              propriedade.areaTotal,
              propriedade.tipoPropriedade
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Situação", // NOVA COLUNA
      key: "situacao",
      render: (propriedade) => {
        const cores = {
          PROPRIA: "bg-green-100 text-green-800",
          CONDOMINIO: "bg-yellow-100 text-yellow-800",
          USUFRUTO: "bg-purple-100 text-purple-800",
        };

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              cores[propriedade.situacao] || "bg-gray-100 text-gray-800"
            }`}
          >
            {propriedadeService.formatarSituacaoPropriedade(
              propriedade.situacao
            )}
          </span>
        );
      },
    },
    {
      title: "Proprietário",
      key: "proprietario",
      render: (propriedade) => (
        <div>
          {propriedade.proprietario ? (
            <>
              <div className="font-medium text-gray-900">
                {propriedade.proprietario.nome}
              </div>
              <div className="text-sm text-gray-500">
                {propriedade.proprietario.cpfCnpj}
              </div>
              {/* NOVO: Indicador se é residente */}
              {propriedade.proprietarioResidente && (
                <div className="text-xs text-green-600 font-medium">
                  📍 Residente
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400">Não informado</span>
          )}
        </div>
      ),
    },
    {
      title: "Informações Rurais", // NOVA COLUNA
      key: "informacoesRurais",
      render: (propriedade) => {
        if (!propriedadeService.isRural(propriedade.tipoPropriedade)) {
          return <span className="text-gray-400">-</span>;
        }

        return (
          <div className="text-sm">
            {propriedade.itr && (
              <div className="text-gray-700">ITR: {propriedade.itr}</div>
            )}
            {propriedade.incra && (
              <div className="text-gray-700">INCRA: {propriedade.incra}</div>
            )}
            {!propriedade.itr && !propriedade.incra && (
              <span className="text-gray-400">Não informado</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Localização",
      key: "localizacao",
      render: (propriedade) => (
        <div className="max-w-xs">
          {propriedade.localizacao ? (
            <div className="truncate" title={propriedade.localizacao}>
              {propriedade.localizacao}
            </div>
          ) : (
            <span className="text-gray-400">Não informada</span>
          )}
        </div>
      ),
    },
  ];

  // Botões de ação adicionais
  const actionButtons = (
    <>
      <button
        onClick={() => window.open("/relatorios/propriedades", "_blank")}
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

      {/* NOVO: Botão para filtrar por tipo */}
      <div className="relative inline-block">
        <select
          onChange={(e) => {
            if (e.target.value) {
              // Implementar filtro por tipo se necessário
              console.log("Filtrar por tipo:", e.target.value);
            }
          }}
          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Filtrar por Tipo</option>
          {propriedadeService.getTiposPropriedade().map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>
      </div>
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
      searchPlaceholder="Buscar por nome, matrícula, proprietário, logradouro..."
      actionButtons={actionButtons}
    />
  );
};

export default PropriedadePage;
