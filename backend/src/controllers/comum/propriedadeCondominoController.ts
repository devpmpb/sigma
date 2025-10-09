// backend/src/controllers/comum/propriedadeCondominoController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const propriedadeCondominoController = {
  /**
   * Adicionar condômino a uma propriedade
   * POST /api/comum/propriedades/:propriedadeId/condominos
   */
  addCondomino: async (req: Request, res: Response) => {
    try {
      const { propriedadeId } = req.params;
      const { condominoId, percentual, observacoes } = req.body;

      // Validações
      if (!condominoId) {
        return res.status(400).json({ erro: "Condômino é obrigatório" });
      }

      // Verificar se propriedade existe e é do tipo CONDOMINIO
      const propriedade = await prisma.propriedade.findUnique({
        where: { id: Number(propriedadeId) },
      });

      if (!propriedade) {
        return res.status(404).json({ erro: "Propriedade não encontrada" });
      }

      if (propriedade.situacao !== "CONDOMINIO") {
        return res.status(400).json({
          erro: "Apenas propriedades com situação CONDOMÍNIO podem ter condôminos",
        });
      }

      // Verificar se pessoa existe
      const pessoa = await prisma.pessoa.findUnique({
        where: { id: Number(condominoId) },
      });

      if (!pessoa) {
        return res.status(404).json({ erro: "Pessoa não encontrada" });
      }

      // Verificar se já é condômino ativo
      const condominoExistente = await prisma.propriedadeCondomino.findFirst({
        where: {
          propriedadeId: Number(propriedadeId),
          condominoId: Number(condominoId),
          dataFim: null, // Condomínio ativo
        },
      });

      if (condominoExistente) {
        return res.status(400).json({
          erro: "Esta pessoa já é condômina desta propriedade",
        });
      }

      // Criar condômino
      const condomino = await prisma.propriedadeCondomino.create({
        data: {
          propriedadeId: Number(propriedadeId),
          condominoId: Number(condominoId),
          percentual: percentual ? Number(percentual) : null,
          observacoes,
        },
        include: {
          condomino: true,
          propriedade: true,
        },
      });

      return res.status(201).json(condomino);
    } catch (error) {
      console.error("Erro ao adicionar condômino:", error);
      return res.status(500).json({
        erro: "Erro ao adicionar condômino",
      });
    }
  },

  /**
   * Listar condôminos de uma propriedade
   * GET /api/comum/propriedades/:propriedadeId/condominos
   */
  getCondominos: async (req: Request, res: Response) => {
    try {
      const { propriedadeId } = req.params;
      const { ativos } = req.query;

      const where: any = {
        propriedadeId: Number(propriedadeId),
      };

      // Se ativos=true, buscar apenas condôminos ativos
      if (ativos === "true") {
        where.dataFim = null;
      }

      const condominos = await prisma.propriedadeCondomino.findMany({
        where,
        include: {
          condomino: true,
        },
        orderBy: { dataInicio: "desc" },
      });

      return res.status(200).json(condominos);
    } catch (error) {
      console.error("Erro ao buscar condôminos:", error);
      return res.status(500).json({
        erro: "Erro ao buscar condôminos",
      });
    }
  },

  /**
   * Remover condômino (marcar dataFim)
   * DELETE /api/comum/propriedades/:propriedadeId/condominos/:condominoId
   */
  removeCondomino: async (req: Request, res: Response) => {
    try {
      const { propriedadeId, condominoId } = req.params;

      // Buscar condômino ativo
      const condomino = await prisma.propriedadeCondomino.findFirst({
        where: {
          propriedadeId: Number(propriedadeId),
          condominoId: Number(condominoId),
          dataFim: null,
        },
      });

      if (!condomino) {
        return res.status(404).json({
          erro: "Condômino não encontrado ou já removido",
        });
      }

      // Marcar data fim
      const condominoAtualizado = await prisma.propriedadeCondomino.update({
        where: { id: condomino.id },
        data: { dataFim: new Date() },
        include: {
          condomino: true,
        },
      });

      return res.status(200).json(condominoAtualizado);
    } catch (error) {
      console.error("Erro ao remover condômino:", error);
      return res.status(500).json({
        erro: "Erro ao remover condômino",
      });
    }
  },

  /**
   * Atualizar percentual de condômino
   * PATCH /api/comum/propriedades/:propriedadeId/condominos/:id
   */
  updateCondomino: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { percentual, observacoes } = req.body;

      const condomino = await prisma.propriedadeCondomino.update({
        where: { id: Number(id) },
        data: {
          percentual: percentual ? Number(percentual) : null,
          observacoes,
        },
        include: {
          condomino: true,
        },
      });

      return res.status(200).json(condomino);
    } catch (error) {
      console.error("Erro ao atualizar condômino:", error);
      return res.status(500).json({
        erro: "Erro ao atualizar condômino",
      });
    }
  },
};