// frontend/src/pages/movimentos/comum/transferencia/TransferenciaPropiedadeForm.tsx
import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import { FormField, FormSection } from "../../../../components/comum";
import transferenciaPropiedadeService, {
  TransferenciaPropriedade,
  TransferenciaPropiedadeDTO,
  NovoProprietarioCondominio,
  DadosUsufruto,
} from "../../../../services/comum/transferenciaPropiedadeService";
import propriedadeService, {
  Propriedade,
  SituacaoPropriedade,
} from "../../../../services/comum/propriedadeService";
import pessoaService, {
  Pessoa,
} from "../../../../services/comum/pessoaService";

interface TransferenciaPropiedadeFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Formulário para transferência de propriedade
 * Suporta 3 situações: PROPRIA, CONDOMINIO, USUFRUTO
 */
const TransferenciaPropiedadeForm: React.FC<
  TransferenciaPropiedadeFormProps
> = ({ id, onSave }) => {
  // Estados
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loadingPropriedades, setLoadingPropriedades] = useState(false);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [propriedadeSelecionada, setPropriedadeSelecionada] =
    useState<Propriedade | null>(null);

  // Estados para controle de situação
  const [situacaoSelecionada, setSituacaoSelecionada] =
    useState<SituacaoPropriedade>(SituacaoPropriedade.PROPRIA);

  // Estados para condomínio
  const [novosProprietarios, setNovosProprietarios] = useState<
    NovoProprietarioCondominio[]
  >([
    { pessoaId: 0, percentual: 50 },
    { pessoaId: 0, percentual: 50 },
  ]);

  // Estados para usufruto
  const [dadosUsufruto, setDadosUsufruto] = useState<DadosUsufruto>({
    usufrutuarioId: 0,
    nuProprietarioId: 0,
  });

  // Valores iniciais
  const initialValues: TransferenciaPropiedadeDTO = {
    propriedadeId: 0,
    situacaoPropriedade: SituacaoPropriedade.PROPRIA,
    proprietarioAnteriorId: 0,
    proprietarioNovoId: 0,
    novosProprietarios: [],
    usufruto: { usufrutuarioId: 0, nuProprietarioId: 0 },
    dataTransferencia: new Date().toISOString().split("T")[0],
    observacoes: "",
  };

  // Carregar propriedades
  useEffect(() => {
    const fetchPropriedades = async () => {
      setLoadingPropriedades(true);
      try {
        const props = await propriedadeService.getAll();
        setPropriedades(props);
      } catch (error) {
        console.error("Erro ao carregar propriedades:", error);
      } finally {
        setLoadingPropriedades(false);
      }
    };

    fetchPropriedades();
  }, []);

  // Carregar pessoas
  useEffect(() => {
    const fetchPessoas = async () => {
      setLoadingPessoas(true);
      try {
        const pessoasList = await pessoaService.getAll();
        setPessoas(pessoasList);
      } catch (error) {
        console.error("Erro ao carregar pessoas:", error);
      } finally {
        setLoadingPessoas(false);
      }
    };

    fetchPessoas();
  }, []);

  // Funções para condomínio
  const adicionarProprietario = () => {
    setNovosProprietarios((prev) => [...prev, { pessoaId: 0, percentual: 0 }]);
  };

  const removerProprietario = (index: number) => {
    if (novosProprietarios.length > 2) {
      setNovosProprietarios((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const atualizarProprietario = (
    index: number,
    field: keyof NovoProprietarioCondominio,
    value: number
  ) => {
    setNovosProprietarios((prev) =>
      prev.map((np, i) => (i === index ? { ...np, [field]: value } : np))
    );
  };

  const distribuirPercentuaisIgual = () => {
    const totalProprietarios = novosProprietarios.length;
    const percentualIgual = Math.floor(10000 / totalProprietarios) / 100;
    const resto = 100 - percentualIgual * totalProprietarios;

    setNovosProprietarios((prev) =>
      prev.map((np, i) => ({
        ...np,
        percentual: i === 0 ? percentualIgual + resto : percentualIgual,
      }))
    );
  };

  // Calcular soma dos percentuais
  const somaPercentuais = novosProprietarios.reduce(
    (sum, np) => sum + (np.percentual || 0),
    0
  );

  // Validação do formulário
  const validate = (values: TransferenciaPropiedadeDTO) => {
    const errors: any = {};

    // Validações comuns
    if (!values.propriedadeId || values.propriedadeId === 0) {
      errors.propriedadeId = "Propriedade é obrigatória";
    }

    if (!values.dataTransferencia) {
      errors.dataTransferencia = "Data da transferência é obrigatória";
    } else {
      const hoje = new Date();
      const dataTransferencia = new Date(values.dataTransferencia);

      if (dataTransferencia > hoje) {
        errors.dataTransferencia = "A data não pode ser futura";
      }
    }

    // Validações específicas por situação
    switch (situacaoSelecionada) {
      case SituacaoPropriedade.PROPRIA:
        if (
          !values.proprietarioAnteriorId ||
          values.proprietarioAnteriorId === 0
        ) {
          errors.proprietarioAnteriorId = "Proprietário atual é obrigatório";
        }

        if (!values.proprietarioNovoId || values.proprietarioNovoId === 0) {
          errors.proprietarioNovoId = "Novo proprietário é obrigatório";
        }

        if (
          values.proprietarioAnteriorId === values.proprietarioNovoId &&
          values.proprietarioAnteriorId !== 0
        ) {
          errors.proprietarioNovoId =
            "O novo proprietário deve ser diferente do atual";
        }
        break;

      case SituacaoPropriedade.CONDOMINIO:
        if (novosProprietarios.length < 2) {
          errors.novosProprietarios =
            "Condomínio requer pelo menos 2 proprietários";
        }

        const proprietariosInvalidos = novosProprietarios.some(
          (np) => !np.pessoaId
        );
        if (proprietariosInvalidos) {
          errors.novosProprietarios =
            "Todos os proprietários devem ser selecionados";
        }

        if (Math.abs(somaPercentuais - 100) > 0.01) {
          errors.percentuais = `A soma dos percentuais deve ser 100% (atual: ${somaPercentuais.toFixed(
            2
          )}%)`;
        }

        // Verificar proprietários duplicados
        const pessoasIds = novosProprietarios.map((np) => np.pessoaId);
        const pessoasUnicas = new Set(pessoasIds);
        if (pessoasIds.length !== pessoasUnicas.size) {
          errors.novosProprietarios = "Não pode haver proprietários duplicados";
        }
        break;

      case SituacaoPropriedade.USUFRUTO:
        if (
          !dadosUsufruto.usufrutuarioId ||
          dadosUsufruto.usufrutuarioId === 0
        ) {
          errors.usufrutuarioId = "Usufrutuário é obrigatório";
        }

        if (
          !dadosUsufruto.nuProprietarioId ||
          dadosUsufruto.nuProprietarioId === 0
        ) {
          errors.nuProprietarioId = "Nu-proprietário é obrigatório";
        }

        if (dadosUsufruto.usufrutuarioId === dadosUsufruto.nuProprietarioId) {
          errors.nuProprietarioId =
            "Usufrutuário e nu-proprietário devem ser diferentes";
        }
        break;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Função para atualizar propriedade selecionada
  const handlePropriedadeChange = (
    propriedadeId: number,
    setValue: (name: string, value: any) => void
  ) => {
    const propriedade = propriedades.find((p) => p.id === propriedadeId);
    setPropriedadeSelecionada(propriedade || null);
    setValue("propriedadeId", propriedadeId);

    if (propriedade) {
      // Preencher proprietário anterior
      setValue("proprietarioAnteriorId", propriedade.proprietarioId);

      // PRÉ-SELECIONAR A SITUAÇÃO ATUAL DA PROPRIEDADE
      setSituacaoSelecionada(propriedade.situacao);
      setValue("situacaoPropriedade", propriedade.situacao);

      // Se for usufruto, pré-carregar os dados
      if (
        propriedade.situacao === SituacaoPropriedade.USUFRUTO &&
        propriedade.nuProprietarioId
      ) {
        setDadosUsufruto({
          usufrutuarioId: propriedade.proprietarioId,
          nuProprietarioId: propriedade.nuProprietarioId,
        });
      }
    }
  };

  return (
    <FormBase<TransferenciaPropriedade, TransferenciaPropiedadeDTO>
      title="Transferência de Propriedade"
      service={transferenciaPropiedadeService}
      id={id}
      initialValues={initialValues}
      validate={validate}
      onSave={onSave}
      returnUrl="/movimentos/comum/transferencias-propriedade"
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        setValue,
        setFieldTouched,
      }) => {
        // Atualizar values com os estados locais antes do submit
        values.situacaoPropriedade = situacaoSelecionada;
        values.novosProprietarios = novosProprietarios;
        values.usufruto = dadosUsufruto;

        return (
          <div className="space-y-6">
            {/* Seção 1 - Propriedade */}
            <FormSection
              title="Propriedade a ser Transferida"
              description="Selecione a propriedade que terá a propriedade transferida"
            >
              <div className="space-y-4">
                <FormField
                  name="propriedadeId"
                  label="Propriedade"
                  error={errors.propriedadeId}
                  touched={touched.propriedadeId}
                  required
                >
                  <select
                    id="propriedadeId"
                    name="propriedadeId"
                    value={values.propriedadeId}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      handleChange(e);
                      handlePropriedadeChange(value, setValue);
                    }}
                    onBlur={() => setFieldTouched("propriedadeId", true)}
                    disabled={loadingPropriedades}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>
                      {loadingPropriedades
                        ? "Carregando..."
                        : "Selecione a propriedade"}
                    </option>
                    {propriedades.map((propriedade) => (
                      <option key={propriedade.id} value={propriedade.id}>
                        {propriedade.nome} - {propriedade.tipoPropriedade}
                        {propriedade.areaTotal &&
                          ` (${propriedade.areaTotal} alq)`}{" "}
                        - Situação:{" "}
                        {propriedadeService.formatarSituacaoPropriedade(
                          propriedade.situacao
                        )}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Informações da propriedade selecionada */}
                {propriedadeSelecionada && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Detalhes da Propriedade
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-800">Tipo:</span>{" "}
                        {propriedadeSelecionada.tipoPropriedade}
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Área:</span>{" "}
                        {propriedadeSelecionada.areaTotal} alqueires
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">
                          Situação Atual:
                        </span>{" "}
                        <span className="font-semibold text-blue-900">
                          {propriedadeService.formatarSituacaoPropriedade(
                            propriedadeSelecionada.situacao
                          )}
                        </span>
                      </div>
                      {propriedadeSelecionada.matricula && (
                        <div>
                          <span className="font-medium text-blue-800">
                            Matrícula:
                          </span>{" "}
                          {propriedadeSelecionada.matricula}
                        </div>
                      )}
                      {propriedadeSelecionada.localizacao && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-blue-800">
                            Localização:
                          </span>{" "}
                          {propriedadeSelecionada.localizacao}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            {/* Seção 2 - Nova Situação da Propriedade */}
            <FormSection
              title="Nova Situação da Propriedade"
              description="Selecione a situação após a transferência"
            >
              <FormField
                name="situacaoPropriedade"
                label="Situação"
                error={errors.situacaoPropriedade}
                touched={touched.situacaoPropriedade}
                required
              >
                <select
                  id="situacaoPropriedade"
                  name="situacaoPropriedade"
                  value={situacaoSelecionada}
                  onChange={(e) => {
                    const novaSituacao = e.target.value as SituacaoPropriedade;
                    setSituacaoSelecionada(novaSituacao);
                    setValue("situacaoPropriedade", novaSituacao);

                    // Resetar estados ao mudar situação
                    if (novaSituacao === SituacaoPropriedade.CONDOMINIO) {
                      setNovosProprietarios([
                        { pessoaId: 0, percentual: 50 },
                        { pessoaId: 0, percentual: 50 },
                      ]);
                    } else if (novaSituacao === SituacaoPropriedade.USUFRUTO) {
                      setDadosUsufruto({
                        usufrutuarioId: 0,
                        nuProprietarioId: 0,
                      });
                    }
                  }}
                  onBlur={() => setFieldTouched("situacaoPropriedade", true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={SituacaoPropriedade.PROPRIA}>
                    Própria - Transferência para um único proprietário
                  </option>
                  <option value={SituacaoPropriedade.CONDOMINIO}>
                    Condomínio - Múltiplos proprietários com percentuais
                  </option>
                  <option value={SituacaoPropriedade.USUFRUTO}>
                    Usufruto - Usufrutuário e Nu-proprietário
                  </option>
                </select>
              </FormField>

              {/* Descrição da situação selecionada */}
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {situacaoSelecionada === SituacaoPropriedade.PROPRIA && (
                  <p>
                    <strong>Própria:</strong> A propriedade será transferida
                    para um único proprietário que terá 100% da propriedade.
                  </p>
                )}
                {situacaoSelecionada === SituacaoPropriedade.CONDOMINIO && (
                  <p>
                    <strong>Condomínio:</strong> A propriedade será dividida
                    entre múltiplos proprietários, cada um com seu percentual de
                    participação. A soma dos percentuais deve ser 100%.
                  </p>
                )}
                {situacaoSelecionada === SituacaoPropriedade.USUFRUTO && (
                  <p>
                    <strong>Usufruto:</strong> O usufrutuário terá direito de
                    usar e usufruir da propriedade, enquanto o nu-proprietário
                    mantém a propriedade legal. Pode ter prazo definido ou ser
                    vitalício.
                  </p>
                )}
              </div>
            </FormSection>

            {/* Seção 3 - PRÓPRIA */}
            {situacaoSelecionada === SituacaoPropriedade.PROPRIA && (
              <FormSection
                title="Dados da Transferência"
                description="Defina o proprietário atual e o novo proprietário"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="proprietarioAnteriorId"
                    label="Proprietário Atual"
                    error={errors.proprietarioAnteriorId}
                    touched={touched.proprietarioAnteriorId}
                    required
                  >
                    <select
                      id="proprietarioAnteriorId"
                      name="proprietarioAnteriorId"
                      value={values.proprietarioAnteriorId}
                      onChange={(e) =>
                        setValue(
                          "proprietarioAnteriorId",
                          Number(e.target.value)
                        )
                      }
                      onBlur={() =>
                        setFieldTouched("proprietarioAnteriorId", true)
                      }
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    >
                      <option value={0}>Será preenchido automaticamente</option>
                      {pessoas.map((pessoa) => (
                        <option key={pessoa.id} value={pessoa.id}>
                          {pessoa.nome} - {pessoa.cpfCnpj}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    name="proprietarioNovoId"
                    label="Novo Proprietário"
                    error={errors.proprietarioNovoId}
                    touched={touched.proprietarioNovoId}
                    required
                  >
                    <select
                      id="proprietarioNovoId"
                      name="proprietarioNovoId"
                      value={values.proprietarioNovoId}
                      onChange={(e) =>
                        setValue("proprietarioNovoId", Number(e.target.value))
                      }
                      onBlur={() => setFieldTouched("proprietarioNovoId", true)}
                      disabled={loadingPessoas}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>
                        {loadingPessoas
                          ? "Carregando..."
                          : "Selecione o novo proprietário"}
                      </option>
                      {pessoas.map((pessoa) => (
                        <option key={pessoa.id} value={pessoa.id}>
                          {pessoa.nome} - {pessoa.cpfCnpj}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </FormSection>
            )}

            {/* Seção 4 - CONDOMÍNIO */}
            {situacaoSelecionada === SituacaoPropriedade.CONDOMINIO && (
              <FormSection
                title="Proprietários do Condomínio"
                description="Adicione todos os proprietários e seus respectivos percentuais"
              >
                <div className="space-y-4">
                  {/* Barra de ações */}
                  <div className="flex items-center justify-between">
                    <div>
                      {errors.novosProprietarios && (
                        <p className="text-sm text-red-600">
                          {errors.novosProprietarios}
                        </p>
                      )}
                      {errors.percentuais && (
                        <p className="text-sm text-red-600">
                          {errors.percentuais}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={distribuirPercentuaisIgual}
                        className="px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-300 rounded-md hover:bg-green-100"
                      >
                        Distribuir Igual
                      </button>
                      <button
                        type="button"
                        onClick={adicionarProprietario}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        + Adicionar Proprietário
                      </button>
                    </div>
                  </div>

                  {/* Lista de proprietários */}
                  <div className="space-y-3">
                    {novosProprietarios.map((np, index) => (
                      <div
                        key={index}
                        className="flex gap-3 items-start p-3 bg-gray-50 border border-gray-200 rounded-md"
                      >
                        <div className="flex-1">
                          <select
                            value={np.pessoaId}
                            onChange={(e) =>
                              atualizarProprietario(
                                index,
                                "pessoaId",
                                Number(e.target.value)
                              )
                            }
                            disabled={loadingPessoas}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={0}>
                              {loadingPessoas
                                ? "Carregando..."
                                : "Selecione o proprietário"}
                            </option>
                            {pessoas.map((pessoa) => (
                              <option key={pessoa.id} value={pessoa.id}>
                                {pessoa.nome} - {pessoa.cpfCnpj}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={np.percentual}
                              onChange={(e) =>
                                atualizarProprietario(
                                  index,
                                  "percentual",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="absolute right-3 top-2.5 text-gray-500 text-sm">
                              %
                            </span>
                          </div>
                        </div>
                        {novosProprietarios.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removerProprietario(index)}
                            className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Resumo dos percentuais */}
                  <div className="flex justify-end">
                    <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md">
                      <span className="text-sm font-medium text-gray-700">
                        Total:
                      </span>{" "}
                      <span
                        className={`text-lg font-bold ${
                          Math.abs(somaPercentuais - 100) < 0.01
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {somaPercentuais.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </FormSection>
            )}

            {/* Seção 5 - USUFRUTO */}
            {situacaoSelecionada === SituacaoPropriedade.USUFRUTO && (
              <FormSection
                title="Dados do Usufruto"
                description="Defina o usufrutuário e o nu-proprietário"
              >
                <div className="space-y-4">
                  {/* Alerta informativo */}
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-purple-600 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-purple-900">
                        <strong>Usufruto:</strong> O usufrutuário tem direito de
                        usar e usufruir da propriedade, enquanto o
                        nu-proprietário mantém a propriedade legal.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="usufrutuarioId"
                      label="Usufrutuário"
                      error={errors.usufrutuarioId}
                      touched={touched.usufrutuarioId}
                      required
                    >
                      <select
                        id="usufrutuarioId"
                        name="usufrutuarioId"
                        value={dadosUsufruto.usufrutuarioId}
                        onChange={(e) =>
                          setDadosUsufruto((prev) => ({
                            ...prev,
                            usufrutuarioId: Number(e.target.value),
                          }))
                        }
                        disabled={loadingPessoas}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={0}>
                          {loadingPessoas
                            ? "Carregando..."
                            : "Selecione o usufrutuário"}
                        </option>
                        {pessoas.map((pessoa) => (
                          <option key={pessoa.id} value={pessoa.id}>
                            {pessoa.nome} - {pessoa.cpfCnpj}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Quem terá o direito de uso e usufruto
                      </p>
                    </FormField>

                    <FormField
                      name="nuProprietarioId"
                      label="Nu-proprietário"
                      error={errors.nuProprietarioId}
                      touched={touched.nuProprietarioId}
                      required
                    >
                      <select
                        id="nuProprietarioId"
                        name="nuProprietarioId"
                        value={dadosUsufruto.nuProprietarioId}
                        onChange={(e) =>
                          setDadosUsufruto((prev) => ({
                            ...prev,
                            nuProprietarioId: Number(e.target.value),
                          }))
                        }
                        disabled={loadingPessoas}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={0}>
                          {loadingPessoas
                            ? "Carregando..."
                            : "Selecione o nu-proprietário"}
                        </option>
                        {pessoas.map((pessoa) => (
                          <option key={pessoa.id} value={pessoa.id}>
                            {pessoa.nome} - {pessoa.cpfCnpj}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Quem manterá a propriedade legal
                      </p>
                    </FormField>
                  </div>

                  <FormField
                    name="prazoUsufruto"
                    label="Prazo do Usufruto (Opcional)"
                    error={errors.prazoUsufruto}
                    touched={touched.prazoUsufruto}
                  >
                    <input
                      type="date"
                      id="prazoUsufruto"
                      name="prazoUsufruto"
                      value={dadosUsufruto.prazoUsufruto || ""}
                      onChange={(e) =>
                        setDadosUsufruto((prev) => ({
                          ...prev,
                          prazoUsufruto: e.target.value,
                        }))
                      }
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Data de término do usufruto. Deixe em branco para usufruto
                      vitalício.
                    </p>
                  </FormField>
                </div>
              </FormSection>
            )}

            {/* Seção 6 - Data e Observações */}
            <FormSection
              title="Informações Adicionais"
              description="Data da transferência e observações"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="dataTransferencia"
                  label="Data da Transferência"
                  error={errors.dataTransferencia}
                  touched={touched.dataTransferencia}
                  required
                >
                  <input
                    type="date"
                    id="dataTransferencia"
                    name="dataTransferencia"
                    value={values.dataTransferencia}
                    onChange={handleChange}
                    onBlur={() => setFieldTouched("dataTransferencia", true)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>

                <FormField
                  name="observacoes"
                  label="Observações"
                  error={errors.observacoes}
                  touched={touched.observacoes}
                >
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    value={values.observacoes || ""}
                    onChange={handleChange}
                    onBlur={() => setFieldTouched("observacoes", true)}
                    rows={3}
                    placeholder="Observações sobre a transferência (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </FormField>
              </div>
            </FormSection>
          </div>
        );
      }}
    </FormBase>
  );
};

export default TransferenciaPropiedadeForm;
