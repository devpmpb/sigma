// src/controllers/GenericController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interface para opções de configuração do controlador
interface GenericControllerOptions<T> {
  modelName: string; // Nome do modelo no Prisma (ex: 'bairro')
  displayName: string; // Nome amigável para mensagens (ex: 'Bairro')
  uniqueField?: string; // Campo único para verificação de duplicidade (ex: 'nome')
  softDelete?: boolean; // Se deve usar soft delete (desativar em vez de excluir)
  orderBy?: { [key: string]: "asc" | "desc" }; // Ordenação padrão
  // Funções de validação opcionais
  validateCreate?: (data: any) => { isValid: boolean; errors?: string[] };
  validateUpdate?: (data: any) => { isValid: boolean; errors?: string[] };
}

export function createGenericController<T>(
  options: GenericControllerOptions<T>
) {
  return {
    // Listar todos os registros
    listar: async (req: Request, res: Response) => {
      try {
        const { ativo } = req.query;
        const whereClause: any = {};

        // Filtrar por status ativo/inativo se o parâmetro for fornecido
        if (options.softDelete && ativo !== undefined) {
          whereClause.ativo = ativo === "true";
        }

        const registros = await (prisma as any)[options.modelName].findMany({
          where: whereClause,
          orderBy: options.orderBy || { id: "asc" },
        });

        return res.status(200).json(registros);
      } catch (error) {
        console.error(
          `Erro ao listar ${options.displayName.toLowerCase()}s:`,
          error
        );
        return res.status(500).json({
          erro: `Erro ao listar ${options.displayName.toLowerCase()}s`,
        });
      }
    },

    // Buscar registro por ID
    buscarPorId: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const registro = await (prisma as any)[options.modelName].findUnique({
          where: { id: Number(id) },
        });

        if (!registro) {
          return res
            .status(404)
            .json({ erro: `${options.displayName} não encontrado` });
        }

        return res.status(200).json(registro);
      } catch (error) {
        console.error(
          `Erro ao buscar ${options.displayName.toLowerCase()}:`,
          error
        );
        return res.status(500).json({
          erro: `Erro ao buscar ${options.displayName.toLowerCase()}`,
        });
      }
    },

    // Criar novo registro
    criar: async (req: Request, res: Response) => {
      try {
        const data = req.body;

        // Validação customizada
        if (options.validateCreate) {
          const validationResult = options.validateCreate(data);
          if (!validationResult.isValid) {
            return res.status(400).json({
              erro: `Dados inválidos para criar ${options.displayName.toLowerCase()}`,
              detalhes: validationResult.errors,
            });
          }
        }

        // Verificar duplicidade se tiver campo único
        if (options.uniqueField && data[options.uniqueField]) {
          const existente = await (prisma as any)[options.modelName].findFirst({
            where: {
              [options.uniqueField]: {
                equals: data[options.uniqueField],
                mode: "insensitive",
              },
            },
          });

          if (existente) {
            return res.status(400).json({
              erro: `Já existe um ${options.displayName.toLowerCase()} com este ${
                options.uniqueField
              }`,
            });
          }
        }

        const novoRegistro = await (prisma as any)[options.modelName].create({
          data,
        });

        return res.status(201).json(novoRegistro);
      } catch (error) {
        console.error(
          `Erro ao criar ${options.displayName.toLowerCase()}:`,
          error
        );
        return res
          .status(500)
          .json({ erro: `Erro ao criar ${options.displayName.toLowerCase()}` });
      }
    },

    // Atualizar registro
    update: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const data = req.body;

        // Validação customizada
        if (options.validateUpdate) {
          const validationResult = options.validateUpdate(data);
          if (!validationResult.isValid) {
            return res.status(400).json({
              erro: `Dados inválidos para atualizar ${options.displayName.toLowerCase()}`,
              detalhes: validationResult.errors,
            });
          }
        }

        // Verificar se registro existe
        const existente = await (prisma as any)[options.modelName].findUnique({
          where: { id: Number(id) },
        });

        if (!existente) {
          return res
            .status(404)
            .json({ erro: `${options.displayName} não encontrado` });
        }

        // Verificar duplicidade se tiver campo único
        if (options.uniqueField && data[options.uniqueField]) {
          const duplicado = await (prisma as any)[options.modelName].findFirst({
            where: {
              [options.uniqueField]: {
                equals: data[options.uniqueField],
                mode: "insensitive",
              },
              id: { not: Number(id) },
            },
          });

          if (duplicado) {
            return res.status(400).json({
              erro: `Já existe outro ${options.displayName.toLowerCase()} com este ${
                options.uniqueField
              }`,
            });
          }
        }

        const registroAtualizado = await (prisma as any)[
          options.modelName
        ].update({
          where: { id: Number(id) },
          data,
        });

        return res.status(200).json(registroAtualizado);
      } catch (error) {
        console.error(
          `Erro ao atualizar ${options.displayName.toLowerCase()}:`,
          error
        );
        return res.status(500).json({
          erro: `Erro ao atualizar ${options.displayName.toLowerCase()}`,
        });
      }
    },

    status: async (req: Request, res: Response) => {
      try {
        if (!options.softDelete) {
          return res.status(405).json({ erro: "Método não permitido" });
        }

        const { id } = req.params;

        // Verificar se registro existe
        const registro = await (prisma as any)[options.modelName].findUnique({
          where: { id: Number(id) },
        });

        if (!registro) {
          return res
            .status(404)
            .json({ erro: `${options.displayName} não encontrado` });
        }

        await (prisma as any)[options.modelName].update({
          where: { id: Number(id) },
          data: { ativo: !registro.ativo },
        });

        return res
          .status(200)
          .json({ mensagem: `${options.displayName} desativado com sucesso` });
      } catch (error) {
        console.error(
          `Erro ao desativar ${options.displayName.toLowerCase()}:`,
          error
        );
        return res.status(500).json({
          erro: `Erro ao desativar ${options.displayName.toLowerCase()}`,
        });
      }
    },

    // Desativar registro (soft delete)
    desativar: async (req: Request, res: Response) => {
      try {
        if (!options.softDelete) {
          return res.status(405).json({ erro: "Método não permitido" });
        }

        const { id } = req.params;

        // Verificar se registro existe
        const registro = await (prisma as any)[options.modelName].findUnique({
          where: { id: Number(id) },
        });

        if (!registro) {
          return res
            .status(404)
            .json({ erro: `${options.displayName} não encontrado` });
        }

        await (prisma as any)[options.modelName].update({
          where: { id: Number(id) },
          data: { ativo: false },
        });

        return res
          .status(200)
          .json({ mensagem: `${options.displayName} desativado com sucesso` });
      } catch (error) {
        console.error(
          `Erro ao desativar ${options.displayName.toLowerCase()}:`,
          error
        );
        return res.status(500).json({
          erro: `Erro ao desativar ${options.displayName.toLowerCase()}`,
        });
      }
    },

    // Excluir registro (hard delete)
    excluir: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        // Verificar se registro existe
        const registro = await (prisma as any)[options.modelName].findUnique({
          where: { id: Number(id) },
        });

        if (!registro) {
          return res
            .status(404)
            .json({ erro: `${options.displayName} não encontrado` });
        }

        await (prisma as any)[options.modelName].delete({
          where: { id: Number(id) },
        });

        return res
          .status(200)
          .json({ mensagem: `${options.displayName} excluído com sucesso` });
      } catch (error) {
        console.error(
          `Erro ao excluir ${options.displayName.toLowerCase()}:`,
          error
        );

        // Verificar se é erro de integridade referencial
        if ((error as any).code === "P2003") {
          return res.status(400).json({
            erro: `Não é possível excluir este ${options.displayName.toLowerCase()} pois está sendo utilizado em outros registros`,
          });
        }

        return res.status(500).json({
          erro: `Erro ao excluir ${options.displayName.toLowerCase()}`,
        });
      }
    },
  };
}
