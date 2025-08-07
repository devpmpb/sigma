import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

const genericController = createGenericController({
  modelName: "tipoVeiculo",
  displayName: "Tipo de Veículo",
  uniqueField: "descricao",
  softDelete: true,
  orderBy: { descricao: "asc" },
});

export const tipoVeiculoController = {
  ...genericController,

  // Método para buscar tipos de veículo ativos
  findAtivos: async (req: Request, res: Response) => {
    try {
      const tiposVeiculo = await prisma.tipoVeiculo.findMany({
        where: { ativo: true },
        orderBy: { descricao: "asc" },
      });

      return res.status(200).json(tiposVeiculo);
    } catch (error) {
      console.error("Erro ao listar tipos de veículo ativos:", error);
      return res.status(500).json({
        erro: "Erro ao listar tipos de veículo ativos",
      });
    }
  },
};