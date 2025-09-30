// frontend/src/pages/cadastros/comum/regrasNegocio/RegrasNegocioForm.tsx
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
  TipoRegra,
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
 * Corrigido para carregar dados JSON corretamente
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

  // Estado para dados carregados da regra existente
  const [loadedRegra, setLoadedRegra] = useState<RegrasNegocio | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
  const [initialValues, setInitialValues] = useState<RegrasNegocioDTO>({
    programaId: finalProgramaId || 0,
    tipoRegra: TipoRegra.AREA_CONSTRUCAO,
    parametro: parametro,
    valorBeneficio: 0,
    limiteBeneficio: undefined,
  });

  // CORREÇÃO PRINCIPAL: Carregar dados da regra ao editar
  useEffect(() => {
    const loadRegraData = async () => {
      if (regraId && regraId !== "novo") {
        setIsLoading(true);
        try {
          const regra = await regrasNegocioService.getById(regraId);
          setLoadedRegra(regra);

          // Processar parametro JSON
          let parametroData = regra.parametro;
          if (typeof parametroData === "string") {
            try {
              parametroData = JSON.parse(parametroData);
            } catch (e) {
              console.error("Erro ao fazer parse do parametro:", e);
            }
          }

          // Processar limiteBeneficio JSON
          let limiteData = regra.limiteBeneficio;
          if (typeof limiteData === "string") {
            try {
              limiteData = JSON.parse(limiteData);
            } catch (e) {
              console.error("Erro ao fazer parse do limiteBeneficio:", e);
            }
          }

          // Atualizar estados com dados carregados
          setParametro({
            condicao: parametroData?.condicao || CondicaoRegra.MENOR_QUE,
            valor: parametroData?.valor || "",
            valorMinimo: parametroData?.valorMinimo,
            valorMaximo: parametroData?.valorMaximo,
            unidade: parametroData?.unidade || "",
            descricao: parametroData?.descricao || "",
            ...parametroData, // Incluir outros campos customizados
          });

          if (limiteData) {
            setLimiteBeneficio({
              tipo: limiteData.tipo || TipoLimite.VALOR,
              limite: limiteData.limite || 0,
              unidade: limiteData.unidade || "",
              limitePorPeriodo: limiteData.limitePorPeriodo,
              multiplicador: limiteData.multiplicador,
              ...limiteData, // Incluir outros campos customizados
            });
            setHasLimite(true);
            setHasMultiplicador(!!limiteData.multiplicador);
            setHasLimitePorPeriodo(!!limiteData.limitePorPeriodo);
          }

          // Atualizar valores iniciais do formulário
          setInitialValues({
            programaId: regra.programaId,
            tipoRegra: regra.tipoRegra as TipoRegra,
            parametro: parametroData,
            valorBeneficio: Number(regra.valorBeneficio),
            limiteBeneficio: limiteData || undefined,
          });

          setSelectedTipoRegra(regra.tipoRegra);
        } catch (error) {
          console.error("Erro ao carregar regra:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadRegraData();
  }, [regraId]);

  // Carregar informações do programa
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

  // NÃO carregar template quando editando uma regra existente
  useEffect(() => {
    const loadTemplate = async () => {
      // Só carregar template se for novo cadastro e tipo foi selecionado
      if (selectedTipoRegra && !loadedRegra) {
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
  }, [selectedTipoRegra, loadedRegra]);

  const getReturnUrl = () => {
    if (finalProgramaId) {
      return `/cadastros/comum/regrasNegocio/programa/${finalProgramaId}`;
    }
    return "/cadastros/comum/regrasNegocio";
  };

  // Função personalizada para callback após salvar
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
  const updateParametro = (
    field: keyof ParametroRegra | string,
    value: any
  ) => {
    setParametro((prev) => ({ ...prev, [field]: value }));
  };

  // Função para atualizar limite
  const updateLimite = (field: keyof LimiteBeneficio | string, value: any) => {
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

  // Função para processar campos customizados do parametro
  const renderCustomParametroFields = () => {
    // Para regras das leis cadastradas, renderizar campos específicos
    const tipoRegra = selectedTipoRegra || loadedRegra?.tipoRegra;

    if (!tipoRegra) return null;

    // Campos específicos por tipo de regra
    if (tipoRegra.includes("area_propriedade")) {
      return (
        <FormField
          name="parametro.incluiArrendamento"
          label="Incluir Arrendamento?"
        >
          <input
            type="checkbox"
            checked={parametro.incluiArrendamento || false}
            onChange={(e) =>
              updateParametro("incluiArrendamento", e.target.checked)
            }
            className="mr-2"
          />
          <span>Somar área arrendada na validação</span>
        </FormField>
      );
    }

    if (tipoRegra.includes("equipamento")) {
      return (
        <FormField name="parametro.tipoEquipamento" label="Tipo de Equipamento">
          <select
            value={parametro.tipoEquipamento || ""}
            onChange={(e) => updateParametro("tipoEquipamento", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Selecione...</option>
            <option value="ordenhadeira">Ordenhadeira</option>
            <option value="resfriador">Resfriador</option>
          </select>
        </FormField>
      );
    }

    if (tipoRegra.includes("inseminacao")) {
      return (
        <>
          <FormField name="parametro.tipoAnimal" label="Tipo de Animal">
            <select
              value={parametro.tipoAnimal || ""}
              onChange={(e) => updateParametro("tipoAnimal", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Selecione...</option>
              <option value="bovino">Bovino</option>
              <option value="suino">Suíno</option>
            </select>
          </FormField>

          <FormField name="parametro.modalidade" label="Modalidade">
            <select
              value={parametro.modalidade || ""}
              onChange={(e) => updateParametro("modalidade", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Selecione...</option>
              <option value="fornecimento_municipio">
                Fornecimento pelo Município
              </option>
              <option value="retirada_secretaria">
                Retirada na Secretaria
              </option>
              <option value="reembolso">Reembolso</option>
            </select>
          </FormField>
        </>
      );
    }

    return null;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando dados...</div>;
  }

  return (
    <FormBase<RegrasNegocio, RegrasNegocioDTO>
      title="Regra de Negócio"
      service={regrasNegocioService}
      id={regraId}
      initialValues={initialValues}
      validate={validate}
      returnUrl={getReturnUrl()}
      onSave={handleSave}
      transformBeforeSave={buildFinalData}
    >
      {({ values, errors, touched, handleChange, setValue }) => (
        <>
          {/* Informações do Programa */}
          {programaInfo && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">
                {programaInfo.nome}
              </h3>
              {programaInfo.leiNumero && (
                <p className="text-sm text-blue-700">
                  {programaInfo.leiNumero}
                </p>
              )}
            </div>
          )}

          <div className="space-y-6">
            {/* Seção de Identificação */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Identificação da Regra
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!finalProgramaId && (
                  <FormField name="programaId" label="Programa" required>
                    <select
                      value={values.programaId}
                      onChange={(e) => {
                        handleChange(e);
                        setValue("programaId", Number(e.target.value));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione um programa...</option>
                      {programas.map((programa) => (
                        <option key={programa.id} value={programa.id}>
                          {programa.nome}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}

                <FormField name="tipoRegra" label="Tipo de Regra" required>
                  <input
                    type="text"
                    value={values.tipoRegra || selectedTipoRegra}
                    onChange={(e) => {
                      handleChange(e);
                      setSelectedTipoRegra(e.target.value);
                    }}
                    placeholder="Ex: area_propriedade, tipo_equipamento..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>

                <FormField
                  name="valorBeneficio"
                  label="Valor do Benefício (R$)"
                  required
                >
                  <input
                    type="number"
                    value={values.valorBeneficio}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
              </div>
            </div>

            {/* Seção de Parâmetros */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Parâmetros da Regra
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name="parametro.condicao" label="Condição">
                    <select
                      value={parametro.condicao}
                      onChange={(e) =>
                        updateParametro("condicao", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="menor_que">Menor que</option>
                      <option value="maior_que">Maior que</option>
                      <option value="igual_a">Igual a</option>
                      <option value="entre">Entre</option>
                      <option value="contem">Contém</option>
                      <option value="nao_contem">Não contém</option>
                    </select>
                  </FormField>

                  <FormField name="parametro.unidade" label="Unidade">
                    <input
                      type="text"
                      value={parametro.unidade || ""}
                      onChange={(e) =>
                        updateParametro("unidade", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: alqueires, reais, toneladas..."
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parametro.condicao === CondicaoRegra.ENTRE ? (
                    <>
                      <FormField
                        name="parametro.valorMinimo"
                        label="Valor Mínimo"
                      >
                        <input
                          type="number"
                          value={parametro.valorMinimo || ""}
                          onChange={(e) =>
                            updateParametro(
                              "valorMinimo",
                              Number(e.target.value)
                            )
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
                            updateParametro(
                              "valorMaximo",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </FormField>
                    </>
                  ) : (
                    <FormField name="parametro.valor" label="Valor">
                      <input
                        type="text"
                        value={parametro.valor || ""}
                        onChange={(e) =>
                          updateParametro("valor", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </FormField>
                  )}
                </div>

                {/* Campos customizados por tipo de regra */}
                {renderCustomParametroFields()}

                <FormField name="parametro.descricao" label="Descrição">
                  <textarea
                    value={parametro.descricao || ""}
                    onChange={(e) =>
                      updateParametro("descricao", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrição detalhada da condição..."
                  />
                </FormField>
              </div>
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
                        <option value="quantidade">Quantidade</option>
                        <option value="valor">Valor</option>
                        <option value="percentual">Percentual</option>
                        <option value="area">Área</option>
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
                        placeholder="Ex: toneladas, reais, doses..."
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Selecione...</option>
                            <option value="area">Área</option>
                            <option value="renda">Renda</option>
                            <option value="fixo">Fixo</option>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </FormField>
                      </div>
                    </div>
                  )}

                  {hasLimitePorPeriodo && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-medium mb-2">Limite por Período</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          name="limitePorPeriodo.periodo"
                          label="Período"
                        >
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Selecione...</option>
                            <option value="mensal">Mensal</option>
                            <option value="anual">Anual</option>
                            <option value="bienal">Bienal (2 anos)</option>
                          </select>
                        </FormField>

                        <FormField
                          name="limitePorPeriodo.quantidade"
                          label="Quantidade"
                        >
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </FormField>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </FormBase>
  );
};

export default RegrasNegocioForm;
