// backend/src/controllers/comum/saldoController.ts
// Controller para consulta de saldo de benefícios

import { Request, Response } from "express";
import {
  calcularSaldoDisponivel,
  verificarDisponibilidade,
  consultarSaldoRapido,
} from "../../services/saldoBeneficioService";

export const saldoController = {
  /**
   * GET /api/comum/saldo/:pessoaId/:programaId
   * Retorna saldo completo com histórico
   */
  async getSaldo(req: Request, res: Response) {
    try {
      const { pessoaId, programaId } = req.params;

      if (!pessoaId || !programaId) {
        return res.status(400).json({
          erro: "Pessoa e Programa são obrigatórios",
        });
      }

      const saldo = await calcularSaldoDisponivel(
        parseInt(pessoaId),
        parseInt(programaId)
      );

      return res.json(saldo);
    } catch (error: any) {
      console.error("Erro ao calcular saldo:", error);
      return res.status(500).json({
        erro: error.message || "Erro ao calcular saldo",
      });
    }
  },

  /**
   * GET /api/comum/saldo/:pessoaId/:programaId/rapido
   * Retorna apenas saldo disponível (para exibição rápida)
   */
  async getSaldoRapido(req: Request, res: Response) {
    try {
      const { pessoaId, programaId } = req.params;

      const saldo = await consultarSaldoRapido(
        parseInt(pessoaId),
        parseInt(programaId)
      );

      return res.json(saldo);
    } catch (error: any) {
      console.error("Erro ao consultar saldo:", error);
      return res.status(500).json({
        erro: error.message || "Erro ao consultar saldo",
      });
    }
  },

  /**
   * POST /api/comum/saldo/verificar
   * Verifica se quantidade desejada está disponível
   */
  async verificarQuantidade(req: Request, res: Response) {
    try {
      const { pessoaId, programaId, quantidade } = req.body;

      if (!pessoaId || !programaId || quantidade === undefined) {
        return res.status(400).json({
          erro: "Pessoa, Programa e Quantidade são obrigatórios",
        });
      }

      const resultado = await verificarDisponibilidade(
        parseInt(pessoaId),
        parseInt(programaId),
        parseFloat(quantidade)
      );

      return res.json(resultado);
    } catch (error: any) {
      console.error("Erro ao verificar disponibilidade:", error);
      return res.status(500).json({
        erro: error.message || "Erro ao verificar disponibilidade",
      });
    }
  },

  /**
   * GET /api/comum/saldo/pessoa/:pessoaId
   * Retorna saldo de TODOS os programas ativos para uma pessoa
   */
  async getSaldosPorPessoa(req: Request, res: Response) {
    try {
      const { pessoaId } = req.params;

      // Importar prisma aqui para evitar circular dependency
      const prisma = require("../../utils/prisma").default;

      // Buscar todos os programas ativos
      const programas = await prisma.programa.findMany({
        where: { ativo: true },
        select: { id: true, nome: true },
      });

      // Calcular saldo para cada programa
      const saldos = await Promise.all(
        programas.map(async (prog: any) => {
          try {
            return await consultarSaldoRapido(parseInt(pessoaId), prog.id);
          } catch {
            return {
              programaId: prog.id,
              programaNome: prog.nome,
              disponivel: 0,
              unidade: "",
              valorMaximo: 0,
              mensagem: "Erro ao calcular",
            };
          }
        })
      );

      return res.json({
        pessoaId: parseInt(pessoaId),
        programas: saldos.map((s, i) => ({
          programaId: programas[i].id,
          programaNome: programas[i].nome,
          ...s,
        })),
      });
    } catch (error: any) {
      console.error("Erro ao buscar saldos:", error);
      return res.status(500).json({
        erro: error.message || "Erro ao buscar saldos",
      });
    }
  },
};


// ============================================================================
// REGISTRAR ROTAS - Adicionar em backend/src/routes/index.ts
// ============================================================================

/*
import saldoRoutes from "./comum/saldoRoutes";

// Na função de registro de rotas:
app.use("/api/comum/saldo", saldoRoutes);
*/
