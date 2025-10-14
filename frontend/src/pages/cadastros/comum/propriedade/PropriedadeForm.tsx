import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import FormField from "../../../../components/comum/FormField";
import FormSection from "../../../../components/comum/FormSection";
import AsyncSearchSelect from "../../../../components/comum/AsyncSearchSelect";
import propriedadeService, {
  PropriedadeDTO,
  TipoPropriedade,
  SituacaoPropriedade,
  Propriedade,
} from "../../../../services/comum/propriedadeService";
import pessoaService, {
  Pessoa,
} from "../../../../services/comum/pessoaService";
import logradouroService, {
  Logradouro,
} from "../../../../services/comum/logradouroService";
import propriedadeCondominoService from "../../../../services/comum/propriedadeCondominoService";
import { useParams } from "@tanstack/react-router";

interface PropriedadeFormProps {
  id?: string | number;
  onSave?: () => void;
}

// Interface para condôminos no formulário
interface CondominoFormData {
  condominoId: number;
  percentual?: number;
  observacoes?: string;
  nome?: string; // Para exibição na tabela
  cpfCnpj?: string; // Para exibição na tabela
}

/**
 * Formulário para cadastro e edição de propriedades
 */
const PropriedadeForm: React.FC<PropriedadeFormProps> = ({ id, onSave }) => {
  const params = useParams({ strict: false });
  const propriedadeId = id || params.id;

  const [logradouros, setLogradouros] = useState<Logradouro[]>([]);
  const [loadingLogradouros, setLoadingLogradouros] = useState(false);

  // Estados para condôminos
  const [condominos, setCondominos] = useState<CondominoFormData[]>([]);
  const [novoCondomino, setNovoCondomino] = useState<CondominoFormData>({
    condominoId: 0,
    percentual: undefined,
    observacoes: "",
  });

  // Busca de pessoas para AsyncSearchSelect
  const searchPessoas = async (termo: string): Promise<Pessoa[]> => {
    if (!termo || termo.length < 2) {
      return [];
    }
    try {
      return await pessoaService.buscarPorTermo(termo);
    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
      return [];
    }
  };

  // Valores iniciais do formulário
  const initialValues: PropriedadeDTO = {
    nome: "",
    tipoPropriedade: TipoPropriedade.RURAL,
    logradouroId: undefined,
    numero: "",
    areaTotal: "",
    itr: "",
    incra: "",
    atividadeProdutiva: undefined,
    situacao: SituacaoPropriedade.PROPRIA,
    isproprietarioResidente: false,
    localizacao: "",
    matricula: "",
    proprietarioId: 0,
    nuProprietarioId: undefined,
  };

  // Carregar logradouros para seleção
  useEffect(() => {
    const fetchLogradouros = async () => {
      setLoadingLogradouros(true);
      try {
        const data = await logradouroService.getAll();
        setLogradouros(data);
      } catch (error) {
        console.error("Erro ao carregar logradouros:", error);
      } finally {
        setLoadingLogradouros(false);
      }
    };

    fetchLogradouros();
  }, []);

  // Carregar condôminos existentes quando estiver editando
  useEffect(() => {
    const fetchCondominos = async () => {
      if (propriedadeId && propriedadeId !== "new") {
        try {
          const condominosAtuais = await propriedadeCondominoService.getCondominos(
            Number(propriedadeId),
            true // Apenas ativos
          );

          const condominosFormatados: CondominoFormData[] = condominosAtuais.map(
            (c) => ({
              condominoId: c.condominoId,
              percentual: c.percentual ? Number(c.percentual) : undefined,
              observacoes: c.observacoes || "",
              nome: c.condomino?.nome,
              cpfCnpj: c.condomino?.cpfCnpj,
            })
          );

          setCondominos(condominosFormatados);
        } catch (error) {
          console.error("Erro ao carregar condôminos:", error);
        }
      }
    };

    fetchCondominos();
  }, [propriedadeId]);

  // Adicionar condômino à lista
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
      nome: undefined,
      cpfCnpj: undefined,
    });
  };

  // Remover condômino da lista
  const removerCondomino = (condominoId: number) => {
    setCondominos(condominos.filter((c) => c.condominoId !== condominoId));
  };

  // Validação do formulário
  const validate = (values: PropriedadeDTO): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    if (!values.nome?.trim()) {
      errors.nome = "Nome é obrigatório";
    }

    if (!values.tipoPropriedade) {
      errors.tipoPropriedade = "Tipo de propriedade é obrigatório";
    }

    if (!values.areaTotal || Number(values.areaTotal) <= 0) {
      errors.areaTotal = "Área total deve ser maior que zero";
    }

    if (!values.proprietarioId || values.proprietarioId === 0) {
      errors.proprietarioId = "Proprietário é obrigatório";
    }

    if (!values.situacao) {
      errors.situacao = "Situação da propriedade é obrigatória";
    }

    if (propriedadeService.isRural(values.tipoPropriedade)) {
      if (!values.atividadeProdutiva) {
        errors.atividadeProdutiva = "Atividade produtiva é obrigatória para propriedades rurais";
      }
    }

    if (values.situacao === SituacaoPropriedade.USUFRUTO) {
      if (!values.nuProprietarioId || values.nuProprietarioId === 0) {
        errors.nuProprietarioId =
          "Nu-proprietário é obrigatório quando a situação é Usufruto";
      }
      if (values.nuProprietarioId === values.proprietarioId) {
        errors.nuProprietarioId =
          "Nu-proprietário deve ser diferente do usufrutuário";
      }
    }

    // Validação de condôminos
    if (values.situacao === SituacaoPropriedade.CONDOMINIO && condominos.length === 0) {
      errors.condominos =
        "Para situação CONDOMÍNIO, adicione pelo menos um condômino";
    }

    // Validações específicas para propriedades rurais
    if (propriedadeService.isRural(values.tipoPropriedade)) {
      if (values.itr && values.itr.length > 0 && values.itr.length < 3) {
        errors.itr = "ITR deve ter pelo menos 3 caracteres";
      }

      if (values.incra && values.incra.length > 0 && values.incra.length < 3) {
        errors.incra = "INCRA deve ter pelo menos 3 caracteres";
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Service wrapper que adiciona condôminos ao payload
  const propriedadeServiceWithCondominos = {
    ...propriedadeService,
    create: async (data: PropriedadeDTO) => {
      const payload: any = { ...data };
      if (data.situacao === SituacaoPropriedade.CONDOMINIO && condominos.length > 0) {
        payload.condominos = condominos;
      }
      return propriedadeService.create(payload);
    },
    update: async (id: string | number, data: PropriedadeDTO) => {
      const payload: any = { ...data };
      if (data.situacao === SituacaoPropriedade.CONDOMINIO && condominos.length > 0) {
        payload.condominos = condominos;
      }
      return propriedadeService.update(id, payload);
    },
  };

  return (
    <FormBase<Propriedade, PropriedadeDTO>
      title="Propriedade"
      service={propriedadeServiceWithCondominos}
      id={propriedadeId}
      initialValues={initialValues}
      validate={validate}
      returnUrl="/cadastros/comum/propriedades"
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
          {/* Nome da Propriedade */}
          <FormField
            name="nome"
            label="Nome da Propriedade"
            error={errors.nome}
            touched={touched.nome}
            required
          >
            <input
              type="text"
              id="nome"
              name="nome"
              value={values.nome}
              onChange={handleChange}
              onBlur={() => setFieldTouched("nome")}
              placeholder="Digite o nome da propriedade"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Propriedade */}
            <FormField
              name="tipoPropriedade"
              label="Tipo de Propriedade"
              error={errors.tipoPropriedade}
              touched={touched.tipoPropriedade}
              required
            >
              <select
                id="tipoPropriedade"
                name="tipoPropriedade"
                value={values.tipoPropriedade}
                onChange={(e) => {
                  handleChange(e);
                  // Limpar campos rurais quando mudar para não rural
                  if (!propriedadeService.isRural(e.target.value as TipoPropriedade)) {
                    setValue("itr", "");
                    setValue("incra", "");
                    setValue("atividadeProdutiva", undefined);
                  }
                }}
                onBlur={() => setFieldTouched("tipoPropriedade")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {propriedadeService.getTiposPropriedade().map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Situação da Propriedade */}
            <FormField
              name="situacao"
              label="Situação da Propriedade"
              error={errors.situacao}
              touched={touched.situacao}
              required
            >
              <select
                id="situacao"
                name="situacao"
                value={values.situacao}
                onChange={(e) => {
                  handleChange(e);
                  // Limpar nu-proprietário se não for usufruto
                  if (e.target.value !== SituacaoPropriedade.USUFRUTO) {
                    setValue("nuProprietarioId", undefined);
                  }
                }}
                onBlur={() => setFieldTouched("situacao")}
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

            {/* Campo Proprietário - Renomear conforme situação */}
            <AsyncSearchSelect<Pessoa>
              label={
                values.situacao === SituacaoPropriedade.USUFRUTO
                  ? "Usufrutuário"
                  : "Proprietário"
              }
              value={values.proprietarioId || null}
              onChange={(value) => {
                setValue("proprietarioId", value || 0);
                setFieldTouched("proprietarioId");
              }}
              searchFunction={searchPessoas}
              getOptionLabel={(pessoa) => pessoa.nome}
              getOptionSubLabel={(pessoa) => pessoa.cpfCnpj}
              getId={(pessoa) => pessoa.id}
              placeholder="Digite o nome ou CPF/CNPJ..."
              required
              error={errors.proprietarioId}
            />

            {/* CAMPO CONDICIONAL: Nu-Proprietário (apenas para Usufruto) */}
            {values.situacao === SituacaoPropriedade.USUFRUTO && (
              <div className="transition-all duration-300 ease-in-out">
                <AsyncSearchSelect<Pessoa>
                  label="Nu-Proprietário"
                  value={values.nuProprietarioId || null}
                  onChange={(value) => {
                    setValue("nuProprietarioId", value || undefined);
                    setFieldTouched("nuProprietarioId");
                  }}
                  searchFunction={searchPessoas}
                  getOptionLabel={(pessoa) => pessoa.nome}
                  getOptionSubLabel={(pessoa) => pessoa.cpfCnpj}
                  getId={(pessoa) => pessoa.id}
                  placeholder={
                    !values.proprietarioId
                      ? "Selecione primeiro o usufrutuário"
                      : "Digite o nome ou CPF/CNPJ..."
                  }
                  disabled={!values.proprietarioId}
                  required
                  error={errors.nuProprietarioId}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Logradouro */}
            <FormField
              name="logradouroId"
              label="Logradouro"
              error={errors.logradouroId}
              touched={touched.logradouroId}
            >
              <select
                id="logradouroId"
                name="logradouroId"
                value={values.logradouroId || ""}
                onChange={(e) =>
                  setValue(
                    "logradouroId",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                onBlur={() => setFieldTouched("logradouroId")}
                disabled={loadingLogradouros}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {loadingLogradouros
                    ? "Carregando..."
                    : "Selecione o logradouro"}
                </option>
                {logradouros.map((logradouro) => (
                  <option key={logradouro.id} value={logradouro.id}>
                    {logradouro.tipo} {logradouro.descricao}
                    {logradouro.bairro && ` - ${logradouro.bairro.nome}`}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Número */}
            <FormField
              name="numero"
              label="Número (Lote/Chácara)"
              error={errors.numero}
              touched={touched.numero}
            >
              <input
                type="text"
                id="numero"
                name="numero"
                value={values.numero || ""}
                onChange={handleChange}
                onBlur={() => setFieldTouched("numero")}
                placeholder="Ex: 123, Lote 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>

            {/* Área Total */}
            <FormField
              name="areaTotal"
              label={`Área Total (${propriedadeService.getSufixoUnidade(
                values.tipoPropriedade
              )})`}
              error={errors.areaTotal}
              touched={touched.areaTotal}
              required
            >
              <input
                type="number"
                step="0.01"
                id="areaTotal"
                name="areaTotal"
                value={values.areaTotal}
                onChange={handleChange}
                onBlur={() => setFieldTouched("areaTotal")}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>

          {/* Campos específicos para propriedades RURAIS */}
          {propriedadeService.isRural(values.tipoPropriedade) && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-900 mb-3">
                Informações Rurais
              </h4>

              {/* NOVO CAMPO: Atividade Produtiva */}
              <FormField
                name="atividadeProdutiva"
                label="Atividade Produtiva Principal"
                error={errors.atividadeProdutiva}
                touched={touched.atividadeProdutiva}
                required
                helpText="Selecione a principal atividade produtiva desenvolvida na propriedade"
              >
                <select
                  id="atividadeProdutiva"
                  name="atividadeProdutiva"
                  value={values.atividadeProdutiva || ""}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("atividadeProdutiva")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione a atividade produtiva</option>
                  {propriedadeService.getAtividadesProdutivas().map((atividade) => (
                    <option key={atividade.value} value={atividade.value}>
                      {atividade.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ITR */}
                <FormField
                  name="itr"
                  label="ITR (Imposto Territorial Rural)"
                  error={errors.itr}
                  touched={touched.itr}
                >
                  <input
                    type="text"
                    id="itr"
                    name="itr"
                    value={values.itr || ""}
                    onChange={handleChange}
                    onBlur={() => setFieldTouched("itr")}
                    placeholder="Digite o número do ITR"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>

                {/* INCRA */}
                <FormField
                  name="incra"
                  label="INCRA (Código do Imóvel)"
                  error={errors.incra}
                  touched={touched.incra}
                >
                  <input
                    type="text"
                    id="incra"
                    name="incra"
                    value={values.incra || ""}
                    onChange={handleChange}
                    onBlur={() => setFieldTouched("incra")}
                    placeholder="Digite o código INCRA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Proprietário 
          <FormField
            name="proprietarioId"
            label="Proprietário"
            error={errors.proprietarioId}
            touched={touched.proprietarioId}
            required
          >
            <select
              id="proprietarioId"
              name="proprietarioId"
              value={values.proprietarioId}
              onChange={handleChange}
              onBlur={() => setFieldTouched("proprietarioId")}
              disabled={loadingPessoas}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">
                {loadingPessoas ? "Carregando..." : "Selecione o proprietário"}
              </option>
              {pessoas.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome} - {pessoa.cpfCnpj}
                </option>
              ))}
            </select>
          </FormField>*/}

          {/* Proprietário Residente */}
          <FormField
            name="isproprietarioResidente"
            label="Proprietário Residente"
            error={errors.isproprietarioResidente}
            touched={touched.isproprietarioResidente}
          >
            <div className="flex items-center">
              <input
                id="isproprietarioResidente"
                name="isproprietarioResidente"
                type="checkbox"
                checked={values.isproprietarioResidente}
                onChange={handleChange}
                onBlur={() => setFieldTouched("isproprietarioResidente")}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isproprietarioResidente"
                className="ml-2 text-sm text-gray-700"
              >
                Marque se o proprietário reside na propriedade
              </label>
            </div>
          </FormField>

          {/* Matrícula */}
          <FormField
            name="matricula"
            label="Matrícula do Imóvel"
            error={errors.matricula}
            touched={touched.matricula}
          >
            <input
              type="text"
              id="matricula"
              name="matricula"
              value={values.matricula || ""}
              onChange={handleChange}
              onBlur={() => setFieldTouched("matricula")}
              placeholder="Digite a matrícula do imóvel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          {/* Localização/Descrição */}
          <FormField
            name="localizacao"
            label="Descrição/Observações"
            error={errors.localizacao}
            touched={touched.localizacao}
          >
            <textarea
              id="localizacao"
              name="localizacao"
              rows={3}
              value={values.localizacao || ""}
              onChange={handleChange}
              onBlur={() => setFieldTouched("localizacao")}
              placeholder="Descrição adicional da propriedade, pontos de referência, observações, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          {/* SEÇÃO CONDICIONAL: Condôminos (só aparece se CONDOMÍNIO) */}
          {values.situacao === SituacaoPropriedade.CONDOMINIO && (
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
                      <AsyncSearchSelect<Pessoa>
                        label="Condômino"
                        value={novoCondomino.condominoId || null}
                        onChange={(value, pessoa) => {
                          if (value && pessoa) {
                            setNovoCondomino({
                              ...novoCondomino,
                              condominoId: value,
                              nome: pessoa.nome,
                              cpfCnpj: pessoa.cpfCnpj,
                            });
                          } else {
                            setNovoCondomino({
                              ...novoCondomino,
                              condominoId: 0,
                              nome: undefined,
                              cpfCnpj: undefined,
                            });
                          }
                        }}
                        searchFunction={searchPessoas}
                        getOptionLabel={(pessoa) => pessoa.nome}
                        getOptionSubLabel={(pessoa) => pessoa.cpfCnpj}
                        getId={(pessoa) => pessoa.id}
                        placeholder="Digite o nome ou CPF/CNPJ..."
                        required
                      />
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
                        {condominos.map((condomino) => (
                          <tr key={condomino.condominoId}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div>{condomino.nome || `ID: ${condomino.condominoId}`}</div>
                              {condomino.cpfCnpj && (
                                <div className="text-xs text-gray-500">{condomino.cpfCnpj}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {condomino.percentual ? `${condomino.percentual}%` : "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {condomino.observacoes || "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removerCondomino(condomino.condominoId)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mensagem de erro se nenhum condômino foi adicionado */}
                {errors.condominos && touched.situacao && (
                  <p className="text-sm text-red-600">{errors.condominos}</p>
                )}
              </div>
            </FormSection>
          )}
        </>
      )}
    </FormBase>
  );
};

export default PropriedadeForm;
