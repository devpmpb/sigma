// frontend/src/pages/cadastros/agricultura/regrasNegocio/RegrasNegocio.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { formatarData } from "../../../../utils/formatters";
import { Column } from "../../../../components/common/DataTable";
import regrasNegocioService, {
  RegrasNegocio,
  RegrasNegocioDTO,
} from "../../../../services/common/regrasNegocioService";
import programaService, { Programa } from "../../../../services/common/programaService";
import { CadastroBase } from "../../../../components/cadastro";
import RegrasNegocioForm from "./RegrasNegocioForm";

/**
 * Componente de Listagem de Regras de Negócio
 * Pode ser filtrado por programa específico
 */
const RegrasNegocioPage: React.FC = () => {
  const params = useParams({ strict: false });
  const programaId = params.programaId;
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [filteredService, setFilteredService] = useState(regrasNegocioService);

  // Carregar dados do programa se estiver filtrado
  useEffect(() => {
    const loadPrograma = async () => {
      if (programaId) {
        try {
          const programaData = await programaService.getById(programaId);
          setPrograma(programaData);
          
          // Criar serviço filtrado para este programa
          const serviceFiltered = {
            ...regrasNegocioService,
            getAll: () => regrasNegocioService.getByPrograma(programaId),
            buscarPorTermo: (termo: string) => {
              if (!termo.trim()) {
                return regrasNegocioService.getByPrograma(programaId);
              }
              // Implementar busca filtrada por programa
              return regrasNegocioService.getByPrograma(programaId).then(regras =>
                regras.filter(regra => 
                  regra.tipoRegra.toLowerCase().includes(termo.toLowerCase()) ||
                  regra.valorBeneficio.toString().includes(termo)
                )
              );
            }
          };
          
          setFilteredService(serviceFiltered as any);
        } catch (error) {
          console.error("Erro ao carregar programa:", error);
        }
      }
    };

    loadPrograma();
  }, [programaId]);

  // Definição das colunas da tabela
  const columns: Column<RegrasNegocio>[] = [
    { 
      title: "ID", 
      key: "id", 
      width: "80px" 
    },
    // Mostrar programa apenas se não estiver filtrado por um programa específico
    ...(programaId ? [] : [{
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
    }]),
    {
      title: "Tipo de Regra",
      key: "tipoRegra",
      render: (regra) => {
        const formatLabel = (tipo: string) => {
          return tipo.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
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
          {regrasNegocioService.formatarParametro(regra.parametro)}
        </div>
      ),
    },
    {
      title: "Valor Benefício",
      key: "valorBeneficio",
      align: "right",
      render: (regra) => (
        <div className="text-right font-medium">
          {regrasNegocioService.formatarValorBeneficio(regra.valorBeneficio)}
        </div>
      ),
    },
    {
      title: "Limite",
      key: "limiteBeneficio",
      render: (regra) => (
        <div className="text-sm">
          {regrasNegocioService.formatarLimite(regra.limiteBeneficio)}
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
  const pageTitle = programaId && programa 
    ? `Regras - ${programa.nome}`
    : "Regras de Negócio";

  // URL base baseada no contexto
  const baseUrl = programaId 
    ? `/cadastros/agricultura/regrasNegocio/programa/${programaId}`
    : "/cadastros/agricultura/regrasNegocio";

  // Botões de ação adicionais
  const actionButtons = (
    <>
      {programaId && programa && (
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Voltar ao Programa
        </button>
      )}
      
      <button
        onClick={() => window.open('/relatorios/regras-negocio', '_blank')}
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
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho com informações do programa (se filtrado) */}
      {programaId && programa && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">
                {programa.nome}
              </h2>
              <p className="text-blue-700">
                {programa.tipoPrograma} • {programa.leiNumero || "Sem lei definida"}
              </p>
              {programa.descricao && (
                <p className="text-blue-600 text-sm mt-1">
                  {programa.descricao}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {columns.length - 2} {/* Subtraindo ID e Data */}
              </div>
              <div className="text-blue-700 text-sm">regras configuradas</div>
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
        module="agricultura"
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