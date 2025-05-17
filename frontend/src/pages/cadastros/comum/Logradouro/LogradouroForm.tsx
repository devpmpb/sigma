import React from "react";
import { useParams } from "@tanstack/react-router";
import logradouroService, {
  Logradouro,
  LogradouroDTO,
  TipoLogradouro,
} from "../../../../services/common/logradouroService";
import { FormBase } from "../../../../components/cadastro";
import { FormField } from "../../../../components/common";

interface LogradouroFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Componente de Formulário de Logradouros
 * Utiliza o FormBase para exibir o formulário em uma página separada
 */
const LogradouroForm: React.FC<LogradouroFormProps> = ({ id, onSave }) => {
  // Correção para o uso correto do useParams no TanStack Router
  // O params é extraído diretamente da rota agora
  const logradouroId = id || useParams({ strict: false }).id;

  // Valor inicial para o formulário
  const initialValues: LogradouroDTO = {
    tipo: TipoLogradouro.RUA,
    descricao: "",
    cep: "",
    ativo: true,
  };

  // Validação do formulário
  const validate = (values: LogradouroDTO) => {
    const errors: Record<string, string> = {};

    if (!values.descricao) {
      errors.descricao = "Descrição é obrigatória";
    }

    if (!values.cep) {
      errors.cep = "CEP é obrigatório";
    } else if (!/^\d{5}-?\d{3}$/.test(values.cep.replace(/[^\d-]/g, ""))) {
      errors.cep = "CEP inválido. Formato esperado: 12345-678";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  return (
    <FormBase<Logradouro, LogradouroDTO>
      title="Logradouro"
      service={logradouroService}
      id={logradouroId}
      initialValues={initialValues}
      validate={validate}
      returnUrl="/cadastros/comum/logradouros"
      onSave={onSave}
    >
      {({ values, errors, touched, handleChange, setValue }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="tipo"
              label="Tipo de Logradouro"
              error={errors.tipo}
              touched={touched.tipo}
              required
            >
              <select
                id="tipo"
                name="tipo"
                value={values.tipo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(TipoLogradouro).map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              name="cep"
              label="CEP"
              error={errors.cep}
              touched={touched.cep}
              required
              helpText="Formato: 12345-678"
            >
              <input
                type="text"
                id="cep"
                name="cep"
                value={values.cep}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345-678"
                maxLength={9}
              />
            </FormField>
          </div>

          <FormField
            name="descricao"
            label="Descrição do Logradouro"
            error={errors.descricao}
            touched={touched.descricao}
            required
          >
            <input
              type="text"
              id="descricao"
              name="descricao"
              value={values.descricao}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do logradouro"
            />
          </FormField>

          {logradouroId && logradouroId !== "novo" && (
            <FormField name="ativo" label="Ativo" type="checkbox">
              <input
                type="checkbox"
                id="ativo"
                name="ativo"
                checked={values.ativo}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </FormField>
          )}
        </>
      )}
    </FormBase>
  );
};

export default LogradouroForm;