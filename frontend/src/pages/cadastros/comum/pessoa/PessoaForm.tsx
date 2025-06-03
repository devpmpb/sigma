import React, { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import pessoaService, {
  Pessoa,
  PessoaDTO,
  TipoPessoa,
  PessoaFisicaData,
  PessoaJuridicaData,
} from "../../../../services/common/pessoaService";
import { FormBase } from "../../../../components/cadastro";
import { FormField } from "../../../../components/common";
import { formatarCPF, formatarCNPJ, formatarTelefone, formatDateForInput } from "../../../../utils/formatters";

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
    ativo: true,
    pessoaFisica: {
      rg: "",
      dataNascimento: "",
    },
    pessoaJuridica: {
      nomeFantasia: "",
      inscricaoEstadual: "",
      inscricaoMunicipal: "",
      dataFundacao: "",
      representanteLegal: "",
    },
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

    // Validações específicas para pessoa física
    if (values.tipoPessoa === TipoPessoa.FISICA) {
      if (!values.pessoaFisica?.dataNascimento) {
        errors.dataNascimento = "Data de nascimento é obrigatória para pessoa física";
      }
    }

    // Validações específicas para pessoa jurídica
    if (values.tipoPessoa === TipoPessoa.JURIDICA) {
      if (!values.pessoaJuridica?.representanteLegal) {
        errors.representanteLegal = "Representante legal é obrigatório para pessoa jurídica";
      }
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
        
        // Função para transformar dados do backend para o formulário
        useEffect(() => {
          const transformBackendData = async () => {
            if (pessoaId && pessoaId !== "novo") {
              try {
                const pessoaData = await pessoaService.getByIdWithDetails(pessoaId);
                
                // Transformar os dados para o formato do formulário
                const formData: PessoaDTO = {
                  tipoPessoa: pessoaData.tipoPessoa,
                  nome: pessoaData.nome,
                  cpfCnpj: pessoaData.cpfCnpj,
                  email: pessoaData.email || "",
                  telefone: pessoaData.telefone || "",
                  status: pessoaData.status,
                  pessoaFisica: {
                    rg: pessoaData.pessoaFisica?.rg || "",
                    dataNascimento: formatDateForInput(pessoaData.pessoaFisica?.dataNascimento || ""),
                  },
                  pessoaJuridica: {
                    nomeFantasia: pessoaData.pessoaJuridica?.nomeFantasia || "",
                    inscricaoEstadual: pessoaData.pessoaJuridica?.inscricaoEstadual || "",
                    inscricaoMunicipal: pessoaData.pessoaJuridica?.inscricaoMunicipal || "",
                    dataFundacao: formatDateForInput(pessoaData.pessoaJuridica?.dataFundacao || ""),
                    representanteLegal: pessoaData.pessoaJuridica?.representanteLegal || "",
                  },
                };

                // Atualizar o formulário com os dados carregados
                Object.keys(formData).forEach(key => {
                  setValue(key, (formData as any)[key]);
                });
              } catch (error) {
                console.error("Erro ao carregar dados da pessoa:", error);
              }
            }
          };

          transformBackendData();
        }, [pessoaId, setValue]);
        
        // Função auxiliar para atualizar dados específicos
        const updatePessoaFisica = (field: keyof PessoaFisicaData, value: any) => {
          setValue('pessoaFisica', {
            ...values.pessoaFisica,
            [field]: value
          });
        };

        const updatePessoaJuridica = (field: keyof PessoaJuridicaData, value: any) => {
          setValue('pessoaJuridica', {
            ...values.pessoaJuridica,
            [field]: value
          });
        };
        
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
        }, [values.tipoPessoa, setValue]);

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
                  value={values.email || ''}
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
                  value={values.telefone || ''}
                  onChange={handleChange}
                  onBlur={handleTelefoneBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(99) 9 9999-9999"
                  maxLength={16}
                />
              </FormField>
            </div>

            {/* Campos específicos para Pessoa Física */}
            {values.tipoPessoa === TipoPessoa.FISICA && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Pessoa Física</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="rg"
                    label="RG"
                    error={errors.rg}
                    touched={touched.rg}
                  >
                    <input
                      type="text"
                      id="rg"
                      name="rg"
                      value={values.pessoaFisica?.rg || ''}
                      onChange={(e) => updatePessoaFisica('rg', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12.345.678-9"
                    />
                  </FormField>

                  <FormField
                    name="dataNascimento"
                    label="Data de Nascimento"
                    error={errors.dataNascimento}
                    touched={touched.dataNascimento}
                    required
                  >
                    <input
                      type="date"
                      id="dataNascimento"
                      name="dataNascimento"
                      value={values.pessoaFisica?.dataNascimento || ''}
                      onChange={(e) => updatePessoaFisica('dataNascimento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Campos específicos para Pessoa Jurídica */}
            {values.tipoPessoa === TipoPessoa.JURIDICA && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Pessoa Jurídica</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="nomeFantasia"
                    label="Nome Fantasia"
                    error={errors.nomeFantasia}
                    touched={touched.nomeFantasia}
                  >
                    <input
                      type="text"
                      id="nomeFantasia"
                      name="nomeFantasia"
                      value={values.pessoaJuridica?.nomeFantasia || ''}
                      onChange={(e) => updatePessoaJuridica('nomeFantasia', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome fantasia da empresa"
                    />
                  </FormField>

                  <FormField
                    name="representanteLegal"
                    label="Representante Legal"
                    error={errors.representanteLegal}
                    touched={touched.representanteLegal}
                    required
                  >
                    <input
                      type="text"
                      id="representanteLegal"
                      name="representanteLegal"
                      value={values.pessoaJuridica?.representanteLegal || ''}
                      onChange={(e) => updatePessoaJuridica('representanteLegal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do representante legal"
                    />
                  </FormField>

                  <FormField
                    name="inscricaoEstadual"
                    label="Inscrição Estadual"
                    error={errors.inscricaoEstadual}
                    touched={touched.inscricaoEstadual}
                  >
                    <input
                      type="text"
                      id="inscricaoEstadual"
                      name="inscricaoEstadual"
                      value={values.pessoaJuridica?.inscricaoEstadual || ''}
                      onChange={(e) => updatePessoaJuridica('inscricaoEstadual', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123456789"
                    />
                  </FormField>

                  <FormField
                    name="inscricaoMunicipal"
                    label="Inscrição Municipal"
                    error={errors.inscricaoMunicipal}
                    touched={touched.inscricaoMunicipal}
                  >
                    <input
                      type="text"
                      id="inscricaoMunicipal"
                      name="inscricaoMunicipal"
                      value={values.pessoaJuridica?.inscricaoMunicipal || ''}
                      onChange={(e) => updatePessoaJuridica('inscricaoMunicipal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="987654321"
                    />
                  </FormField>

                  <FormField
                    name="dataFundacao"
                    label="Data de Fundação"
                    error={errors.dataFundacao}
                    touched={touched.dataFundacao}
                  >
                    <input
                      type="date"
                      id="dataFundacao"
                      name="dataFundacao"
                      value={values.pessoaJuridica?.dataFundacao || ''}
                      onChange={(e) => updatePessoaJuridica('dataFundacao', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormField>
                </div>
              </div>
            )}
          </>
        );
      }}
    </FormBase>
  );
};

export default PessoaForm;