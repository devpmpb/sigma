import React, { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
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
      returnUrl={
        finalProgramaId
          ? `/cadastros/comum/regrasNegocio/programa/${finalProgramaId}`
          : "/cadastros/comum/regrasNegocio"
      }
      onSave={onSave}
    >
      {({ values, errors, touched, handleChange, setValue }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="">Selecione um programa</option>
                {programas.map((programa) => (
                  <option key={programa.id} value={programa.id}>
                    {programa.nome} ({programa.tipoPrograma})
                  </option>
                ))}
              </select>
            </FormField>

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
                <option value="">Selecione um tipo</option>
                {tiposRegra.map((tipo) => (
                  <option
                    key={tipo.valor}
                    value={tipo.valor}
                    title={tipo.descricao}
                  >
                    {tipo.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField
            name="valorBeneficio"
            label="Valor do Benefício"
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
              placeholder="0,00"
            />
          </FormField>

          {/* Configuração de Parâmetros */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Parâmetros da Regra
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="condicao" label="Condição" required>
                <select
                  value={parametro.condicao}
                  onChange={(e) =>
                    updateParametro("condicao", e.target.value as CondicaoRegra)
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

              {parametro.condicao === CondicaoRegra.ENTRE ? (
                <>
                  <FormField name="valorMinimo" label="Valor Mínimo" required>
                    <input
                      type="number"
                      value={parametro.valorMinimo || ""}
                      onChange={(e) =>
                        updateParametro("valorMinimo", Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormField>
                  <FormField name="valorMaximo" label="Valor Máximo" required>
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
              ) : (
                <FormField name="valor" label="Valor" required>
                  <input
                    type="text"
                    value={parametro.valor || ""}
                    onChange={(e) => updateParametro("valor", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField name="unidade" label="Unidade">
                <input
                  type="text"
                  value={parametro.unidade || ""}
                  onChange={(e) => updateParametro("unidade", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: alqueires, kg, reais"
                />
              </FormField>

              <FormField name="descricao" label="Descrição">
                <input
                  type="text"
                  value={parametro.descricao || ""}
                  onChange={(e) => updateParametro("descricao", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição da regra"
                />
              </FormField>
            </div>
          </div>

          {/* Configuração de Limites */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Limites do Benefício
              </h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasLimite}
                  onChange={(e) => setHasLimite(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Definir limites
                </span>
              </label>
            </div>

            {hasLimite && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField name="tipoLimite" label="Tipo de Limite" required>
                    <select
                      value={limiteBeneficio.tipo}
                      onChange={(e) =>
                        updateLimite("tipo", e.target.value as TipoLimite)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {regrasNegocioService.getTiposLimite().map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField name="limite" label="Valor do Limite" required>
                    <input
                      type="number"
                      value={limiteBeneficio.limite}
                      onChange={(e) =>
                        updateLimite("limite", Number(e.target.value))
                      }
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormField>

                  <FormField name="unidadeLimite" label="Unidade">
                    <input
                      type="text"
                      value={limiteBeneficio.unidade || ""}
                      onChange={(e) => updateLimite("unidade", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: kg, reais, %"
                    />
                  </FormField>
                </div>

                {/* Multiplicador */}
                <div className="mt-4">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={hasMultiplicador}
                      onChange={(e) => setHasMultiplicador(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Usar multiplicador
                    </span>
                  </label>

                  {hasMultiplicador && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="baseMultiplicador"
                        label="Base do Multiplicador"
                      >
                        <select
                          value={limiteBeneficio.multiplicador?.base || "area"}
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

                      <FormField name="fatorMultiplicador" label="Fator">
                        <input
                          type="number"
                          value={limiteBeneficio.multiplicador?.fator || 1}
                          onChange={(e) =>
                            updateLimite("multiplicador", {
                              ...limiteBeneficio.multiplicador,
                              fator: Number(e.target.value),
                            })
                          }
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </FormField>
                    </div>
                  )}
                </div>

                {/* Limite por Período */}
                <div className="mt-4">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={hasLimitePorPeriodo}
                      onChange={(e) => setHasLimitePorPeriodo(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Limite por período
                    </span>
                  </label>

                  {hasLimitePorPeriodo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField name="periodo" label="Período">
                        <select
                          value={
                            limiteBeneficio.limitePorPeriodo?.periodo || "anual"
                          }
                          onChange={(e) =>
                            updateLimite("limitePorPeriodo", {
                              ...limiteBeneficio.limitePorPeriodo,
                              periodo: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {regrasNegocioService.getPeriodos().map((periodo) => (
                            <option key={periodo.value} value={periodo.value}>
                              {periodo.label}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField name="quantidadePeriodo" label="Quantidade">
                        <input
                          type="number"
                          value={
                            limiteBeneficio.limitePorPeriodo?.quantidade || 1
                          }
                          onChange={(e) =>
                            updateLimite("limitePorPeriodo", {
                              ...limiteBeneficio.limitePorPeriodo,
                              quantidade: Number(e.target.value),
                            })
                          }
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </FormField>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Preview da regra */}
          {selectedTipoRegra && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Preview da Regra
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Condição:</strong>{" "}
                    {regrasNegocioService.formatarParametro(parametro)}
                  </div>
                  <div>
                    <strong>Benefício:</strong>{" "}
                    {regrasNegocioService.formatarValorBeneficio(
                      values.valorBeneficio || 0
                    )}
                  </div>
                  <div>
                    <strong>Limite:</strong>{" "}
                    {regrasNegocioService.formatarLimite(
                      hasLimite ? limiteBeneficio : null
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </FormBase>
  );
};

export default RegrasNegocioForm;
