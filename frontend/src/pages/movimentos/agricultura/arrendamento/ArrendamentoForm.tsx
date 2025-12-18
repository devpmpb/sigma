// frontend/src/pages/movimentos/agricultura/arrendamento/ArrendamentoForm.tsx
import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import FormField from "../../../../components/comum/FormField";
import FormSection from "../../../../components/comum/FormSection";
import arrendamentoService, {
  ArrendamentoDTO,
  Arrendamento,
  StatusArrendamento,
  AtividadeProdutiva,
  atividadeProdutivaLabels
} from "../../../../services/agricultura/arrendamentoService";
import propriedadeService, {
  Propriedade,
} from "../../../../services/comum/propriedadeService";
import pessoaService, {
  Pessoa,
  TipoPessoa,
} from "../../../../services/comum/pessoaService";
import { useParams } from "@tanstack/react-router";

interface ArrendamentoFormProps {
  id?: string | number;
  onSave: () => void;
}

const ArrendamentoForm: React.FC<ArrendamentoFormProps> = ({ id, onSave }) => {
  const params = useParams({ strict: false });
  const arrendamentoId = id || params.id;
  
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [pessoasFisicas, setPessoasFisicas] = useState<Pessoa[]>([]);
  const [loadingPropriedades, setLoadingPropriedades] = useState(false);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [propriedadeSelecionada, setPropriedadeSelecionada] =
    useState<Propriedade | null>(null);

  // Valores iniciais com novos campos
  const initialValues: ArrendamentoDTO = {
    propriedadeId: 0,
    proprietarioId: 0,
    arrendatarioId: 0,
    areaArrendada: 0,
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: "",
    status: StatusArrendamento.ATIVO,
    documentoUrl: "",
    residente: false,
    atividadeProdutiva: undefined
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

  // Validação do formulário
  const validate = (values: ArrendamentoDTO) => {
    const errors: any = {};

    if (!values.propriedadeId || values.propriedadeId === 0) {
      errors.propriedadeId = "Propriedade é obrigatória";
    }

    if (!values.proprietarioId || values.proprietarioId === 0) {
      errors.proprietarioId = "Proprietário é obrigatório";
    }

    if (!values.arrendatarioId || values.arrendatarioId === 0) {
      errors.arrendatarioId = "Arrendatário é obrigatório";
    }

    if (values.proprietarioId === values.arrendatarioId && values.proprietarioId !== 0) {
      errors.arrendatarioId = "Arrendatário deve ser diferente do proprietário";
    }

    if (!values.areaArrendada || values.areaArrendada <= 0) {
      errors.areaArrendada = "Área arrendada deve ser maior que zero";
    }

    if (!values.dataInicio) {
      errors.dataInicio = "Data de início é obrigatória";
    }

    if (values.dataFim && values.dataInicio) {
      const inicio = new Date(values.dataInicio);
      const fim = new Date(values.dataFim);
      if (fim <= inicio) {
        errors.dataFim = "Data de término deve ser posterior à data de início";
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  return (
    <FormBase<Arrendamento, ArrendamentoDTO>
      title="Arrendamento"
      service={arrendamentoService}
      id={arrendamentoId}
      initialValues={initialValues}
      validate={validate}
      returnUrl="/movimentos/agricultura/arrendamentos"
    >
      {({ values, errors, touched, handleChange, setValue, setFieldTouched }) => (
        <div className="space-y-6">
          {/* Seção de Propriedade e Partes */}
          <FormSection
            title="Propriedade e Partes Envolvidas"
            description="Selecione a propriedade e as pessoas envolvidas no arrendamento"
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
                    handleChange(e);
                    const propId = parseInt(e.target.value);
                    const prop = propriedades.find(p => p.id === propId);
                    setPropriedadeSelecionada(prop || null);
                    if (prop?.proprietarioId) {
                      setValue("proprietarioId", prop.proprietarioId);
                    }
                  }}
                  onBlur={() => setFieldTouched("propriedadeId", true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingPropriedades}
                >
                  <option value={0}>Selecione uma propriedade</option>
                  {propriedades.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.nome} - {prop.areaTotal} {prop.unidadeArea}
                      {prop.localizacao && ` - ${prop.localizacao}`}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                name="proprietarioId"
                label="Proprietário"
                error={errors.proprietarioId}
                touched={touched.proprietarioId}
                required
                helpText="Proprietário é definido automaticamente pela propriedade selecionada"
              >
                <select
                  id="proprietarioId"
                  name="proprietarioId"
                  value={String(values.proprietarioId || 0)}
                  onChange={(e) => setValue("proprietarioId", Number(e.target.value))}
                  onBlur={() => setFieldTouched("proprietarioId", true)}
                  disabled={true}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
                >
                  <option value="0">
                    {loadingPessoas
                      ? "Carregando..."
                      : "Proprietário será preenchido automaticamente"}
                  </option>
                  {pessoasFisicas.map((pessoa) => (
                    <option key={pessoa.id} value={String(pessoa.id)}>
                      {pessoa.nome} - {pessoa.cpfCnpj}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingPessoas}
              >
                <option value={0}>Selecione o arrendatário</option>
                {pessoasFisicas
                  .filter(p => p.id !== values.proprietarioId)
                  .map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome} - {pessoa.cpfCnpj}
                    </option>
                  ))}
              </select>
            </FormField>

            {/* NOVO CAMPO: Residente */}
            <FormField
              name="residente"
              label="Arrendatário será residente da terra?"
              error={errors.residente}
              touched={touched.residente}
              helpText="Marque se o arrendatário irá residir na propriedade arrendada"
            >
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    id="residente"
                    name="residente"
                    checked={values.residente}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">
                    Sim, o arrendatário será residente
                  </span>
                </label>
              </div>
            </FormField>
          </FormSection>

          {/* Seção de Detalhes do Arrendamento */}
          <FormSection
            title="Detalhes do Arrendamento"
            description="Informações sobre área, atividade produtiva e período"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="areaArrendada"
                label="Área Arrendada"
                error={errors.areaArrendada}
                touched={touched.areaArrendada}
                required
                helpText={propriedadeSelecionada ? 
                  `Total disponível: ${propriedadeSelecionada.areaTotal} ${propriedadeSelecionada.unidadeArea}` : 
                  "Selecione uma propriedade primeiro"
                }
              >
                <input
                  type="number"
                  id="areaArrendada"
                  name="areaArrendada"
                  value={values.areaArrendada || ""}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("areaArrendada", true)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>

              {/* NOVO CAMPO: Atividade Produtiva */}
              <FormField
                name="atividadeProdutiva"
                label="Atividade Produtiva"
                error={errors.atividadeProdutiva}
                touched={touched.atividadeProdutiva}
                helpText="Selecione a principal atividade produtiva a ser desenvolvida"
              >
                <select
                  id="atividadeProdutiva"
                  name="atividadeProdutiva"
                  value={values.atividadeProdutiva || ""}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("atividadeProdutiva", true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma atividade</option>
                  {Object.entries(atividadeProdutivaLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

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
                helpText="Deixe em branco para arrendamento por tempo indeterminado"
              >
                <input
                  type="date"
                  id="dataFim"
                  name="dataFim"
                  value={values.dataFim || ""}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("dataFim", true)}
                  min={values.dataInicio}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>

              <FormField
                name="status"
                label="Status"
                error={errors.status}
                touched={touched.status}
                required
              >
                <select
                  id="status"
                  name="status"
                  value={values.status}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("status", true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={StatusArrendamento.ATIVO}>Ativo</option>
                  <option value={StatusArrendamento.ENCERRADO}>Encerrado</option>
                  <option value={StatusArrendamento.CANCELADO}>Cancelado</option>
                </select>
              </FormField>
            </div>

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
          </FormSection>

          {/* Seção de Documentação */}
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