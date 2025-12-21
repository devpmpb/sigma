// frontend/src/pages/cadastros/obras/tipoServico/TipoServicoForm.tsx
import React, { useState } from "react";
import { FormBase } from "../../../../components/cadastro";
import FormField from "../../../../components/comum/FormField";
import FormSection from "../../../../components/comum/FormSection";
import tipoServicoService, {
  TipoServicoInput,
  TipoServico,
  FaixaPrecoServico,
} from "../../../../services/obras/tipoServicoService";
import { Plus, Trash2 } from "lucide-react";

interface TipoServicoFormProps {
  id?: string | number;
  onSave: () => void;
}

const TipoServicoForm: React.FC<TipoServicoFormProps> = ({ id, onSave }) => {
  const [faixas, setFaixas] = useState<
    Omit<FaixaPrecoServico, "id" | "tipoServicoId">[]
  >([
    { quantidadeMin: 1, quantidadeMax: 3, multiplicadorVR: 0.1, ativo: true },
  ]);

  // Valores iniciais do formulário
  const initialValues: TipoServicoInput = {
    nome: "",
    unidade: "hora",
    ativo: true,
    faixasPreco: faixas,
  };

  // Função de validação
  const validate = (values: TipoServicoInput) => {
    const errors: any = {};

    if (!values.nome || values.nome.trim() === "") {
      errors.nome = "Nome é obrigatório";
    }

    if (!values.unidade || values.unidade.trim() === "") {
      errors.unidade = "Unidade é obrigatória";
    }

    if (!faixas || faixas.length === 0) {
      errors.faixas = "É necessário cadastrar pelo menos uma faixa de preço";
    }

    // Validar faixas
    faixas.forEach((faixa, index) => {
      if (faixa.quantidadeMin < 0) {
        errors[`faixa_${index}_min`] = "Quantidade mínima deve ser maior que 0";
      }
      if (
        faixa.quantidadeMax !== null &&
        faixa.quantidadeMax < faixa.quantidadeMin
      ) {
        errors[`faixa_${index}_max`] =
          "Quantidade máxima deve ser maior que a mínima";
      }
      if (faixa.multiplicadorVR <= 0) {
        errors[`faixa_${index}_mult`] = "Multiplicador deve ser maior que 0";
      }
    });

    return errors;
  };

  // Adicionar nova faixa
  const adicionarFaixa = () => {
    setFaixas([
      ...faixas,
      {
        quantidadeMin: 1,
        quantidadeMax: null,
        multiplicadorVR: 0.1,
        ativo: true,
      },
    ]);
  };

  // Remover faixa
  const removerFaixa = (index: number) => {
    if (faixas.length > 1) {
      setFaixas(faixas.filter((_, i) => i !== index));
    }
  };

  // Atualizar faixa
  const atualizarFaixa = (
    index: number,
    campo: keyof FaixaPrecoServico,
    valor: any
  ) => {
    const novasFaixas = [...faixas];
    novasFaixas[index] = {
      ...novasFaixas[index],
      [campo]: valor === "" ? null : valor,
    };
    setFaixas(novasFaixas);
  };

  /* Preparar dados para submissão
  const prepareSubmit = (values: TipoServicoInput) => {
    return {
      ...values,
      faixasPreco: faixas,
    };
  };*/

  // Carregar dados ao editar
  const onLoad = (data: TipoServico) => {
    if (data.faixasPreco && data.faixasPreco.length > 0) {
      setFaixas(
        data.faixasPreco.map((faixa) => ({
          quantidadeMin: faixa.quantidadeMin,
          quantidadeMax: faixa.quantidadeMax,
          multiplicadorVR: parseFloat(faixa.multiplicadorVR.toString()),
          ativo: faixa.ativo ?? true,
        }))
      );
    }
  };

  return (
    <FormBase<TipoServico, TipoServicoInput>
      id={id}
      service={tipoServicoService}
      initialValues={initialValues}
      validate={validate}
      onSave={onSave}
      returnUrl="/cadastros/obras/tipos-servico"
      //prepareSubmit={prepareSubmit}
      //onLoad={onLoad}
      title={id ? "Editar Tipo de Serviço" : "Novo Tipo de Serviço"}
    >
      {({ values, errors, touched, handleChange }) => (
        <div className="space-y-6">
          {/* Seção: Informações Básicas */}
          <FormSection title="Informações Básicas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Nome do Tipo de Serviço"
                name="nome"
                //value={values.nome}
                //onChange={handleChange}
                error={errors.nome}
                touched={touched.nome}
                helpText="Ex: Carga de terra, Caminhão truck"
                required
              >
                <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={values.nome}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
              </FormField>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade <span className="text-red-500">*</span>
                </label>
                <select
                  name="unidade"
                  value={values.unidade}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.unidade ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="hora">Hora</option>
                  <option value="carga">Carga</option>
                </select>
                {errors.unidade && (
                  <p className="text-red-500 text-sm mt-1">{errors.unidade}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={values.ativo}
                  onChange={(e) =>
                    handleChange({
                      target: { name: "ativo", value: e.target.checked },
                    } as any)
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Ativo</span>
              </label>
            </div>
          </FormSection>

          {/* Seção: Faixas de Preço */}
          <FormSection
            title="Faixas de Preço"
            description="Configure as faixas de preço baseadas na quantidade. O multiplicador será aplicado sobre o Valor Referencial (VR)."
          >
            <div className="space-y-4">
              {faixas.map((faixa, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Faixa {index + 1}
                    </h4>
                    {faixas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerFaixa(index)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remover faixa"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade Mínima *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={faixa.quantidadeMin}
                        onChange={(e) =>
                          atualizarFaixa(
                            index,
                            "quantidadeMin",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {errors[`faixa_${index}_min`] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors[`faixa_${index}_min`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade Máxima
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={faixa.quantidadeMax ?? ""}
                        onChange={(e) =>
                          atualizarFaixa(
                            index,
                            "quantidadeMax",
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        placeholder="Sem limite"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors[`faixa_${index}_max`] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors[`faixa_${index}_max`]}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Deixe vazio para "acima de X"
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Multiplicador VR *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={faixa.multiplicadorVR}
                        onChange={(e) =>
                          atualizarFaixa(
                            index,
                            "multiplicadorVR",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {errors[`faixa_${index}_mult`] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors[`faixa_${index}_mult`]}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Ex: 0.1, 0.3, 0.5
                      </p>
                    </div>
                  </div>

                  {/* Preview do cálculo */}
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <strong>Exemplo de cálculo:</strong>{" "}
                      {values.unidade === "hora" ? "1 hora" : "1 carga"} × R$
                      180,00 (VR) × {faixa.multiplicadorVR} = R${" "}
                      {(180 * faixa.multiplicadorVR).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={adicionarFaixa}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Adicionar Faixa de Preço
              </button>

              {errors.faixas && (
                <p className="text-red-500 text-sm">{errors.faixas}</p>
              )}
            </div>
          </FormSection>
        </div>
      )}
    </FormBase>
  );
};

export default TipoServicoForm;
