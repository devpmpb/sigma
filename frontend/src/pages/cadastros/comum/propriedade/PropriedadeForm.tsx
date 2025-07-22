import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import FormField from "../../../../components/comum/FormField";
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

interface PropriedadeFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Formulário para cadastro e edição de propriedades
 */
const PropriedadeForm: React.FC<PropriedadeFormProps> = ({ id, onSave }) => {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [logradouros, setLogradouros] = useState<Logradouro[]>([]);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [loadingLogradouros, setLoadingLogradouros] = useState(false);

  // Valores iniciais do formulário
  const initialValues: PropriedadeDTO = {
    nome: "",
    tipoPropriedade: TipoPropriedade.RURAL,
    logradouroId: undefined,
    numero: "",
    areaTotal: "",
    itr: "",
    incra: "",
    situacao: SituacaoPropriedade.PROPRIA,
    proprietarioResidente: false,
    localizacao: "",
    matricula: "",
    proprietarioId: 0,
  };

  // Carregar pessoas para seleção
  useEffect(() => {
    const fetchPessoas = async () => {
      setLoadingPessoas(true);
      try {
        const data = await pessoaService.getAll();
        setPessoas(data);
      } catch (error) {
        console.error("Erro ao carregar pessoas:", error);
      } finally {
        setLoadingPessoas(false);
      }
    };

    fetchPessoas();
  }, []);

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

  return (
    <FormBase<Propriedade, PropriedadeDTO>
      title="Propriedade"
      service={propriedadeService}
      id={id}
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
                  if (e.target.value !== TipoPropriedade.RURAL) {
                    setValue("itr", "");
                    setValue("incra", "");
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
                onChange={handleChange}
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
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3">
                Informações Específicas para Propriedade Rural
              </h4>

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
                    placeholder="Digite o código ITR"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>

                {/* INCRA */}
                <FormField
                  name="incra"
                  label="INCRA"
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

          {/* Proprietário */}
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
          </FormField>

          {/* Proprietário Residente */}
          <FormField
            name="proprietarioResidente"
            label="Proprietário Residente"
            error={errors.proprietarioResidente}
            touched={touched.proprietarioResidente}
          >
            <div className="flex items-center">
              <input
                id="proprietarioResidente"
                name="proprietarioResidente"
                type="checkbox"
                checked={values.proprietarioResidente}
                onChange={handleChange}
                onBlur={() => setFieldTouched("proprietarioResidente")}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="proprietarioResidente"
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
        </>
      )}
    </FormBase>
  );
};

export default PropriedadeForm;
