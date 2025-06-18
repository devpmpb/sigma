// src/controllers/comum/propriedadeController.ts
import { Request, Response } from "express";
import { PrismaClient, TipoPropriedade } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

// Controlador com os métodos genéricos
const genericController = createGenericController({
  modelName: "propriedade",
  displayName: "Propriedade",
  orderBy: { nome: "asc" },
  validateCreate: (data: any) => {
    const errors = [];

    if (!data.nome || data.nome.trim() === "") {
      errors.push("Nome é obrigatório");
    }

    if (!data.areaTotal || isNaN(Number(data.areaTotal))) {
      errors.push("Área total é obrigatória e deve ser um número");
    }

    if (!data.proprietarioId) {
      errors.push("Proprietário é obrigatório");
    }

    if (
      data.tipoPropriedade &&
      !Object.values(TipoPropriedade).includes(data.tipoPropriedade)
    ) {
      errors.push("Tipo de propriedade inválido");
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// Controlador com métodos específicos para Propriedade
export const propriedadeController = {
  ...genericController,

  // Sobrescrever findAll para incluir dados do proprietário
  findAll: async (req: Request, res: Response) => {
    try {
      const propriedades = await prisma.propriedade.findMany({
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error("Erro ao listar propriedades:", error);
      return res.status(500).json({
        erro: "Erro ao listar propriedades",
      });
    }
  },

  // Sobrescrever findById para incluir dados do proprietário
  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const propriedade = await prisma.propriedade.findUnique({
        where: { id: Number(id) },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
        },
      });

      if (!propriedade) {
        return res.status(404).json({ erro: "Propriedade não encontrada" });
      }

      return res.status(200).json(propriedade);
    } catch (error) {
      console.error("Erro ao buscar propriedade:", error);
      return res.status(500).json({ erro: "Erro ao buscar propriedade" });
    }
  },

  // Buscar propriedades por proprietário
  findByProprietario: async (req: Request, res: Response) => {
    try {
      const { proprietarioId } = req.params;

      const propriedades = await prisma.propriedade.findMany({
        where: {
          proprietarioId: Number(proprietarioId),
        },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
        },
        orderBy: {
          nome: "asc",
        },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error("Erro ao buscar propriedades por proprietário:", error);
      return res.status(500).json({
        erro: "Erro ao buscar propriedades por proprietário",
      });
    }
  },

  // Buscar propriedades por tipo
  findByTipo: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.params;

      // Validar se o tipo é válido
      if (!Object.values(TipoPropriedade).includes(tipo as TipoPropriedade)) {
        return res.status(400).json({ erro: "Tipo de propriedade inválido" });
      }

      const propriedades = await prisma.propriedade.findMany({
        where: {
          tipoPropriedade: tipo as TipoPropriedade,
        },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
        },
        orderBy: {
          nome: "asc",
        },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error("Erro ao buscar propriedades por tipo:", error);
      return res.status(500).json({
        erro: "Erro ao buscar propriedades por tipo",
      });
    }
  },

  // Buscar propriedade com todos os detalhes
  findByIdWithDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const propriedade = await prisma.propriedade.findUnique({
        where: { id: Number(id) },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
              telefone: true,
              email: true,
            },
          },
          enderecos: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
            },
          },
          arrendamentos: {
            include: {
              arrendatario: {
                select: {
                  id: true,
                  pessoa: {
                    select: {
                      nome: true,
                      cpfCnpj: true,
                    },
                  },
                },
              },
              proprietario: {
                select: {
                  id: true,
                  pessoa: {
                    select: {
                      nome: true,
                      cpfCnpj: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!propriedade) {
        return res.status(404).json({ erro: "Propriedade não encontrada" });
      }

      return res.status(200).json(propriedade);
    } catch (error) {
      console.error("Erro ao buscar detalhes da propriedade:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao buscar detalhes da propriedade" });
    }
  },

  // Buscar propriedades com busca por termo
  buscarPorTermo: async (req: Request, res: Response) => {
    try {
      const { termo } = req.query;

      if (!termo) {
        return res.status(400).json({ erro: "Termo de busca é obrigatório" });
      }

      const propriedades = await prisma.propriedade.findMany({
        where: {
          OR: [
            {
              nome: {
                contains: termo as string,
                mode: "insensitive",
              },
            },
            {
              matricula: {
                contains: termo as string,
                mode: "insensitive",
              },
            },
            {
              localizacao: {
                contains: termo as string,
                mode: "insensitive",
              },
            },
            {
              proprietario: {
                nome: {
                  contains: termo as string,
                  mode: "insensitive",
                },
              },
            },
            {
              proprietario: {
                cpfCnpj: {
                  contains: termo as string,
                  mode: "insensitive",
                },
              },
            },
          ],
        },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error("Erro ao buscar propriedades por termo:", error);
      return res.status(500).json({
        erro: "Erro ao buscar propriedades",
      });
    }
  },
};
