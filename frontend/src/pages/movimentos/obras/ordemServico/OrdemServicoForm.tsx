import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import FormField from "../../../../components/comum/FormField";
import FormSection from "../../../../components/comum/FormSection";
import ordemServicoService, {
  OrdemServicoDTO,
  OrdemServico,
  StatusOrdemServico,
} from "../../../../services/obras/ordemServicoService";
import pessoaService, { Pessoa } from "../../../../services/comum/pessoaService";
import veiculoService, { Veiculo } from "../../../../services/comum/veiculoService";
import tipoServicoService, { TipoServico } from "../../../../services/obras/tipoServicoService";
import { formatarMoeda } from "../../../../utils/formatters";

interface OrdemServicoFormProps {
  id?: string | number;
  onSave: () => void;
  module?: "obras";
}

const OrdemServicoForm: React.FC<OrdemServicoFormProps> = ({ id, onSave }) => {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [loadingVeiculos, setLoadingVeiculos] = useState(false);
  const [loadingTiposServico, setLoadingTiposServico] = useState(false);
  const [valorCalculado, setValorCalculado] = useState<number>(0);
  const [calculando, setCalculando] = useState(false);

  // Valores iniciais do formulário
  const initialValues: OrdemServicoDTO = {
    pessoaId: 0,
    tipoServicoId: 0,
    quantidadeSolicitada: 0,
    veiculoId: 0,
    dataServico: "",
    horaInicio: "",
    horaFim: "",
    valorReferencial: 180,
    observacoes: "",
    enderecoServico: "",
  };

  // Carregar dados necessários
  useEffect(() => {
    const carregarDados = async () => {
      // Carregar pessoas
      setLoadingPessoas(true);
      try {
        const pessoasData = await pessoaService.getAll();
        setPessoas(pessoasData);
      } catch (error) {
        console.error("Erro ao carregar pessoas:", error);
      } finally {
        setLoadingPessoas(false);
      }

      // Carregar veículos
      setLoadingVeiculos(true);
      try {
        const veiculosData = await veiculoService.getAtivos();
        setVeiculos(veiculosData);
      } catch (error) {
        console.error("Erro ao carregar veículos:", error);
      } finally {
        setLoadingVeiculos(false);
      }

      // Carregar tipos de serviço
      setLoadingTiposServico(true);
      try {
        const tiposData = await tipoServicoService.getAtivos();
        setTiposServico(tiposData);
      } catch (error) {
        console.error("Erro ao carregar tipos de serviço:", error);
      } finally {
        setLoadingTiposServico(false);
      }
    };

    carregarDados();
  }, []);

  // Função para calcular valor automaticamente
  const calcularValor = async (
    tipoServicoId: number,
    quantidade: number,
    valorReferencial: number = 180
  ) => {
    if (!tipoServicoId || !quantidade || quantidade <= 0) {
      setValorCalculado(0);
      return;
    }

    setCalculando(true);
    try {
      const resultado = await tipoServicoService.calcularValor({
        tipoServicoId,
        quantidade,
        valorReferencial,
      });
      setValorCalculado(resultado.valorCalculado);
    } catch (error) {
      console.error("Erro ao calcular valor:", error);
      setValorCalculado(0);
    } finally {
      setCalculando(false);
    }
  };

  // Função de validação
  const validate = (values: OrdemServicoDTO) => {
    const errors: Record<string, string> = {};

    if (!values.pessoaId || values.pessoaId === 0) {
      errors.pessoaId = "Solicitante é obrigatório";
    }

    if (!values.tipoServicoId || values.tipoServicoId === 0) {
      errors.tipoServicoId = "Tipo de serviço é obrigatório";
    }

    if (!values.quantidadeSolicitada || values.quantidadeSolicitada <= 0) {
      errors.quantidadeSolicitada = "Quantidade deve ser maior que zero";
    }

    if (!values.veiculoId || values.veiculoId === 0) {
      errors.veiculoId = "Veículo é obrigatório";
    }

    if (!values.dataServico) {
      errors.dataServico = "Data do serviço é obrigatória";
    } else {
      // Validar se a data não é no passado
      const dataServico = new Date(values.dataServico);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (dataServico < hoje) {
        errors.dataServico = "Data do serviço não pode ser no passado";
      }
    }

    // Horários são opcionais, mas se preenchidos devem estar corretos
    if (values.horaInicio && values.horaFim) {
      const [inicioHora, inicioMin] = values.horaInicio.split(":").map(Number);
      const [fimHora, fimMin] = values.horaFim.split(":").map(Number);

      const inicioEmMinutos = inicioHora * 60 + inicioMin;
      const fimEmMinutos = fimHora * 60 + fimMin;

      if (fimEmMinutos <= inicioEmMinutos) {
        errors.horaFim = "Hora de fim deve ser maior que a hora de início";
      }
    }

    if (!values.valorReferencial || values.valorReferencial <= 0) {
      errors.valorReferencial = "Valor referencial deve ser maior que zero";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Preparar dados para submissão (incluir valorCalculado)
  const prepareSubmit = (values: OrdemServicoDTO) => {
    return {
      ...values,
      valorCalculado,
    };
  };

  return (
    <FormBase<OrdemServico, OrdemServicoDTO>
      title={
        id && id !== "novo" ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"
      }
      service={ordemServicoService}
      id={id}
      initialValues={initialValues}
      validate={validate}
      onSave={onSave}
      //prepareSubmit={prepareSubmit}
      returnUrl="/movimentos/obras/ordens-servico"
    >
      {({ values, errors, touched, handleChange, setValue }) => {
        // Recalcular valor quando campos relevantes mudarem
        React.useEffect(() => {
          calcularValor(
            values.tipoServicoId,
            values.quantidadeSolicitada,
            values.valorReferencial
          );
        }, [
          values.tipoServicoId,
          values.quantidadeSolicitada,
          values.valorReferencial,
        ]);

        // Encontrar tipo de serviço selecionado
        const tipoSelecionado = tiposServico.find(
          (t) => t.id === values.tipoServicoId
        );

        return (
          <div className="space-y-6">
            {/* Seção Principal */}
            <FormSection title="Informações Principais">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Solicitante */}
                <FormField
                  name="pessoaId"
                  label="Solicitante"
                  error={touched.pessoaId ? errors.pessoaId : undefined}
                  required
                >
                  <select
                    id="pessoaId"
                    name="pessoaId"
                    value={values.pessoaId}
                    onChange={(e) => setValue("pessoaId", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingPessoas}
                  >
                    <option value={0}>
                      {loadingPessoas ? "Carregando..." : "Selecione o solicitante"}
                    </option>
                    {pessoas.map((pessoa) => (
                      <option key={pessoa.id} value={pessoa.id}>
                        {pessoa.nome} - {pessoa.cpfCnpj}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Veículo */}
                <FormField
                  name="veiculoId"
                  label="Veículo"
                  error={touched.veiculoId ? errors.veiculoId : undefined}
                  required
                >
                  <select
                    id="veiculoId"
                    name="veiculoId"
                    value={values.veiculoId}
                    onChange={(e) => setValue("veiculoId", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingVeiculos}
                  >
                    <option value={0}>
                      {loadingVeiculos ? "Carregando..." : "Selecione o veículo"}
                    </option>
                    {veiculos.map((veiculo) => (
                      <option key={veiculo.id} value={veiculo.id}>
                        {veiculo.descricao} - {veiculo.tipoVeiculo?.descricao} (
                        {veiculo.placa})
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </FormSection>

            {/* Seção de Serviço */}
            <FormSection title="Tipo de Serviço">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Serviço */}
                <FormField
                  name="tipoServicoId"
                  label="Tipo de Serviço"
                  error={touched.tipoServicoId ? errors.tipoServicoId : undefined}
                  required
                >
                  <select
                    id="tipoServicoId"
                    name="tipoServicoId"
                    value={values.tipoServicoId}
                    onChange={(e) =>
                      setValue("tipoServicoId", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingTiposServico}
                  >
                    <option value={0}>
                      {loadingTiposServico
                        ? "Carregando..."
                        : "Selecione o tipo de serviço"}
                    </option>
                    {tiposServico.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nome} (por {tipo.unidade})
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Quantidade Solicitada */}
                <FormField
                  name="quantidadeSolicitada"
                  label={`Quantidade ${tipoSelecionado ? `(${tipoSelecionado.unidade}s)` : ""}`}
                  error={
                    touched.quantidadeSolicitada
                      ? errors.quantidadeSolicitada
                      : undefined
                  }
                  required
                  helpText={
                    tipoSelecionado
                      ? `Quantidade de ${tipoSelecionado.unidade}s solicitadas`
                      : "Selecione um tipo de serviço primeiro"
                  }
                >
                  <input
                    type="number"
                    id="quantidadeSolicitada"
                    name="quantidadeSolicitada"
                    value={values.quantidadeSolicitada || ""}
                    onChange={(e) =>
                      setValue(
                        "quantidadeSolicitada",
                        e.target.value ? Number(e.target.value) : 0
                      )
                    }
                    step="0.5"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      tipoSelecionado
                        ? `Ex: 5 ${tipoSelecionado.unidade}s`
                        : "0"
                    }
                    disabled={!tipoSelecionado}
                  />
                </FormField>
              </div>

              {/* Preview das faixas do tipo selecionado */}
              {tipoSelecionado && tipoSelecionado.faixasPreco && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Faixas de Preço - {tipoSelecionado.nome}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {tipoSelecionado.faixasPreco.map((faixa, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white p-2 rounded border border-blue-100"
                      >
                        <span className="font-medium text-blue-700">
                          {faixa.quantidadeMin}
                          {faixa.quantidadeMax
                            ? `-${faixa.quantidadeMax}`
                            : "+"}
                          :
                        </span>{" "}
                        <span className="text-green-700 font-semibold">
                          {faixa.multiplicadorVR}×VR
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </FormSection>

            {/* Seção de Data e Horário */}
            <FormSection title="Data e Horário do Serviço">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data do Serviço */}
                <FormField
                  name="dataServico"
                  label="Data do Serviço"
                  error={touched.dataServico ? errors.dataServico : undefined}
                  required
                >
                  <input
                    type="date"
                    id="dataServico"
                    name="dataServico"
                    value={values.dataServico}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Hora Início - Opcional */}
                <FormField
                  name="horaInicio"
                  label="Hora de Início (Opcional)"
                  error={touched.horaInicio ? errors.horaInicio : undefined}
                  helpText="Preenchido após o início da execução"
                >
                  <input
                    type="time"
                    id="horaInicio"
                    name="horaInicio"
                    value={values.horaInicio || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>

                {/* Hora Fim - Opcional */}
                <FormField
                  name="horaFim"
                  label="Hora de Fim (Opcional)"
                  error={touched.horaFim ? errors.horaFim : undefined}
                  helpText="Preenchido após o término da execução"
                >
                  <input
                    type="time"
                    id="horaFim"
                    name="horaFim"
                    value={values.horaFim || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Seção de Valores */}
            <FormSection title="Valores e Cálculos">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valor Referencial - Desabilitado */}
                <FormField
                  name="valorReferencial"
                  label="Valor Referencial (VR)"
                  helpText="Valor alterado 1x por ano - Não editável"
                >
                  <input
                    type="number"
                    id="valorReferencial"
                    name="valorReferencial"
                    value={values.valorReferencial || ""}
                    step="0.01"
                    min="0"
                    disabled={true}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
                    placeholder="180.00"
                  />
                </FormField>

                {/* Valor Calculado (read-only) */}
                <FormField name="valorCalculado" label="Valor Calculado">
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                    {calculando ? (
                      <span className="text-gray-500">Calculando...</span>
                    ) : (
                      <span className="text-lg font-bold text-green-700">
                        {formatarMoeda(valorCalculado)}
                      </span>
                    )}
                  </div>
                </FormField>
              </div>

              {/* Informação sobre o cálculo */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-700">
                  <strong>💡 Dica:</strong> O valor é calculado automaticamente
                  baseado no tipo de serviço, quantidade e valor referencial.
                  {!values.tipoServicoId || !values.quantidadeSolicitada ? (
                    <span className="block mt-1">
                      Selecione o tipo de serviço e informe a quantidade para ver o
                      cálculo.
                    </span>
                  ) : null}
                </p>
              </div>
            </FormSection>

            {/* Seção de Informações Adicionais */}
            <FormSection title="Informações Adicionais">
              <div className="grid grid-cols-1 gap-6">
                {/* Endereço do Serviço */}
                <FormField name="enderecoServico" label="Local do Serviço">
                  <input
                    type="text"
                    id="enderecoServico"
                    name="enderecoServico"
                    value={values.enderecoServico || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Endereço onde será executado o serviço"
                  />
                </FormField>

                {/* Observações */}
                <FormField name="observacoes" label="Observações">
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    value={values.observacoes || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observações adicionais sobre o serviço"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Status (apenas para edição) */}
            {id && id !== "novo" && (
              <FormSection title="Status da Ordem">
                <FormField name="status" label="Status atual">
                  <select
                    id="status"
                    name="status"
                    value={(values as any).status || StatusOrdemServico.PENDENTE}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={StatusOrdemServico.PENDENTE}>Pendente</option>
                    <option value={StatusOrdemServico.EM_EXECUCAO}>
                      Em Execução
                    </option>
                    <option value={StatusOrdemServico.CONCLUIDA}>Concluída</option>
                    <option value={StatusOrdemServico.CANCELADA}>Cancelada</option>
                  </select>
                </FormField>
              </FormSection>
            )}
          </div>
        );
      }}
    </FormBase>
  );
};

export default OrdemServicoForm;
