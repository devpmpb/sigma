// frontend/src/pages/cadastros/comum/pessoa/PessoaForm.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import pessoaService, {
  Pessoa,
  PessoaDTO,
  TipoPessoa,
  PessoaFisicaData,
  PessoaJuridicaData,
} from "../../../../services/comum/pessoaService";
import { logradouroService, bairroService } from "../../../../services";
import enderecoService, {
  TipoEndereco,
  type EnderecoDTO,
} from "../../../../services/comum/enderecoService";
import areaRuralService from "../../../../services/comum/areaRuralService";
import { FormBase } from "../../../../components/cadastro";
import { FormField } from "../../../../components/comum";
import {
  formatarCPF,
  formatarCNPJ,
  formatarTelefone,
  formatDateForInput,
} from "../../../../utils/formatters";

interface PessoaFormProps {
  id?: string | number;
  onSave: () => void;
}

// Interface estendida para incluir dados de endereço
interface PessoaFormData extends PessoaDTO {
  // Campos de endereço integrados
  incluirEndereco?: boolean;
  tipoEndereco?: TipoEndereco;
  logradouroId?: string;
  numero?: string;
  complemento?: string;
  bairroId?: string;
  areaRuralId?: string;
  referenciaRural?: string;
  coordenadas?: string;
}

