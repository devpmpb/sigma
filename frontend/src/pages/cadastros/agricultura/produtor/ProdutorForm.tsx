import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import produtorService, {
  ProdutorDTO,
  Produtor,
  AreaEfetivaDTO,
} from "../../../../services/comum/produtorService";
import pessoaService, {
  Pessoa,
  TipoPessoa,
} from "../../../../services/comum/pessoaService";

interface ProdutorFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Formulário para cadastro e edição de produtores rurais
 * Inclui área efetiva na mesma tela
 */
const ProdutorForm: React.FC<ProdutorFormProps> = ({ id, onSave }) => {
  const [pessoasFisicas, setPessoasFisicas] = useState<Pessoa[]>([]);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [areaEfetiva, setAreaEfetiva] = useState<AreaEfetivaDTO>({
    anoReferencia: new Date().getFullYear(),
    areaPropria: 0,
    areaArrendadaRecebida: 0,
    areaArrendadaCedida: 0,
    areaEfetiva: 0,
  });
  const [incluirAreaEfetiva, setIncluirAreaEfetiva] = useState(false);

  // Valores iniciais do formulário
  const initialValues: ProdutorDTO = {
    inscricaoEstadual: "",
    dap: "",
    tipoProdutor: "",
    atividadePrincipal: "",
    contratoAssistencia: false,
    observacoes: "",
  };

  // Carregar pessoas físicas para seleção
  useEffect(() => {
    const fetchPessoasFisicas = async () => {
      setLoadingPessoas(true);
      try {
        const pessoasFisicas = await pessoaService.getPessoasByTipo(
          TipoPessoa.FISICA
        );
        setPessoasFisicas(pessoasFisicas);
      } catch (error) {
        console.error("Erro ao carregar pessoas físicas:", error);
      } finally {
        setLoadingPessoas(false);
      }
    };

    fetchPessoasFisicas();
  }, []);

  // Carregar dados do produtor se estiver editando
  useEffect(() => {
    const loadProdutorData = async () => {
      if (id && id !== "novo") {
        try {
          const produtor = await produtorService.getProdutorWithDetails(
            Number(id)
          );

          if (produtor.areaEfetiva) {
            setAreaEfetiva({
              anoReferencia: produtor.areaEfetiva.anoReferencia,
              areaPropria: Number(produtor.areaEfetiva.areaPropria),
              areaArrendadaRecebida: Number(
                produtor.areaEfetiva.areaArrendadaRecebida
              ),
              areaArrendadaCedida: Number(
                produtor.areaEfetiva.areaArrendadaCedida
              ),
              areaEfetiva: Number(produtor.areaEfetiva.areaEfetiva),
            });
            setIncluirAreaEfetiva(true);
          }
        } catch (error) {
          console.error("Erro ao carregar dados do produtor:", error);
        }
      }
    };

    loadProdutorData();
  }, [id]);

  // Calcular área efetiva automaticamente
  useEffect(() => {
    const areaCalculada = produtorService.calcularAreaEfetiva(areaEfetiva);
    setAreaEfetiva((prev) => ({ ...prev, areaEfetiva: areaCalculada }));
  }, [
    areaEfetiva.areaPropria,
    areaEfetiva.areaArrendadaRecebida,
    areaEfetiva.areaArrendadaCedida,
  ]);

  // Validação do formulário
  const validate = (values: ProdutorDTO): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    // Validar ID da pessoa (obrigatório para criação)
    if (!id || id === "novo") {
      if (!values.id || values.id === 0) {
        errors.id = "Pessoa física é obrigatória";
      }
    }

    // Validar DAP se informada
    if (values.dap && !produtorService.validarDAP(values.dap)) {
      errors.dap = "DAP deve conter 11 dígitos";
    }

    // Validações da área efetiva
    if (incluirAreaEfetiva) {
      if (!areaEfetiva.anoReferencia || areaEfetiva.anoReferencia < 2000) {
        errors.anoReferencia = "Ano de referência deve ser válido";
      }

      if (Number(areaEfetiva.areaPropria) < 0) {
        errors.areaPropria = "Área própria não pode ser negativa";
      }

      if (Number(areaEfetiva.areaArrendadaRecebida) < 0) {
        errors.areaArrendadaRecebida =
          "Área arrendada recebida não pode ser negativa";
      }

      if (Number(areaEfetiva.areaArrendadaCedida) < 0) {
        errors.areaArrendadaCedida =
          "Área arrendada cedida não pode ser negativa";
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Função para atualizar campo da área efetiva
  const updateAreaEfetiva = (field: keyof AreaEfetivaDTO, value: any) => {
    setAreaEfetiva((prev) => ({ ...prev, [field]: value }));
  };

  // Função para construir dados finais
  const buildFinalData = (values: ProdutorDTO): ProdutorDTO => {
    const finalData = { ...values };

    if (incluirAreaEfetiva) {
      finalData.areaEfetiva = { ...areaEfetiva };
    }

    return finalData;
  };

  // Opções disponíveis
  const tiposProdutor = produtorService.getTiposProdutor();
  const atividadesPrincipais = produtorService.getAtividadesPrincipais();

  return (
    <FormBase<Produtor, ProdutorDTO>
      title="Produtor Rural"
      service={{
        ...produtorService,
        create: (data: ProdutorDTO) =>
          produtorService.create(buildFinalData(data)),
        update: (id: number | string, data: ProdutorDTO) =>
          produtorService.update(id, buildFinalData(data)),
      }}
      id={id}
      initialValues={initialValues}
      validate={validate}
      onSave={onSave}
      returnUrl="/cadastros/agricultura/produtores"
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        setValue,
        setFieldTouched,
      }) => (
        <>
          {/* Seleção da Pessoa Física (apenas para criação) */}
          {(!id || id === "novo") && (
            <div>
              <label
                htmlFor="id"
                className="block text-sm font-medium text-gray-700"
              >
                Pessoa Física *
              </label>
              <select
                id="id"
                name="id"
                value={values.id || 0}
                onChange={handleChange}
                onBlur={() => setFieldTouched("id")}
                disabled={loadingPessoas}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.id && touched.id ? "border-red-500" : ""
                }`}
              >
                <option value="0">
                  {loadingPessoas
                    ? "Carregando..."
                    : "Selecione a pessoa física"}
                </option>
                {pessoasFisicas.map((pessoa) => (
                  <option key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome} - {pessoa.cpfCnpj}
                  </option>
                ))}
              </select>
              {errors.id && touched.id && (
                <p className="mt-1 text-sm text-red-600">{errors.id}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Selecione a pessoa física que será cadastrada como produtor
                rural
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Produtor */}
            <div>
              <label
                htmlFor="tipoProdutor"
                className="block text-sm font-medium text-gray-700"
              >
                Tipo de Produtor
              </label>
              <select
                id="tipoProdutor"
                name="tipoProdutor"
                value={values.tipoProdutor || ""}
                onChange={handleChange}
                onBlur={() => setFieldTouched("tipoProdutor")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecione o tipo</option>
                {tiposProdutor.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Atividade Principal */}
            <div>
              <label
                htmlFor="atividadePrincipal"
                className="block text-sm font-medium text-gray-700"
              >
                Atividade Principal
              </label>
              <select
                id="atividadePrincipal"
                name="atividadePrincipal"
                value={values.atividadePrincipal || ""}
                onChange={handleChange}
                onBlur={() => setFieldTouched("atividadePrincipal")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecione a atividade</option>
                {atividadesPrincipais.map((atividade) => (
                  <option key={atividade.value} value={atividade.value}>
                    {atividade.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DAP */}
            <div>
              <label
                htmlFor="dap"
                className="block text-sm font-medium text-gray-700"
              >
                DAP (Declaração de Aptidão ao PRONAF)
              </label>
              <input
                type="text"
                id="dap"
                name="dap"
                value={values.dap || ""}
                onChange={handleChange}
                onBlur={() => setFieldTouched("dap")}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.dap && touched.dap ? "border-red-500" : ""
                }`}
                placeholder="00.000.000-000"
                maxLength={14}
              />
              {errors.dap && touched.dap && (
                <p className="mt-1 text-sm text-red-600">{errors.dap}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Número da DAP (11 dígitos)
              </p>
            </div>

            {/* Inscrição Estadual */}
            <div>
              <label
                htmlFor="inscricaoEstadual"
                className="block text-sm font-medium text-gray-700"
              >
                Inscrição Estadual
              </label>
              <input
                type="text"
                id="inscricaoEstadual"
                name="inscricaoEstadual"
                value={values.inscricaoEstadual || ""}
                onChange={handleChange}
                onBlur={() => setFieldTouched("inscricaoEstadual")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Digite a inscrição estadual"
              />
            </div>
          </div>

          {/* Contrato de Assistência */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="contratoAssistencia"
                checked={values.contratoAssistencia || false}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Possui contrato de assistência técnica
              </span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Marque se o produtor possui contrato de assistência técnica ativo
            </p>
          </div>

          {/* Observações */}
          <div>
            <label
              htmlFor="observacoes"
              className="block text-sm font-medium text-gray-700"
            >
              Observações
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={3}
              value={values.observacoes || ""}
              onChange={handleChange}
              onBlur={() => setFieldTouched("observacoes")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Observações adicionais sobre o produtor"
            />
          </div>

          {/* Seção Área Efetiva */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Área Efetiva
              </h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={incluirAreaEfetiva}
                  onChange={(e) => setIncluirAreaEfetiva(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Definir área efetiva
                </span>
              </label>
            </div>

            {incluirAreaEfetiva && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-blue-800">
                    <strong>Área Efetiva:</strong> É calculada automaticamente
                    como:
                    <br />
                    <code className="bg-blue-100 px-2 py-1 rounded">
                      Área Própria + Área Arrendada Recebida - Área Arrendada
                      Cedida
                    </code>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ano de Referência */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ano de Referência *
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="2030"
                      value={areaEfetiva.anoReferencia}
                      onChange={(e) =>
                        updateAreaEfetiva(
                          "anoReferencia",
                          Number(e.target.value)
                        )
                      }
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        errors.anoReferencia ? "border-red-500" : ""
                      }`}
                    />
                    {errors.anoReferencia && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.anoReferencia}
                      </p>
                    )}
                  </div>
                  <div></div> {/* Espaço vazio */}
                  {/* Área Própria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Área Própria (alqueires)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={areaEfetiva.areaPropria}
                      onChange={(e) =>
                        updateAreaEfetiva("areaPropria", Number(e.target.value))
                      }
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        errors.areaPropria ? "border-red-500" : ""
                      }`}
                      placeholder="0,00"
                    />
                    {errors.areaPropria && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.areaPropria}
                      </p>
                    )}
                  </div>
                  {/* Área Arrendada Recebida */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Área Arrendada Recebida (alqueires)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={areaEfetiva.areaArrendadaRecebida}
                      onChange={(e) =>
                        updateAreaEfetiva(
                          "areaArrendadaRecebida",
                          Number(e.target.value)
                        )
                      }
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        errors.areaArrendadaRecebida ? "border-red-500" : ""
                      }`}
                      placeholder="0,00"
                    />
                    {errors.areaArrendadaRecebida && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.areaArrendadaRecebida}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Área que o produtor arrenda de terceiros para produzir
                    </p>
                  </div>
                  {/* Área Arrendada Cedida */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Área Arrendada Cedida (alqueires)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={areaEfetiva.areaArrendadaCedida}
                      onChange={(e) =>
                        updateAreaEfetiva(
                          "areaArrendadaCedida",
                          Number(e.target.value)
                        )
                      }
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        errors.areaArrendadaCedida ? "border-red-500" : ""
                      }`}
                      placeholder="0,00"
                    />
                    {errors.areaArrendadaCedida && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.areaArrendadaCedida}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Área que o produtor cede em arrendamento para terceiros
                    </p>
                  </div>
                  {/* Área Efetiva Calculada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Área Efetiva (calculada automaticamente)
                    </label>
                    <input
                      type="text"
                      value={`${produtorService.formatarArea(
                        areaEfetiva.areaEfetiva || 0
                      )} alqueires`}
                      disabled
                      className="mt-1 block w-full rounded-md bg-gray-100 border-gray-300 text-gray-700 font-semibold"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Área efetivamente utilizada pelo produtor para a atividade
                      rural
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </FormBase>
  );
};

export default ProdutorForm;
