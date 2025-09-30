// frontend/src/pages/cadastros/comum/regrasNegocio/RegrasNegocio.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { formatarData } from "../../../../utils/formatters";
import { Column } from "../../../../components/comum/DataTable";
import regrasNegocioService, {
  RegrasNegocio,
  RegrasNegocioDTO,
} from "../../../../services/comum/regrasNegocioService";
import programaService, {
  Programa,
} from "../../../../services/comum/programaService";
import { CadastroBase } from "../../../../components/cadastro";
import RegrasNegocioForm from "./RegrasNegocioForm";

const RegrasNegocioPage: React.FC = () => {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const programaId = params.programaId;
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [filteredService, setFilteredService] = useState<any>(null); // ✅ CORRIGIDO: Iniciar como null
  const [loading, setLoading] = useState(true); // ✅ NOVO: Estado de carregamento

  // Carregar dados do programa se estiver filtrado
  useEffect(() => {
    const loadPrograma = async () => {
      setLoading(true); // ✅ Iniciar carregamento

      if (programaId) {
        try {
          const programaData = await programaService.getById(programaId);
          setPrograma(programaData);

          // ✅ CRIAR SERVICE FILTRADO
          const serviceFiltered = {
            ...regrasNegocioService,

            // Sobrescrever getAll para filtrar por programa
            getAll: async () => {
              console.log(`🔍 Carregando regras do programa ${programaId}`);
              return await regrasNegocioService.getByPrograma(programaId);
            },

            // Sobrescrever buscarPorTermo para manter filtro
            buscarPorTermo: async (termo: string) => {
              if (!termo.trim()) {
                return await regrasNegocioService.getByPrograma(programaId);
              }

              // Buscar todas as regras do programa e filtrar localmente
              const regras = await regrasNegocioService.getByPrograma(
                programaId
              );
              return regras.filter(
                (regra) =>
                  regra.tipoRegra.toLowerCase().includes(termo.toLowerCase()) ||
                  regra.valorBeneficio.toString().includes(termo)
              );
            },

            // Preservar métodos com bind para manter contexto
            create: regrasNegocioService.create.bind(regrasNegocioService),
            update: regrasNegocioService.update.bind(regrasNegocioService),
            delete: regrasNegocioService.delete.bind(regrasNegocioService),
            getById: regrasNegocioService.getById.bind(regrasNegocioService),
            toggleStatus:
              regrasNegocioService.toggleStatus?.bind(regrasNegocioService),
          };

          setFilteredService(serviceFiltered);
        } catch (error) {
          console.error("Erro ao carregar programa:", error);
          // ✅ Em caso de erro, usar serviço original
          setFilteredService(regrasNegocioService);
        }
      } else {
        // ✅ Se não há programa, usar serviço original
        setFilteredService(regrasNegocioService);
      }

      setLoading(false); // ✅ Finalizar carregamento
    };

    loadPrograma();
  }, [programaId]); // ✅ Reexecutar quando programaId mudar

  // Função para voltar aos programas
  const handleVoltarPrograma = () => {
    if (programaId) {
      navigate({ to: `/cadastros/comum/programas/${programaId}` });
    } else {
      navigate({ to: "/cadastros/comum/programas" });
    }
  };

  // Definição das colunas da tabela
  const columns: Column<RegrasNegocio>[] = [
    {
      title: "ID",
      key: "id",
      width: "80px",
    },
    // ✅ Mostrar programa apenas se não estiver filtrado por um programa específico
    ...(programaId
      ? []
      : [
          {
            title: "Programa",
            key: "programa",
            render: (regra: RegrasNegocio) => (
              <div>
                <div className="font-medium">{regra.programa?.nome}</div>
                <div className="text-sm text-gray-500">
                  {regra.programa?.tipoPrograma}
                </div>
              </div>
            ),
          },
        ]),
    {
      title: "Tipo de Regra",
      key: "tipoRegra",
      render: (regra) => {
        const formatLabel = (tipo: string) => {
          return tipo
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        };

        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {formatLabel(regra.tipoRegra)}
          </span>
        );
      },
    },
    {
      title: "Parâmetro",
      key: "parametro",
      render: (regra) => (
        <div className="text-sm">
          {regra.parametro
            ? `${regra.parametro.condicao} ${
                regra.parametro.valor || regra.parametro.valorMinimo || ""
              } ${regra.parametro.unidade || ""}`.trim()
            : "Sem parâmetro"}
        </div>
      ),
    },
    {
      title: "Valor Benefício",
      key: "valorBeneficio",
      align: "right",
      render: (regra) => (
        <div className="text-right font-medium">
          R$ {Number(regra.valorBeneficio).toFixed(2)}
        </div>
      ),
    },
    {
      title: "Limite",
      key: "limiteBeneficio",
      render: (regra) => (
        <div className="text-sm">
          {regra.limiteBeneficio
            ? `${regra.limiteBeneficio.tipo}: ${regra.limiteBeneficio.limite} ${
                regra.limiteBeneficio.unidade || ""
              }`.trim()
            : "Sem limite"}
        </div>
      ),
    },
    {
      title: "Criado em",
      key: "createdAt",
      render: (regra) => formatarData(regra.createdAt, false),
    },
  ];

  // Título da página baseado no contexto
  const pageTitle =
    programaId && programa ? `Regras - ${programa.nome}` : "Regras de Negócio";

  // URL base baseada no contexto
  const baseUrl = programaId
    ? `/cadastros/comum/regrasNegocio/programa/${programaId}`
    : "/cadastros/comum/regrasNegocio";

  // Botões de ação adicionais
  const actionButtons = (
    <>
      <button
        onClick={() => window.open("/relatorios/regras-negocio", "_blank")}
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

  // ✅ NOVO: Mostrar loading enquanto carrega
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando regras...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ NOVO: Não renderizar CadastroBase até ter o service pronto
  if (!filteredService) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            ⚠️ Erro ao carregar o serviço de regras. Por favor, recarregue a
            página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button
              onClick={() => navigate({ to: "/cadastros/comum/programas" })}
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
              </svg>
              Programas
            </button>
          </li>
          {programa && (
            <>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <button
                    onClick={() =>
                      navigate({
                        to: `/cadastros/comum/programas/${programaId}`,
                      })
                    }
                    className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                  >
                    {programa.nome}
                  </button>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    Regras
                  </span>
                </div>
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Card de informação do programa (se estiver filtrado) */}
      {programaId && programa && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-blue-900 mb-1">
                  {programa.nome}
                </h2>
                {programa.leiNumero && (
                  <p className="text-sm text-blue-700 mb-2">
                    {programa.leiNumero}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-sm">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                    {programa.tipoPrograma}
                  </span>
                  <span className="text-blue-700">
                    📋 Gerenciando regras deste programa
                  </span>
                </div>
              </div>
              <button
                onClick={handleVoltarPrograma}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Voltar ao Programa
              </button>
            </div>
          </div>
        </div>
      )}

      <CadastroBase<RegrasNegocio, RegrasNegocioDTO>
        title={pageTitle}
        service={filteredService}
        columns={columns}
        rowKey="id"
        baseUrl={baseUrl}
        module="comum"
        FormComponent={(props) => (
          <RegrasNegocioForm
            {...props}
            programaId={programaId ? Number(programaId) : undefined}
          />
        )}
        searchPlaceholder="Buscar regras por tipo ou valor..."
        actionButtons={actionButtons}
      />
    </div>
  );
};

export default RegrasNegocioPage;
