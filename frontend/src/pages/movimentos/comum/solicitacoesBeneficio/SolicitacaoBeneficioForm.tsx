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
import { FormField } from "../../../../components/comum";

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
  const params = useParams({ strict: false });
  const solicitacaoId = id || params.id;
  
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [programaSelecionado, setProgramaSelecionado] = useState<Programa | null>(null);
  const [loadingProgramas, setLoadingProgramas] = useState(false);
  const [loadingPessoas, setLoadingPessoas] = useState(false);

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
  };

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
      returnUrl="/movimentos/comum/solicitacoes"
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
                onChange={(e) => handleSelectChange(e, handleChange, setValue)}
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

          {/* Informações do programa selecionado */}
          {programaSelecionado && (
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
        </>
      )}
    </FormBase>
  );
};

export default SolicitacaoBeneficioForm;