// frontend/src/pages/movimentos/agricultura/arrendamentos/ArrendamentoForm.tsx
import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro"; // 🔥 USANDO O EXISTENTE
import FormField from "../../../../components/common/FormField";
import FormSection from "../../../../components/common/FormSection"; //
import arrendamentoService, {
  ArrendamentoDTO,
  Arrendamento,
  StatusArrendamento,
} from "../../../../services/agricultura/arrendamentoService";
import propriedadeService, {
  Propriedade,
} from "../../../../services/common/propriedadeService";
import pessoaService, {
  Pessoa,
  TipoPessoa,
} from "../../../../services/common/pessoaService";

interface ArrendamentoFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Formulário para cadastro e edição de arrendamentos
 * USA FormBase ESTENDIDO com FormSection ao invés de criar novo template
 */
const ArrendamentoForm: React.FC<ArrendamentoFormProps> = ({ id, onSave }) => {
  // Estados (mesmo código de antes)
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [pessoasFisicas, setPessoasFisicas] = useState<Pessoa[]>([]);
  const [loadingPropriedades, setLoadingPropriedades] = useState(false);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [propriedadeSelecionada, setPropriedadeSelecionada] =
    useState<Propriedade | null>(null);

  // Valores iniciais
  const initialValues: ArrendamentoDTO = {
    propriedadeId: 0,
    proprietarioId: 0,
    arrendatarioId: 0,
    areaArrendada: 0,
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: "",
    status: StatusArrendamento.ATIVO,
    documentoUrl: "",
  };

  // useEffects para carregar dados (mesmo código de antes)
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

  useEffect(() => {
    const fetchPessoasFisicas = async () => {
      setLoadingPessoas(true);
      try {
        const pessoas = await pessoaService.getPessoasByTipo(TipoPessoa.FISICA);
        setPessoasFisicas(pessoas);
      } catch (error) {
        console.error("Erro ao carregar pessoas físicas:", error);
      } finally {
        setLoadingPessoas(false);
      }
    };

    fetchPessoasFisicas();
  }, []);

  // Validação (mesmo código de antes)
  const validate = async (
    values: ArrendamentoDTO
  ): Promise<Record<string, string> | null> => {
    const errors: Record<string, string> = {};

    if (!values.propriedadeId || values.propriedadeId === 0) {
      errors.propriedadeId = "Propriedade é obrigatória";
    }

    if (!values.proprietarioId || values.proprietarioId === 0) {
      errors.proprietarioId = "Proprietário é obrigatório";
    }

    if (!values.arrendatarioId || values.arrendatarioId === 0) {
      errors.arrendatarioId = "Arrendatário é obrigatório";
    }

    if (
      values.proprietarioId === values.arrendatarioId &&
      values.proprietarioId !== 0
    ) {
      errors.arrendatarioId = "Arrendatário deve ser diferente do proprietário";
    }

    const areaArrendada = Number(values.areaArrendada);
    if (!areaArrendada || areaArrendada <= 0) {
      errors.areaArrendada = "Área arrendada deve ser maior que zero";
    }

    if (
      propriedadeSelecionada &&
      areaArrendada > Number(propriedadeSelecionada.areaTotal)
    ) {
      errors.areaArrendada = `Área arrendada não pode ser maior que a área total da propriedade (${propriedadeService.formatarArea(
        propriedadeSelecionada.areaTotal
      )})`;
    }

    if (!values.dataInicio) {
      errors.dataInicio = "Data de início é obrigatória";
    }

    if (values.dataFim && values.dataInicio) {
      const dataInicio = new Date(values.dataInicio);
      const dataFim = new Date(values.dataFim);

      if (dataFim <= dataInicio) {
        errors.dataFim = "Data fim deve ser posterior à data de início";
      }
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
  };

  return (
    <FormBase<Arrendamento, ArrendamentoDTO>
      title="Arrendamento"
      service={arrendamentoService}
      id={id}
      initialValues={initialValues}
      validate={validate}
      onSave={onSave}
      returnUrl="/movimentos/agricultura/arrendamentos"
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
          {/* 🆕 SEÇÃO 1 - Propriedade */}
          <FormSection
            title="Informações da Propriedade"
            description="Selecione a propriedade e defina a área a ser arrendada"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      : "Selecione uma propriedade"}
                  </option>
                  {propriedades.map((propriedade) => (
                    <option key={propriedade.id} value={propriedade.id}>
                      {propriedade.nome} -{" "}
                      {propriedadeService.formatarArea(propriedade.areaTotal)}
                      {propriedade.localizacao &&
                        ` (${propriedade.localizacao})`}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                name="areaArrendada"
                label="Área Arrendada (ha)"
                error={errors.areaArrendada}
                touched={touched.areaArrendada}
                required
              >
                <input
                  type="number"
                  step="0.01"
                  id="areaArrendada"
                  name="areaArrendada"
                  value={values.areaArrendada}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("areaArrendada", true)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>

              {/* Info da propriedade */}
              {propriedadeSelecionada && (
                <div className="md:col-span-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-900">
                    Detalhes da Propriedade
                  </h4>
                  <div className="mt-2 text-sm text-blue-800 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <p>
                      <strong>Área Total:</strong>{" "}
                      {propriedadeService.formatarArea(
                        propriedadeSelecionada.areaTotal
                      )}
                    </p>
                    <p>
                      <strong>Tipo:</strong>{" "}
                      {propriedadeSelecionada.tipoPropriedade}
                    </p>
                    {propriedadeSelecionada.matricula && (
                      <p>
                        <strong>Matrícula:</strong>{" "}
                        {propriedadeSelecionada.matricula}
                      </p>
                    )}
                    {propriedadeSelecionada.localizacao && (
                      <p>
                        <strong>Localização:</strong>{" "}
                        {propriedadeSelecionada.localizacao}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          <FormSection
            title="Partes Envolvidas"
            description="Defina proprietário e arrendatário do contrato"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onBlur={() => setFieldTouched("proprietarioId", true)}
                  disabled={loadingPessoas}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>
                    {loadingPessoas
                      ? "Carregando..."
                      : "Selecione o proprietário"}
                  </option>
                  {pessoasFisicas.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome} - {pessoa.cpfCnpj}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                name="arrendatarioId"
                label="Arrendatário"
                error={errors.arrendatarioId}
                touched={touched.arrendatarioId}
                required
              >
                <select
                  id="arrendatarioId"
                  name="arrendatarioId"
                  value={values.arrendatarioId}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("arrendatarioId", true)}
                  disabled={loadingPessoas}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>
                    {loadingPessoas
                      ? "Carregando..."
                      : "Selecione o arrendatário"}
                  </option>
                  {pessoasFisicas.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome} - {pessoa.cpfCnpj}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </FormSection>

          {/* 🆕 SEÇÃO 3 - Período */}
          <FormSection
            title="Período do Arrendamento"
            description="Configure as datas de início e término do contrato"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  name="dataInicio"
                  label="Data de Início"
                  error={errors.dataInicio}
                  touched={touched.dataInicio}
                  required
                >
                  <input
                    type="date"
                    id="dataInicio"
                    name="dataInicio"
                    value={values.dataInicio}
                    onChange={handleChange}
                    onBlur={() => setFieldTouched("dataInicio", true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>

                <FormField
                  name="dataFim"
                  label="Data de Término"
                  error={errors.dataFim}
                  touched={touched.dataFim}
                  helpText="Deixe vazio para prazo indeterminado"
                >
                  <input
                    type="date"
                    id="dataFim"
                    name="dataFim"
                    value={values.dataFim || ""}
                    onChange={handleChange}
                    onBlur={() => setFieldTouched("dataFim", true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>

                <FormField
                  name="status"
                  label="Status"
                  error={errors.status}
                  touched={touched.status}
                >
                  <select
                    id="status"
                    name="status"
                    value={values.status}
                    onChange={handleChange}
                    onBlur={() => setFieldTouched("status", true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {arrendamentoService.getStatusOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Duração calculada */}
              {values.dataInicio && values.dataFim && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <strong>Duração:</strong>{" "}
                    {arrendamentoService.calcularDuracao(
                      values.dataInicio,
                      values.dataFim
                    )}
                  </p>
                </div>
              )}
            </div>
          </FormSection>

          {/* 🆕 SEÇÃO 4 - Documentos */}
          <FormSection
            title="Documentação"
            description="Anexe documentos relacionados ao arrendamento"
          >
            <FormField
              name="documentoUrl"
              label="URL do Documento"
              error={errors.documentoUrl}
              touched={touched.documentoUrl}
              helpText="Link para o contrato de arrendamento ou documentação relacionada"
            >
              <input
                type="url"
                id="documentoUrl"
                name="documentoUrl"
                value={values.documentoUrl || ""}
                onChange={handleChange}
                onBlur={() => setFieldTouched("documentoUrl", true)}
                placeholder="https://exemplo.com/contrato-arrendamento.pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </FormSection>
        </div>
      )}
    </FormBase>
  );
};

export default ArrendamentoForm;
