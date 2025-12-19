// backend/src/controllers/agricultura/relatorioArrendamentoController.ts
import { Request, Response } from "express";
import prisma from "../../utils/prisma";

/**
 * Controller para relatórios de arrendamentos
 */
export const relatorioArrendamentoController = {
  /**
   * Relatório geral de arrendamentos
   */
  geral: async (req: Request, res: Response) => {
    try {
      const { dataInicio, dataFim, status, propriedadeId } = req.query;

      const whereClause: any = {};

      // Filtro por data
      if (dataInicio || dataFim) {
        whereClause.dataInicio = {};
        if (dataInicio) {
          whereClause.dataInicio.gte = new Date(dataInicio as string);
        }
        if (dataFim) {
          whereClause.dataInicio.lte = new Date(dataFim as string);
        }
      }

      // Filtro por status
      if (status) {
        whereClause.status = status as string;
      }

      // Filtro por propriedade
      if (propriedadeId) {
        whereClause.propriedadeId = Number(propriedadeId);
      }

      const arrendamentos = await prisma.arrendamento.findMany({
        where: whereClause,
        include: {
          propriedade: {
            include: {
              proprietario: true,
            },
          },
          arrendatario: true,
          proprietario: true,
        },
        orderBy: {
          dataInicio: "desc",
        },
      });

      // Calcular estatísticas
      const porStatus = arrendamentos.reduce((acc: any, arr) => {
        if (!acc[arr.status]) {
          acc[arr.status] = {
            status: arr.status,
            quantidade: 0,
            areaTotal: 0,
          };
        }
        acc[arr.status].quantidade++;
        acc[arr.status].areaTotal += Number(arr.areaArrendada);
        return acc;
      }, {});

      const areaTotal = arrendamentos.reduce(
        (sum, arr) => sum + Number(arr.areaArrendada),
        0
      );

      return res.status(200).json({
        arrendamentos,
        estatisticas: {
          total: arrendamentos.length,
          areaTotal,
          porStatus: Object.values(porStatus),
          propriedadesUnicas: new Set(arrendamentos.map((a) => a.propriedadeId))
            .size,
          arrendatariosUnicos: new Set(
            arrendamentos.map((a) => a.arrendatarioId)
          ).size,
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório geral:", error);
      return res.status(500).json({ erro: "Erro ao gerar relatório geral" });
    }
  },

  /**
   * Relatório por propriedade
   */
  porPropriedade: async (req: Request, res: Response) => {
    try {
      const { dataInicio, dataFim } = req.query;

      const whereClause: any = {};

      if (dataInicio || dataFim) {
        whereClause.dataInicio = {};
        if (dataInicio) {
          whereClause.dataInicio.gte = new Date(dataInicio as string);
        }
        if (dataFim) {
          whereClause.dataInicio.lte = new Date(dataFim as string);
        }
      }

      const arrendamentos = await prisma.arrendamento.findMany({
        where: whereClause,
        include: {
          propriedade: {
            include: {
              proprietario: true,
              endereco: true,
            },
          },
          arrendatario: true,
        },
      });

      // Agrupar por propriedade
      const porPropriedade = arrendamentos.reduce((acc: any, arr) => {
        const propId = arr.propriedadeId;
        if (!acc[propId]) {
          acc[propId] = {
            propriedade: {
              id: arr.propriedade.id,
              area: arr.propriedade.areaTotal,
              proprietario: arr.propriedade.proprietario.nome,
            },
            arrendamentos: [],
            areaArrendadaTotal: 0,
            quantidadeArrendamentos: 0,
          };
        }

        acc[propId].arrendamentos.push({
          arrendatario: arr.arrendatario.nome,
          areaArrendada: Number(arr.areaArrendada),
          dataInicio: arr.dataInicio,
          dataFim: arr.dataFim,
          status: arr.status,
          atividadeProdutiva: arr.atividadeProdutiva,
        });

        acc[propId].areaArrendadaTotal += Number(arr.areaArrendada);
        acc[propId].quantidadeArrendamentos++;

        return acc;
      }, {});

      return res.status(200).json({
        propriedades: Object.values(porPropriedade),
        totais: {
          totalPropriedades: Object.keys(porPropriedade).length,
          totalArrendamentos: arrendamentos.length,
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório por propriedade:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao gerar relatório por propriedade" });
    }
  },

  /**
   * Relatório por arrendatário
   */
  porArrendatario: async (req: Request, res: Response) => {
    try {
      const { dataInicio, dataFim } = req.query;

      const whereClause: any = {};

      if (dataInicio || dataFim) {
        whereClause.dataInicio = {};
        if (dataInicio) {
          whereClause.dataInicio.gte = new Date(dataInicio as string);
        }
        if (dataFim) {
          whereClause.dataInicio.lte = new Date(dataFim as string);
        }
      }

      const arrendamentos = await prisma.arrendamento.findMany({
        where: whereClause,
        include: {
          arrendatario: {
            include: {
              enderecos: {
                where: { principal: true },
              },
            },
          },
          propriedade: {
            include: {
              proprietario: true,
            },
          },
        },
      });

      // Agrupar por arrendatário
      const porArrendatario = arrendamentos.reduce((acc: any, arr) => {
        const arrendatarioId = arr.arrendatarioId;
        if (!acc[arrendatarioId]) {
          acc[arrendatarioId] = {
            arrendatario: {
              id: arr.arrendatario.id,
              nome: arr.arrendatario.nome,
              cpfCnpj: arr.arrendatario.cpfCnpj,
              telefone: arr.arrendatario.telefone,
              endereco: arr.arrendatario.enderecos[0] || null,
            },
            arrendamentos: [],
            areaTotal: 0,
            quantidadeArrendamentos: 0,
            atividadesProdutivas: new Set(),
          };
        }

        acc[arrendatarioId].arrendamentos.push({
          proprietario: arr.propriedade.proprietario.nome,
          areaArrendada: Number(arr.areaArrendada),
          dataInicio: arr.dataInicio,
          dataFim: arr.dataFim,
          status: arr.status,
          atividadeProdutiva: arr.atividadeProdutiva,
        });

        acc[arrendatarioId].areaTotal += Number(arr.areaArrendada);
        acc[arrendatarioId].quantidadeArrendamentos++;

        if (arr.atividadeProdutiva) {
          acc[arrendatarioId].atividadesProdutivas.add(arr.atividadeProdutiva);
        }

        return acc;
      }, {});

      // Converter Set para Array
      const resultado = Object.values(porArrendatario).map((item: any) => ({
        ...item,
        atividadesProdutivas: Array.from(item.atividadesProdutivas),
      }));

      return res.status(200).json({
        arrendatarios: resultado,
        totais: {
          totalArrendatarios: resultado.length,
          totalArrendamentos: arrendamentos.length,
          areaTotal: arrendamentos.reduce(
            (sum, arr) => sum + Number(arr.areaArrendada),
            0
          ),
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório por arrendatário:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao gerar relatório por arrendatário" });
    }
  },

  /**
   * Relatório por atividade produtiva
   */
  porAtividadeProdutiva: async (req: Request, res: Response) => {
    try {
      const { dataInicio, dataFim } = req.query;

      const whereClause: any = {};

      if (dataInicio || dataFim) {
        whereClause.dataInicio = {};
        if (dataInicio) {
          whereClause.dataInicio.gte = new Date(dataInicio as string);
        }
        if (dataFim) {
          whereClause.dataInicio.lte = new Date(dataFim as string);
        }
      }

      const arrendamentos = await prisma.arrendamento.findMany({
        where: whereClause,
        include: {
          propriedade: true,
          arrendatario: true,
        },
      });

      // Agrupar por atividade produtiva
      const porAtividade = arrendamentos.reduce((acc: any, arr) => {
        const atividade = arr.atividadeProdutiva || "Não informado";
        if (!acc[atividade]) {
          acc[atividade] = {
            atividade,
            quantidadeArrendamentos: 0,
            areaTotal: 0,
            arrendatariosUnicos: new Set(),
            propriedadesUnicas: new Set(),
          };
        }

        acc[atividade].quantidadeArrendamentos++;
        acc[atividade].areaTotal += Number(arr.areaArrendada);
        acc[atividade].arrendatariosUnicos.add(arr.arrendatarioId);
        acc[atividade].propriedadesUnicas.add(arr.propriedadeId);

        return acc;
      }, {});

      // Converter Sets para contadores
      const resultado = Object.values(porAtividade).map((item: any) => ({
        atividade: item.atividade,
        quantidadeArrendamentos: item.quantidadeArrendamentos,
        areaTotal: item.areaTotal,
        arrendatariosUnicos: item.arrendatariosUnicos.size,
        propriedadesUnicas: item.propriedadesUnicas.size,
      }));

      return res.status(200).json({
        atividades: resultado,
        totais: {
          totalArrendamentos: arrendamentos.length,
          areaTotal: arrendamentos.reduce(
            (sum, arr) => sum + Number(arr.areaArrendada),
            0
          ),
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório por atividade produtiva:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao gerar relatório por atividade produtiva" });
    }
  },

  /**
   * Relatório de arrendamentos vencendo
   */
  vencendo: async (req: Request, res: Response) => {
    try {
      const { dias = "30" } = req.query;

      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + Number(dias));

      const arrendamentos = await prisma.arrendamento.findMany({
        where: {
          status: "ativo",
          dataFim: {
            gte: hoje,
            lte: dataLimite,
          },
        },
        include: {
          propriedade: {
            include: {
              proprietario: true,
            },
          },
          arrendatario: {
            include: {
              enderecos: {
                where: { principal: true },
              },
            },
          },
        },
        orderBy: {
          dataFim: "asc",
        },
      });

      // Calcular dias até vencimento
      const comDiasRestantes = arrendamentos.map((arr) => {
        const diasRestantes = Math.ceil(
          (new Date(arr.dataFim!).getTime() - hoje.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        return {
          ...arr,
          diasRestantes,
          urgente: diasRestantes <= 7, // Menos de 7 dias
        };
      });

      return res.status(200).json({
        arrendamentos: comDiasRestantes,
        estatisticas: {
          total: arrendamentos.length,
          urgentes: comDiasRestantes.filter((a) => a.urgente).length,
          areaTotal: arrendamentos.reduce(
            (sum, arr) => sum + Number(arr.areaArrendada),
            0
          ),
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório de vencimentos:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao gerar relatório de vencimentos" });
    }
  },
};
