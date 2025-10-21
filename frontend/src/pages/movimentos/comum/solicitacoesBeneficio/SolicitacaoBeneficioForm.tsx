import React, { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import solicitacaoBeneficioService, {
  SolicitacaoBeneficio,
  SolicitacaoBeneficioDTO,
  StatusSolicitacao,
} from "../../../../services/comum/solicitacaoBeneficioService";
import programaService, {
  Programa,
  TipoPerfil,
} from "../../../../services/comum/programaService";
import pessoaService, { Pessoa } from "../../../../services/comum/pessoaService";
import { FormBase } from "../../../../components/cadastro";
import { FormField, HistoricoSolicitacao } from "../../../../components/comum";

interface SolicitacaoBeneficioFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Componente de Formulário de Solicitações de Benefício
 * Utiliza FormBase e permite selecionar pessoa e programa
 */
const SolicitacaoBeneficioForm: React.FC<SolicitacaoBeneficioFormProps> = ({
  id,
  onSave,
}) => {
  const params = useParams({ strict: false }) as any;
  const solicitacaoId = id || params.id;

  const [programas, setProgramas] = useState<Programa[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [programaSelecionado, setProgramaSelecionado] = useState<Programa | null>(null);
  const [loadingProgramas, setLoadingProgramas] = useState(false);
  const [loadingPessoas, setLoadingPessoas] = useState(false);

  // NOVO: Estados para cálculo automático
  const [calculando, setCalculando] = useState(false);
  const [calculoResultado, setCalculoResultado] = useState<any>(null);
  const [quantidadeSolicitada, setQuantidadeSolicitada] = useState<number | string>(""); // Inicia vazio ao invés de 0

  // Valor inicial para o formulário
  const initialValues: SolicitacaoBeneficioDTO = {
    pessoaId: 0,
    programaId: 0,
    observacoes: "",
    status: StatusSolicitacao.PENDENTE,
  };

  // Carregar programas
  useEffect(() => {
    const loadProgramas = async () => {
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

    loadProgramas();
  }, []);

  // Carregar pessoas baseado no programa selecionado
  useEffect(() => {
    const loadPessoas = async () => {
      if (!programaSelecionado) {
        setPessoas([]);
        return;
      }

      setLoadingPessoas(true);
      try {
        let pessoasDisponiveis: Pessoa[] = [];

        if (programaSelecionado.secretaria === TipoPerfil.AGRICULTURA) {
          // Para agricultura, buscar apenas pessoas que são produtores
          const todasPessoas = await pessoaService.getProdutores();
          pessoasDisponiveis = todasPessoas.filter(pessoa => 
            pessoa.ativo
          );
        } else {
          // Para obras, qualquer pessoa ativa
          const todasPessoas = await pessoaService.getAll();
          pessoasDisponiveis = todasPessoas.filter(pessoa => pessoa.ativo);
        }

        setPessoas(pessoasDisponiveis);
      } catch (error) {
        console.error("Erro ao carregar pessoas:", error);
      } finally {
        setLoadingPessoas(false);
      }
    };

    loadPessoas();
  }, [programaSelecionado]);

  // Função para atualizar programa selecionado
  const handleProgramaChange = (programaId: number, setValue: any) => {
    const programa = programas.find(p => p.id === programaId);
    setProgramaSelecionado(programa || null);
    setValue("programaId", programaId);
    setValue("pessoaId", 0); // Resetar pessoa selecionada
    setCalculoResultado(null); // Limpar cálculo anterior
  };

  // NOVO: Função para calcular benefício automaticamente
  const calcularBeneficioAutomatico = async (pessoaId: number, programaId: number, quantidade?: number) => {
    // Só calcular se tiver pessoa E programa selecionados
    if (!pessoaId || pessoaId === 0 || !programaId || programaId === 0) {
      setCalculoResultado(null);
      return;
    }

    setCalculando(true);
    try {
      const resultado = await solicitacaoBeneficioService.calcularBeneficio({
        pessoaId,
        programaId,
        quantidadeSolicitada: quantidade && quantidade > 0 ? quantidade : undefined
      });

      setCalculoResultado(resultado);
    } catch (error: any) {
      console.error("Erro ao calcular benefício:", error);
      setCalculoResultado({
        sucesso: false,
        calculo: {
          regraAplicadaId: null,
          valorCalculado: 0,
          calculoDetalhes: {},
          mensagem: error.response?.data?.erro || "Erro ao calcular benefício",
          avisos: error.response?.data?.detalhes || []
        },
        limitePeriodo: null
      });
    } finally {
      setCalculando(false);
    }
  };

  // NOVO: Effect para recalcular quando pessoa, programa ou quantidade mudarem
  useEffect(() => {
    // Pega os valores atuais do formulário (será implementado via callback)
  }, []);

  // Validação do formulário
  const validate = (values: SolicitacaoBeneficioDTO) => {
    const errors: Record<string, string> = {};

    if (!values.pessoaId || values.pessoaId === 0) {
      errors.pessoaId = "Pessoa é obrigatória";
    }

    if (!values.programaId || values.programaId === 0) {
      errors.programaId = "Programa é obrigatório";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Função para converter strings para números
  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>, 
    handleChange: any, 
    setValue: any
  ) => {
    const { name, value } = e.target;
    
    // Converter para número se for pessoaId ou programaId
    if (name === 'pessoaId' || name === 'programaId') {
      const numericValue = value === '' ? 0 : parseInt(value, 10);
      setValue(name, numericValue);
    } else {
      handleChange(e);
    }
  };

  return (
    <FormBase<SolicitacaoBeneficio, SolicitacaoBeneficioDTO>
      title="Solicitação de Benefício"
      service={solicitacaoBeneficioService}
      id={solicitacaoId}
      initialValues={initialValues}
      validate={validate}
      returnUrl="/movimentos/comum/solicitacoesBeneficios"
      onSave={onSave}
    >
      {({ values, errors, touched, handleChange, setValue }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="programaId"
              label="Programa"
              error={errors.programaId}
              touched={touched.programaId}
              required
              helpText={programaSelecionado ? 
                `Secretaria: ${programaService.formatarSecretaria(programaSelecionado.secretaria)}` : 
                "Selecione o programa para definir as pessoas disponíveis"
              }
            >
              <select
                id="programaId"
                name="programaId"
                value={values.programaId}
                onChange={(e) => {
                  handleSelectChange(e, handleChange, setValue);
                  handleProgramaChange(Number(e.target.value), setValue);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingProgramas}
              >
                <option value={0}>
                  {loadingProgramas ? "Carregando..." : "Selecione um programa"}
                </option>
                {programas.map((programa) => (
                  <option key={programa.id} value={programa.id}>
                    [{programaService.formatarSecretaria(programa.secretaria)}] {programa.nome}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              name="pessoaId"
              label={programaSelecionado?.secretaria === TipoPerfil.AGRICULTURA ? "Produtor" : "Pessoa"}
              error={errors.pessoaId}
              touched={touched.pessoaId}
              required
              helpText={
                programaSelecionado?.secretaria === TipoPerfil.AGRICULTURA
                  ? "Apenas produtores rurais podem solicitar benefícios de agricultura"
                  : "Qualquer pessoa pode solicitar benefícios de obras"
              }
            >
              <select
                id="pessoaId"
                name="pessoaId"
                value={values.pessoaId}
                onChange={(e) => {
                  handleSelectChange(e, handleChange, setValue);
                  // NOVO: Calcular automaticamente quando pessoa for selecionada
                  const pessoaId = parseInt(e.target.value);
                  if (pessoaId && pessoaId !== 0 && values.programaId && values.programaId !== 0) {
                    calcularBeneficioAutomatico(pessoaId, values.programaId, quantidadeSolicitada);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!programaSelecionado || loadingPessoas}
              >
                <option value={0}>
                  {!programaSelecionado
                    ? "Selecione um programa primeiro"
                    : loadingPessoas
                    ? "Carregando..."
                    : programaSelecionado.secretaria === TipoPerfil.AGRICULTURA
                    ? "Selecione um produtor"
                    : "Selecione uma pessoa"}
                </option>
                {pessoas.map((pessoa) => (
                  <option key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome} - {pessoa.cpfCnpj}
                    {pessoa.isProdutor}
                  </option>
                ))}
              </select>
            </FormField>

            {/* NOVO: Campo de quantidade solicitada */}
            {programaSelecionado && values.pessoaId !== 0 && (
              <FormField
                name="quantidadeSolicitada"
                label="Quantidade Solicitada"
                helpText="Quantidade de toneladas, unidades, etc (opcional para alguns programas)"
              >
                <input
                  type="number"
                  id="quantidadeSolicitada"
                  name="quantidadeSolicitada"
                  value={quantidadeSolicitada}
                  onChange={(e) => {
                    const valorInput = e.target.value;
                    // Se estiver vazio, mantém como string vazia
                    if (valorInput === "" || valorInput === null) {
                      setQuantidadeSolicitada("");
                      calcularBeneficioAutomatico(values.pessoaId, values.programaId, undefined);
                    } else {
                      const valor = parseFloat(valorInput);
                      setQuantidadeSolicitada(valor);
                      // Recalcular automaticamente
                      calcularBeneficioAutomatico(values.pessoaId, values.programaId, valor);
                    }
                  }}
                  onBlur={() => {
                    // Recalcular quando sair do campo
                    const valor = typeof quantidadeSolicitada === 'number' ? quantidadeSolicitada : undefined;
                    calcularBeneficioAutomatico(values.pessoaId, values.programaId, valor);
                  }}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 10 (toneladas)"
                />
              </FormField>
            )}

            {solicitacaoId && solicitacaoId !== "novo" && (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {solicitacaoBeneficioService.getStatusOptions().map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
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
              value={values.observacoes || ""}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite observações sobre a solicitação..."
            />
          </FormField>

          {/* NOVO: Preview do Cálculo Automático */}
          {calculando && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
              <p className="text-gray-600">⏳ Calculando benefício...</p>
            </div>
          )}

          {calculoResultado && !calculando && (
            <div className={`border rounded-lg p-4 ${
              calculoResultado.calculo.regraAplicadaId
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h4 className={`font-medium mb-3 ${
                calculoResultado.calculo.regraAplicadaId
                  ? 'text-green-900'
                  : 'text-yellow-900'
              }`}>
                {calculoResultado.calculo.regraAplicadaId ? '✅' : '⚠️'} Cálculo do Benefício
              </h4>

              {/* Valor Calculado */}
              {calculoResultado.calculo.regraAplicadaId && (
                <div className="mb-4">
                  <div className="text-3xl font-bold text-green-700">
                    R$ {calculoResultado.calculo.valorCalculado.toFixed(2)}
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {calculoResultado.calculo.mensagem}
                  </p>
                </div>
              )}

              {/* Detalhes do Cálculo */}
              {calculoResultado.calculo.calculoDetalhes?.observacoes && (
                <div className="space-y-1 text-sm">
                  {calculoResultado.calculo.calculoDetalhes.observacoes.map((obs: string, idx: number) => (
                    <p key={idx} className={calculoResultado.calculo.regraAplicadaId ? 'text-green-700' : 'text-yellow-700'}>
                      • {obs}
                    </p>
                  ))}
                </div>
              )}

              {/* Avisos */}
              {calculoResultado.calculo.avisos && calculoResultado.calculo.avisos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-yellow-300">
                  <p className="font-medium text-yellow-900 mb-1">⚠️ Avisos:</p>
                  {calculoResultado.calculo.avisos.map((aviso: string, idx: number) => (
                    <p key={idx} className="text-sm text-yellow-700">• {aviso}</p>
                  ))}
                </div>
              )}

              {/* Mensagem quando não se enquadra */}
              {!calculoResultado.calculo.regraAplicadaId && (
                <div className="text-yellow-700">
                  <p className="font-medium">{calculoResultado.calculo.mensagem}</p>
                  {calculoResultado.calculo.avisos && calculoResultado.calculo.avisos.map((aviso: string, idx: number) => (
                    <p key={idx} className="text-sm mt-1">• {aviso}</p>
                  ))}
                </div>
              )}

              {/* Verificação de Limites */}
              {calculoResultado.limitePeriodo && !calculoResultado.limitePeriodo.permitido && (
                <div className="mt-3 pt-3 border-t border-red-300 bg-red-50 -m-4 mt-3 p-4 rounded-b-lg">
                  <p className="font-medium text-red-900 flex items-center gap-2">
                    🚫 Limite Atingido
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {calculoResultado.limitePeriodo.mensagem}
                  </p>
                </div>
              )}

              {calculoResultado.limitePeriodo && calculoResultado.limitePeriodo.permitido && (
                <div className="mt-3 pt-3 border-t border-green-300">
                  <p className="text-sm text-green-700">
                    ✓ {calculoResultado.limitePeriodo.mensagem}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Informações do programa selecionado */}
          {programaSelecionado && !calculoResultado && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                📋 Informações do Programa
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Nome:</strong> {programaSelecionado.nome}</p>
                <p><strong>Tipo:</strong> {programaSelecionado.tipoPrograma}</p>
                <p><strong>Secretaria:</strong> {programaService.formatarSecretaria(programaSelecionado.secretaria)}</p>
                {programaSelecionado.descricao && (
                  <p><strong>Descrição:</strong> {programaSelecionado.descricao}</p>
                )}
                {programaSelecionado.leiNumero && (
                  <p><strong>Lei:</strong> {programaSelecionado.leiNumero}</p>
                )}
              </div>
            </div>
          )}

          {/* NOVO: Histórico de mudanças (apenas ao editar) */}
          {solicitacaoId && solicitacaoId !== "novo" && typeof solicitacaoId === 'number' && (
            <div className="mt-6">
              <HistoricoSolicitacao solicitacaoId={solicitacaoId} />
            </div>
          )}
        </>
      )}
    </FormBase>
  );
};

export default SolicitacaoBeneficioForm;