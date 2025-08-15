// frontend/src/pages/cadastros/comum/pessoa/PessoaForm.tsx - VERSÃO ATUALIZADA
import React, { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import pessoaService, {
  Pessoa,
  PessoaDTO,
  TipoPessoa,
  PessoaFisicaData,
  PessoaJuridicaData,
  AreaEfetivaDTO,
} from "../../../../services/comum/pessoaService";
import { FormBase } from "../../../../components/cadastro";
import { FormField } from "../../../../components/comum";
import FormSection from "../../../../components/comum/FormSection";
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
  const pessoaId = id || useParams({ strict: false }).id;

  // Estados existentes
  const [showEnderecoForm, setShowEnderecoForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"dados" | "enderecos" | "areaEfetiva">("dados");
  const [pessoaSalva, setPessoaSalva] = useState<Pessoa | null>(null);

  // 🆕 Estados para área efetiva
  const [areaEfetiva, setAreaEfetiva] = useState<AreaEfetivaDTO>({
    anoReferencia: new Date().getFullYear(),
    areaPropria: 0,
    areaArrendadaRecebida: 0,
    areaArrendadaCedida: 0,
    areaEfetiva: 0,
  });
  const [incluirAreaEfetiva, setIncluirAreaEfetiva] = useState(false);

  // Hook para endereços
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

  // Valor inicial atualizado
  const initialValues: PessoaDTO = {
    tipoPessoa: TipoPessoa.FISICA,
    nome: "",
    cpfCnpj: "",
    email: "",
    telefone: "",
    ativo: true,
    // 🆕 Novos campos
    produtorRural: false,
    inscricaoEstadual: "",
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

  // Validação atualizada
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

    // 🆕 Validação para produtor rural
    if (values.produtorRural && !values.inscricaoEstadual?.trim()) {
      errors.inscricaoEstadual = "Inscrição estadual é obrigatória para produtores rurais";
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

  // Calcular área efetiva automaticamente
  useEffect(() => {
    const areaCalculada = pessoaService.calcularAreaEfetiva(areaEfetiva);
    setAreaEfetiva((prev) => ({ ...prev, areaEfetiva: areaCalculada }));
  }, [
    areaEfetiva.areaPropria,
    areaEfetiva.areaArrendadaRecebida,
    areaEfetiva.areaArrendadaCedida,
  ]);

  // Carregar pessoa salva
  useEffect(() => {
    if (pessoaId && pessoaId !== "novo") {
      pessoaService
        .getById(pessoaId)
        .then((pessoa) => {
          setPessoaSalva(pessoa);
          
          // 🆕 Carregar área efetiva se existir
          if (pessoa.produtorRural && pessoa.areaEfetiva) {
            setAreaEfetiva({
              anoReferencia: pessoa.areaEfetiva.anoReferencia,
              areaPropria: Number(pessoa.areaEfetiva.areaPropria),
              areaArrendadaRecebida: Number(pessoa.areaEfetiva.areaArrendadaRecebida),
              areaArrendadaCedida: Number(pessoa.areaEfetiva.areaArrendadaCedida),
              areaEfetiva: Number(pessoa.areaEfetiva.areaEfetiva),
            });
            setIncluirAreaEfetiva(true);
          }
        })
        .catch(console.error);
    }
  }, [pessoaId]);

  // Handlers para endereços
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

  // 🆕 Handlers para área efetiva
  const updateAreaEfetiva = (field: keyof AreaEfetivaDTO, value: any) => {
    setAreaEfetiva((prev) => ({ ...prev, [field]: value }));
  };

  // 🆕 Função para construir dados finais
  const buildFinalData = (values: PessoaDTO): PessoaDTO => {
    const finalData = { ...values };

    if (values.produtorRural && incluirAreaEfetiva) {
      finalData.areaEfetiva = { ...areaEfetiva };
    }

    return finalData;
  };

  return (
    <div className="pessoa-form-container">
      {/* Navegação por abas */}
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
              {/* 🆕 Nova aba para área efetiva */}
              {pessoaSalva.produtorRural && (
                <button
                  type="button"
                  onClick={() => setActiveTab("areaEfetiva")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "areaEfetiva"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  🌾 Área Efetiva
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Conteúdo das abas */}
      {activeTab === "dados" && (
        <FormBase<Pessoa, PessoaDTO>
          title="Cadastro de Pessoa"
          service={{
            ...pessoaService,
            create: (data: PessoaDTO) => pessoaService.create(buildFinalData(data)),
            update: (id: number | string, data: PessoaDTO) =>
              pessoaService.update(id, buildFinalData(data)),
          }}
          id={pessoaId}
          initialValues={initialValues}
          validate={validate}
          onSave={onSave}
          returnUrl="/cadastros/comum/pessoas"
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            setValue,
            setFieldTouched,
          }) => {
            // Helpers para atualizar campos aninhados
            const updatePessoaFisica = (field: keyof PessoaFisicaData, value: any) => {
              setValue("pessoaFisica", {
                ...values.pessoaFisica,
                [field]: value,
              });
            };

            const updatePessoaJuridica = (field: keyof PessoaJuridicaData, value: any) => {
              setValue("pessoaJuridica", {
                ...values.pessoaJuridica,
                [field]: value,
              });
            };

            const handleCpfCnpjBlur = (e: React.FocusEvent<HTMLInputElement>) => {
              const value = e.target.value;
              if (values.tipoPessoa === TipoPessoa.FISICA) {
                setValue("cpfCnpj", formatarCPF(value));
              } else {
                setValue("cpfCnpj", formatarCNPJ(value));
              }
              setFieldTouched("cpfCnpj", true);
            };

            const handleTelefoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
              setValue("telefone", formatarTelefone(e.target.value));
              setFieldTouched("telefone", true);
            };

            return (
              <div className="space-y-6">
                <FormSection
                  title="Informações Básicas"
                  description="Dados principais da pessoa"
                >
                  {/* Tipo de Pessoa */}
                  <div>
                    <label className="text-base font-medium text-gray-900">
                      Tipo de Pessoa *
                    </label>
                    <fieldset className="mt-4">
                      <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                        {Object.values(TipoPessoa).map((tipo) => (
                          <div key={tipo} className="flex items-center">
                            <input
                              id={tipo}
                              name="tipoPessoa"
                              type="radio"
                              value={tipo}
                              checked={values.tipoPessoa === tipo}
                              onChange={handleChange}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label
                              htmlFor={tipo}
                              className="ml-3 block text-sm font-medium text-gray-700"
                            >
                              {tipo === TipoPessoa.FISICA ? "Pessoa Física" : "Pessoa Jurídica"}
                            </label>
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  {/* CPF/CNPJ */}
                  <FormField
                    name="cpfCnpj"
                    label={values.tipoPessoa === TipoPessoa.FISICA ? "CPF" : "CNPJ"}
                    error={errors.cpfCnpj}
                    touched={touched.cpfCnpj}
                    required
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
                        values.tipoPessoa === TipoPessoa.FISICA
                          ? "123.456.789-00"
                          : "12.345.678/0001-90"
                      }
                    />
                  </FormField>

                  {/* Nome/Razão Social */}
                  <FormField
                    name="nome"
                    label={
                      values.tipoPessoa === TipoPessoa.FISICA
                        ? "Nome completo"
                        : "Razão social"
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
                </FormSection>

                {/* 🆕 Seção Produtor Rural */}
                <FormSection
                  title="Produtor Rural"
                  description="Marque se esta pessoa é um produtor rural"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="produtorRural"
                      name="produtorRural"
                      checked={values.produtorRural || false}
                      onChange={(e) => {
                        setValue("produtorRural", e.target.checked);
                        if (!e.target.checked) {
                          setValue("inscricaoEstadual", "");
                          setIncluirAreaEfetiva(false);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="produtorRural" className="ml-3 text-sm font-medium text-gray-700">
                      Esta pessoa é um produtor rural
                    </label>
                  </div>

                  {values.produtorRural && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <FormField
                        name="inscricaoEstadual"
                        label="Inscrição Estadual"
                        error={errors.inscricaoEstadual}
                        touched={touched.inscricaoEstadual}
                        required
                        helpText="Obrigatório para produtores rurais"
                      >
                        <input
                          type="text"
                          id="inscricaoEstadual"
                          name="inscricaoEstadual"
                          value={values.inscricaoEstadual || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="12345678901"
                        />
                      </FormField>

                      {/* 🆕 Checkbox para incluir área efetiva */}
                      <div className="mt-4 flex items-center">
                        <input
                          type="checkbox"
                          id="incluirAreaEfetiva"
                          checked={incluirAreaEfetiva}
                          onChange={(e) => setIncluirAreaEfetiva(e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="incluirAreaEfetiva" className="ml-3 text-sm font-medium text-gray-700">
                          Incluir dados de área efetiva
                        </label>
                      </div>
                    </div>
                  )}
                </FormSection>

                {/* 🆕 Seção Área Efetiva (condicional) */}
                {values.produtorRural && incluirAreaEfetiva && (
                  <FormSection
                    title="Área Efetiva"
                    description="Informações sobre as áreas de exploração agrícola"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="anoReferencia"
                        label="Ano de Referência"
                      >
                        <input
                          type="number"
                          value={areaEfetiva.anoReferencia}
                          onChange={(e) => updateAreaEfetiva("anoReferencia", Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="2020"
                          max="2030"
                        />
                      </FormField>

                      <FormField
                        name="areaPropria"
                        label="Área Própria (alqueires)"
                      >
                        <input
                          type="number"
                          step="0.01"
                          value={areaEfetiva.areaPropria}
                          onChange={(e) => updateAreaEfetiva("areaPropria", Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </FormField>

                      <FormField
                        name="areaArrendadaRecebida"
                        label="Área Arrendada Recebida (alqueires)"
                      >
                        <input
                          type="number"
                          step="0.01"
                          value={areaEfetiva.areaArrendadaRecebida}
                          onChange={(e) => updateAreaEfetiva("areaArrendadaRecebida", Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </FormField>

                      <FormField
                        name="areaArrendadaCedida"
                        label="Área Arrendada Cedida (alqueires)"
                      >
                        <input
                          type="number"
                          step="0.01"
                          value={areaEfetiva.areaArrendadaCedida}
                          onChange={(e) => updateAreaEfetiva("areaArrendadaCedida", Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </FormField>
                    </div>

                    {/* Área Efetiva Calculada */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-lg font-medium text-blue-900">
                        Área Efetiva Total: {pessoaService.formatarArea(areaEfetiva.areaEfetiva)}
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Calculada automaticamente: Área Própria + Área Recebida - Área Cedida
                      </p>
                    </div>
                  </FormSection>
                )}

                {/* Campos específicos para Pessoa Física */}
                {values.tipoPessoa === TipoPessoa.FISICA && (
                  <FormSection
                    title="Dados da Pessoa Física"
                    description="Informações específicas para pessoa física"
                  >
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
                          onChange={(e) => updatePessoaFisica("rg", e.target.value)}
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
                          onChange={(e) => updatePessoaFisica("dataNascimento", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </FormField>
                    </div>
                  </FormSection>
                )}

                {/* Campos específicos para Pessoa Jurídica */}
                {values.tipoPessoa === TipoPessoa.JURIDICA && (
                  <FormSection
                    title="Dados da Pessoa Jurídica"
                    description="Informações específicas para pessoa jurídica"
                  >
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
                          onChange={(e) => updatePessoaJuridica("nomeFantasia", e.target.value)}
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
                          value={values.pessoaJuridica?.representanteLegal || ""}
                          onChange={(e) => updatePessoaJuridica("representanteLegal", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nome do representante legal"
                        />
                      </FormField>

                      <FormField
                        name="inscricaoEstadualPJ"
                        label="Inscrição Estadual"
                        error={errors.inscricaoEstadualPJ}
                        touched={touched.inscricaoEstadualPJ}
                      >
                        <input
                          type="text"
                          id="inscricaoEstadualPJ"
                          name="inscricaoEstadualPJ"
                          value={values.pessoaJuridica?.inscricaoEstadual || ""}
                          onChange={(e) => updatePessoaJuridica("inscricaoEstadual", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="12345678901"
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
                          value={values.pessoaJuridica?.inscricaoMunicipal || ""}
                          onChange={(e) => updatePessoaJuridica("inscricaoMunicipal", e.target.value)}
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
                          onChange={(e) => updatePessoaJuridica("dataFundacao", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </FormField>
                    </div>
                  </FormSection>
                )}
              </div>
            );
          }}
        </FormBase>
      )}

      {/* Aba de Endereços */}
      {activeTab === "enderecos" && pessoaSalva && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Endereços</h2>
            {podeAdicionarEndereco && (
              <button
                onClick={() => setShowEnderecoForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Adicionar Endereço
              </button>
            )}
          </div>

          {enderecosError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Erro ao carregar endereços: {enderecosError}</p>
            </div>
          )}

          {showEnderecoForm ? (
            <EnderecoForm
              pessoaId={pessoaSalva.id}
              onSuccess={handleEnderecoSuccess}
              onCancel={() => setShowEnderecoForm(false)}
            />
          ) : (
            <EnderecoLista
              enderecos={enderecos}
              enderecoPrincipal={enderecoPrincipal}
              loading={enderecosLoading}
              onRemover={handleRemoverEndereco}
              onDefinirPrincipal={handleDefinirPrincipal}
            />
          )}
        </div>
      )}

      {/* 🆕 Aba Área Efetiva */}
      {activeTab === "areaEfetiva" && pessoaSalva && pessoaSalva.produtorRural && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Área Efetiva</h2>
          
          {pessoaSalva.areaEfetiva ? (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {pessoaService.formatarArea(pessoaSalva.areaEfetiva.areaPropria)}
                  </div>
                  <div className="text-sm text-gray-500">Área Própria</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {pessoaService.formatarArea(pessoaSalva.areaEfetiva.areaArrendadaRecebida)}
                  </div>
                  <div className="text-sm text-gray-500">Área Recebida</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {pessoaService.formatarArea(pessoaSalva.areaEfetiva.areaArrendadaCedida)}
                  </div>
                  <div className="text-sm text-gray-500">Área Cedida</div>
                </div>
                
                <div className="text-center border-l-2 border-yellow-400">
                  <div className="text-3xl font-bold text-yellow-600">
                    {pessoaService.formatarArea(pessoaSalva.areaEfetiva.areaEfetiva)}
                  </div>
                  <div className="text-sm text-gray-500">Área Efetiva Total</div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>Ano de Referência: {pessoaSalva.areaEfetiva.anoReferencia}</p>
                <p>Última atualização: {new Date(pessoaSalva.areaEfetiva.updatedAt || '').toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Nenhuma área efetiva cadastrada</p>
              <p className="text-sm text-gray-400">
                Para cadastrar área efetiva, edite os dados pessoais e marque a opção correspondente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PessoaForm;