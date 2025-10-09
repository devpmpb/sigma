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

  transferirCondomino: async (req: Request, res: Response) => {
    try {
      const { propriedadeId } = req.params;
      const {
        condominoSaiId,
        condominoEntraId,
        dataTransferencia,
        observacoes,
      } = req.body;

      // Validações
      if (!condominoSaiId || !condominoEntraId) {
        return res.status(400).json({
          erro: "Condômino que sai e condômino que entra são obrigatórios",
        });
      }

      if (condominoSaiId === condominoEntraId) {
        return res.status(400).json({
          erro: "Condômino que sai deve ser diferente do que entra",
        });
      }

      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Verificar se propriedade existe e é CONDOMINIO
        const propriedade = await tx.propriedade.findUnique({
          where: { id: Number(propriedadeId) },
        });

        if (!propriedade) {
          throw new Error("Propriedade não encontrada");
        }

        if (propriedade.situacao !== "CONDOMINIO") {
          throw new Error(
            "Apenas propriedades em condomínio permitem transferência entre condôminos"
          );
        }

        // 2. Verificar se condômino que sai existe e está ativo
        const condominoAtual = await tx.propriedadeCondomino.findFirst({
          where: {
            propriedadeId: Number(propriedadeId),
            condominoId: Number(condominoSaiId),
            dataFim: null,
          },
          include: {
            condomino: true,
          },
        });

        if (!condominoAtual) {
          throw new Error("Condômino que sai não encontrado ou já inativo");
        }

        // 3. Verificar se nova pessoa existe
        const novaPessoa = await tx.pessoa.findUnique({
          where: { id: Number(condominoEntraId) },
        });

        if (!novaPessoa) {
          throw new Error("Pessoa que entra não encontrada");
        }

        // 4. Verificar se nova pessoa já não é condômina ativa
        const jaCondomino = await tx.propriedadeCondomino.findFirst({
          where: {
            propriedadeId: Number(propriedadeId),
            condominoId: Number(condominoEntraId),
            dataFim: null,
          },
        });

        if (jaCondomino) {
          throw new Error(
            "A pessoa que entra já é condômina desta propriedade"
          );
        }

        // 5. Remover condômino atual (marcar data fim)
        const dataFim = dataTransferencia
          ? new Date(dataTransferencia)
          : new Date();

        await tx.propriedadeCondomino.update({
          where: { id: condominoAtual.id },
          data: {
            dataFim,
            observacoes: observacoes
              ? `${condominoAtual.observacoes || ""}\nTransferido para ${novaPessoa.nome} em ${dataFim.toLocaleDateString()}: ${observacoes}`.trim()
              : condominoAtual.observacoes,
          },
        });

        // 6. Adicionar novo condômino com mesmos dados
        const novoCondomino = await tx.propriedadeCondomino.create({
          data: {
            propriedadeId: Number(propriedadeId),
            condominoId: Number(condominoEntraId),
            percentual: condominoAtual.percentual, // Mantém mesmo percentual
            dataInicio: dataFim, // Data início = data saída do anterior
            observacoes: observacoes
              ? `Recebido de ${condominoAtual.condomino.nome}: ${observacoes}`
              : `Recebido de ${condominoAtual.condomino.nome}`,
          },
          include: {
            condomino: true,
          },
        });

        return {
          condominoRemovido: condominoAtual,
          condominoAdicionado: novoCondomino,
        };
      });

      return res.status(200).json({
        mensagem: "Transferência entre condôminos realizada com sucesso",
        ...resultado,
      });
    } catch (error: any) {
      console.error("Erro ao transferir entre condôminos:", error);

      if (
        error.message.includes("não encontrada") ||
        error.message.includes("não encontrado") ||
        error.message.includes("Apenas propriedades") ||
        error.message.includes("já é condômina")
      ) {
        return res.status(400).json({ erro: error.message });
      }

      return res.status(500).json({
        erro: "Erro ao transferir entre condôminos",
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
