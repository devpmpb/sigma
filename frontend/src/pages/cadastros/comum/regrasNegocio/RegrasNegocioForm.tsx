import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import regrasNegocioService, {
  RegrasNegocio,
  RegrasNegocioDTO,
  ParametroRegra,
  LimiteBeneficio,
  CondicaoRegra,
  TipoLimite,
  TipoRegraOption,
  TemplateRegra,
} from "../../../../services/comum/regrasNegocioService";
import programaService, {
  Programa,
} from "../../../../services/comum/programaService";
import { FormBase } from "../../../../components/cadastro";
import { FormField } from "../../../../components/comum";

interface RegrasNegocioFormProps {
  id?: string | number;
  onSave: () => void;
  programaId?: number;
}

/**
 * Componente de Formulário de Regras de Negócio
 * Suporta configuração dinâmica de parâmetros e limites
 */
const RegrasNegocioForm: React.FC<RegrasNegocioFormProps> = ({
  id,
  onSave,
  programaId: propProgramaId,
}) => {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const regraId = id || params.id;
  const programaIdFromUrl = params.programaId;
  const finalProgramaId =
    propProgramaId ||
    (programaIdFromUrl ? Number(programaIdFromUrl) : undefined);

  const [programas, setProgramas] = useState<Programa[]>([]);
  const [tiposRegra, setTiposRegra] = useState<TipoRegraOption[]>([]);
  const [templateRegra, setTemplateRegra] = useState<TemplateRegra | null>(
    null
  );
  const [selectedTipoRegra, setSelectedTipoRegra] = useState<string>("");
  const [programaInfo, setProgramaInfo] = useState<{
    nome: string;
    leiNumero?: string;
  } | null>(null);

  // Estados para parâmetros
  const [parametro, setParametro] = useState<ParametroRegra>({
    condicao: CondicaoRegra.MENOR_QUE,
    valor: "",
    unidade: "",
    descricao: "",
  });

  // Estados para limites
  const [limiteBeneficio, setLimiteBeneficio] = useState<LimiteBeneficio>({
    tipo: TipoLimite.VALOR,
    limite: 0,
    unidade: "",
  });

  const [hasLimite, setHasLimite] = useState(false);
  const [hasMultiplicador, setHasMultiplicador] = useState(false);
  const [hasLimitePorPeriodo, setHasLimitePorPeriodo] = useState(false);

  // Valor inicial para o formulário
  const initialValues: RegrasNegocioDTO = {
    programaId: finalProgramaId || 0,
    tipoRegra: "",
    parametro: parametro,
    valorBeneficio: 0,
    limiteBeneficio: undefined,
  };

  // Carregar informações do programa - NOVO
  useEffect(() => {
    const loadProgramaInfo = async () => {
      if (finalProgramaId) {
        try {
          const programa = await programaService.getById(finalProgramaId);
          setProgramaInfo({
            nome: programa.nome,
            leiNumero: programa.leiNumero,
          });
        } catch (error) {
          console.error("Erro ao carregar programa:", error);
        }
      }
    };

    loadProgramaInfo();
  }, [finalProgramaId]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Carregar programas
        const programasData = await programaService.getAll();
        setProgramas(programasData.filter((p) => p.ativo));

        // Carregar tipos de regra
        const tiposData = await regrasNegocioService.getTiposRegra();
        setTiposRegra(tiposData);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };

    loadInitialData();
  }, []);

  // Carregar template quando tipo de regra mudar
  useEffect(() => {
    const loadTemplate = async () => {
      if (selectedTipoRegra) {
        try {
          const template = await regrasNegocioService.getTemplateRegra(
            selectedTipoRegra
          );
          setTemplateRegra(template);
          setParametro(template.parametro);
          setLimiteBeneficio(template.limiteBeneficio);
          setHasLimite(true);
          setHasMultiplicador(!!template.limiteBeneficio.multiplicador);
          setHasLimitePorPeriodo(!!template.limiteBeneficio.limitePorPeriodo);
        } catch (error) {
          console.error("Erro ao carregar template:", error);
        }
      }
    };

    loadTemplate();
  }, [selectedTipoRegra]);

  // Função para determinar URL de retorno - NOVO
  const getReturnUrl = () => {
    if (finalProgramaId) {
      return `/cadastros/comum/regrasNegocio/programa/${finalProgramaId}`;
    }
    return "/cadastros/comum/regrasNegocio";
  };

  // Função personalizada para callback após salvar - NOVO
  const handleSave = () => {
    navigate({ to: getReturnUrl() });
  };

  // Validação do formulário
  const validate = (values: RegrasNegocioDTO) => {
    const errors: Record<string, string> = {};

    if (!values.programaId) {
      errors.programaId = "Programa é obrigatório";
    }

    if (!values.tipoRegra) {
      errors.tipoRegra = "Tipo de regra é obrigatório";
    }

    if (!values.valorBeneficio || values.valorBeneficio <= 0) {
      errors.valorBeneficio = "Valor do benefício deve ser maior que zero";
    }

    // Validações específicas dos parâmetros
    if (parametro.condicao === CondicaoRegra.ENTRE) {
      if (!parametro.valorMinimo || !parametro.valorMaximo) {
        errors.parametro =
          "Valor mínimo e máximo são obrigatórios para condição 'entre'";
      } else if (parametro.valorMinimo >= parametro.valorMaximo) {
        errors.parametro = "Valor mínimo deve ser menor que o valor máximo";
      }
    } else if (
      [
        CondicaoRegra.MENOR_QUE,
        CondicaoRegra.MAIOR_QUE,
        CondicaoRegra.IGUAL_A,
      ].includes(parametro.condicao)
    ) {
      if (!parametro.valor) {
        errors.parametro = "Valor é obrigatório para esta condição";
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Função para atualizar parâmetro
  const updateParametro = (field: keyof ParametroRegra, value: any) => {
    setParametro((prev) => ({ ...prev, [field]: value }));
  };

  // Função para atualizar limite
  const updateLimite = (field: keyof LimiteBeneficio, value: any) => {
    setLimiteBeneficio((prev) => ({ ...prev, [field]: value }));
  };

  // Função para construir dados finais
  const buildFinalData = (values: RegrasNegocioDTO): RegrasNegocioDTO => {
    const finalData = {
      ...values,
      parametro: { ...parametro },
      limiteBeneficio: hasLimite ? { ...limiteBeneficio } : undefined,
    };

    // Limpar campos não utilizados do limite
    if (finalData.limiteBeneficio) {
      if (!hasMultiplicador) {
        delete finalData.limiteBeneficio.multiplicador;
      }
      if (!hasLimitePorPeriodo) {
        delete finalData.limiteBeneficio.limitePorPeriodo;
      }
    }

    return finalData;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb - NOVO */}
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
          {finalProgramaId && programaInfo && (
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
                      to: `/cadastros/comum/programas/${finalProgramaId}`,
                    })
                  }
                  className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                >
                  {programaInfo.nome}
                </button>
              </div>
            </li>
          )}
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
                onClick={() => navigate({ to: getReturnUrl() })}
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
              >
                Regras de Negócio
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
                {regraId && regraId !== "novo" ? "Editar Regra" : "Nova Regra"}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Cabeçalho do programa (se estiver editando regra de programa específico) - NOVO */}
      {finalProgramaId && programaInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">
                {regraId && regraId !== "novo"
                  ? "Editando regra do programa:"
                  : "Criando nova regra para:"}
              </h2>
              <p className="text-blue-700 font-medium">
                📋 {programaInfo.nome}
                {programaInfo.leiNumero && (
                  <span className="text-blue-600 ml-2">
                    • {programaInfo.leiNumero}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => navigate({ to: getReturnUrl() })}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Voltar às Regras
            </button>
          </div>
        </div>
      )}

      <FormBase<RegrasNegocio, RegrasNegocioDTO>
        title="Regra de Negócio"
        service={{
          ...regrasNegocioService,
          create: (data: RegrasNegocioDTO) =>
            regrasNegocioService.create(buildFinalData(data)),
          update: (id: number | string, data: RegrasNegocioDTO) =>
            regrasNegocioService.update(id, buildFinalData(data)),
        }}
        id={regraId}
        initialValues={initialValues}
        validate={validate}
        returnUrl={getReturnUrl()}
        onSave={handleSave}
      >
        {({ values, errors, touched, handleChange, setValue }) => (
          <>
            {/* Campo Programa */}
            <FormField
              name="programaId"
              label="Programa"
              error={errors.programaId}
              touched={touched.programaId}
              required
            >
              <select
                id="programaId"
                name="programaId"
                value={values.programaId}
                onChange={handleChange}
                disabled={!!finalProgramaId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Selecione um programa...</option>
                {programas.map((programa) => (
                  <option key={programa.id} value={programa.id}>
                    {programa.nome} ({programa.tipoPrograma})
                  </option>
                ))}
              </select>
            </FormField>

            {/* Campo Tipo de Regra */}
            <FormField
              name="tipoRegra"
              label="Tipo de Regra"
              error={errors.tipoRegra}
              touched={touched.tipoRegra}
              required
            >
              <select
                id="tipoRegra"
                name="tipoRegra"
                value={values.tipoRegra}
                onChange={(e) => {
                  handleChange(e);
                  setSelectedTipoRegra(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um tipo...</option>
                {tiposRegra.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Campo Valor do Benefício */}
            <FormField
              name="valorBeneficio"
              label="Valor do Benefício (R$)"
              error={errors.valorBeneficio}
              touched={touched.valorBeneficio}
              required
            >
              <input
                type="number"
                id="valorBeneficio"
                name="valorBeneficio"
                value={values.valorBeneficio}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </FormField>

            {/* Seção de Parâmetros */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Parâmetros da Regra
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="parametro.condicao" label="Condição">
                  <select
                    value={parametro.condicao}
                    onChange={(e) =>
                      updateParametro("condicao", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {regrasNegocioService.getCondicoes().map((condicao) => (
                      <option key={condicao.value} value={condicao.value}>
                        {condicao.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField name="parametro.unidade" label="Unidade">
                  <input
                    type="text"
                    value={parametro.unidade || ""}
                    onChange={(e) => updateParametro("unidade", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: alqueires, hectares..."
                  />
                </FormField>

                {/* Campos condicionais baseados na condição */}
                {parametro.condicao === CondicaoRegra.ENTRE && (
                  <>
                    <FormField
                      name="parametro.valorMinimo"
                      label="Valor Mínimo"
                    >
                      <input
                        type="number"
                        value={parametro.valorMinimo || ""}
                        onChange={(e) =>
                          updateParametro("valorMinimo", Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </FormField>
                    <FormField
                      name="parametro.valorMaximo"
                      label="Valor Máximo"
                    >
                      <input
                        type="number"
                        value={parametro.valorMaximo || ""}
                        onChange={(e) =>
                          updateParametro("valorMaximo", Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </FormField>
                  </>
                )}

                {[
                  CondicaoRegra.MENOR_QUE,
                  CondicaoRegra.MAIOR_QUE,
                  CondicaoRegra.IGUAL_A,
                ].includes(parametro.condicao) && (
                  <FormField name="parametro.valor" label="Valor">
                    <input
                      type="number"
                      value={parametro.valor || ""}
                      onChange={(e) => updateParametro("valor", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormField>
                )}
              </div>

              <FormField name="parametro.descricao" label="Descrição">
                <textarea
                  value={parametro.descricao || ""}
                  onChange={(e) => updateParametro("descricao", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição detalhada da condição..."
                />
              </FormField>
            </div>

            {/* Seção de Limites */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Limites do Benefício
                </h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hasLimite}
                    onChange={(e) => setHasLimite(e.target.checked)}
                    className="mr-2"
                  />
                  Aplicar limites
                </label>
              </div>

              {hasLimite && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField name="limite.tipo" label="Tipo de Limite">
                      <select
                        value={limiteBeneficio.tipo}
                        onChange={(e) => updateLimite("tipo", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {regrasNegocioService.getTiposLimite().map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField name="limite.limite" label="Valor do Limite">
                      <input
                        type="number"
                        value={limiteBeneficio.limite}
                        onChange={(e) =>
                          updateLimite("limite", Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </FormField>

                    <FormField name="limite.unidade" label="Unidade">
                      <input
                        type="text"
                        value={limiteBeneficio.unidade || ""}
                        onChange={(e) =>
                          updateLimite("unidade", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: toneladas, quilos..."
                      />
                    </FormField>
                  </div>

                  {/* Opções adicionais de limite */}
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasMultiplicador}
                        onChange={(e) => setHasMultiplicador(e.target.checked)}
                        className="mr-2"
                      />
                      Aplicar multiplicador
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasLimitePorPeriodo}
                        onChange={(e) =>
                          setHasLimitePorPeriodo(e.target.checked)
                        }
                        className="mr-2"
                      />
                      Definir limite por período
                    </label>
                  </div>

                  {/* Seções condicionais para multiplicador e período */}
                  {hasMultiplicador && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-medium mb-2">Multiplicador</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField name="multiplicador.base" label="Base">
                          <select
                            value={limiteBeneficio.multiplicador?.base || ""}
                            onChange={(e) =>
                              updateLimite("multiplicador", {
                                ...limiteBeneficio.multiplicador,
                                base: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {regrasNegocioService
                              .getBasesMultiplicador()
                              .map((base) => (
                                <option key={base.value} value={base.value}>
                                  {base.label}
                                </option>
                              ))}
                          </select>
                        </FormField>
                        <FormField name="multiplicador.fator" label="Fator">
                          <input
                            type="number"
                            value={limiteBeneficio.multiplicador?.fator || ""}
                            onChange={(e) =>
                              updateLimite("multiplicador", {
                                ...limiteBeneficio.multiplicador,
                                fator: Number(e.target.value),
                              })
                            }
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </FormField>
                      </div>
                    </div>
                  )}

                  {hasLimitePorPeriodo && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-medium mb-2">Limite por Período</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField name="periodo.periodo" label="Período">
                          <select
                            value={
                              limiteBeneficio.limitePorPeriodo?.periodo || ""
                            }
                            onChange={(e) =>
                              updateLimite("limitePorPeriodo", {
                                ...limiteBeneficio.limitePorPeriodo,
                                periodo: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {regrasNegocioService
                              .getPeriodos()
                              .map((periodo) => (
                                <option
                                  key={periodo.value}
                                  value={periodo.value}
                                >
                                  {periodo.label}
                                </option>
                              ))}
                          </select>
                        </FormField>
                        <FormField name="periodo.quantidade" label="Quantidade">
                          <input
                            type="number"
                            value={
                              limiteBeneficio.limitePorPeriodo?.quantidade || ""
                            }
                            onChange={(e) =>
                              updateLimite("limitePorPeriodo", {
                                ...limiteBeneficio.limitePorPeriodo,
                                quantidade: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </FormField>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </FormBase>
    </div>
  );
};

export default RegrasNegocioForm;
