// frontend/src/pages/movimentos/agricultura/arrendamento/ArrendamentoForm.tsx - VERSÃO ATUALIZADA
import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import FormField from "../../../../components/comum/FormField";
import FormSection from "../../../../components/comum/FormSection";
import arrendamentoService, {
  ArrendamentoDTO,
  Arrendamento,
  StatusArrendamento,
} from "../../../../services/agricultura/arrendamentoService";
import propriedadeService, {
  Propriedade,
} from "../../../../services/comum/propriedadeService";
import pessoaService, {
  Pessoa,
  TipoPessoa,
} from "../../../../services/comum/pessoaService";

interface ArrendamentoFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Formulário para cadastro e edição de arrendamentos
 * 🆕 ATUALIZADO: Agora usa Pessoa ao invés de PessoaFisica
 */
const ArrendamentoForm: React.FC<ArrendamentoFormProps> = ({ id, onSave }) => {
  // Estados
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]); // 🆕 Mudança: pessoas ao invés de pessoasFisicas
  const [loadingPropriedades, setLoadingPropriedades] = useState(false);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [propriedadeSelecionada, setPropriedadeSelecionada] = useState<Propriedade | null>(null);
  
  // 🆕 Filtros para pessoas
  const [filtroProprietario, setFiltroProprietario] = useState<'todos' | 'produtores'>('todos');
  const [filtroArrendatario, setFiltroArrendatario] = useState<'todos' | 'produtores'>('todos');

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

  // 🆕 Carregar pessoas (todas, não apenas físicas)
  useEffect(() => {
    const fetchPessoas = async () => {
      setLoadingPessoas(true);
      try {
        // Carregar todas as pessoas ativas
        const todasPessoas = await pessoaService.getAll();
        const pessoasAtivas = todasPessoas.filter(p => p.ativo);
        setPessoas(pessoasAtivas);
      } catch (error) {
        console.error("Erro ao carregar pessoas:", error);
      } finally {
        setLoadingPessoas(false);
      }
    };

    fetchPessoas();
  }, []);

  // Atualizar propriedade selecionada quando mudar
  useEffect(() => {
    const propriedadeId = document.querySelector<HTMLSelectElement>('#propriedadeId')?.value;
    if (propriedadeId && Number(propriedadeId) > 0) {
      const propriedade = propriedades.find(p => p.id === Number(propriedadeId));
      setPropriedadeSelecionada(propriedade || null);
    }
  }, [propriedades]);

  // Validação
  const validate = (values: ArrendamentoDTO): Record<string, string> | null => {
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

  // 🆕 Função para filtrar pessoas baseado no tipo
  const filtrarPessoas = (tipo: 'proprietario' | 'arrendatario'): Pessoa[] => {
    const filtro = tipo === 'proprietario' ? filtroProprietario : filtroArrendatario;
    
    if (filtro === 'produtores') {
      return pessoas.filter(p => p.produtorRural);
    }
    
    return pessoas;
  };

  // 🆕 Função para renderizar pessoa na option
  const renderPessoaOption = (pessoa: Pessoa) => {
    const tipoLabel = pessoa.tipoPessoa === TipoPessoa.FISICA ? 'PF' : 'PJ';
    const produtorLabel = pessoa.produtorRural ? ' (Produtor)' : '';
    
    return `${pessoa.nome} - ${pessoa.cpfCnpj} [${tipoLabel}]${produtorLabel}`;
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
        <>
          <FormSection
            title="Propriedade"
            description="Selecione a propriedade que será arrendada"
          >
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
                  const propriedadeId = Number(e.target.value);
                  setValue("propriedadeId", propriedadeId);
                  
                  // Atualizar propriedade selecionada
                  const propriedade = propriedades.find(p => p.id === propriedadeId);
                  setPropriedadeSelecionada(propriedade || null);
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
                    {propriedade.nome} - {propriedadeService.formatarArea(propriedade.areaTotal)}
                    {propriedade.localizacao && ` (${propriedade.localizacao})`}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Informações da propriedade selecionada */}
            {propriedadeSelecionada && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">
                  Dados da Propriedade
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Área Total:</span>{" "}
                    {propriedadeService.formatarArea(propriedadeSelecionada.areaTotal)}
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span>{" "}
                    {propriedadeService.formatarTipoPropriedade(propriedadeSelecionada.tipoPropriedade)}
                  </div>
                  {propriedadeSelecionada.localizacao && (
                    <div className="md:col-span-2">
                      <span className="font-medium">Localização:</span>{" "}
                      {propriedadeSelecionada.localizacao}
                    </div>
                  )}
                </div>
              </div>
            )}
          </FormSection>

          <FormSection
            title="Partes Envolvidas"
            description="Defina proprietário e arrendatário do contrato"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Proprietário */}
              <div>
                <FormField
                  name="proprietarioId"
                  label="Proprietário"
                  error={errors.proprietarioId}
                  touched={touched.proprietarioId}
                  required
                >
                  {/* 🆕 Filtro para proprietário */}
                  <div className="mb-2">
                    <div className="flex gap-2 text-sm">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="filtroProprietario"
                          value="todos"
                          checked={filtroProprietario === 'todos'}
                          onChange={(e) => setFiltroProprietario(e.target.value as 'todos')}
                          className="mr-1"
                        />
                        Todas pessoas
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="filtroProprietario"
                          value="produtores"
                          checked={filtroProprietario === 'produtores'}
                          onChange={(e) => setFiltroProprietario(e.target.value as 'produtores')}
                          className="mr-1"
                        />
                        Apenas produtores rurais
                      </label>
                    </div>
                  </div>

                  <select
                    id="proprietarioId"
                    name="proprietarioId"
                    value={values.proprietarioId}
                    onChange={(e) => setValue("proprietarioId", Number(e.target.value))}
                    onBlur={() => setFieldTouched("proprietarioId", true)}
                    disabled={loadingPessoas}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>
                      {loadingPessoas
                        ? "Carregando..."
                        : "Selecione o proprietário"}
                    </option>
                    {filtrarPessoas('proprietario').map((pessoa) => (
                      <option key={pessoa.id} value={pessoa.id}>
                        {renderPessoaOption(pessoa)}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Arrendatário */}
              <div>
                <FormField
                  name="arrendatarioId"
                  label="Arrendatário"
                  error={errors.arrendatarioId}
                  touched={touched.arrendatarioId}
                  required
                >
                  {/* 🆕 Filtro para arrendatário */}
                  <div className="mb-2">
                    <div className="flex gap-2 text-sm">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="filtroArrendatario"
                          value="todos"
                          checked={filtroArrendatario === 'todos'}
                          onChange={(e) => setFiltroArrendatario(e.target.value as 'todos')}
                          className="mr-1"
                        />
                        Todas pessoas
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="filtroArrendatario"
                          value="produtores"
                          checked={filtroArrendatario === 'produtores'}
                          onChange={(e) => setFiltroArrendatario(e.target.value as 'produtores')}
                          className="mr-1"
                        />
                        Apenas produtores rurais
                      </label>
                    </div>
                  </div>

                  <select
                    id="arrendatarioId"
                    name="arrendatarioId"
                    value={values.arrendatarioId}
                    onChange={(e) => setValue("arrendatarioId", Number(e.target.value))}
                    onBlur={() => setFieldTouched("arrendatarioId", true)}
                    disabled={loadingPessoas}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>
                      {loadingPessoas
                        ? "Carregando..."
                        : "Selecione o arrendatário"}
                    </option>
                    {filtrarPessoas('arrendatario')
                      .filter(p => p.id !== values.proprietarioId) // Evitar mesmo proprietário
                      .map((pessoa) => (
                        <option key={pessoa.id} value={pessoa.id}>
                          {renderPessoaOption(pessoa)}
                        </option>
                      ))}
                  </select>
                </FormField>
              </div>
            </div>

            {/* 🆕 Informações das pessoas selecionadas */}
            {(values.proprietarioId > 0 || values.arrendatarioId > 0) && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">
                  Pessoas Selecionadas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {values.proprietarioId > 0 && (
                    <div>
                      <div className="font-medium text-green-800">Proprietário:</div>
                      {(() => {
                        const proprietario = pessoas.find(p => p.id === values.proprietarioId);
                        return proprietario ? (
                          <div>
                            <div>{proprietario.nome}</div>
                            <div className="text-green-600">
                              {proprietario.cpfCnpj} 
                              {proprietario.produtorRural && <span className="ml-2 font-medium">(Produtor Rural)</span>}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                  
                  {values.arrendatarioId > 0 && (
                    <div>
                      <div className="font-medium text-green-800">Arrendatário:</div>
                      {(() => {
                        const arrendatario = pessoas.find(p => p.id === values.arrendatarioId);
                        return arrendatario ? (
                          <div>
                            <div>{arrendatario.nome}</div>
                            <div className="text-green-600">
                              {arrendatario.cpfCnpj}
                              {arrendatario.produtorRural && <span className="ml-2 font-medium">(Produtor Rural)</span>}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </FormSection>

          <FormSection
            title="Detalhes do Arrendamento"
            description="Informações sobre área, período e status"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                name="areaArrendada"
                label="Área Arrendada (alqueires)"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="0.00"
                />
              </FormField>

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
                label="Data de Fim"
                error={errors.dataFim}
                touched={touched.dataFim}
                helpText="Opcional - deixe vazio para contratos sem prazo definido"
              >
                <input
                  type="date"
                  id="dataFim"
                  name="dataFim"
                  value={values.dataFim}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("dataFim", true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {Object.values(StatusArrendamento).map((status) => (
                    <option key={status} value={status}>
                      {arrendamentoService.formatarStatus(status)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                name="documentoUrl"
                label="URL do Documento"
                error={errors.documentoUrl}
                touched={touched.documentoUrl}
                helpText="Link para contrato ou documento do arrendamento"
              >
                <input
                  type="url"
                  id="documentoUrl"
                  name="documentoUrl"
                  value={values.documentoUrl}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("documentoUrl", true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </FormField>
            </div>
          </FormSection>
        </>
      )}
    </FormBase>
  );
};

export default ArrendamentoForm;