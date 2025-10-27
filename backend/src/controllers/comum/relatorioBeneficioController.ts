// backend/src/controllers/comum/relatorioBeneficioController.ts
import { Request, Response } from "express";
import prisma from "../../utils/prisma";

/**
 * Controller para relatórios de benefícios
 */
export const relatorioBeneficioController = {
  /**
   * Relatório geral de benefícios por programa
   */
  porPrograma: async (req: Request, res: Response) => {
    try {
      const { dataInicio, dataFim, programaId, status } = req.query;

      const whereClause: any = {};

      // Filtro por data
      if (dataInicio || dataFim) {
        whereClause.datasolicitacao = {};
        if (dataInicio) {
          whereClause.datasolicitacao.gte = new Date(dataInicio as string);
        }
        if (dataFim) {
          whereClause.datasolicitacao.lte = new Date(dataFim as string);
        }
      }

      // Filtro por programa
      if (programaId) {
        whereClause.programaId = Number(programaId);
      }

      // Filtro por status
      if (status) {
        whereClause.status = status as string;
      }

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: whereClause,
        include: {
          programa: true,
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
            },
          },
        },
        orderBy: {
          datasolicitacao: "desc",
        },
      });

      // Agrupar por programa
      const porPrograma = solicitacoes.reduce((acc: any, sol) => {
        const programaNome = sol.programa.nome;
        if (!acc[programaNome]) {
          acc[programaNome] = {
            programa: sol.programa.nome,
            programaId: sol.programa.id,
            totalSolicitacoes: 0,
            valorTotal: 0,
            porStatus: {},
          };
        }

        acc[programaNome].totalSolicitacoes++;
        acc[programaNome].valorTotal += sol.valorCalculado
          ? Number(sol.valorCalculado)
          : 0;

        // Contar por status
        if (!acc[programaNome].porStatus[sol.status]) {
          acc[programaNome].porStatus[sol.status] = 0;
        }
        acc[programaNome].porStatus[sol.status]++;

        return acc;
      }, {});

      return res.status(200).json({
        resumo: Object.values(porPrograma),
        detalhes: solicitacoes,
        totais: {
          totalSolicitacoes: solicitacoes.length,
          valorTotal: solicitacoes.reduce(
            (sum, sol) => sum + (sol.valorCalculado ? Number(sol.valorCalculado) : 0),
            0
          ),
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório por programa:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao gerar relatório por programa" });
    }
  },

  /**
   * Relatório de produtores beneficiados
   */
  produtoresBeneficiados: async (req: Request, res: Response) => {
    try {
      const { dataInicio, dataFim } = req.query;

      const whereClause: any = {};

      if (dataInicio || dataFim) {
        whereClause.datasolicitacao = {};
        if (dataInicio) {
          whereClause.datasolicitacao.gte = new Date(dataInicio as string);
        }
        if (dataFim) {
          whereClause.datasolicitacao.lte = new Date(dataFim as string);
        }
      }

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: whereClause,
        include: {
          pessoa: {
            include: {
              enderecos: {
                where: { principal: true },
                include: {
                  bairro: true,
                  logradouro: true,
                },
              },
            },
          },
          programa: true,
        },
      });

      // Agrupar por pessoa
      const porPessoa = solicitacoes.reduce((acc: any, sol) => {
        const pessoaId = sol.pessoa.id;
        if (!acc[pessoaId]) {
          acc[pessoaId] = {
            pessoa: {
              id: sol.pessoa.id,
              nome: sol.pessoa.nome,
              cpfCnpj: sol.pessoa.cpfCnpj,
              telefone: sol.pessoa.telefone,
              endereco: sol.pessoa.enderecos[0] || null,
            },
            beneficios: [],
            totalRecebido: 0,
            quantidadeBeneficios: 0,
          };
        }

        acc[pessoaId].beneficios.push({
          programa: sol.programa.nome,
          valor: sol.valorCalculado ? Number(sol.valorCalculado) : 0,
          data: sol.datasolicitacao,
          status: sol.status,
        });

        acc[pessoaId].totalRecebido += sol.valorCalculado
          ? Number(sol.valorCalculado)
          : 0;
        acc[pessoaId].quantidadeBeneficios++;

        return acc;
      }, {});

      return res.status(200).json({
        produtores: Object.values(porPessoa),
        totais: {
          totalProdutores: Object.keys(porPessoa).length,
          totalBeneficios: solicitacoes.length,
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório de produtores:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao gerar relatório de produtores" });
    }
  },

  /**
   * Relatório de valores investidos por período
   */
  investimentoPorPeriodo: async (req: Request, res: Response) => {
    try {
      const { dataInicio, dataFim, agrupamento = "mes" } = req.query;

      const whereClause: any = {};

      if (dataInicio || dataFim) {
        whereClause.datasolicitacao = {};
        if (dataInicio) {
          whereClause.datasolicitacao.gte = new Date(dataInicio as string);
        }
        if (dataFim) {
          whereClause.datasolicitacao.lte = new Date(dataFim as string);
        }
      }

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: whereClause,
        include: {
          programa: true,
        },
        orderBy: {
          datasolicitacao: "asc",
        },
      });

      // Agrupar por período
      const porPeriodo = solicitacoes.reduce((acc: any, sol) => {
        const data = new Date(sol.datasolicitacao);
        let chave = "";

        if (agrupamento === "mes") {
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
        } else if (agrupamento === "ano") {
          chave = `${data.getFullYear()}`;
        } else if (agrupamento === "dia") {
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
        }

        if (!acc[chave]) {
          acc[chave] = {
            periodo: chave,
            totalInvestido: 0,
            quantidadeSolicitacoes: 0,
            porPrograma: {},
          };
        }

        acc[chave].totalInvestido += sol.valorCalculado
          ? Number(sol.valorCalculado)
          : 0;
        acc[chave].quantidadeSolicitacoes++;

        // Por programa
        const programaNome = sol.programa.nome;
        if (!acc[chave].porPrograma[programaNome]) {
          acc[chave].porPrograma[programaNome] = 0;
        }
        acc[chave].porPrograma[programaNome] += sol.valorCalculado
          ? Number(sol.valorCalculado)
          : 0;

        return acc;
      }, {});

      return res.status(200).json({
        periodos: Object.values(porPeriodo),
        totais: {
          valorTotal: solicitacoes.reduce(
            (sum, sol) =>
              sum + (sol.valorCalculado ? Number(sol.valorCalculado) : 0),
            0
          ),
          quantidadeTotal: solicitacoes.length,
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório de investimento:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao gerar relatório de investimento" });
    }
  },

  /**
   * Relatório por secretaria (ADMIN, OBRAS, AGRICULTURA)
   */
  porSecretaria: async (req: Request, res: Response) => {
    try {
      const { dataInicio, dataFim } = req.query;

      const whereClause: any = {};

      if (dataInicio || dataFim) {
        whereClause.datasolicitacao = {};
        if (dataInicio) {
          whereClause.datasolicitacao.gte = new Date(dataInicio as string);
        }
        if (dataFim) {
          whereClause.datasolicitacao.lte = new Date(dataFim as string);
        }
      }

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: whereClause,
        include: {
          programa: true,
        },
      });

      // Agrupar por secretaria
      const porSecretaria = solicitacoes.reduce((acc: any, sol) => {
        const secretaria = sol.programa.secretaria;
        if (!acc[secretaria]) {
          acc[secretaria] = {
            secretaria,
            totalInvestido: 0,
            quantidadeSolicitacoes: 0,
            programas: {},
          };
        }

        acc[secretaria].totalInvestido += sol.valorCalculado
          ? Number(sol.valorCalculado)
          : 0;
        acc[secretaria].quantidadeSolicitacoes++;

        // Por programa dentro da secretaria
        const programaNome = sol.programa.nome;
        if (!acc[secretaria].programas[programaNome]) {
          acc[secretaria].programas[programaNome] = {
            nome: programaNome,
            total: 0,
            quantidade: 0,
          };
        }
        acc[secretaria].programas[programaNome].total += sol.valorCalculado
          ? Number(sol.valorCalculado)
          : 0;
        acc[secretaria].programas[programaNome].quantidade++;

        return acc;
      }, {});

      return res.status(200).json({
        secretarias: Object.values(porSecretaria).map((sec: any) => ({
          ...sec,
          programas: Object.values(sec.programas),
        })),
        totais: {
          valorTotal: solicitacoes.reduce(
            (sum, sol) =>
              sum + (sol.valorCalculado ? Number(sol.valorCalculado) : 0),
            0
          ),
          quantidadeTotal: solicitacoes.length,
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório por secretaria:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao gerar relatório por secretaria" });
    }
  },
};
