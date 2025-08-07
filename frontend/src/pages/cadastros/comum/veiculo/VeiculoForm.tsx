import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import FormField from "../../../../components/comum/FormField";
import veiculoService, {
  VeiculoDTO,
  Veiculo,
} from "../../../../services/comum/veiculoService";
import tipoVeiculoService, {
  TipoVeiculo,
} from "../../../../services/comum/tipoVeiculoService";

interface VeiculoFormProps {
  id?: string | number;
  onSave: () => void;
  module?: "comum";
}

const VeiculoForm: React.FC<VeiculoFormProps> = ({ id, onSave }) => {
  const [tiposVeiculo, setTiposVeiculo] = useState<TipoVeiculo[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);

  // Valores iniciais do formulário
  const initialValues: VeiculoDTO = {
    tipoVeiculoId: 0,
    descricao: "",
    placa: "",
    ativo: true,
  };

  // Carregar tipos de veículo disponíveis
  useEffect(() => {
    const carregarTiposVeiculo = async () => {
      setLoadingTipos(true);
      try {
        const tipos = await tipoVeiculoService.getTiposVeiculosAtivos();
        setTiposVeiculo(tipos);
      } catch (error) {
        console.error("Erro ao carregar tipos de veículo:", error);
      } finally {
        setLoadingTipos(false);
      }
    };

    carregarTiposVeiculo();
  }, []);

  // Função de validação
  const validate = (values: VeiculoDTO) => {
    const errors: Record<string, string> = {};

    if (!values.tipoVeiculoId || values.tipoVeiculoId === 0) {
      errors.tipoVeiculoId = "Tipo de veículo é obrigatório";
    }

    if (!values.descricao || values.descricao.trim() === "") {
      errors.descricao = "Descrição é obrigatória";
    }

    if (!values.placa || values.placa.trim() === "") {
      errors.placa = "Placa é obrigatória";
    } else {
      const validacao = veiculoService.validarPlaca(values.placa);
      if (!validacao.valida) {
        errors.placa = validacao.erro || "Placa inválida";
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  return (
    <FormBase<Veiculo, VeiculoDTO>
      title={id && id !== "novo" ? "Editar Veículo" : "Novo Veículo"}
      service={veiculoService}
      id={id}
      initialValues={initialValues}
      validate={validate}
      onSave={onSave}
      returnUrl="/cadastros/comum/veiculos"
    >
      {({ values, errors, touched, handleChange, setValue }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de Veículo */}
          <div className="md:col-span-2">
            <FormField
              name="tipoVeiculoId"
              label="Tipo de Veículo"
              error={touched.tipoVeiculoId ? errors.tipoVeiculoId : undefined}
              required
            >
              <select
                id="tipoVeiculoId"
                name="tipoVeiculoId"
                value={values.tipoVeiculoId}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number(e.target.value);
                  setValue("tipoVeiculoId", value); // Converte para number
                }}
                disabled={loadingTipos}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>
                  {loadingTipos ? "Carregando..." : "Selecione um tipo"}
                </option>
                {tiposVeiculo.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.descricao}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Descrição */}
          <div className="md:col-span-2">
            <FormField
              name="descricao"
              label="Descrição"
              error={touched.descricao ? errors.descricao : undefined}
              required
            >
              <input
                type="text"
                id="descricao"
                name="descricao"
                value={values.descricao}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Trator New Holland T7.230"
              />
            </FormField>
          </div>

          {/* Placa */}
          <div>
            <FormField
              name="placa"
              label="Placa"
              error={touched.placa ? errors.placa : undefined}
              required
              helpText="Formato: AAA-0000 (padrão) ou AAA-0A00 (Mercosul)"
            >
              <input
                type="text"
                id="placa"
                name="placa"
                value={values.placa}
                onChange={(e) => {
                  // Formatar placa em tempo real
                  let valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  
                  // Aplicar máscara conforme digitação
                  if (valor.length >= 3 && valor.length <= 7) {
                    // Formato com hífen: AAA-0000 ou AAA-0A00
                    valor = valor.replace(/^([A-Z]{3})([0-9A-Z].*)$/, "$1-$2");
                  }
                  
                  // Limitar tamanho
                  if (valor.length > 8) {
                    valor = valor.substring(0, 8);
                  }
                  
                  setValue("placa", valor);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="AAA-0000 ou AAA-0A00"
                maxLength={8}
              />
            </FormField>
          </div>

          {/* Status (apenas para edição) */}
          {id && id !== "novo" && (
            <div>
              <FormField
                name="ativo"
                label="Ativo"
                type="checkbox"
              >
                <input
                  type="checkbox"
                  id="ativo"
                  name="ativo"
                  checked={values.ativo}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </FormField>
            </div>
          )}
        </div>
      )}
    </FormBase>
  );
};

export default VeiculoForm;