import React, { useState, useEffect } from "react";
import FormularioMovimento from "../../../../components/movimento/FormularioMovimento";
import arrendamentoService, { 
  ArrendamentoDTO, 
  Arrendamento, 
  StatusArrendamento 
} from "../../../../services/agricultura/arrendamentoService";
import propriedadeService, { Propriedade } from "../../../../services/common/propriedadeService";
import pessoaService, { Pessoa, TipoPessoa } from "../../../../services/common/pessoaService";
import { FormField } from "../../../../components/common";

interface ArrendamentoFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Formulário para cadastro e edição de arrendamentos usando FormularioMovimento
 */
const ArrendamentoForm: React.FC<ArrendamentoFormProps> = ({ id, onSave }) => {
  // Estados para dados auxiliares
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [pessoasFisicas, setPessoasFisicas] = useState<Pessoa[]>([]);
  const [loadingPropriedades, setLoadingPropriedades] = useState(false);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [propriedadeSelecionada, setPropriedadeSelecionada] = useState<Propriedade | null>(null);
  const [conflitosValidacao, setConflitosValidacao] = useState<any[]>([]);
  const [validandoConflitos, setValidandoConflitos] = useState(false);

  // Valores iniciais do formulário
  const initialValues: ArrendamentoDTO = {
    propriedadeId: 0,
    proprietarioId: 0,
    arrendatarioId: 0,
    areaArrendada: 0,
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: "",
    status: StatusArrendamento.ATIVO,
    documentoUrl: "",
  };

  // Carregar propriedades para seleção
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

  // Carregar pessoas físicas para seleção
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

  // Validação do formulário
  const validate = async (values: ArrendamentoDTO): Promise<Record<string, string> | null> => {
    const errors: Record<string, string> = {};

    // Validar propriedade
    if (!values.propriedadeId || values.propriedadeId === 0) {
      errors.propriedadeId = "Propriedade é obrigatória";
    }

    // Validar proprietário
    if (!values.proprietarioId || values.proprietarioId === 0) {
      errors.proprietarioId = "Proprietário é obrigatório";
    }

    // Validar arrendatário
    if (!values.arrendatarioId || values.arrendatarioId === 0) {
      errors.arrendatarioId = "Arrendatário é obrigatório";
    }

    // Validar se proprietário e arrendatário são diferentes
    if (values.proprietarioId === values.arrendatarioId && values.proprietarioId !== 0) {
      errors.arrendatarioId = "Arrendatário deve ser diferente do proprietário";
    }

    // Validar área arrendada
    const areaArrendada = Number(values.areaArrendada);
    if (!areaArrendada || areaArrendada <= 0) {
      errors.areaArrendada = "Área arrendada deve ser maior que zero";
    }

    // Validar área contra propriedade selecionada
    if (propriedadeSelecionada && areaArrendada > Number(propriedadeSelecionada.areaTotal)) {
      errors.areaArrendada = `Área arrendada não pode ser maior que a área total da propriedade (${propriedadeService.formatarArea(propriedadeSelecionada.areaTotal)})`;
    }

    // Validar data de início
    if (!values.dataInicio) {
      errors.dataInicio = "Data de início é obrigatória";
    }

    // Validar data fim (se informada)
    if (values.dataFim && values.dataInicio) {
      const dataInicio = new Date(values.dataInicio);
      const dataFim = new Date(values.dataFim);
      
      if (dataFim <= dataInicio) {
        errors.dataFim = "Data fim deve ser posterior à data de início";
      }
    }

    // Validar conflitos de arrendamento (se não há erros básicos)
    if (Object.keys(errors).length === 0 && values.propriedadeId && values.dataInicio && areaArrendada > 0) {
      try {
        setValidandoConflitos(true);
        const validacao = await arrendamentoService.validarConflito({
          propriedadeId: values.propriedadeId,
          areaArrendada: areaArrendada,
          dataInicio: values.dataInicio,
          dataFim: values.dataFim,
          arrendamentoId: id && id !== "novo" ? Number(id) : undefined,
        });

        if (validacao.temConflito) {
          setConflitosValidacao(validacao.conflitos || []);
          errors.areaArrendada = "Há conflitos com outros arrendamentos ativos neste período";
        } else {
          setConflitosValidacao([]);
        }
      } catch (error) {
        console.error("Erro ao validar conflitos:", error);
        errors.geral = "Erro ao validar conflitos. Tente novamente.";
      } finally {
        setValidandoConflitos(false);
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Função para atualizar propriedade selecionada
  const handlePropriedadeChange = (propriedadeId: number, setValue: (name: string, value: any) => void) => {
    const propriedade = propriedades.find(p => p.id === propriedadeId);
    setPropriedadeSelecionada(propriedade || null);
    setValue('propriedadeId', propriedadeId);
  };

  // Seções do formulário
  const sections = [
    {
      title: "Informações da Propriedade",
      description: "Selecione a propriedade e defina a área a ser arrendada",
      content: ({ values, errors, touched, handleChange, setValue, setFieldTouched }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Propriedade *"
            name="propriedadeId"
            type="select"
            value={values.propriedadeId}
            onChange={(e) => {
              const value = Number(e.target.value);
              handleChange(e);
              handlePropriedadeChange(value, setValue);
            }}
            onBlur={() => setFieldTouched("propriedadeId", true)}
            error={touched.propriedadeId && errors.propriedadeId}
            disabled={loadingPropriedades}
            required
          >
            <option value={0}>
              {loadingPropriedades ? "Carregando..." : "Selecione uma propriedade"}
            </option>
            {propriedades.map((propriedade) => (
              <option key={propriedade.id} value={propriedade.id}>
                {propriedade.nome} - {propriedadeService.formatarArea(propriedade.areaTotal)}
                {propriedade.localizacao && ` (${propriedade.localizacao})`}
              </option>
            ))}
          </FormField>

          <FormField
            label="Área Arrendada (ha) *"
            name="areaArrendada"
            type="number"
            step="0.01"
            value={values.areaArrendada}
            onChange={handleChange}
            onBlur={() => setFieldTouched("areaArrendada", true)}
            error={touched.areaArrendada && errors.areaArrendada}
            placeholder="0.00"
            required
          />

          {/* Informações da propriedade selecionada */}
          {propriedadeSelecionada && (
            <div className="md:col-span-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-blue-900">Detalhes da Propriedade</h4>
              <div className="mt-2 text-sm text-blue-800 grid grid-cols-1 md:grid-cols-2 gap-2">
                <p><strong>Área Total:</strong> {propriedadeService.formatarArea(propriedadeSelecionada.areaTotal)}</p>
                <p><strong>Tipo:</strong> {propriedadeSelecionada.tipoPropriedade}</p>
                {propriedadeSelecionada.matricula && (
                  <p><strong>Matrícula:</strong> {propriedadeSelecionada.matricula}</p>
                )}
                {propriedadeSelecionada.localizacao && (
                  <p><strong>Localização:</strong> {propriedadeSelecionada.localizacao}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Partes Envolvidas",
      description: "Defina proprietário e arrendatário do contrato",
      content: ({ values, errors, touched, handleChange, setFieldTouched }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Proprietário *"
            name="proprietarioId"
            type="select"
            value={values.proprietarioId}
            onChange={handleChange}
            onBlur={() => setFieldTouched("proprietarioId", true)}
            error={touched.proprietarioId && errors.proprietarioId}
            disabled={loadingPessoas}
            required
          >
            <option value={0}>
              {loadingPessoas ? "Carregando..." : "Selecione o proprietário"}
            </option>
            {pessoasFisicas.map((pessoa) => (
              <option key={pessoa.id} value={pessoa.id}>
                {pessoa.nome} - {pessoa.cpfCnpj}
              </option>
            ))}
          </FormField>

          <FormField
            label="Arrendatário *"
            name="arrendatarioId"
            type="select"
            value={values.arrendatarioId}
            onChange={handleChange}
            onBlur={() => setFieldTouched("arrendatarioId", true)}
            error={touched.arrendatarioId && errors.arrendatarioId}
            disabled={loadingPessoas}
            required
          >
            <option value={0}>
              {loadingPessoas ? "Carregando..." : "Selecione o arrendatário"}
            </option>
            {pessoasFisicas.map((pessoa) => (
              <option key={pessoa.id} value={pessoa.id}>
                {pessoa.nome} - {pessoa.cpfCnpj}
              </option>
            ))}
          </FormField>
        </div>
      ),
    },
    {
      title: "Período do Arrendamento",
      description: "Configure as datas de início e término do contrato",
      content: ({ values, errors, touched, handleChange, setFieldTouched }) => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Data de Início *"
              name="dataInicio"
              type="date"
              value={values.dataInicio}
              onChange={handleChange}
              onBlur={() => setFieldTouched("dataInicio", true)}
              error={touched.dataInicio && errors.dataInicio}
              required
            />

            <FormField
              label="Data de Término"
              name="dataFim"
              type="date"
              value={values.dataFim || ""}
              onChange={handleChange}
              onBlur={() => setFieldTouched("dataFim", true)}
              error={touched.dataFim && errors.dataFim}
              placeholder="Deixe vazio para arrendamento por prazo indeterminado"
            />

            <FormField
              label="Status"
              name="status"
              type="select"
              value={values.status}
              onChange={handleChange}
              onBlur={() => setFieldTouched("status", true)}
              error={touched.status && errors.status}
            >
              {arrendamentoService.getStatusOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormField>
          </div>

          {/* Exibir duração calculada */}
          {values.dataInicio && values.dataFim && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                <strong>Duração:</strong> {arrendamentoService.calcularDuracao(values.dataInicio, values.dataFim)}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Documentação",
      description: "Anexe documentos relacionados ao arrendamento",
      content: ({ values, errors, touched, handleChange, setFieldTouched }) => (
        <FormField
          label="URL do Documento"
          name="documentoUrl"
          type="url"
          value={values.documentoUrl || ""}
          onChange={handleChange}
          onBlur={() => setFieldTouched("documentoUrl", true)}
          error={touched.documentoUrl && errors.documentoUrl}
          placeholder="https://exemplo.com/contrato-arrendamento.pdf"
          helpText="Link para o contrato de arrendamento ou documentação relacionada"
        />
      ),
    },
  ];

  // Alertas dinâmicos
  const alerts = [
    {
      type: 'warning' as const,
      title: 'Validando Conflitos',
      message: 'Verificando se há conflitos com outros arrendamentos...',
      show: validandoConflitos,
    },
    {
      type: 'error' as const,
      title: 'Conflitos Detectados',
      message: `Foram encontrados ${conflitosValidacao.length} conflito(s) com outros arrendamentos ativos no mesmo período.`,
      show: conflitosValidacao.length > 0,
    },
  ];

  // Ações customizadas no rodapé
  const customActions = (
    <div className="flex items-center space-x-4">
      {conflitosValidacao.length > 0 && (
        <button
          type="button"
          onClick={() => {
            // Aqui poderia abrir um modal com detalhes dos conflitos
            alert(`Conflitos encontrados:\n${conflitosValidacao.map(c => 
              `• Período: ${new Date(c.dataInicio).toLocaleDateString()} - ${c.dataFim ? new Date(c.dataFim).toLocaleDateString() : 'Indeterminado'} | Área: ${arrendamentoService.formatarArea(c.areaArrendada)}`
            ).join('\n')}`);
          }}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          📋 Ver Conflitos
        </button>
      )}
    </div>
  );

  return (
    <FormularioMovimento<Arrendamento, ArrendamentoDTO>
      title={id && id !== "novo" ? "Editar Arrendamento" : "Novo Arrendamento"}
      service={arrendamentoService}
      id={id}
      initialValues={initialValues}
      validate={validate}
      onSave={onSave}
      returnUrl="/movimentos/agricultura/arrendamentos"
      sections={sections}
      alerts={alerts}
      customActions={customActions}
      loading={loadingPropriedades || loadingPessoas}
    />
  );
};

export default ArrendamentoForm;