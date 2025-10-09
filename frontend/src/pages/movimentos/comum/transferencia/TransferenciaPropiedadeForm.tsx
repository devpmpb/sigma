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
} from "../../../../services/comum/propriedadeService";
import pessoaService, {
  Pessoa,
  TipoPessoa,
} from "../../../../services/comum/pessoaService";

interface TransferenciaPropiedadeFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Formulário para transferência de propriedade
 * Baseado no ArrendamentoForm mas simplificado
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

  // Valores iniciais
  const initialValues: TransferenciaPropiedadeDTO = {
    propriedadeId: 0,
    proprietarioAnteriorId: 0,
    proprietarioNovoId: 0,
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

  // Carregar pessoas físicas e jurídicas
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

  // Função para atualizar propriedade selecionada e preencher proprietário atual
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
    }
  };

  return (
    <FormBase<TransferenciaPropriedade, TransferenciaPropiedadeDTO>
      title="Transferência de Propriedade"
      service={transferenciaPropiedadeService}
      id={id}
      initialValues={initialValues}
      validate={validate}
      //onSave={onSave}
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
                    {propriedadeSelecionada.localizacao && (
                      <div>
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

          {/* Seção 2 - Transferência */}
          <FormSection
            title="Dados da Transferência"
            description="Defina o proprietário atual, novo proprietário e data da transferência"
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
                  {pessoasFisicas.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome} - {pessoa.cpfCnpj}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

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
      )}
    </FormBase>
  );
};

export default TransferenciaPropiedadeForm;
