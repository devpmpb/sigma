// backend/src/controllers/comum/areaRuralController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

// Controlador genérico base
const genericController = createGenericController("areaRural", {
  findOptions: {
    orderBy: { nome: "asc" },
  },
  searchConfig: {
    searchableFields: ["nome"],
  },
  validate: (data: any) => {
    const errors: string[] = [];

    if (!data.nome) {
      errors.push("Nome da área rural é obrigatório");
    }

    if (data.nome && data.nome.length < 3) {
      errors.push("Nome da área rural deve ter pelo menos 3 caracteres");
    }

    if (data.nome && data.nome.length > 100) {
      errors.push("Nome da área rural não pode ter mais de 100 caracteres");
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// Controlador com métodos específicos para AreaRural
export const areaRuralController = {
  ...genericController,

  // Buscar áreas rurais ativas
  findAtivas: async (req: Request, res: Response) => {
    try {
      const areasRurais = await prisma.areaRural.findMany({
        where: {
          ativo: true,
        },
        orderBy: {
          nome: "asc",
        },
      });

      return res.status(200).json(areasRurais);
    } catch (error) {
      console.error("Erro ao buscar áreas rurais ativas:", error);
      return res.status(500).json({
        erro: "Erro ao buscar áreas rurais ativas",
      });
    }
  },

  // Buscar área rural por nome
  findByNome: async (req: Request, res: Response) => {
    try {
      const { nome } = req.query;

      if (!nome || typeof nome !== "string") {
        return res.status(400).json({ erro: "Nome é obrigatório" });
      }

      const areaRural = await prisma.areaRural.findFirst({
        where: {
          nome: {
            equals: nome,
            mode: "insensitive",
          },
        },
      });

      if (!areaRural) {
        return res.status(404).json({ erro: "Área rural não encontrada" });
      }

      return res.status(200).json(areaRural);
    } catch (error) {
      console.error("Erro ao buscar área rural por nome:", error);
      return res.status(500).json({
        erro: "Erro ao buscar área rural",
      });
    }
  },
};
