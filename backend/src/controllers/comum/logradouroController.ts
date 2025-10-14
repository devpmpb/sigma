import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { TipoLogradouro } from "@prisma/client";
import { createGenericController } from "../GenericController";

const genericController = createGenericController({
  modelName: "logradouro",
  displayName: "Logradouro",
  orderBy: { tipo: "asc", descricao: "asc" },
});

export const logradouroController = {
  ...genericController,

  findAll: async (req: Request, res: Response) => {
    try {
      const logradouros = await prisma.logradouro.findMany({
        orderBy: [{ tipo: "asc" }, { descricao: "asc" }],
      });

      return res.status(200).json(logradouros);
    } catch (error) {
      console.error("Erro ao listar logradouros:", error);
      return res.status(500).json({
        erro: "Erro ao listar logradouros",
      });
    }
  },

  // Buscar logradouros ativos
  findAtivos: async (req: Request, res: Response) => {
    try {
      const logradouros = await prisma.logradouro.findMany({
        where: { ativo: true },
        orderBy: [{ tipo: "asc" }, { descricao: "asc" }],
      });

      return res.status(200).json(logradouros);
    } catch (error) {
      console.error("Erro ao listar logradouros ativos:", error);
      return res.status(500).json({
        erro: "Erro ao listar logradouros ativos",
      });
    }
  },
};
