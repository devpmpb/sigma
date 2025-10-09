// frontend/src/pages/movimentos/comum/transferencia/TransferenciaPropiedadeForm.tsx
import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import FormField from "../../../../components/comum/FormField";
import FormSection from "../../../../components/comum/FormSection";
import transferenciaPropiedadeService, {
  TransferenciaPropiedadeDTO,
  TransferenciaPropriedade,
} from "../../../../services/comum/transferenciaPropiedadeService";
import propriedadeService, {
  Propriedade,
  SituacaoPropriedade,
} from "../../../../services/comum/propriedadeService";
import pessoaService, {
  Pessoa,
} from "../../../../services/comum/pessoaService";
import propriedadeCondominoService, {
  PropriedadeCondominoDTO,
} from "../../../../services/comum/propriedadeCondominoService";

interface TransferenciaPropiedadeFormProps {
  id?: string | number;
  onSave: () => void;
}

// ✅ Interface para condôminos no formulário
interface CondominoFormData {
  condominoId: number;
  percentual?: number;
  observacoes?: string;
}

/**
 * Formulário para transferência de propriedade
 * Suporta 3 situações: PRÓPRIA, CONDOMÍNIO, USUFRUTO
 */
const TransferenciaPropiedadeForm: React.FC<
  TransferenciaPropiedadeFormProps
