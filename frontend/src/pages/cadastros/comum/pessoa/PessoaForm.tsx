import React, { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import pessoaService, {
  Pessoa,
  PessoaDTO,
  TipoPessoa,
  PessoaFisicaData,
  PessoaJuridicaData,
} from "../../../../services/comum/pessoaService";
import { FormBase } from "../../../../components/cadastro";
import { FormField } from "../../../../components/comum";
import {
  formatarCPF,
  formatarCNPJ,
  formatarTelefone,
  formatDateForInput,
} from "../../../../utils/formatters";
import { EnderecoLista } from "../../../../components/endereco/EnderecoLista";
import { EnderecoForm } from "../../../../components/endereco/EnderecoForm";
import { usePessoaEnderecos } from "../../../../hooks/usePessoaEnderecos";

interface PessoaFormProps {
  id?: string | number;
  onSave: () => void;
}

const PessoaForm: React.FC<PessoaFormProps> = ({ id, onSave }) => {
  // O params é extraído diretamente da rota
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const pessoaId = id || useParams({ strict: false }).id;

  // ✅ NOVOS ESTADOS PARA ENDEREÇOS
  const [showEnderecoForm, setShowEnderecoForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"dados" | "enderecos">("dados");
  const [pessoaSalva, setPessoaSalva] = useState<Pessoa | null>(null);

  // ✅ HOOK PARA GERENCIAR ENDEREÇOS
  const {
    enderecos,
    enderecoPrincipal,
    loading: enderecosLoading,
    error: enderecosError,
    adicionarEndereco,
    removerEndereco,
    definirPrincipal,
    totalEnderecos,
    recarregarEnderecos,
    podeAdicionarEndereco,
  } = usePessoaEnderecos(pessoaSalva?.id);

  // Valor inicial para o formulário (MANTÉM O MESMO)
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

  // Validação do formulário (MANTÉM A MESMA)
  const validate = (values: PessoaDTO) => {
    const errors: Record<string, string> = {};

    if (!values.nome) {
      errors.nome = "Nome é obrigatório";
    }

    if (!values.cpfCnpj) {
      errors.cpfCnpj = "CPF/CNPJ é obrigatório";
    } else if (
      values.tipoPessoa === TipoPessoa.FISICA &&
      !/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(
        values.cpfCnpj.replace(/[^\d-]/g, "")
      )
    ) {
      errors.cpfCnpj = "CPF inválido. Formato esperado: 123.456.789-00";
    } else if (
      values.tipoPessoa === TipoPessoa.JURIDICA &&
      !/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(
        values.cpfCnpj.replace(/[^\d\/-]/g, "")
      )
    ) {
      errors.cpfCnpj = "CNPJ inválido. Formato esperado: 12.345.678/0001-90";
    }

    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
      errors.email = "Email inválido";
    }

    // Validações específicas para pessoa física
    if (values.tipoPessoa === TipoPessoa.FISICA) {
      if (!values.pessoaFisica?.dataNascimento) {
        errors.dataNascimento =
          "Data de nascimento é obrigatória para pessoa física";
      }
    }

    // Validações específicas para pessoa jurídica
    if (values.tipoPessoa === TipoPessoa.JURIDICA) {
      if (!values.pessoaJuridica?.representanteLegal) {
        errors.representanteLegal =
          "Representante legal é obrigatório para pessoa jurídica";
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // ✅ CARREGAR PESSOA SALVA QUANDO EXISTE ID
  useEffect(() => {
    if (pessoaId && pessoaId !== "novo") {
      pessoaService
        .getById(pessoaId)
        .then((pessoa) => {
          setPessoaSalva(pessoa);
        })
        .catch(console.error);
    }
  }, [pessoaId]);

  // ✅ HANDLERS PARA ENDEREÇOS
  const handleEnderecoSuccess = () => {
    setShowEnderecoForm(false);
    recarregarEnderecos();
  };

  const handleRemoverEndereco = async (enderecoId: number) => {
    await removerEndereco(enderecoId);
  };

  const handleDefinirPrincipal = async (enderecoId: number) => {
    await definirPrincipal(enderecoId);
  };

  return (
    <div className="pessoa-form-container">
      {/* ✅ NAVEGAÇÃO POR ABAS (só aparece se pessoa existe) */}
      {pessoaSalva && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab("dados")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "dados"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                👤 Dados Pessoais
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("enderecos")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "enderecos"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📍 Endereços ({totalEnderecos})
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ✅ ABA DE DADOS PESSOAIS */}
      {(!pessoaSalva || activeTab === "dados") && (
        <FormBase<Pessoa, PessoaDTO>
          title="Pessoa"
          service={pessoaService}
          id={pessoaId}
          initialValues={initialValues}
          validate={validate}
          returnUrl="/cadastros/comum/pessoas"
          onSave={(pessoa) => {
            setPessoaSalva(pessoa);
            if (pessoaId === "novo") {
              setActiveTab("enderecos"); // Vai para endereços após criar
            }
            onSave();
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            setValue,
            setFieldTouched,
          }) => {
            // ✅ FUNÇÕES AUXILIARES (MANTÉM AS MESMAS)
            const updatePessoaFisica = (
              field: keyof PessoaFisicaData,
              value: string
            ) => {
              setValue("pessoaFisica", {
                ...values.pessoaFisica,
                [field]: value,
              });
              setFieldTouched(`pessoaFisica.${field}`, true);
            };

            const updatePessoaJuridica = (
              field: keyof PessoaJuridicaData,
              value: string
            ) => {
              setValue("pessoaJuridica", {
                ...values.pessoaJuridica,
                [field]: value,
              });
              setFieldTouched(`pessoaJuridica.${field}`, true);
            };

            const handleCpfCnpjChange = (
              e: React.ChangeEvent<HTMLInputElement>
            ) => {
              const value = e.target.value;
              let formattedValue = value;

              if (values.tipoPessoa === TipoPessoa.FISICA) {
                formattedValue = formatarCPF(value);
              } else {
                formattedValue = formatarCNPJ(value);
              }

              setValue("cpfCnpj", formattedValue);
              setFieldTouched("cpfCnpj", true);
            };

            const handleTelefoneBlur = (
              e: React.FocusEvent<HTMLInputElement>
            ) => {
              const formatted = formatarTelefone(e.target.value);
              setValue("telefone", formatted);
            };

            // ✅ TRANSFORMAR DADOS DO BACKEND (MANTÉM O MESMO)
            useEffect(() => {
              const transformBackendData = async () => {
                if (pessoaId && pessoaId !== "novo") {
                  try {
                    const pessoaData = await pessoaService.getByIdWithDetails(
                      pessoaId
                    );

                    const formData: PessoaDTO = {
                      tipoPessoa: pessoaData.tipoPessoa,
                      nome: pessoaData.nome,
                      cpfCnpj: pessoaData.cpfCnpj,
                      email: pessoaData.email || "",
                      telefone: pessoaData.telefone || "",
                      ativo: pessoaData.ativo,
                      pessoaFisica: {
                        rg: pessoaData.pessoaFisica?.rg || "",
                        dataNascimento: formatDateForInput(
                          pessoaData.pessoaFisica?.dataNascimento || ""
                        ),
                      },
                      pessoaJuridica: {
                        nomeFantasia:
                          pessoaData.pessoaJuridica?.nomeFantasia || "",
                        inscricaoEstadual:
                          pessoaData.pessoaJuridica?.inscricaoEstadual || "",
                        inscricaoMunicipal:
                          pessoaData.pessoaJuridica?.inscricaoMunicipal || "",
                        dataFundacao: formatDateForInput(
                          pessoaData.pessoaJuridica?.dataFundacao || ""
                        ),
                        representanteLegal:
                          pessoaData.pessoaJuridica?.representanteLegal || "",
                      },
                    };

                    Object.keys(formData).forEach((key) => {
                      setValue(key, (formData as any)[key]);
                    });
                  } catch (error) {
                    console.error("Erro ao carregar dados da pessoa:", error);
                  }
                }
              };

              transformBackendData();
            }, [pessoaId]);

            // ✅ RENDER DO FORMULÁRIO (MANTÉM EXATAMENTE O MESMO)
            return (
              <div className="space-y-6">
                {/* Tipo de Pessoa */}
                <div>
                  <label className="text-base font-medium text-gray-900">
                    Tipo de Pessoa
                  </label>
                  <fieldset className="mt-4">
                    <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                      {[
                        {
                          value: TipoPessoa.FISICA,
                          label: "Pessoa Física",
                          icon: "👤",
                        },
                        {
                          value: TipoPessoa.JURIDICA,
                          label: "Pessoa Jurídica",
                          icon: "🏢",
                        },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center">
                          <input
                            id={option.value}
                            name="tipoPessoa"
                            type="radio"
                            checked={values.tipoPessoa === option.value}
                            onChange={() =>
                              setValue("tipoPessoa", option.value)
                            }
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                          />
                          <label
                            htmlFor={option.value}
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            {option.icon} {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* CPF/CNPJ */}
                <FormField
                  name="cpfCnpj"
                  label={
                    values.tipoPessoa === TipoPessoa.FISICA ? "CPF" : "CNPJ"
                  }
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
                    onChange={handleCpfCnpjChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      values.tipoPessoa === TipoPessoa.FISICA
                        ? "000.000.000-00"
                        : "00.000.000/0000-00"
                    }
                    maxLength={
                      values.tipoPessoa === TipoPessoa.FISICA ? 14 : 18
                    }
                  />
                </FormField>

                {/* Nome */}
                <FormField
                  name="nome"
                  label={
                    values.tipoPessoa === TipoPessoa.FISICA
                      ? "Nome Completo"
                      : "Razão Social"
                  }
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
                    placeholder={
                      values.tipoPessoa === TipoPessoa.FISICA
                        ? "Nome completo"
                        : "Razão social"
                    }
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
                      value={values.email || ""}
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
                      value={values.telefone || ""}
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
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Dados da Pessoa Física
                    </h3>

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
                          value={values.pessoaFisica?.rg || ""}
                          onChange={(e) =>
                            updatePessoaFisica("rg", e.target.value)
                          }
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
                          value={values.pessoaFisica?.dataNascimento || ""}
                          onChange={(e) =>
                            updatePessoaFisica("dataNascimento", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </FormField>
                    </div>
                  </div>
                )}

                {/* Campos específicos para Pessoa Jurídica */}
                {values.tipoPessoa === TipoPessoa.JURIDICA && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Dados da Pessoa Jurídica
                    </h3>

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
                          value={values.pessoaJuridica?.nomeFantasia || ""}
                          onChange={(e) =>
                            updatePessoaJuridica("nomeFantasia", e.target.value)
                          }
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
                          value={
                            values.pessoaJuridica?.representanteLegal || ""
                          }
                          onChange={(e) =>
                            updatePessoaJuridica(
                              "representanteLegal",
                              e.target.value
                            )
                          }
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
                          value={values.pessoaJuridica?.inscricaoEstadual || ""}
                          onChange={(e) =>
                            updatePessoaJuridica(
                              "inscricaoEstadual",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="123.456.789.000"
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
                          value={
                            values.pessoaJuridica?.inscricaoMunicipal || ""
                          }
                          onChange={(e) =>
                            updatePessoaJuridica(
                              "inscricaoMunicipal",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="123456789"
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
                          value={values.pessoaJuridica?.dataFundacao || ""}
                          onChange={(e) =>
                            updatePessoaJuridica("dataFundacao", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </FormField>
                    </div>
                  </div>
                )}

                {/* ✅ BOTÃO PARA IR PARA ENDEREÇOS (só aparece após salvar) */}
                {pessoaSalva && (
                  <div className="border-t pt-4 mt-6">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveTab("enderecos")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        📍 Gerenciar Endereços ({totalEnderecos})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }}
        </FormBase>
      )}

      {/* ✅ ABA DE ENDEREÇOS */}
      {pessoaSalva && activeTab === "enderecos" && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Endereços de {pessoaSalva.nome}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {totalEnderecos} endereço(s) cadastrado(s)
                  {enderecoPrincipal && " • Principal definido"}
                </p>
              </div>
              {!showEnderecoForm && (
                <button
                  type="button"
                  onClick={() => setShowEnderecoForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  + Adicionar Endereço
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {enderecosError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{enderecosError}</p>
              </div>
            )}

            {showEnderecoForm && (
              <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <EnderecoForm
                  pessoaId={pessoaSalva.id}
                  onSuccess={handleEnderecoSuccess}
                  onCancel={() => setShowEnderecoForm(false)}
                />
              </div>
            )}

            {!showEnderecoForm && (
              <EnderecoLista
                enderecos={enderecos}
                loading={enderecosLoading}
                onRemover={handleRemoverEndereco}
                onDefinirPrincipal={handleDefinirPrincipal}
                showActions={true}
              />
            )}

            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("dados")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  ← Voltar aos Dados
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  ✅ Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PessoaForm;
