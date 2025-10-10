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

  const formDataRef = React.useRef<TransferenciaPropiedadeDTO | null>(null);

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
  const handlePropriedadeChange = async (
    propriedadeId: number,
    setValue: (name: string, value: any) => void
  ) => {
    const propriedade = propriedades.find((p) => p.id === propriedadeId);
    setPropriedadeSelecionada(propriedade || null);
    setValue("propriedadeId", propriedadeId);

    if (!propriedade) {
      // Limpar tudo se não encontrou propriedade
      setValue("proprietarioAnteriorId", 0);
      setValue("situacaoPropriedade", SituacaoPropriedade.PROPRIA);
      setValue("nuProprietarioNovoId", undefined);
      setCondominos([]);
      return;
    }

    // 1. ✅ Preencher proprietário atual
    if (propriedade.proprietarioId) {
      setValue("proprietarioAnteriorId", propriedade.proprietarioId);
    }

    // 2. ✅ Preencher situação da propriedade
    setValue("situacaoPropriedade", propriedade.situacao);

    // 3. ✅ Se for USUFRUTO, preencher nu-proprietário atual
    if (propriedade.situacao === SituacaoPropriedade.USUFRUTO) {
      if (propriedade.nuProprietarioId) {
        // Aqui podemos mostrar info do nu-proprietário anterior para referência
        console.log("Nu-proprietário atual:", propriedade.nuProprietario?.nome);
      }
    }

    // 4. ✅ Se for CONDOMÍNIO, carregar condôminos atuais
    if (propriedade.situacao === SituacaoPropriedade.CONDOMINIO) {
      try {
        setLoadingPessoas(true);
        const condominosAtuais =
          await propriedadeCondominoService.getCondominos(
            propriedade.id,
            true // Apenas ativos
          );

        // Mapear para o formato do formulário
        const condominosFormatados: CondominoFormData[] = condominosAtuais.map(
          (c) => ({
            condominoId: c.condominoId,
            percentual: c.percentual ? Number(c.percentual) : undefined,
            observacoes: c.observacoes || "",
          })
        );

        setCondominos(condominosFormatados);
        console.log(`${condominosFormatados.length} condôminos carregados`);
      } catch (error) {
        console.error("Erro ao carregar condôminos:", error);
        setCondominos([]);
      } finally {
        setLoadingPessoas(false);
      }
    } else {
      // Se não for condomínio, limpar lista
      setCondominos([]);
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

    // ✅ REMOVIDO: Validação que impedia proprietário igual
    // Agora pode ser igual se for adicionar apenas condôminos

    if (!values.situacaoPropriedade) {
      errors.situacaoPropriedade = "Situação da propriedade é obrigatória";
    }

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

    // ✅ NOVO: Validar se há pelo menos uma mudança
    const mudaProprietario =
      values.proprietarioAnteriorId !== values.proprietarioNovoId;
    const temCondominos = condominos.length > 0;

    if (!mudaProprietario && !temCondominos) {
      errors.proprietarioNovoId =
        "É necessário alterar o proprietário ou adicionar condôminos";
    }

    // ✅ MODIFICADO: Validação de condôminos
    if (values.situacaoPropriedade === SituacaoPropriedade.CONDOMINIO) {
      // Se está mudando proprietário para situação CONDOMINIO, precisa ter condôminos
      if (mudaProprietario && condominos.length === 0) {
        errors.condominos =
          "Para situação CONDOMÍNIO, adicione pelo menos um condômino";
      }

      // Se tem condôminos, incluir no objeto
      if (condominos.length > 0) {
        (values as any).condominos = condominos;
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
                  <h4 className="font-medium text-blue-900 mb-3">
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
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium ml-1">
                        {propriedadeService.formatarSituacaoPropriedade(
                          propriedadeSelecionada.situacao
                        )}
                      </span>
                    </div>

                    {/* ✅ ADICIONAR: Mostrar proprietário atual */}
                    <div className="col-span-2">
                      <span className="font-medium text-blue-800">
                        Proprietário Atual:
                      </span>{" "}
                      {propriedadeSelecionada.proprietario?.nome ||
                        "Não informado"}
                      {propriedadeSelecionada.proprietario?.cpfCnpj && (
                        <span className="text-blue-600 ml-1">
                          ({propriedadeSelecionada.proprietario.cpfCnpj})
                        </span>
                      )}
                    </div>

                    {/* ✅ ADICIONAR: Se for USUFRUTO, mostrar nu-proprietário */}
                    {propriedadeSelecionada.situacao ===
                      SituacaoPropriedade.USUFRUTO &&
                      propriedadeSelecionada.nuProprietario && (
                        <div className="col-span-2">
                          <span className="font-medium text-blue-800">
                            Nu-Proprietário Atual:
                          </span>{" "}
                          {propriedadeSelecionada.nuProprietario.nome}
                          {propriedadeSelecionada.nuProprietario.cpfCnpj && (
                            <span className="text-blue-600 ml-1">
                              ({propriedadeSelecionada.nuProprietario.cpfCnpj})
                            </span>
                          )}
                        </div>
                      )}

                    {/* ✅ ADICIONAR: Se for CONDOMÍNIO, mostrar condôminos */}
                    {propriedadeSelecionada.situacao ===
                      SituacaoPropriedade.CONDOMINIO &&
                      condominos.length > 0 && (
                        <div className="col-span-2">
                          <span className="font-medium text-blue-800">
                            Condôminos Atuais ({condominos.length}):
                          </span>
                          <ul className="mt-2 space-y-1">
                            {condominos.map((c) => {
                              const pessoa = pessoasFisicas.find(
                                (p) => p.id === c.condominoId
                              );
                              return (
                                <li
                                  key={c.condominoId}
                                  className="text-blue-700"
                                >
                                  • {pessoa?.nome || `ID: ${c.condominoId}`}
                                  {c.percentual && ` - ${c.percentual}%`}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
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
              {propriedadeSelecionada && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                  <strong>Situação atual:</strong>{" "}
                  {propriedadeService.formatarSituacaoPropriedade(
                    propriedadeSelecionada.situacao
                  )}
                  <br />
                  <span className="text-gray-600">
                    Você pode manter ou alterar a situação da propriedade após a
                    transferência.
                  </span>
                </div>
              )}

              {values.situacaoPropriedade ===
                SituacaoPropriedade.CONDOMINIO && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                  <strong>Condomínio:</strong> Você poderá adicionar múltiplos
                  condôminos após preencher os dados básicos.
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

              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm">
                <p className="text-blue-800">
                  <strong>Dica:</strong> Você pode manter o mesmo proprietário e
                  adicionar apenas condôminos, ou alterar o proprietário sem
                  mexer nos condôminos existentes.
                </p>
              </div>

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
