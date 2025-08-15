// frontend/src/pages/movimentos/comum/solicitacoesBeneficio/SolicitacaoBeneficioForm.tsx - VERSÃO ATUALIZADA
import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import FormField from "../../../../components/comum/FormField";
import FormSection from "../../../../components/comum/FormSection";
import solicitacaoBeneficioService, {
  SolicitacaoBeneficioDTO,
  SolicitacaoBeneficio,
  StatusSolicitacao,
} from "../../../../services/comum/solicitacaoBeneficioService";
import programaService, {
  Programa,
  TipoPerfil,
} from "../../../../services/comum/programaService";
import pessoaService, {
  Pessoa,
  TipoPessoa,
} from "../../../../services/comum/pessoaService";

interface SolicitacaoBeneficioFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Formulário para cadastro e edição de solicitações de benefício
 * 🆕 ATUALIZADO: Agora usa pessoa diretamente com filtro para produtores rurais
 */
const SolicitacaoBeneficioForm: React.FC<SolicitacaoBeneficioFormProps> = ({
  id,
  onSave,
}) => {
  // Estados
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [loadingProgramas, setLoadingProgramas] = useState(false);
  const [programaSelecionado, setProgramaSelecionado] = useState<Programa | null>(null);
  
  // 🆕 Filtros
  const [filtrarPorProdutor, setFiltrarPorProdutor] = useState<'todos' | 'apenas_produtores'>('todos');
  const [filtrarPorSecretaria, setFiltrarPorSecretaria] = useState<TipoPerfil | 'todas'>('todas');

  // Valores iniciais
  const initialValues: SolicitacaoBeneficioDTO = {
    pessoaId: 0, // 🆕 Mudança: era produtorId
    programaId: 0,
    datasolicitacao: new Date().toISOString().split("T")[0],
    status: StatusSolicitacao.PENDENTE,
    observacoes: "",
  };

  // Carregar pessoas
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

  // Carregar programas
  useEffect(() => {
    const fetchProgramas = async () => {
      setLoadingProgramas(true);
      try {
        const programasAtivos = await programaService.getAll();
        setProgramas(programasAtivos.filter(p => p.ativo));
      } catch (error) {
        console.error("Erro ao carregar programas:", error);
      } finally {
        setLoadingProgramas(false);
      }
    };

    fetchProgramas();
  }, []);

  // Atualizar programa selecionado
  useEffect(() => {
    const programaId = document.querySelector<HTMLSelectElement>('#programaId')?.value;
    if (programaId && Number(programaId) > 0) {
      const programa = programas.find(p => p.id === Number(programaId));
      setProgramaSelecionado(programa || null);
    }
  }, [programas]);

  // Validação
  const validate = (values: SolicitacaoBeneficioDTO): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    if (!values.pessoaId || values.pessoaId === 0) {
      errors.pessoaId = "Pessoa é obrigatória";
    }

    if (!values.programaId || values.programaId === 0) {
      errors.programaId = "Programa é obrigatório";
    }

    if (!values.datasolicitacao) {
      errors.datasolicitacao = "Data da solicitação é obrigatória";
    }

    // 🆕 Validação específica: programa de agricultura só para produtores rurais
    if (programaSelecionado && values.pessoaId > 0) {
      const pessoaSelecionada = pessoas.find(p => p.id === values.pessoaId);
      
      if (programaSelecionado.secretaria === TipoPerfil.AGRICULTURA && 
          pessoaSelecionada && !pessoaSelecionada.produtorRural) {
        errors.pessoaId = "Programas de agricultura são apenas para produtores rurais";
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // 🆕 Função para filtrar pessoas
  const filtrarPessoas = (): Pessoa[] => {
    let pessoasFiltradas = pessoas;

    // Filtro por produtor rural
    if (filtrarPorProdutor === 'apenas_produtores') {
      pessoasFiltradas = pessoasFiltradas.filter(p => p.produtorRural);
    }

    return pessoasFiltradas;
  };

  // 🆕 Função para filtrar programas
  const filtrarProgramas = (): Programa[] => {
    if (filtrarPorSecretaria === 'todas') {
      return programas;
    }
    
    return programas.filter(p => p.secretaria === filtrarPorSecretaria);
  };

  // 🆕 Função para renderizar pessoa na option
  const renderPessoaOption = (pessoa: Pessoa) => {
    const tipoLabel = pessoa.tipoPessoa === TipoPessoa.FISICA ? 'PF' : 'PJ';
    const produtorLabel = pessoa.produtorRural ? ' (Produtor Rural)' : '';
    
    return `${pessoa.nome} - ${pessoa.cpfCnpj} [${tipoLabel}]${produtorLabel}`;
  };

  return (
    <FormBase<SolicitacaoBeneficio, SolicitacaoBeneficioDTO>
      title="Solicitação de Benefício"
      service={solicitacaoBeneficioService}
      id={id}
      initialValues={initialValues}
      validate={validate}
      onSave={onSave}
      returnUrl="/movimentos/comum/solicitacoes-beneficio"
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
            title="Beneficiário"
            description="Selecione a pessoa que receberá o benefício"
          >
            {/* 🆕 Filtros para pessoas */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Filtros</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Pessoa
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="filtroProdutor"
                        value="todos"
                        checked={filtrarPorProdutor === 'todos'}
                        onChange={(e) => setFiltrarPorProdutor(e.target.value as 'todos')}
                        className="mr-2"
                      />
                      <span className="text-sm">Todas as pessoas</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="filtroProdutor"
                        value="apenas_produtores"
                        checked={filtrarPorProdutor === 'apenas_produtores'}
                        onChange={(e) => setFiltrarPorProdutor(e.target.value as 'apenas_produtores')}
                        className="mr-2"
                      />
                      <span className="text-sm">Apenas produtores rurais</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secretaria do Programa
                  </label>
                  <select
                    value={filtrarPorSecretaria}
                    onChange={(e) => setFiltrarPorSecretaria(e.target.value as TipoPerfil | 'todas')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="todas">Todas as secretarias</option>
                    <option value={TipoPerfil.AGRICULTURA}>Agricultura</option>
                    <option value={TipoPerfil.OBRAS}>Obras</option>
                  </select>
                </div>
              </div>
            </div>

            <FormField
              name="pessoaId"
              label="Pessoa"
              error={errors.pessoaId}
              touched={touched.pessoaId}
              required
            >
              <select
                id="pessoaId"
                name="pessoaId"
                value={values.pessoaId}
                onChange={(e) => setValue("pessoaId", Number(e.target.value))}
                onBlur={() => setFieldTouched("pessoaId", true)}
                disabled={loadingPessoas}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>
                  {loadingPessoas ? "Carregando..." : "Selecione a pessoa"}
                </option>
                {filtrarPessoas().map((pessoa) => (
                  <option key={pessoa.id} value={pessoa.id}>
                    {renderPessoaOption(pessoa)}
                  </option>
                ))}
              </select>
            </FormField>

            {/* 🆕 Informações da pessoa selecionada */}
            {values.pessoaId > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">
                  Dados da Pessoa Selecionada
                </h4>
                {(() => {
                  const pessoa = pessoas.find(p => p.id === values.pessoaId);
                  return pessoa ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Nome:</span> {pessoa.nome}
                      </div>
                      <div>
                        <span className="font-medium">CPF/CNPJ:</span> {pessoa.cpfCnpj}
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span>{" "}
                        {pessoa.tipoPessoa === TipoPessoa.FISICA ? "Pessoa Física" : "Pessoa Jurídica"}
                      </div>
                      <div>
                        <span className="font-medium">Produtor Rural:</span>{" "}
                        <span className={pessoa.produtorRural ? "text-green-600 font-medium" : "text-gray-500"}>
                          {pessoa.produtorRural ? "Sim" : "Não"}
                        </span>
                      </div>
                      {pessoa.telefone && (
                        <div>
                          <span className="font-medium">Telefone:</span> {pessoa.telefone}
                        </div>
                      )}
                      {pessoa.email && (
                        <div>
                          <span className="font-medium">E-mail:</span> {pessoa.email}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </FormSection>

          <FormSection
            title="Programa"
            description="Selecione o programa de benefício solicitado"
          >
            <FormField
              name="programaId"
              label="Programa"
              error={errors.programaId}
              touched={touched.programaId}
              required
            >
              <select
                id="programaId"
                name="programaId"
                value={values.programaId}
                onChange={(e) => {
                  const programaId = Number(e.target.value);
                  setValue("programaId", programaId);
                  
                  // Atualizar programa selecionado
                  const programa = programas.find(p => p.id === programaId);
                  setProgramaSelecionado(programa || null);
                }}
                onBlur={() => setFieldTouched("programaId", true)}
                disabled={loadingProgramas}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>
                  {loadingProgramas ? "Carregando..." : "Selecione o programa"}
                </option>
                {filtrarProgramas().map((programa) => (
                  <option key={programa.id} value={programa.id}>
                    {programa.nome} - {programaService.formatarSecretaria(programa.secretaria)}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Informações do programa selecionado */}
            {programaSelecionado && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">
                  Detalhes do Programa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Nome:</span> {programaSelecionado.nome}
                  </div>
                  <div>
                    <span className="font-medium">Secretaria:</span>{" "}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      programaService.getSecretariaColor(programaSelecionado.secretaria) === 'green' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {programaService.formatarSecretaria(programaSelecionado.secretaria)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span>{" "}
                    {programaService.formatarTipoPrograma(programaSelecionado.tipoPrograma)}
                  </div>
                  {programaSelecionado.leiNumero && (
                    <div>
                      <span className="font-medium">Lei:</span> {programaSelecionado.leiNumero}
                    </div>
                  )}
                  {programaSelecionado.descricao && (
                    <div className="md:col-span-2">
                      <span className="font-medium">Descrição:</span> {programaSelecionado.descricao}
                    </div>
                  )}
                </div>

                {/* 🆕 Aviso para programas de agricultura */}
                {programaSelecionado.secretaria === TipoPerfil.AGRICULTURA && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <div className="text-yellow-600 mr-2">⚠️</div>
                      <p className="text-sm text-yellow-800">
                        <strong>Atenção:</strong> Este programa é exclusivo para produtores rurais.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </FormSection>

          <FormSection
            title="Detalhes da Solicitação"
            description="Informações sobre a solicitação do benefício"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="datasolicitacao"
                label="Data da Solicitação"
                error={errors.datasolicitacao}
                touched={touched.datasolicitacao}
                required
              >
                <input
                  type="date"
                  id="datasolicitacao"
                  name="datasolicitacao"
                  value={values.datasolicitacao}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("datasolicitacao", true)}
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
                  {Object.values(StatusSolicitacao).map((status) => (
                    <option key={status} value={status}>
                      {solicitacaoBeneficioService.formatarStatus(status)}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField
              name="observacoes"
              label="Observações"
              error={errors.observacoes}
              touched={touched.observacoes}
              helpText="Informações adicionais sobre a solicitação"
            >
              <textarea
                id="observacoes"
                name="observacoes"
                value={values.observacoes}
                onChange={handleChange}
                onBlur={() => setFieldTouched("observacoes", true)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite observações sobre a solicitação..."
              />
            </FormField>
          </FormSection>
        </>
      )}
    </FormBase>
  );
};

export default SolicitacaoBeneficioForm;