> = ({ id, onSave }) => {
  // Estados
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [pessoasFisicas, setPessoasFisicas] = useState<Pessoa[]>([]);
  const [loadingPropriedades, setLoadingPropriedades] = useState(false);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [propriedadeSelecionada, setPropriedadeSelecionada] =
    useState<Propriedade | null>(null);

  // ✅ NOVOS ESTADOS para condôminos
  const [condominos, setCondominos] = useState<CondominoFormData[]>([]);
  const [novoCondomino, setNovoCondomino] = useState<CondominoFormData>({
    condominoId: 0,
    percentual: undefined,
    observacoes: "",
  });

  // Valores iniciais
  const initialValues: TransferenciaPropiedadeDTO = {
    propriedadeId: 0,
    proprietarioAnteriorId: 0,
    proprietarioNovoId: 0,
    situacaoPropriedade: SituacaoPropriedade.PROPRIA, // ✅ NOVO
    nuProprietarioNovoId: undefined, // ✅ NOVO
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
        const pessoas = await pessoaService.getAll();
        setPessoasFisicas(pessoas);
      } catch (error) {
        console.error("Erro ao carregar pessoas:", error);
      } finally {
        setLoadingPessoas(false);
      }
    };

    fetchPessoas();
  }, []);

  // Função para atualizar propriedade selecionada
  const handlePropriedadeChange = (
    propriedadeId: number,
    setValue: (name: string, value: any) => void
  ) => {
    const propriedade = propriedades.find((p) => p.id === propriedadeId);
    setPropriedadeSelecionada(propriedade || null);
    setValue("propriedadeId", propriedadeId);

    // Preencher automaticamente o proprietário atual
    if (propriedade && propriedade.proprietarioId) {
      setValue("proprietarioAnteriorId", propriedade.proprietarioId);

      // ✅ Se a propriedade for USUFRUTO, preencher também o nu-proprietário anterior
      if (
        propriedade.situacao === SituacaoPropriedade.USUFRUTO &&
        propriedade.nuProprietarioId
      ) {
        // Aqui poderíamos mostrar info do nu-proprietário anterior, se necessário
      }
    }
  };

  // ✅ NOVA FUNÇÃO: Adicionar condômino à lista
  const adicionarCondomino = () => {
    if (novoCondomino.condominoId === 0) {
      alert("Selecione um condômino");
      return;
    }

    // Verificar se já existe
    const existe = condominos.find(
      (c) => c.condominoId === novoCondomino.condominoId
    );
    if (existe) {
      alert("Este condômino já foi adicionado");
      return;
    }

    setCondominos([...condominos, novoCondomino]);

    // Limpar formulário
    setNovoCondomino({
      condominoId: 0,
      percentual: undefined,
      observacoes: "",
    });
  };

  // ✅ NOVA FUNÇÃO: Remover condômino da lista
  const removerCondomino = (condominoId: number) => {
    setCondominos(condominos.filter((c) => c.condominoId !== condominoId));
  };

  // Validação do formulário
  const validate = (values: TransferenciaPropiedadeDTO) => {
    const errors: any = {};

    if (!values.propriedadeId || values.propriedadeId === 0) {
      errors.propriedadeId = "Propriedade é obrigatória";
    }

    if (!values.proprietarioAnteriorId || values.proprietarioAnteriorId === 0) {
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

    // ✅ NOVA VALIDAÇÃO: Situação da propriedade
    if (!values.situacaoPropriedade) {
      errors.situacaoPropriedade = "Situação da propriedade é obrigatória";
    }

    // ✅ NOVA VALIDAÇÃO: Se for USUFRUTO, validar nu-proprietário
    if (values.situacaoPropriedade === SituacaoPropriedade.USUFRUTO) {
      if (!values.nuProprietarioNovoId || values.nuProprietarioNovoId === 0) {
        errors.nuProprietarioNovoId =
          "Nu-proprietário é obrigatório para usufruto";
      }

      if (values.nuProprietarioNovoId === values.proprietarioNovoId) {
        errors.nuProprietarioNovoId =
          "Nu-proprietário deve ser diferente do usufrutuário";
      }
    }

    // ✅ NOVA VALIDAÇÃO: Se for CONDOMÍNIO, validar lista de condôminos
    if (values.situacaoPropriedade === SituacaoPropriedade.CONDOMINIO) {
      if (condominos.length === 0) {
        errors.condominos = "Adicione pelo menos um condômino";
      }
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

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // ✅ ATUALIZAR função onSave para incluir condôminos
  const handleSave = async (data: TransferenciaPropiedadeDTO) => {
    try {
      // 1. Realizar a transferência
      const response = await transferenciaPropiedadeService.transferir(data);

      // 2. Se for CONDOMÍNIO, cadastrar os condôminos
      if (
        data.situacaoPropriedade === SituacaoPropriedade.CONDOMINIO &&
        condominos.length > 0
      ) {
        for (const condomino of condominos) {
          await propriedadeCondominoService.addCondomino(data.propriedadeId, {
            condominoId: condomino.condominoId,
            percentual: condomino.percentual,
            observacoes: condomino.observacoes,
          });
        }
      }

      onSave();
    } catch (error) {
      console.error("Erro ao salvar transferência:", error);
      throw error;
    }
  };

  return (
    <FormBase<TransferenciaPropriedade, TransferenciaPropiedadeDTO>
      title="Transferência de Propriedade"
      service={transferenciaPropiedadeService}
      id={id}
      initialValues={initialValues}
      validate={validate}
      //onSave={handleSave}
      returnUrl="/movimentos/comum/transferencias-propriedade"
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        setValue,
        setFieldTouched,
      }) => (
        <div className="space-y-6">
          {/* Seção 1 - Informações da Propriedade */}
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
                        ` (${propriedade.areaTotal} alq)`}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Tipo:</span>{" "}
                      {propriedadeSelecionada.tipoPropriedade}
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Área:</span>{" "}
                      {propriedadeSelecionada.areaTotal} alqueires
                    </div>
                    {propriedadeSelecionada.matricula && (
                      <div>
                        <span className="font-medium text-blue-800">
                          Matrícula:
                        </span>{" "}
                        {propriedadeSelecionada.matricula}
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-blue-800">
                        Situação Atual:
                      </span>{" "}
                      {propriedadeService.formatarSituacaoPropriedade(
                        propriedadeSelecionada.situacao
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* Seção 2 - Transferência */}
          <FormSection
            title="Dados da Transferência"
            description="Defina a situação e os responsáveis pela propriedade"
          >
            <div className="space-y-4">
              {/* ✅ NOVO CAMPO: Situação da Propriedade */}
              <FormField
                name="situacaoPropriedade"
                label="Situação da Propriedade após Transferência"
                error={errors.situacaoPropriedade}
                touched={touched.situacaoPropriedade}
                required
              >
                <select
                  id="situacaoPropriedade"
                  name="situacaoPropriedade"
                  value={values.situacaoPropriedade}
                  onChange={(e) => {
                    handleChange(e);
                    // Limpar campos condicionais ao mudar situação
                    if (e.target.value !== SituacaoPropriedade.USUFRUTO) {
                      setValue("nuProprietarioNovoId", undefined);
                    }
                    if (e.target.value !== SituacaoPropriedade.CONDOMINIO) {
                      setCondominos([]);
                    }
                  }}
                  onBlur={() => setFieldTouched("situacaoPropriedade", true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {propriedadeService
                    .getSituacoesPropriedade()
                    .map((situacao) => (
                      <option key={situacao.value} value={situacao.value}>
                        {situacao.label}
                      </option>
                    ))}
                </select>
              </FormField>

              {/* Descrição da situação selecionada */}
              {values.situacaoPropriedade ===
                SituacaoPropriedade.CONDOMINIO && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                  <strong>Condomínio:</strong> Você poderá adicionar múltiplos
                  condôminos após preencher os dados básicos.
                </div>
              )}
              {values.situacaoPropriedade === SituacaoPropriedade.USUFRUTO && (
                <div className="bg-purple-50 border border-purple-200 rounded-md p-3 text-sm text-purple-800">
                  <strong>Usufruto:</strong> O usufrutuário tem direito de usar
                  a propriedade, enquanto o nu-proprietário mantém a
                  propriedade.
                </div>
              )}

              {/* Proprietário Anterior */}
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
                    setValue("proprietarioAnteriorId", Number(e.target.value))
                  }
                  onBlur={() => setFieldTouched("proprietarioAnteriorId", true)}
                  disabled={loadingPessoas}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value={0}>
                    {loadingPessoas
                      ? "Carregando..."
                      : "Proprietário será preenchido automaticamente"}
                  </option>
                  {pessoasFisicas.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome} - {pessoa.cpfCnpj}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* ✅ Proprietário Novo - label muda conforme situação */}
              <FormField
                name="proprietarioNovoId"
                label={
                  values.situacaoPropriedade === SituacaoPropriedade.USUFRUTO
                    ? "Usufrutuário (Novo)"
                    : "Novo Proprietário"
                }
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
                    {loadingPessoas ? "Carregando..." : "Selecione"}
                  </option>
                  {pessoasFisicas.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome} - {pessoa.cpfCnpj}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* ✅ CAMPO CONDICIONAL: Nu-Proprietário (só aparece se USUFRUTO) */}
              {values.situacaoPropriedade === SituacaoPropriedade.USUFRUTO && (
                <FormField
                  name="nuProprietarioNovoId"
                  label="Nu-Proprietário (Novo)"
                  error={errors.nuProprietarioNovoId}
                  touched={touched.nuProprietarioNovoId}
                  required
                >
                  <select
                    id="nuProprietarioNovoId"
                    name="nuProprietarioNovoId"
                    value={values.nuProprietarioNovoId || 0}
                    onChange={(e) =>
                      setValue("nuProprietarioNovoId", Number(e.target.value))
                    }
                    onBlur={() => setFieldTouched("nuProprietarioNovoId", true)}
                    disabled={loadingPessoas}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>
                      {loadingPessoas ? "Carregando..." : "Selecione"}
                    </option>
                    {pessoasFisicas.map((pessoa) => (
                      <option key={pessoa.id} value={pessoa.id}>
                        {pessoa.nome} - {pessoa.cpfCnpj}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              {/* Data da Transferência */}
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

              {/* Observações */}
              <FormField
                name="observacoes"
                label="Observações"
                error={errors.observacoes}
                touched={touched.observacoes}
              >
                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={3}
                  value={values.observacoes || ""}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("observacoes", true)}
                  placeholder="Informações adicionais sobre a transferência"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
            </div>
          </FormSection>

          {/* ✅ SEÇÃO CONDICIONAL: Condôminos (só aparece se CONDOMÍNIO) */}
          {values.situacaoPropriedade === SituacaoPropriedade.CONDOMINIO && (
            <FormSection
              title="Condôminos"
              description="Adicione as pessoas que serão condôminas da propriedade"
            >
              <div className="space-y-4">
                {/* Formulário para adicionar condômino */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Adicionar Condômino
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condômino *
                      </label>
                      <select
                        value={novoCondomino.condominoId}
                        onChange={(e) =>
                          setNovoCondomino({
                            ...novoCondomino,
                            condominoId: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>Selecione</option>
                        {pessoasFisicas.map((pessoa) => (
                          <option key={pessoa.id} value={pessoa.id}>
                            {pessoa.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentual (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={novoCondomino.percentual || ""}
                        onChange={(e) =>
                          setNovoCondomino({
                            ...novoCondomino,
                            percentual: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="Ex: 50.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                      </label>
                      <input
                        type="text"
                        value={novoCondomino.observacoes || ""}
                        onChange={(e) =>
                          setNovoCondomino({
                            ...novoCondomino,
                            observacoes: e.target.value,
                          })
                        }
                        placeholder="Informações adicionais"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={adicionarCondomino}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      + Adicionar Condômino
                    </button>
                  </div>
                </div>

                {/* Lista de condôminos adicionados */}
                {condominos.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Condômino
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Percentual
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Observações
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {condominos.map((condomino) => {
                          const pessoa = pessoasFisicas.find(
                            (p) => p.id === condomino.condominoId
                          );
                          return (
                            <tr key={condomino.condominoId}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {pessoa?.nome || `ID: ${condomino.condominoId}`}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {condomino.percentual
                                  ? `${condomino.percentual}%`
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {condomino.observacoes || "-"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removerCondomino(condomino.condominoId)
                                  }
                                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                                >
                                  Remover
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mensagem de erro se nenhum condômino foi adicionado */}
                {errors.condominos && touched.situacaoPropriedade && (
                  <p className="text-sm text-red-600">{errors.condominos}</p>
                )}
              </div>
            </FormSection>
          )}
        </div>
      )}
    </FormBase>
  );
};

export default TransferenciaPropiedadeForm;
