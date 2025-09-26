import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

// Controlador com métodos genéricos
const genericController = createGenericController({
  modelName: "transferenciaPropriedade",
  displayName: "Transferência de Propriedade",
  orderBy: { dataTransferencia: "desc" },
  validateCreate: (data: any) => {
    const errors = [];

    if (!data.propriedadeId) {
      errors.push("Propriedade é obrigatória");
    }

    if (!data.proprietarioAnteriorId) {
      errors.push("Proprietário atual é obrigatório");
    }

    if (!data.proprietarioNovoId) {
      errors.push("Novo proprietário é obrigatório");
    }

    if (data.proprietarioAnteriorId === data.proprietarioNovoId) {
      errors.push("O novo proprietário deve ser diferente do atual");
    }

    if (!data.dataTransferencia) {
      errors.push("Data da transferência é obrigatória");
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// Controlador específico para Transferência de Propriedade
export const transferenciaPropiedadeController = {
  ...genericController,

  /**
   * Realizar transferência de propriedade
   * POST /api/comum/transferencias-propriedade/transferir
   */
  transferir: async (req: Request, res: Response) => {
    console.log("chegou aqui");
    try {
      const {
        propriedadeId,
        proprietarioAnteriorId,
        proprietarioNovoId,
        dataTransferencia,
        observacoes,
      } = req.body;

      // Usar transação para garantir consistência
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Buscar propriedade atual
        const propriedade = await tx.propriedade.findUnique({
          where: { id: Number(propriedadeId) },
          include: {
            proprietario: true,
          },
        });

        if (!propriedade) {
          throw new Error("Propriedade não encontrada");
        }

        // 2. Validar se o proprietário atual está correto
        if (propriedade.proprietarioId !== Number(proprietarioAnteriorId)) {
          throw new Error(
            "O proprietário informado não é o atual proprietário da propriedade"
          );
        }

        // 3. Validar se o novo proprietário é diferente
        if (Number(proprietarioAnteriorId) === Number(proprietarioNovoId)) {
          throw new Error("O novo proprietário deve ser diferente do atual");
        }

        // 4. Verificar se novo proprietário existe
        const novoProprietario = await tx.pessoa.findUnique({
          where: { id: Number(proprietarioNovoId) },
        });

        // 5. Criar registro de transferência
        const transferencia = await tx.transferenciaPropriedade.create({
          data: {
            propriedadeId: Number(propriedadeId),
            proprietarioAnteriorId: Number(proprietarioAnteriorId),
            proprietarioNovoId: Number(proprietarioNovoId),
            dataTransferencia: new Date(dataTransferencia),
            observacoes: observacoes || null,
          },
          include: {
            propriedade: true,
            proprietarioAnterior: true,
            proprietarioNovo: true,
          },
        });

        // 6. Atualizar proprietário da propriedade
        await tx.propriedade.update({
          where: { id: Number(propriedadeId) },
          data: {
            proprietarioId: Number(proprietarioNovoId),
            updatedAt: new Date(),
          },
        });

        return transferencia;
      });

      return res.status(201).json(resultado);
    } catch (error: any) {
      console.error("Erro ao realizar transferência:", error);

      // Tratar erros específicos
      if (
        error.message.includes("não encontrada") ||
        error.message.includes("não é o atual proprietário") ||
        error.message.includes("deve ser diferente")
      ) {
        return res.status(400).json({ erro: error.message });
      }

      return res.status(500).json({
        erro: "Erro interno do servidor ao realizar transferência",
      });
    }
  },

  /**
   * Buscar histórico de transferências de uma propriedade
   * GET /api/comum/transferencias-propriedade/historico/:propriedadeId
   */
  getHistorico: async (req: Request, res: Response) => {
    try {
      const { propriedadeId } = req.params;

      const transferencias = await prisma.transferenciaPropriedade.findMany({
        where: { propriedadeId: Number(propriedadeId) },
        include: {
          proprietarioAnterior: true,
          proprietarioNovo: true,
        },
        orderBy: { dataTransferencia: "desc" },
      });

      return res.status(200).json(transferencias);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return res.status(500).json({
        erro: "Erro ao buscar histórico de transferências",
      });
    }
  },

  teste: async (req: Request, res: Response) => {
    try {
      return res.json({ message: "Rota de transferência OK!" });
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return res.status(500).json({
        erro: "Erro ao buscar histórico de transferências",
      });
    }
  },

  /**
   * Buscar transferências por propriedade
   * GET /api/comum/transferencias-propriedade/propriedade/:propriedadeId
   */
  getByPropriedade: async (req: Request, res: Response) => {
    try {
      const { propriedadeId } = req.params;

      const transferencias = await prisma.transferenciaPropriedade.findMany({
        where: { propriedadeId: Number(propriedadeId) },
        include: {
          proprietarioAnterior: true,
          proprietarioNovo: true,
        },
        orderBy: { dataTransferencia: "desc" },
      });

      return res.status(200).json(transferencias);
    } catch (error) {
      console.error("Erro ao buscar transferências:", error);
      return res.status(500).json({
        erro: "Erro ao buscar transferências da propriedade",
      });
    }
  },

  /**
   * Buscar transferências recentes (últimos 30 dias)
   * GET /api/comum/transferencias-propriedade/recentes
   */
  getRecentes: async (req: Request, res: Response) => {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);

      const transferencias = await prisma.transferenciaPropriedade.findMany({
        where: {
          dataTransferencia: {
            gte: dataLimite,
          },
        },
        include: {
          propriedade: true,
          proprietarioAnterior: true,
          proprietarioNovo: true,
        },
        orderBy: { dataTransferencia: "desc" },
      });

      return res.status(200).json(transferencias);
    } catch (error) {
      console.error("Erro ao buscar transferências recentes:", error);
      return res.status(500).json({
        erro: "Erro ao buscar transferências recentes",
      });
    }
  },
};
