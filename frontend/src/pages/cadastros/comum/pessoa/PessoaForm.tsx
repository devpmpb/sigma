import React, { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import pessoaService, {
  Pessoa,
  PessoaDTO,
  TipoPessoa,
} from "../../../../services/common/pessoaService";
import { FormBase } from "../../../../components/cadastro";
import { FormField } from "../../../../components/common";
import { formatarCPF, formatarCNPJ, formatarTelefone } from "../../../../utils/formatters";

interface PessoaFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Componente de Formulário de Pessoas
 * Utiliza o FormBase para exibir o formulário em uma página separada
 */
const PessoaForm: React.FC<PessoaFormProps> = ({ id, onSave }) => {
  // O params é extraído diretamente da rota
  const pessoaId = id || useParams({ strict: false }).id;

  // Valor inicial para o formulário
  const initialValues: PessoaDTO = {
    tipoPessoa: TipoPessoa.FISICA,
    nome: "",
    cpfCnpj: "",
    email: "",
    telefone: "",
    dataNascimento: "",
    ativo: true,
  };

  // Validação do formulário
  const validate = (values: PessoaDTO) => {
    const errors: Record<string, string> = {};

    if (!values.nome) {
      errors.nome = "Nome é obrigatório";
    }

    if (!values.cpfCnpj) {
      errors.cpfCnpj = "CPF/CNPJ é obrigatório";
    } else if (
      values.tipoPessoa === TipoPessoa.FISICA &&
      !/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(values.cpfCnpj.replace(/[^\d-]/g, ""))
    ) {
      errors.cpfCnpj = "CPF inválido. Formato esperado: 123.456.789-00";
    } else if (
      values.tipoPessoa === TipoPessoa.JURIDICA &&
      !/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(values.cpfCnpj.replace(/[^\d\/-]/g, ""))
    ) {
      errors.cpfCnpj = "CNPJ inválido. Formato esperado: 12.345.678/0001-90";
    }

    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
      errors.email = "Email inválido";
    }

    if (values.tipoPessoa === TipoPessoa.FISICA && !values.dataNascimento) {
      errors.dataNascimento = "Data de nascimento é obrigatória para pessoa física";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  return (
    <FormBase<Pessoa, PessoaDTO>
      title="Pessoa"
      service={pessoaService}
      id={pessoaId}
      initialValues={initialValues}
      validate={validate}
      returnUrl="/cadastros/comum/pessoas"
      onSave={onSave}
    >
      {({ values, errors, touched, handleChange, setValue, setFieldTouched }) => {
        
        // Formatar CPF/CNPJ quando o usuário terminar de digitar
        const handleCpfCnpjBlur = (e: React.FocusEvent<HTMLInputElement>) => {
          const value = e.target.value;
          if (value) {
            const formatted = values.tipoPessoa === TipoPessoa.FISICA
              ? formatarCPF(value)
              : formatarCNPJ(value);
            setValue('cpfCnpj', formatted);
          }
          setFieldTouched('cpfCnpj', true);
        };
        
        // Formatar telefone quando o usuário terminar de digitar
        const handleTelefoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
          const value = e.target.value;
          if (value) {
            setValue('telefone', formatarTelefone(value));
          }
          setFieldTouched('telefone', true);
        };
        
        // Atualizar campos quando o tipo de pessoa mudar
        useEffect(() => {
          // Limpar CPF/CNPJ quando mudar o tipo de pessoa
          if (values.cpfCnpj) {
            setValue('cpfCnpj', '');
          }
          
          // Limpar data de nascimento se mudar para pessoa jurídica
          if (values.tipoPessoa === TipoPessoa.JURIDICA && values.dataNascimento) {
            setValue('dataNascimento', '');
          }
        }, [values.tipoPessoa]);

        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="tipoPessoa"
                label="Tipo de Pessoa"
                error={errors.tipoPessoa}
                touched={touched.tipoPessoa}
                required
              >
                <select
                  id="tipoPessoa"
                  name="tipoPessoa"
                  value={values.tipoPessoa}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={TipoPessoa.FISICA}>Pessoa Física</option>
                  <option value={TipoPessoa.JURIDICA}>Pessoa Jurídica</option>
                </select>
              </FormField>

              <FormField
                name="cpfCnpj"
                label={values.tipoPessoa === TipoPessoa.FISICA ? "CPF" : "CNPJ"}
                error={errors.cpfCnpj}
                touched={touched.cpfCnpj}
                required
                helpText={
                  values.tipoPessoa === TipoPessoa.FISICA
                    ? "Formato: 123.456.789-00"
                    : "Formato: 12.345.678/0001-90"
                }
              >
                <input
                  type="text"
                  id="cpfCnpj"
                  name="cpfCnpj"
                  value={values.cpfCnpj}
                  onChange={handleChange}
                  onBlur={handleCpfCnpjBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    values.tipoPessoa === TipoPessoa.FISICA ? "123.456.789-00" : "12.345.678/0001-90"
                  }
                  maxLength={values.tipoPessoa === TipoPessoa.FISICA ? 14 : 18}
                />
              </FormField>
            </div>

            <FormField
              name="nome"
              label={values.tipoPessoa === TipoPessoa.FISICA ? "Nome Completo" : "Razão Social"}
              error={errors.nome}
              touched={touched.nome}
              required
            >
              <input
                type="text"
                id="nome"
                name="nome"
                value={values.nome}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={values.tipoPessoa === TipoPessoa.FISICA ? "Nome completo" : "Razão social"}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="email"
                label="E-mail"
                error={errors.email}
                touched={touched.email}
              >
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="exemplo@email.com"
                />
              </FormField>

              <FormField
                name="telefone"
                label="Telefone"
                error={errors.telefone}
                touched={touched.telefone}
                helpText="Formato: (99) 9 9999-9999"
              >
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  value={values.telefone}
                  onChange={handleChange}
                  onBlur={handleTelefoneBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(99) 9 9999-9999"
                  maxLength={16}
                />
              </FormField>
            </div>

            {values.tipoPessoa === TipoPessoa.FISICA && (
              <FormField
                name="dataNascimento"
                label="Data de Nascimento"
                error={errors.dataNascimento}
                touched={touched.dataNascimento}
                required={values.tipoPessoa === TipoPessoa.FISICA}
              >
                <input
                  type="date"
                  id="dataNascimento"
                  name="dataNascimento"
                  value={values.dataNascimento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
            )}

            {pessoaId && pessoaId !== "novo" && (
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
        );
      }}
    </FormBase>
  );
};

export default PessoaForm;