const PessoaForm: React.FC<PessoaFormProps> = ({ id, onSave }) => {
  const pessoaId = id || useParams({ strict: false }).id;

  // Estados para dados auxiliares
  const [logradouros, setLogradouros] = useState<any[]>([]);
  const [bairros, setBairros] = useState<any[]>([]);
  const [areasRurais, setAreasRurais] = useState<any[]>([]);
  const [enderecoExistente, setEnderecoExistente] = useState<any>(null);
  const [loadingDados, setLoadingDados] = useState(false);

  // Valor inicial para o formulário com campos de endereço
  const initialValues: PessoaFormData = {
    tipoPessoa: TipoPessoa.FISICA,
    nome: "",
    cpfCnpj: "",
    email: "",
    telefone: "",
    ativo: true,
    isProdutor: false,
    inscricaoEstadualProdutor: "",
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
    // Campos de endereço
    incluirEndereco: true, // Por padrão, incluir endereço
    tipoEndereco: TipoEndereco.RESIDENCIAL,
    logradouroId: "",
    numero: "",
    complemento: "",
    bairroId: "",
    areaRuralId: "",
    referenciaRural: "",
    coordenadas: "",
  };

  // Carregar dados auxiliares
  useEffect(() => {
    carregarDadosAuxiliares();
  }, []);

  // Carregar endereço existente se estiver editando
  useEffect(() => {
    if (pessoaId && pessoaId !== "novo") {
      carregarEnderecoExistente();
    }
  }, [pessoaId]);

  const carregarDadosAuxiliares = async () => {
    setLoadingDados(true);
    try {
      const [logradourosData, bairrosData, areasRuraisData] = await Promise.all(
        [
          logradouroService.getAll(),
          bairroService.getAll(),
          areaRuralService.getAll(),
        ]
      );

      setLogradouros(logradourosData.filter((l: any) => l.ativo));
      setBairros(bairrosData.filter((b: any) => b.ativo));
      setAreasRurais(areasRuraisData.filter((a: any) => a.ativo));
    } catch (error) {
      console.error("Erro ao carregar dados auxiliares:", error);
    } finally {
      setLoadingDados(false);
    }
  };

  const carregarEnderecoExistente = async () => {
    try {
      const enderecos = await enderecoService.getEnderecosByPessoa(
        Number(pessoaId)
      );
      const enderecoPrincipal =
        enderecos.find((e) => e.principal) || enderecos[0];
      if (enderecoPrincipal) {
        setEnderecoExistente(enderecoPrincipal);
      }
    } catch (error) {
      console.error("Erro ao carregar endereço:", error);
    }
  };

  // Validação do formulário
  const validate = (values: PessoaFormData) => {
    const errors: Record<string, string> = {};

    // Validações de pessoa
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

    // Validações de endereço (se incluirEndereco estiver marcado)
    if (values.incluirEndereco) {
      if (!values.tipoEndereco) {
        errors.tipoEndereco = "Tipo de endereço é obrigatório";
      }

      if (values.tipoEndereco === TipoEndereco.RURAL) {
        // Validações para endereço rural
        if (!values.areaRuralId) {
          errors.areaRuralId = "Área rural é obrigatória";
        }
      } else {
        // Validações para endereço urbano
        if (!values.logradouroId) {
          errors.logradouroId = "Logradouro é obrigatório";
        }
        if (!values.numero) {
          errors.numero = "Número é obrigatório";
        }
        if (!values.bairroId) {
          errors.bairroId = "Bairro é obrigatório";
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Criar um wrapper do serviço para interceptar create/update
  const pessoaServiceWithEndereco = {
    ...pessoaService,

    getById: pessoaService.getById,
    getAll: pessoaService.getAll,
    delete: pessoaService.delete,
    search: pessoaService.search,
    toggleStatus: pessoaService.toggleStatus,

    create: async (data: PessoaFormData): Promise<Pessoa> => {
      // Preparar dados da pessoa (remover campos de endereço)
      const pessoaData: PessoaDTO = {
        tipoPessoa: data.tipoPessoa,
        nome: data.nome,
        cpfCnpj: data.cpfCnpj,
        email: data.email,
        telefone: data.telefone,
        ativo: data.ativo,
        isProdutor: data.isProdutor,
        inscricaoEstadualProdutor: data.inscricaoEstadualProdutor,
        pessoaFisica: data.pessoaFisica,
        pessoaJuridica: data.pessoaJuridica,
      };

      // Criar pessoa
      const pessoaSalva = await pessoaService.create(pessoaData);

      // Se incluir endereço, salvar o endereço
      if (data.incluirEndereco && pessoaSalva) {
        const isRural = data.tipoEndereco === TipoEndereco.RURAL;
        const enderecoData: EnderecoDTO = {
          pessoaId: pessoaSalva.id,
          tipoEndereco: data.tipoEndereco!,
          logradouroId: isRural ? undefined : Number(data.logradouroId),
          numero: isRural ? undefined : data.numero,
          complemento: isRural ? undefined : data.complemento,
          bairroId: isRural ? undefined : Number(data.bairroId),
          areaRuralId: isRural ? Number(data.areaRuralId) : undefined,
          referenciaRural: isRural ? data.referenciaRural : undefined,
          coordenadas: data.coordenadas,
          principal: true,
        };

        await enderecoService.create(enderecoData);
      }

      return pessoaSalva;
    },

    update: async (
      id: string | number,
      data: PessoaFormData
    ): Promise<Pessoa> => {
      // Preparar dados da pessoa (remover campos de endereço)
      const pessoaData: PessoaDTO = {
        tipoPessoa: data.tipoPessoa,
        nome: data.nome,
        cpfCnpj: data.cpfCnpj,
        email: data.email,
        telefone: data.telefone,
        ativo: data.ativo,
        isProdutor: data.isProdutor,
        inscricaoEstadualProdutor: data.inscricaoEstadualProdutor,
        pessoaFisica: data.pessoaFisica,
        pessoaJuridica: data.pessoaJuridica,
      };

      // Atualizar pessoa
      const pessoaSalva = await pessoaService.update(id, pessoaData);

      // Se incluir endereço, salvar ou atualizar o endereço
      if (data.incluirEndereco && pessoaSalva) {
        const isRural = data.tipoEndereco === TipoEndereco.RURAL;
        const enderecoData: EnderecoDTO = {
          pessoaId: pessoaSalva.id,
          tipoEndereco: data.tipoEndereco!,
          logradouroId: isRural ? undefined : Number(data.logradouroId),
          numero: isRural ? undefined : data.numero,
          complemento: isRural ? undefined : data.complemento,
          bairroId: isRural ? undefined : Number(data.bairroId),
          areaRuralId: isRural ? Number(data.areaRuralId) : undefined,
          referenciaRural: isRural ? data.referenciaRural : undefined,
          coordenadas: data.coordenadas,
          principal: true,
        };

        // Se já existe um endereço, atualizar, senão criar
        if (enderecoExistente) {
          await enderecoService.update(enderecoExistente.id, enderecoData);
        } else {
          await enderecoService.create(enderecoData);
        }
      }

      return pessoaSalva;
    },
  };

  return (
    <FormBase<Pessoa, PessoaFormData>
      title="Pessoa"
      service={pessoaServiceWithEndereco}
      id={pessoaId}
      initialValues={initialValues}
      validate={validate}
      returnUrl="/cadastros/comum/pessoas"
      //onSave={onSave}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        setValue,
        setFieldTouched,
      }) => {
        // Funções auxiliares
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

        // Limpar campos específicos quando mudar entre rural/urbano
        const handleTipoEnderecoChange = (
          e: React.ChangeEvent<HTMLSelectElement>
        ) => {
          const novoTipo = e.target.value as TipoEndereco;
          setValue("tipoEndereco", novoTipo);

          // Limpar campos específicos ao mudar o tipo
          if (novoTipo === TipoEndereco.RURAL) {
            // Limpar campos urbanos
            setValue("logradouroId", "");
            setValue("numero", "");
            setValue("complemento", "");
            setValue("bairroId", "");
          } else {
            // Limpar campos rurais
            setValue("areaRuralId", "");
            setValue("referenciaRural", "");
          }
        };

        // Carregar dados da pessoa ao editar
        useEffect(() => {
          const loadPessoaData = async () => {
            if (pessoaId && pessoaId !== "novo") {
              try {
                // Tentar usar o método que traz detalhes completos, senão usar getById
                let pessoaData;
                try {
                  // Primeiro tentar o método com detalhes
                  pessoaData = await pessoaService.getPessoaWithDetails(
                    Number(pessoaId)
                  );
                } catch {
                  // Se não existir, usar o método padrão
                  pessoaData = await pessoaService.getById(pessoaId);
                }

                // Debug - remover depois de confirmar que funciona
                console.log("Dados da pessoa carregados:", pessoaData);
                if (pessoaData.pessoaFisica) {
                  console.log("PessoaFisica - RG:", pessoaData.pessoaFisica.rg);
                  console.log(
                    "PessoaFisica - Data Nasc:",
                    pessoaData.pessoaFisica.dataNascimento
                  );
                }

                // Preencher dados básicos da pessoa
                setValue("tipoPessoa", pessoaData.tipoPessoa);
                setValue("nome", pessoaData.nome);
                setValue("cpfCnpj", pessoaData.cpfCnpj);
                setValue("email", pessoaData.email || "");
                setValue("telefone", pessoaData.telefone || "");
                setValue("ativo", pessoaData.ativo !== false); // garantir que seja boolean
                setValue("isProdutor", pessoaData.isProdutor || false);
                setValue(
                  "inscricaoEstadualProdutor",
                  pessoaData.inscricaoEstadualProdutor || ""
                );

                // Preencher dados específicos de pessoa física
                if (
                  pessoaData.tipoPessoa === TipoPessoa.FISICA &&
                  pessoaData.pessoaFisica
                ) {
                  const rg = pessoaData.pessoaFisica.rg || "";
                  const dataNascimento = pessoaData.pessoaFisica.dataNascimento
                    ? formatDateForInput(pessoaData.pessoaFisica.dataNascimento)
                    : "";

                  console.log(
                    "Setando campos PF - RG:",
                    rg,
                    "Data:",
                    dataNascimento
                  );

                  // Usar a função helper para atualizar os campos
                  updatePessoaFisica("rg", rg);
                  updatePessoaFisica("dataNascimento", dataNascimento);
                }

                // Preencher dados específicos de pessoa jurídica
                if (
                  pessoaData.tipoPessoa === TipoPessoa.JURIDICA &&
                  pessoaData.pessoaJuridica
                ) {
                  const nomeFantasia =
                    pessoaData.pessoaJuridica.nomeFantasia || "";
                  const inscricaoEstadual =
                    pessoaData.pessoaJuridica.inscricaoEstadual || "";
                  const inscricaoMunicipal =
                    pessoaData.pessoaJuridica.inscricaoMunicipal || "";
                  const dataFundacao = pessoaData.pessoaJuridica.dataFundacao
                    ? formatDateForInput(pessoaData.pessoaJuridica.dataFundacao)
                    : "";
                  const representanteLegal =
                    pessoaData.pessoaJuridica.representanteLegal || "";

                  // Usar a função helper para atualizar os campos
                  updatePessoaJuridica("nomeFantasia", nomeFantasia);
                  updatePessoaJuridica("inscricaoEstadual", inscricaoEstadual);
                  updatePessoaJuridica(
                    "inscricaoMunicipal",
                    inscricaoMunicipal
                  );
                  updatePessoaJuridica("dataFundacao", dataFundacao);
                  updatePessoaJuridica(
                    "representanteLegal",
                    representanteLegal
                  );
                }

                // Preencher dados do endereço se existir
                if (enderecoExistente) {
                  setValue("incluirEndereco", true);
                  setValue("tipoEndereco", enderecoExistente.tipoEndereco);
                  setValue(
                    "logradouroId",
                    enderecoExistente.logradouroId?.toString() || ""
                  );
                  setValue("numero", enderecoExistente.numero || "");
                  setValue("complemento", enderecoExistente.complemento || "");
                  setValue(
                    "bairroId",
                    enderecoExistente.bairroId?.toString() || ""
                  );
                  setValue(
                    "areaRuralId",
                    enderecoExistente.areaRuralId?.toString() || ""
                  );
                  setValue(
                    "referenciaRural",
                    enderecoExistente.referenciaRural || ""
                  );
                  setValue("coordenadas", enderecoExistente.coordenadas || "");
                }
              } catch (error) {
                console.error("Erro ao carregar dados da pessoa:", error);
              }
            }
          };

          loadPessoaData();
        }, [pessoaId, enderecoExistente, setValue]);

        return (
          <div className="space-y-8">
            {/* SEÇÃO 1: DADOS PESSOAIS */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                📋 Dados Pessoais
              </h3>

              {/* Tipo de Pessoa */}
              <div className="mb-6">
                <label className="text-base font-medium text-gray-900">
                  Tipo de Pessoa
                </label>
                <fieldset className="mt-4">
                  <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                    <div className="flex items-center">
                      <input
                        id="fisica"
                        name="tipoPessoa"
                        type="radio"
                        value={TipoPessoa.FISICA}
                        checked={values.tipoPessoa === TipoPessoa.FISICA}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label
                        htmlFor="fisica"
                        className="ml-3 block text-sm font-medium text-gray-700"
                      >
                        Pessoa Física
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="juridica"
                        name="tipoPessoa"
                        type="radio"
                        value={TipoPessoa.JURIDICA}
                        checked={values.tipoPessoa === TipoPessoa.JURIDICA}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label
                        htmlFor="juridica"
                        className="ml-3 block text-sm font-medium text-gray-700"
                      >
                        Pessoa Jurídica
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>

              {/* Dados básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="nome"
                  label={
                    values.tipoPessoa === TipoPessoa.JURIDICA
                      ? "Razão Social"
                      : "Nome Completo"
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
                  />
                </FormField>

                <FormField
                  name="cpfCnpj"
                  label={
                    values.tipoPessoa === TipoPessoa.JURIDICA ? "CNPJ" : "CPF"
                  }
                  error={errors.cpfCnpj}
                  touched={touched.cpfCnpj}
                  required
                >
                  <input
                    type="text"
                    id="cpfCnpj"
                    name="cpfCnpj"
                    value={
                      values.tipoPessoa === TipoPessoa.JURIDICA
                        ? formatarCNPJ(values.cpfCnpj)
                        : formatarCPF(values.cpfCnpj)
                    }
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      values.tipoPessoa === TipoPessoa.JURIDICA
                        ? "00.000.000/0000-00"
                        : "000.000.000-00"
                    }
                  />
                </FormField>

                <FormField
                  name="email"
                  label="Email"
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
                  />
                </FormField>

                <FormField
                  name="telefone"
                  label="Telefone"
                  error={errors.telefone}
                  touched={touched.telefone}
                >
                  <input
                    type="text"
                    id="telefone"
                    name="telefone"
                    value={formatarTelefone(values.telefone || "")}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(00) 00000-0000"
                  />
                </FormField>
              </div>

              {/* Campos específicos para Pessoa Física */}
              {values.tipoPessoa === TipoPessoa.FISICA && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name="rg" label="RG">
                    <input
                      type="text"
                      id="rg"
                      name="pessoaFisica.rg"
                      value={values.pessoaFisica?.rg || ""}
                      onChange={(e) => updatePessoaFisica("rg", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      name="pessoaFisica.dataNascimento"
                      value={values.pessoaFisica?.dataNascimento || ""}
                      onChange={(e) =>
                        updatePessoaFisica("dataNascimento", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormField>
                </div>
              )}

              {/* Campos específicos para Pessoa Jurídica */}
              {values.tipoPessoa === TipoPessoa.JURIDICA && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="nomeFantasia" label="Nome Fantasia">
                      <input
                        type="text"
                        id="nomeFantasia"
                        name="pessoaJuridica.nomeFantasia"
                        value={values.pessoaJuridica?.nomeFantasia || ""}
                        onChange={(e) =>
                          updatePessoaJuridica("nomeFantasia", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        name="pessoaJuridica.representanteLegal"
                        value={values.pessoaJuridica?.representanteLegal || ""}
                        onChange={(e) =>
                          updatePessoaJuridica(
                            "representanteLegal",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      name="inscricaoEstadual"
                      label="Inscrição Estadual"
                    >
                      <input
                        type="text"
                        id="inscricaoEstadual"
                        name="pessoaJuridica.inscricaoEstadual"
                        value={values.pessoaJuridica?.inscricaoEstadual || ""}
                        onChange={(e) =>
                          updatePessoaJuridica(
                            "inscricaoEstadual",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </FormField>

                    <FormField
                      name="inscricaoMunicipal"
                      label="Inscrição Municipal"
                    >
                      <input
                        type="text"
                        id="inscricaoMunicipal"
                        name="pessoaJuridica.inscricaoMunicipal"
                        value={values.pessoaJuridica?.inscricaoMunicipal || ""}
                        onChange={(e) =>
                          updatePessoaJuridica(
                            "inscricaoMunicipal",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </FormField>

                    <FormField name="dataFundacao" label="Data de Fundação">
                      <input
                        type="date"
                        id="dataFundacao"
                        name="pessoaJuridica.dataFundacao"
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

              {/* Checkbox para produtor rural */}
              <div className="mt-6 flex items-center">
                <input
                  type="checkbox"
                  id="isProdutor"
                  name="isProdutor"
                  checked={values.isProdutor || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isProdutor"
                  className="ml-2 block text-sm text-gray-900"
                >
                  É produtor rural
                </label>
              </div>

              {values.isProdutor && (
                <div className="mt-4">
                  <FormField
                    name="inscricaoEstadualProdutor"
                    label="Inscrição Estadual de Produtor"
                  >
                    <input
                      type="text"
                      id="inscricaoEstadualProdutor"
                      name="inscricaoEstadualProdutor"
                      value={values.inscricaoEstadualProdutor}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormField>
                </div>
              )}
            </div>

            {/* SEÇÃO 2: ENDEREÇO */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  📍 Endereço Principal
                </h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="incluirEndereco"
                    checked={values.incluirEndereco}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Incluir endereço
                  </span>
                </label>
              </div>

              {values.incluirEndereco && (
                <>
                  {/* Tipo de Endereço */}
                  <div className="mb-6">
                    <FormField
                      name="tipoEndereco"
                      label="Tipo de Endereço"
                      error={errors.tipoEndereco}
                      touched={touched.tipoEndereco}
                      required
                    >
                      <select
                        id="tipoEndereco"
                        name="tipoEndereco"
                        value={values.tipoEndereco}
                        onChange={handleTipoEnderecoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={TipoEndereco.RESIDENCIAL}>
                          Residencial
                        </option>
                        <option value={TipoEndereco.COMERCIAL}>
                          Comercial
                        </option>
                        <option value={TipoEndereco.RURAL}>Rural</option>
                        <option value={TipoEndereco.CORRESPONDENCIA}>
                          Correspondência
                        </option>
                      </select>
                    </FormField>

                    {/* Indicador visual do tipo de campos */}
                    {values.tipoEndereco === TipoEndereco.RURAL && (
                      <div className="mt-2 p-2 bg-green-50 border-l-4 border-green-400 text-green-700">
                        <p className="text-sm">
                          🌾 Preencha os campos de endereço rural abaixo
                        </p>
                      </div>
                    )}
                    {values.tipoEndereco !== TipoEndereco.RURAL && (
                      <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 text-blue-700">
                        <p className="text-sm">
                          🏢 Preencha os campos de endereço urbano abaixo
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Campos para endereço urbano (não rural) */}
                  {values.tipoEndereco !== TipoEndereco.RURAL && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          name="logradouroId"
                          label="Logradouro"
                          error={errors.logradouroId}
                          touched={touched.logradouroId}
                          required
                        >
                          <select
                            id="logradouroId"
                            name="logradouroId"
                            value={values.logradouroId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loadingDados}
                          >
                            <option value="">Selecione...</option>
                            {logradouros.map((log: any) => (
                              <option key={log.id} value={log.id}>
                                {log.tipo} {log.descricao}
                              </option>
                            ))}
                          </select>
                        </FormField>

                        <FormField
                          name="numero"
                          label="Número"
                          error={errors.numero}
                          touched={touched.numero}
                          required
                        >
                          <input
                            type="text"
                            id="numero"
                            name="numero"
                            value={values.numero}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </FormField>

                        <FormField name="complemento" label="Complemento">
                          <input
                            type="text"
                            id="complemento"
                            name="complemento"
                            value={values.complemento}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Apto, Bloco, etc."
                          />
                        </FormField>
                      </div>

                      <div className="mt-4">
                        <FormField
                          name="bairroId"
                          label="Bairro"
                          error={errors.bairroId}
                          touched={touched.bairroId}
                          required
                        >
                          <select
                            id="bairroId"
                            name="bairroId"
                            value={values.bairroId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loadingDados}
                          >
                            <option value="">Selecione...</option>
                            {bairros.map((bairro: any) => (
                              <option key={bairro.id} value={bairro.id}>
                                {bairro.nome}
                              </option>
                            ))}
                          </select>
                        </FormField>
                      </div>
                    </>
                  )}

                  {/* Campos para endereço rural */}
                  {values.tipoEndereco === TipoEndereco.RURAL && (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          name="areaRuralId"
                          label="Área Rural"
                          error={errors.areaRuralId}
                          touched={touched.areaRuralId}
                          required
                        >
                          <select
                            id="areaRuralId"
                            name="areaRuralId"
                            value={values.areaRuralId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loadingDados}
                          >
                            <option value="">Selecione...</option>
                            {areasRurais.map((area: any) => (
                              <option key={area.id} value={area.id}>
                                {area.nome}
                              </option>
                            ))}
                          </select>
                        </FormField>

                        <FormField
                          name="referenciaRural"
                          label="Referência/Ponto de Referência"
                        >
                          <textarea
                            id="referenciaRural"
                            name="referenciaRural"
                            value={values.referenciaRural}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Próximo ao silo azul, após a ponte..."
                          />
                        </FormField>
                      </div>
                    </>
                  )}

                  {/* Campo de coordenadas (comum para ambos) */}
                  <div className="mt-4">
                    <FormField
                      name="coordenadas"
                      label="Coordenadas GPS"
                      helpText="Formato: latitude,longitude (ex: -24.9555,-54.3222)"
                    >
                      <input
                        type="text"
                        id="coordenadas"
                        name="coordenadas"
                        value={values.coordenadas}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="-24.9555,-54.3222"
                      />
                    </FormField>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }}
    </FormBase>
  );
};

export default PessoaForm;
