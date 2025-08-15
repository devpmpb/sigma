// backend/src/controllers/comum/pessoaController.ts - VERSÃO ATUALIZADA
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

  // 🆕 Validação para produtor rural
  if (data.produtorRural === true) {
    if (!data.inscricaoEstadual || data.inscricaoEstadual.trim() === "") {
      errors.push("Inscrição estadual é obrigatória para produtores rurais");
    }
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

  // 🆕 Validação para produtor rural na atualização
  if (data.produtorRural === true) {
    if (!data.inscricaoEstadual || data.inscricaoEstadual.trim() === "") {
      errors.push("Inscrição estadual é obrigatória para produtores rurais");
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
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

  // 🆕 Sobrescrever findAll para incluir informação de produtor rural
  findAll: async (req: Request, res: Response) => {
    try {
      const pessoas = await prisma.pessoa.findMany({
        include: {
          pessoaFisica: true,
          pessoaJuridica: true,
          areaEfetiva: true, // 🆕 Incluir área efetiva
        },
        orderBy: { nome: "asc" },
      });

      // Transformar dados para o formato esperado pelo frontend
      const pessoasFormatadas = pessoas.map((pessoa) => ({
        ...pessoa,
        // Adicionar flag para facilitar identificação no frontend
        isProdutor: pessoa.produtorRural,
        // Incluir dados de área efetiva se for produtor
        ...(pessoa.produtorRural && pessoa.areaEfetiva && {
          areaEfetivaData: pessoa.areaEfetiva
        })
      }));

      return res.status(200).json(pessoasFormatadas);
    } catch (error) {
      console.error("Erro ao listar pessoas:", error);
      return res.status(500).json({ erro: "Erro ao listar pessoas" });
    }
  },

  // Sobrescrever o método create para lidar com PessoaFisica, PessoaJuridica e AreaEfetiva
  create: async (req: Request, res: Response) => {
    try {
      const { 
        tipoPessoa, 
        pessoaFisica, 
        pessoaJuridica, 
        areaEfetiva,
        produtorRural,
        inscricaoEstadual,
        ...dadosPessoa 
      } = req.body;

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

      // 🆕 Verificação para produtor rural
      if (produtorRural && !inscricaoEstadual) {
        return res.status(400).json({
          erro: "Inscrição estadual é obrigatória para produtores rurais",
        });
      }

      // Validação usando função existente
      const validation = validatePessoaCreate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: validation.errors,
        });
      }

      // Transação para criar pessoa com dados relacionados
      const result = await prisma.$transaction(async (tx) => {
        // 1. Criar pessoa principal
        const pessoa = await tx.pessoa.create({
          data: {
            ...dadosPessoa,
            tipoPessoa,
            produtorRural: produtorRural || false,
            inscricaoEstadual: produtorRural ? inscricaoEstadual : null,
          },
        });

        // 2. Criar dados específicos baseado no tipo
        if (tipoPessoa === "FISICA") {
          await tx.pessoaFisica.create({
            data: {
              id: pessoa.id,
              ...pessoaFisica,
              dataNascimento: pessoaFisica.dataNascimento 
                ? new Date(pessoaFisica.dataNascimento) 
                : null,
            },
          });
        } else {
          await tx.pessoaJuridica.create({
            data: {
              id: pessoa.id,
              ...pessoaJuridica,
              dataFundacao: pessoaJuridica.dataFundacao 
                ? new Date(pessoaJuridica.dataFundacao) 
                : null,
            },
          });
        }

        // 3. 🆕 Criar área efetiva se for produtor rural e dados fornecidos
        if (produtorRural && areaEfetiva) {
          await tx.areaEfetiva.create({
            data: {
              pessoaId: pessoa.id,
              anoReferencia: areaEfetiva.anoReferencia || new Date().getFullYear(),
              areaPropria: areaEfetiva.areaPropria || 0,
              areaArrendadaRecebida: areaEfetiva.areaArrendadaRecebida || 0,
              areaArrendadaCedida: areaEfetiva.areaArrendadaCedida || 0,
              areaEfetiva: areaEfetiva.areaEfetiva || 0,
            },
          });
        }

        return pessoa;
      });

      // Buscar pessoa criada com relacionamentos
      const pessoaCriada = await prisma.pessoa.findUnique({
        where: { id: result.id },
        include: {
          pessoaFisica: true,
          pessoaJuridica: true,
          areaEfetiva: true,
        },
      });

      return res.status(201).json(pessoaCriada);
    } catch (error: any) {
      console.error("Erro ao criar pessoa:", error);
      
      if (error.code === "P2002") {
        return res.status(400).json({
          erro: "CPF/CNPJ já existe no sistema",
        });
      }

      return res.status(500).json({
        erro: "Erro ao criar pessoa",
      });
    }
  },

  // Sobrescrever update para lidar com novos campos
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { 
        tipoPessoa, 
        pessoaFisica, 
        pessoaJuridica, 
        areaEfetiva,
        produtorRural,
        inscricaoEstadual,
        ...dadosPessoa 
      } = req.body;

      // Validação
      const validation = validatePessoaUpdate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: validation.errors,
        });
      }

      // Transação para atualizar pessoa
      const result = await prisma.$transaction(async (tx) => {
        // 1. Atualizar pessoa principal
        const pessoa = await tx.pessoa.update({
          where: { id: Number(id) },
          data: {
            ...dadosPessoa,
            produtorRural: produtorRural !== undefined ? produtorRural : undefined,
            inscricaoEstadual: produtorRural ? inscricaoEstadual : null,
          },
        });

        // 2. Atualizar dados específicos
        if (tipoPessoa === "FISICA" && pessoaFisica) {
          await tx.pessoaFisica.upsert({
            where: { id: Number(id) },
            update: {
              ...pessoaFisica,
              dataNascimento: pessoaFisica.dataNascimento 
                ? new Date(pessoaFisica.dataNascimento) 
                : null,
            },
            create: {
              id: Number(id),
              ...pessoaFisica,
              dataNascimento: pessoaFisica.dataNascimento 
                ? new Date(pessoaFisica.dataNascimento) 
                : null,
            },
          });
        }

        if (tipoPessoa === "JURIDICA" && pessoaJuridica) {
          await tx.pessoaJuridica.upsert({
            where: { id: Number(id) },
            update: {
              ...pessoaJuridica,
              dataFundacao: pessoaJuridica.dataFundacao 
                ? new Date(pessoaJuridica.dataFundacao) 
                : null,
            },
            create: {
              id: Number(id),
              ...pessoaJuridica,
              dataFundacao: pessoaJuridica.dataFundacao 
                ? new Date(pessoaJuridica.dataFundacao) 
                : null,
            },
          });
        }

        // 3. 🆕 Gerenciar área efetiva
        if (produtorRural && areaEfetiva) {
          await tx.areaEfetiva.upsert({
            where: { pessoaId: Number(id) },
            update: {
              anoReferencia: areaEfetiva.anoReferencia,
              areaPropria: areaEfetiva.areaPropria,
              areaArrendadaRecebida: areaEfetiva.areaArrendadaRecebida,
              areaArrendadaCedida: areaEfetiva.areaArrendadaCedida,
              areaEfetiva: areaEfetiva.areaEfetiva,
            },
            create: {
              pessoaId: Number(id),
              anoReferencia: areaEfetiva.anoReferencia || new Date().getFullYear(),
              areaPropria: areaEfetiva.areaPropria || 0,
              areaArrendadaRecebida: areaEfetiva.areaArrendadaRecebida || 0,
              areaArrendadaCedida: areaEfetiva.areaArrendadaCedida || 0,
              areaEfetiva: areaEfetiva.areaEfetiva || 0,
            },
          });
        } else if (!produtorRural) {
          // Se não é mais produtor rural, remover área efetiva
          await tx.areaEfetiva.deleteMany({
            where: { pessoaId: Number(id) },
          });
        }

        return pessoa;
      });

      // Buscar pessoa atualizada
      const pessoaAtualizada = await prisma.pessoa.findUnique({
        where: { id: Number(id) },
        include: {
          pessoaFisica: true,
          pessoaJuridica: true,
          areaEfetiva: true,
        },
      });

      return res.status(200).json(pessoaAtualizada);
    } catch (error: any) {
      console.error("Erro ao atualizar pessoa:", error);
      
      if (error.code === "P2002") {
        return res.status(400).json({
          erro: "CPF/CNPJ já existe no sistema",
        });
      }

      return res.status(500).json({
        erro: "Erro ao atualizar pessoa",
      });
    }
  },

  // Sobrescrever findById para incluir área efetiva
  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const pessoa = await prisma.pessoa.findUnique({
        where: { id: Number(id) },
        include: {
          pessoaFisica: true,
          pessoaJuridica: true,
          areaEfetiva: true, // 🆕 Incluir área efetiva
          enderecos: {
            include: {
              bairro: true,
              logradouro: true,
              areaRural: true,
            },
          },
        },
      });

      if (!pessoa) {
        return res.status(404).json({ erro: "Pessoa não encontrada" });
      }

      // Transformar datas para o formato adequado
      const pessoaFormatada = convertPessoaDateFields(pessoa);
      
      return res.status(200).json(pessoaFormatada);
    } catch (error) {
      console.error("Erro ao buscar detalhes da pessoa:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao buscar detalhes da pessoa" });
    }
  },

  // Listar pessoas por tipo (mantido, mas com área efetiva)
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
          areaEfetiva: true, // 🆕 Incluir área efetiva
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(pessoas);
    } catch (error) {
      console.error("Erro ao listar pessoas por tipo:", error);
      return res.status(500).json({ erro: "Erro ao listar pessoas por tipo" });
    }
  },

  // 🆕 NOVO MÉTODO: Listar apenas produtores rurais
  findProdutoresRurais: async (req: Request, res: Response) => {
    try {
      const produtores = await prisma.pessoa.findMany({
        where: {
          produtorRural: true,
          ativo: true,
        },
        include: {
          pessoaFisica: true,
          pessoaJuridica: true,
          areaEfetiva: true,
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(produtores);
    } catch (error) {
      console.error("Erro ao listar produtores rurais:", error);
      return res.status(500).json({ erro: "Erro ao listar produtores rurais" });
    }
  },

  // 🆕 NOVO MÉTODO: Buscar pessoa com detalhes de área efetiva
  findWithAreaEfetiva: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const pessoa = await prisma.pessoa.findUnique({
        where: { 
          id: Number(id),
          produtorRural: true 
        },
        include: {
          pessoaFisica: true,
          pessoaJuridica: true,
          areaEfetiva: true,
        },
      });

      if (!pessoa) {
        return res.status(404).json({ 
          erro: "Produtor rural não encontrado" 
        });
      }

      return res.status(200).json(pessoa);
    } catch (error) {
      console.error("Erro ao buscar produtor com área efetiva:", error);
      return res.status(500).json({ 
        erro: "Erro ao buscar produtor com área efetiva" 
      });
    }
  },
};