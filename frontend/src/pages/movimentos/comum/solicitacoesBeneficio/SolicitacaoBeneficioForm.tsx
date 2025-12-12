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
import pessoaService, {
  Pessoa,
} from "../../../../services/comum/pessoaService";
import { FormBase } from "../../../../components/cadastro";
import { FormField, HistoricoSolicitacao } from "../../../../components/comum";
import AsyncSearchSelect from "../../../../components/comum/AsyncSearchSelect";
import { SaldoCard } from "../../../../components/comum";

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

  const [programaSelecionado, setProgramaSelecionado] =
    useState<Programa | null>(null);
  const [pessoaSelecionada, setPessoaSelecionada] = useState<Pessoa | null>(
    null
  );

  // Estados para labels iniciais (quando editando)
  const [programaInitialLabel, setProgramaInitialLabel] = useState<string>("");
  const [programaInitialSubLabel, setProgramaInitialSubLabel] =
    useState<string>("");
  const [pessoaInitialLabel, setPessoaInitialLabel] = useState<string>("");
  const [pessoaInitialSubLabel, setPessoaInitialSubLabel] =
    useState<string>("");

  // NOVO: Estados para cálculo automático
  const [calculando, setCalculando] = useState(false);
  const [calculoResultado, setCalculoResultado] = useState<any>(null);
  const [quantidadeSolicitada, setQuantidadeSolicitada] = useState<
    number | string
  >(""); // Inicia vazio ao invés de 0
  const [dadosCarregados, setDadosCarregados] = useState(false); // Controla se já carregou dados do edit
  const [quantidadeAnimais, setQuantidadeAnimais] = useState<number | string>(
    ""
  );

  // Valor inicial para o formulário
  const initialValues: SolicitacaoBeneficioDTO = {
    pessoaId: 0,
    programaId: 0,
    quantidadeSolicitada: undefined,
    observacoes: "",
    status: StatusSolicitacao.PENDENTE,
  };

  // Busca de programas para AsyncSearchSelect
  const searchProgramas = async (termo: string): Promise<Programa[]> => {
    if (!termo || termo.length < 2) {
      return [];
    }
    try {
      // Buscar todos os programas ativos e filtrar no frontend
      const todosProgramas = await programaService.getAll();
      const termoLower = termo.toLowerCase();

      return todosProgramas.filter(
        (p) =>
          p.ativo &&
          (p.nome.toLowerCase().includes(termoLower) ||
            p.descricao?.toLowerCase().includes(termoLower) ||
            p.leiNumero?.toLowerCase().includes(termoLower))
      );
    } catch (error) {
      console.error("Erro ao buscar programas:", error);
      return [];
    }
  };

  // Busca de pessoas para AsyncSearchSelect (baseado no programa selecionado)
  const searchPessoas = async (termo: string): Promise<Pessoa[]> => {
    if (!termo || termo.length < 2) {
      return [];
    }
    if (!programaSelecionado) {
      return [];
    }

    try {
      let pessoasDisponiveis: Pessoa[] = [];

      if (programaSelecionado.secretaria === TipoPerfil.AGRICULTURA) {
        // Para agricultura, buscar apenas pessoas que são produtores
        const todasPessoas = await pessoaService.buscarPorTermo(termo);
        pessoasDisponiveis = todasPessoas.filter(
          (pessoa) => pessoa.ativo && pessoa.isProdutor
        );
      } else {
        // Para obras, qualquer pessoa ativa
        const todasPessoas = await pessoaService.buscarPorTermo(termo);
        pessoasDisponiveis = todasPessoas.filter((pessoa) => pessoa.ativo);
      }

      return pessoasDisponiveis;
    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
      return [];
    }
  };

  // Função para atualizar programa selecionado
  const handleProgramaChange = (
    programaId: number | null,
    programa: Programa | undefined,
    setValue: any
  ) => {
    setProgramaSelecionado(programa || null);
    setValue("programaId", programaId || 0);
    setValue("pessoaId", 0); // Resetar pessoa selecionada
    setPessoaSelecionada(null); // Limpar pessoa selecionada
    setCalculoResultado(null); // Limpar cálculo anterior
    setQuantidadeAnimais("");
  };

  // NOVO: Função para calcular benefício automaticamente
  const calcularBeneficioAutomatico = async (
    pessoaId: number,
    programaId: number,
    quantidade?: number,
    dadosAdicionais?: { quantidadeAnimais?: number }
  ) => {
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
        quantidadeSolicitada:
          quantidade && quantidade > 0 ? quantidade : undefined,
        dadosAdicionais: dadosAdicionais || {
          quantidadeAnimais:
            typeof quantidadeAnimais === "number"
              ? quantidadeAnimais
              : undefined,
        },
      });
      console.log("📥 FRONTEND - Resultado recebido:", resultado);
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
          avisos: error.response?.data?.detalhes || [],
        },
        limitePeriodo: null,
      });
    } finally {
      setCalculando(false);
    }
  };

  // NOVO: Carregar dados completos da solicitação quando estiver editando
  useEffect(() => {
    const carregarDadosCompletos = async () => {
      if (!solicitacaoId || solicitacaoId === "novo" || dadosCarregados) {
        return;
      }

      try {
        const solicitacao = await solicitacaoBeneficioService.getById(
          solicitacaoId
        );
        console.log("📦 Solicitação carregada:", solicitacao);

        // 1. Carregar programa selecionado e seus labels para o AsyncSearchSelect
        if (solicitacao.programa) {
          setProgramaSelecionado(solicitacao.programa);
          setProgramaInitialLabel(solicitacao.programa.nome);
          setProgramaInitialSubLabel(
            `${programaService.formatarSecretaria(
              solicitacao.programa.secretaria
            )} - ${solicitacao.programa.tipoPrograma}`
          );
        }

        // 2. Carregar pessoa selecionada e seus labels para o AsyncSearchSelect
        if (solicitacao.pessoa) {
          setPessoaSelecionada(solicitacao.pessoa);
          setPessoaInitialLabel(solicitacao.pessoa.nome);
          setPessoaInitialSubLabel(solicitacao.pessoa.cpfCnpj);
        }

        // 3. Carregar quantidade solicitada
        const quantidadeCarregada = solicitacao.quantidadeSolicitada
          ? Number(solicitacao.quantidadeSolicitada)
          : "";
        console.log(
          "🔢 Quantidade carregada:",
          quantidadeCarregada,
          "| Original:",
          solicitacao.quantidadeSolicitada
        );
        setQuantidadeSolicitada(quantidadeCarregada);

        // 4. Recalcular o benefício com os dados carregados (atualiza o cálculo)
        if (solicitacao.pessoaId && solicitacao.programaId) {
          await calcularBeneficioAutomatico(
            solicitacao.pessoaId,
            solicitacao.programaId,
            quantidadeCarregada ? Number(quantidadeCarregada) : undefined
          );
        }

        setDadosCarregados(true);
      } catch (error) {
        console.error("Erro ao carregar dados da solicitação:", error);
      }
    };

    carregarDadosCompletos();
  }, [solicitacaoId, dadosCarregados]);

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

  return (
    <FormBase<SolicitacaoBeneficio, SolicitacaoBeneficioDTO>
      title="Solicitação de Benefício"
      service={solicitacaoBeneficioService}
      id={solicitacaoId}
      initialValues={initialValues}
      validate={validate}
      returnUrl="/movimentos/comum/solicitacoesBeneficios"
      //onSave={onSave}
    >
      {({ values, errors, touched, handleChange, setValue }) => (
        <>
          {/* Aviso quando estiver editando */}
          {solicitacaoId && solicitacaoId !== "novo" && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Modo de Edição:</strong> Você pode alterar todos os
                dados da solicitação. O valor do benefício será recalculado
                automaticamente ao modificar pessoa, programa ou quantidade.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <AsyncSearchSelect<Programa>
                label="Programa"
                value={
                  values.programaId && values.programaId !== 0
                    ? values.programaId
                    : null
                }
                onChange={(value, programa) => {
                  handleProgramaChange(value, programa, setValue);
                }}
                searchFunction={searchProgramas}
                getOptionLabel={(programa) => programa.nome}
                getOptionSubLabel={(programa) =>
                  `${programaService.formatarSecretaria(
                    programa.secretaria
                  )} - ${programa.tipoPrograma}`
                }
                getId={(programa) => programa.id}
                placeholder="Digite o nome do programa..."
                required
                error={errors.programaId}
                initialLabel={programaInitialLabel || undefined}
                initialSubLabel={programaInitialSubLabel || undefined}
              />
              {programaSelecionado && (
                <p className="mt-1 text-sm text-gray-600">
                  Secretaria:{" "}
                  {programaService.formatarSecretaria(
                    programaSelecionado.secretaria
                  )}
                </p>
              )}
              {!programaSelecionado && (
                <p className="mt-1 text-sm text-gray-500">
                  Selecione o programa para definir as pessoas disponíveis
                </p>
              )}
            </div>

            <div>
              <AsyncSearchSelect<Pessoa>
                label={
                  programaSelecionado?.secretaria === TipoPerfil.AGRICULTURA
                    ? "Produtor"
                    : "Pessoa"
                }
                value={
                  values.pessoaId && values.pessoaId !== 0
                    ? values.pessoaId
                    : null
                }
                onChange={(value, pessoa) => {
                  setValue("pessoaId", value || 0);
                  setPessoaSelecionada(pessoa || null);
                  // Calcular automaticamente quando pessoa for selecionada
                  if (
                    value &&
                    value !== 0 &&
                    values.programaId &&
                    values.programaId !== 0
                  ) {
                    calcularBeneficioAutomatico(
                      value,
                      values.programaId,
                      typeof quantidadeSolicitada === "number"
                        ? quantidadeSolicitada
                        : undefined
                    );
                  }
                }}
                searchFunction={searchPessoas}
                getOptionLabel={(pessoa) => pessoa.nome}
                getOptionSubLabel={(pessoa) => pessoa.cpfCnpj}
                getId={(pessoa) => pessoa.id}
                placeholder={
                  !programaSelecionado
                    ? "Selecione um programa primeiro"
                    : programaSelecionado.secretaria === TipoPerfil.AGRICULTURA
                    ? "Digite o nome ou CPF do produtor..."
                    : "Digite o nome ou CPF/CNPJ da pessoa..."
                }
                disabled={!programaSelecionado}
                required
                error={errors.pessoaId}
                initialLabel={pessoaInitialLabel || undefined}
                initialSubLabel={pessoaInitialSubLabel || undefined}
              />
              {programaSelecionado && (
                <p className="mt-1 text-sm text-gray-500">
                  {programaSelecionado.secretaria === TipoPerfil.AGRICULTURA
                    ? "Apenas produtores rurais podem solicitar benefícios de agricultura"
                    : "Qualquer pessoa pode solicitar benefícios de obras"}
                </p>
              )}
            </div>

            {/* SALDO DISPONÍVEL */}
            {values.pessoaId > 0 && values.programaId > 0 && (
              <div className="col-span-1 md:col-span-2">
                <SaldoCard
                  pessoaId={values.pessoaId}
                  programaId={values.programaId}
                />
              </div>
            )}

            {/* Campo de quantidade de animais - só aparece para programas específicos */}
            {programaSelecionado &&
              (programaSelecionado.unidadeLimite === "doses" ||
                programaSelecionado.unidadeLimite === "matrizes" ||
                programaSelecionado.unidadeLimite === "exames") && (
                <FormField
                  name="quantidadeAnimais"
                  label={
                    programaSelecionado.unidadeLimite === "matrizes"
                      ? "Quantidade de Matrizes (ADAPAR)"
                      : programaSelecionado.unidadeLimite === "exames"
                      ? "Quantidade de Animais no Rebanho"
                      : "Quantidade de Vacas"
                  }
                  helpText={
                    programaSelecionado.unidadeLimite === "matrizes"
                      ? "Informe conforme relatório ADAPAR"
                      : "Informe o total de animais para determinar o enquadramento"
                  }
                >
                  <input
                    type="number"
                    id="quantidadeAnimais"
                    value={quantidadeAnimais}
                    onChange={(e) => {
                      const valor =
                        e.target.value === "" ? "" : parseInt(e.target.value);
                      setQuantidadeAnimais(valor);
                      // Recalcular automaticamente
                      if (values.pessoaId && values.programaId) {
                        calcularBeneficioAutomatico(
                          values.pessoaId,
                          values.programaId,
                          typeof quantidadeSolicitada === "number"
                            ? quantidadeSolicitada
                            : undefined,
                          {
                            quantidadeAnimais:
                              typeof valor === "number" ? valor : undefined,
                          }
                        );
                      }
                    }}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 30"
                  />
                </FormField>
              )}

            {/* NOVO: Campo de quantidade solicitada - READONLY se estiver editando */}
            {programaSelecionado && values.pessoaId !== 0 && (
              <FormField
                name="quantidadeSolicitada"
                label="Quantidade Solicitada"
                helpText={
                  calculoResultado?.calculo?.calculoDetalhes?.limiteAplicado
                    ?.limite
                    ? `Limite máximo: ${
                        calculoResultado.calculo.calculoDetalhes.limiteAplicado
                          .limite
                      } ${
                        calculoResultado.calculo.calculoDetalhes.limiteAplicado
                          .unidade || "unidades"
                      }`
                    : "Toneladas, unidades, doses, etc"
                }
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
                      setValue("quantidadeSolicitada", undefined);
                      calcularBeneficioAutomatico(
                        values.pessoaId,
                        values.programaId,
                        undefined
                      );
                    } else {
                      const valor = parseFloat(valorInput);
                      setQuantidadeSolicitada(valor);
                      setValue("quantidadeSolicitada", valor);
                      // Recalcular automaticamente
                      calcularBeneficioAutomatico(
                        values.pessoaId,
                        values.programaId,
                        valor
                      );
                    }
                  }}
                  onBlur={() => {
                    const valor =
                      typeof quantidadeSolicitada === "number"
                        ? quantidadeSolicitada
                        : undefined;
                    calcularBeneficioAutomatico(
                      values.pessoaId,
                      values.programaId,
                      valor
                    );
                  }}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    calculoResultado?.calculo?.calculoDetalhes?.limiteAplicado
                      ?.limite &&
                    typeof quantidadeSolicitada === "number" &&
                    quantidadeSolicitada >
                      calculoResultado.calculo.calculoDetalhes.limiteAplicado
                        .limite
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Ex: 10"
                />
                {/* Aviso visual quando exceder o limite */}
                {calculoResultado?.calculo?.calculoDetalhes?.limiteAplicado
                  ?.limite &&
                  typeof quantidadeSolicitada === "number" &&
                  quantidadeSolicitada >
                    calculoResultado.calculo.calculoDetalhes.limiteAplicado
                      .limite && (
                    <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                      ⚠️ Quantidade informada ({quantidadeSolicitada}{" "}
                      {calculoResultado.calculo.calculoDetalhes.limiteAplicado
                        .unidade || "unidades"}
                      ) excede o limite máximo de{" "}
                      {
                        calculoResultado.calculo.calculoDetalhes.limiteAplicado
                          .limite
                      }{" "}
                      {calculoResultado.calculo.calculoDetalhes.limiteAplicado
                        .unidade || "unidades"}
                      . O sistema calculará automaticamente com o valor máximo
                      permitido.
                    </div>
                  )}
              </FormField>
            )}

            {/* Campo de quantidade de animais - só aparece para programas que precisam */}
            {programaSelecionado &&
              (["semen_sexado", "semen_suino", "ultrassom"].some((tipo) =>
                programaSelecionado.regras?.some((r) => r.tipoRegra === tipo)
              ) ||
                programaSelecionado.unidadeLimite?.includes("vacas") ||
                programaSelecionado.unidadeLimite?.includes("matrizes") ||
                programaSelecionado.unidadeLimite?.includes("exames")) && (
                <FormField
                  name="quantidadeAnimais"
                  label={
                    programaSelecionado.unidadeLimite?.includes("matrizes")
                      ? "Quantidade de Matrizes (ADAPAR)"
                      : "Quantidade de Vacas/Animais"
                  }
                  helpText="Informe a quantidade total de animais do seu rebanho"
                >
                  <input
                    type="number"
                    id="quantidadeAnimais"
                    value={quantidadeAnimais}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setQuantidadeAnimais(valor === "" ? "" : parseInt(valor));
                      // Recalcular automaticamente
                      if (values.pessoaId && values.programaId) {
                        calcularBeneficioAutomatico(
                          values.pessoaId,
                          values.programaId,
                          typeof quantidadeSolicitada === "number"
                            ? quantidadeSolicitada
                            : undefined,
                          { quantidadeAnimais: parseInt(valor) || 0 }
                        );
                      }
                    }}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 30"
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
                  {solicitacaoBeneficioService
                    .getStatusOptions()
                    .map((status) => (
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
            <div
              className={`border rounded-lg p-4 ${
                calculoResultado.calculo.regraAplicadaId
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <h4
                className={`font-medium mb-3 ${
                  calculoResultado.calculo.regraAplicadaId
                    ? "text-green-900"
                    : "text-yellow-900"
                }`}
              >
                {calculoResultado.calculo.regraAplicadaId ? "✅" : "⚠️"} Cálculo
                do Benefício
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
                  {calculoResultado.calculo.calculoDetalhes.observacoes.map(
                    (obs: string, idx: number) => (
                      <p
                        key={idx}
                        className={
                          calculoResultado.calculo.regraAplicadaId
                            ? "text-green-700"
                            : "text-yellow-700"
                        }
                      >
                        • {obs}
                      </p>
                    )
                  )}
                </div>
              )}

              {/* Avisos */}
              {calculoResultado.calculo.avisos &&
                calculoResultado.calculo.avisos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-yellow-300">
                    <p className="font-medium text-yellow-900 mb-1">
                      ⚠️ Avisos:
                    </p>
                    {calculoResultado.calculo.avisos.map(
                      (aviso: string, idx: number) => (
                        <p key={idx} className="text-sm text-yellow-700">
                          • {aviso}
                        </p>
                      )
                    )}
                  </div>
                )}

              {/* Mensagem quando não se enquadra */}
              {!calculoResultado.calculo.regraAplicadaId && (
                <div className="text-yellow-700">
                  <p className="font-medium">
                    {calculoResultado.calculo.mensagem}
                  </p>
                  {calculoResultado.calculo.avisos &&
                    calculoResultado.calculo.avisos.map(
                      (aviso: string, idx: number) => (
                        <p key={idx} className="text-sm mt-1">
                          • {aviso}
                        </p>
                      )
                    )}
                </div>
              )}

              {/* Verificação de Limites */}
              {calculoResultado.limitePeriodo &&
                !calculoResultado.limitePeriodo.permitido && (
                  <div className="mt-3 pt-3 border-t border-red-300 bg-red-50 -m-4 mt-3 p-4 rounded-b-lg">
                    <p className="font-medium text-red-900 flex items-center gap-2">
                      🚫 Limite Atingido
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {calculoResultado.limitePeriodo.mensagem}
                    </p>
                  </div>
                )}

              {calculoResultado.limitePeriodo &&
                calculoResultado.limitePeriodo.permitido && (
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
                <p>
                  <strong>Nome:</strong> {programaSelecionado.nome}
                </p>
                <p>
                  <strong>Tipo:</strong> {programaSelecionado.tipoPrograma}
                </p>
                <p>
                  <strong>Secretaria:</strong>{" "}
                  {programaService.formatarSecretaria(
                    programaSelecionado.secretaria
                  )}
                </p>
                {programaSelecionado.descricao && (
                  <p>
                    <strong>Descrição:</strong> {programaSelecionado.descricao}
                  </p>
                )}
                {programaSelecionado.leiNumero && (
                  <p>
                    <strong>Lei:</strong> {programaSelecionado.leiNumero}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* NOVO: Histórico de mudanças (apenas ao editar) */}
          {solicitacaoId &&
            solicitacaoId !== "novo" &&
            typeof solicitacaoId === "number" && (
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
