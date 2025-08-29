// src/controllers/comum/pessoaController.ts
import { Request, Response } from "express";
import { PrismaClient, TipoPessoa } from "@prisma/client";
import { createGenericController } from "../GenericController";
import { convertPessoaDateFields } from "../../utils/formatters";

const prisma = new PrismaClient();

// Função para validar dados de criação
const validatePessoaCreate = (data: any) => {
  const errors = [];

  // Validações básicas
  if (!data.nome || data.nome.trim() === "") {
    errors.push("Nome é obrigatório");
  }

  if (!data.cpfCnpj || data.cpfCnpj.trim() === "") {
    errors.push("CPF/CNPJ é obrigatório");
  }

  if (
    !data.tipoPessoa ||
    !Object.values(TipoPessoa).includes(data.tipoPessoa)
  ) {
    errors.push(
      "Tipo de pessoa é obrigatório e deve ser válido (FISICA ou JURIDICA)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

// Função para validar dados de atualização
const validatePessoaUpdate = (data: any) => {
  const errors = [];

  if (data.nome !== undefined && data.nome.trim() === "") {
    errors.push("Nome não pode ser vazio");
  }

  if (data.tipoPessoa && !Object.values(TipoPessoa).includes(data.tipoPessoa)) {
    errors.push("Tipo de pessoa deve ser válido (FISICA ou JURIDICA)");
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

const calcularAreaEfetiva = (areaEfetiva: any) => {
  const areaPropria = Number(areaEfetiva.areaPropria) || 0;
  const areaRecebida = Number(areaEfetiva.areaArrendadaRecebida) || 0;
  const areaCedida = Number(areaEfetiva.areaArrendadaCedida) || 0;

  return areaPropria + areaRecebida - areaCedida;
};

// Controlador com os métodos genéricos
const genericController = createGenericController({
  modelName: "pessoa",
  displayName: "Pessoa",
  uniqueField: "cpfCnpj",
  orderBy: { nome: "asc" },
  softDelete: true,
  validateCreate: validatePessoaCreate,
  validateUpdate: validatePessoaUpdate,
});

// Controlador com métodos específicos para Pessoa
export const pessoaController = {
  ...genericController,

  // Sobrescrever o método create para lidar com PessoaFisica e PessoaJuridica
  create: async (req: Request, res: Response) => {
    try {
      const { tipoPessoa, pessoaFisica, pessoaJuridica, ...dadosPessoa } =
        req.body;

      // Verificação de dados
      if (tipoPessoa === "FISICA" && !pessoaFisica) {
        return res.status(400).json({
          erro: "Dados de pessoa física são obrigatórios",
        });
      }

      if (tipoPessoa === "JURIDICA" && !pessoaJuridica) {
        return res.status(400).json({
          erro: "Dados de pessoa jurídica são obrigatórios",
        });
      }

      // Validação usando a função de validação
      const validationResult = validatePessoaCreate({
        tipoPessoa,
        ...dadosPessoa,
      });

      if (!validationResult.isValid) {
        return res.status(400).json({
          erro: "Dados inválidos para criar pessoa",
          detalhes: validationResult.errors,
        });
      }

      // Verificar duplicidade
      if (dadosPessoa.cpfCnpj) {
        const existente = await prisma.pessoa.findUnique({
          where: { cpfCnpj: dadosPessoa.cpfCnpj },
        });

        if (existente) {
          return res.status(400).json({
            erro: `Já existe uma pessoa com este CPF/CNPJ`,
          });
        }
      }
      console.log(dadosPessoa);
      // Usar transação para garantir a consistência
      const result = await prisma.$transaction(async (tx) => {
        // Criar pessoa base
        
        const novaPessoa = await tx.pessoa.create({
          data: {
            ...dadosPessoa,
            tipoPessoa,
          },
        });

        // Criar detalhes específicos conforme o tipo
        if (tipoPessoa === "FISICA" && pessoaFisica) {
          // Converter datas antes de salvar
          const dadosPF = convertPessoaDateFields({ ...pessoaFisica });

          await tx.pessoaFisica.create({
            data: {
              id: novaPessoa.id,
              ...dadosPF,
            },
          });
        } else if (tipoPessoa === "JURIDICA" && pessoaJuridica) {
          // Converter datas antes de salvar
          const dadosPJ = convertPessoaDateFields({ ...pessoaJuridica });

          await tx.pessoaJuridica.create({
            data: {
              id: novaPessoa.id,
              ...dadosPJ,
            },
          });
        }

        return novaPessoa;
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error("Erro ao criar pessoa:", error);
      return res.status(500).json({
        erro: "Erro ao criar pessoa",
        detalhes: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  },

  // Atualizar pessoa com seus dados específicos
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { pessoaFisica, pessoaJuridica, ...dadosPessoa } = req.body;

      // Buscar a pessoa existente
      const pessoaExistente = await prisma.pessoa.findUnique({
        where: { id: Number(id) },
        include: {
          pessoaFisica: true,
          pessoaJuridica: true,
        },
      });

      if (!pessoaExistente) {
        return res.status(404).json({ erro: "Pessoa não encontrada" });
      }

      // Validação dos dados comuns
      const validationResult = validatePessoaUpdate(dadosPessoa);
      if (!validationResult.isValid) {
        return res.status(400).json({
          erro: "Dados inválidos para atualizar pessoa",
          detalhes: validationResult.errors,
        });
      }

      // Não permitir alteração do tipoPessoa
      if (
        dadosPessoa.tipoPessoa &&
        dadosPessoa.tipoPessoa !== pessoaExistente.tipoPessoa
      ) {
        return res.status(400).json({
          erro: "Não é possível alterar o tipo de pessoa (FISICA/JURIDICA)",
        });
      }

      // Atualizar usando transação
      const result = await prisma.$transaction(async (tx) => {
        // Atualizar dados da pessoa base
        const pessoaAtualizada = await tx.pessoa.update({
          where: { id: Number(id) },
          data: dadosPessoa,
        });

        // Atualizar dados específicos conforme o tipo
        if (pessoaExistente.tipoPessoa === "FISICA" && pessoaFisica) {
          // Converter datas antes de salvar
          const dadosPF = convertPessoaDateFields({ ...pessoaFisica });

          await tx.pessoaFisica.update({
            where: { id: Number(id) },
            data: dadosPF,
          });
        } else if (
          pessoaExistente.tipoPessoa === "JURIDICA" &&
          pessoaJuridica
        ) {
          // Converter datas antes de salvar
          const dadosPJ = convertPessoaDateFields({ ...pessoaJuridica });

          await tx.pessoaJuridica.update({
            where: { id: Number(id) },
            data: dadosPJ,
          });
        }

        return pessoaAtualizada;
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao atualizar pessoa:", error);
      return res.status(500).json({
        erro: "Erro ao atualizar pessoa",
        detalhes: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  },

  // Buscar pessoa por CPF/CNPJ
  findByCpfCnpj: async (req: Request, res: Response) => {
    try {
      const { cpfCnpj } = req.params;

      const pessoa = await prisma.pessoa.findUnique({
        where: { cpfCnpj },
        include: {
          pessoaFisica: true,
          pessoaJuridica: true,
        },
      });

      if (!pessoa) {
        return res.status(404).json({ erro: "Pessoa não encontrada" });
      }

      return res.status(200).json(pessoa);
    } catch (error) {
      console.error("Erro ao buscar pessoa por CPF/CNPJ:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao buscar pessoa por CPF/CNPJ" });
    }
  },

  // Listar pessoas com endereços
  findAllWithEnderecos: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.query;
      const whereClause: any = {};

      if (tipo) {
        whereClause.tipoPessoa = tipo;
      }

      const pessoas = await prisma.pessoa.findMany({
        where: whereClause,
        include: {
          enderecos: true,
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(pessoas);
    } catch (error) {
      console.error("Erro ao listar pessoas com endereços:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao listar pessoas com endereços" });
    }
  },

  // Buscar pessoa por ID com todas as relações
  findByIdWithDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const pessoa = await prisma.pessoa.findUnique({
        where: { id: Number(id) },
        include: {
          enderecos: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
              propriedade: true,
            },
          },
          propriedades: true,
          pessoaFisica: true,
          pessoaJuridica: true,
        },
      });

      if (!pessoa) {
        return res.status(404).json({ erro: "Pessoa não encontrada" });
      }

      return res.status(200).json(pessoa);
    } catch (error) {
      console.error("Erro ao buscar detalhes da pessoa:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao buscar detalhes da pessoa" });
    }
  },

  // Listar pessoas por tipo (FISICA ou JURIDICA)
  findByTipo: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.params;

      if (!Object.values(TipoPessoa).includes(tipo as TipoPessoa)) {
        return res.status(400).json({ erro: "Tipo de pessoa inválido" });
      }

      const pessoas = await prisma.pessoa.findMany({
        where: {
          tipoPessoa: tipo as TipoPessoa,
        },
        include: {
          pessoaFisica: tipo === "FISICA",
          pessoaJuridica: tipo === "JURIDICA",
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(pessoas);
    } catch (error) {
      console.error("Erro ao listar pessoas por tipo:", error);
      return res.status(500).json({ erro: "Erro ao listar pessoas por tipo" });
    }
  },

  findProdutores: async (req: Request, res: Response) => {
    try {
      console.log("11111111111111111111");
      const registros = await prisma.pessoa.findMany({
        where: { isProdutor: true },
      });

      return res.status(200).json(registros);
    } catch (error) {
      console.error("Erro ao listar produtores", error);
      return res.status(500).json({ erro: "Erro ao listar produtores" });
    }
  },

  updateAreaEfetiva: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const areaEfetiva = req.body;

      // Verificar se produtor existe
      const produtorExistente = await prisma.produtor.findUnique({
        where: { id: Number(id) },
        include: { areaEfetiva: true },
      });

      if (!produtorExistente) {
        return res.status(404).json({ erro: "Produtor não encontrado" });
      }

      const areaEfetivaCalculada = calcularAreaEfetiva(areaEfetiva);

      let result;

      if (produtorExistente.areaEfetiva) {
        // Atualizar área efetiva existente
        result = await prisma.areaEfetiva.update({
          where: { id: Number(id) },
          data: {
            ...areaEfetiva,
            areaEfetiva: areaEfetivaCalculada,
          },
        });
      } else {
        // Criar nova área efetiva
        result = await prisma.areaEfetiva.create({
          data: {
            id: Number(id),
            ...areaEfetiva,
            areaEfetiva: areaEfetivaCalculada,
          },
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao atualizar área efetiva:", error);
      return res.status(500).json({ erro: "Erro ao atualizar área efetiva" });
    }
  },
};
