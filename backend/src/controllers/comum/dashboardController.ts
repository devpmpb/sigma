/**
 * Controller para Dashboard Executivo
 * Endpoints otimizados para visualização rápida do prefeito/secretário
 */

import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export const dashboardController = {
  /**
   * Estatísticas gerais - Cards principais do dashboard
   */
  estatisticasGerais: async (req: Request, res: Response) => {
    try {
      const { ano } = req.query;
      const anoFiltro = ano ? Number(ano) : new Date().getFullYear();

      const dataInicio = new Date(anoFiltro, 0, 1);
      const dataFim = new Date(anoFiltro, 11, 31, 23, 59, 59);

      // Buscar solicitações do período
      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: {
          datasolicitacao: {
            gte: dataInicio,
            lte: dataFim,
          },
          status: {
            in: ["aprovada", "paga"],
          },
        },
        select: {
          valorCalculado: true,
          pessoaId: true,
        },
      });

      // Calcular estatísticas
      const totalInvestido = solicitacoes.reduce(
        (sum, s) => sum + (s.valorCalculado ? Number(s.valorCalculado) : 0),
        0
      );

      const produtoresUnicos = new Set(solicitacoes.map((s) => s.pessoaId));
      const produtoresAtendidos = produtoresUnicos.size;

      const mediaPorProdutor =
        produtoresAtendidos > 0 ? totalInvestido / produtoresAtendidos : 0;

      // Comparativo com ano anterior
      const anoAnterior = anoFiltro - 1;
      const dataInicioAnterior = new Date(anoAnterior, 0, 1);
      const dataFimAnterior = new Date(anoAnterior, 11, 31, 23, 59, 59);

      const solicitacoesAnoAnterior = await prisma.solicitacaoBeneficio.findMany({
        where: {
          datasolicitacao: {
            gte: dataInicioAnterior,
            lte: dataFimAnterior,
          },
          status: {
            in: ["aprovada", "paga"],
          },
        },
        select: {
          valorCalculado: true,
        },
      });

      const totalAnoAnterior = solicitacoesAnoAnterior.reduce(
        (sum, s) => sum + (s.valorCalculado ? Number(s.valorCalculado) : 0),
        0
      );

      const variacaoPercentual =
        totalAnoAnterior > 0
          ? ((totalInvestido - totalAnoAnterior) / totalAnoAnterior) * 100
          : 0;

      return res.status(200).json({
        ano: anoFiltro,
        totalInvestido,
        totalSolicitacoes: solicitacoes.length,
        produtoresAtendidos,
        mediaPorProdutor,
        comparativoAnoAnterior: {
          ano: anoAnterior,
          totalInvestido: totalAnoAnterior,
          variacaoPercentual: Math.round(variacaoPercentual * 100) / 100,
        },
        ultimaAtualizacao: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Erro ao buscar estatísticas gerais:", error);
      return res.status(500).json({ erro: "Erro ao buscar estatísticas gerais" });
    }
  },

  /**
   * Estatísticas por programa - Para gráfico de pizza/barras
   */
  porPrograma: async (req: Request, res: Response) => {
    try {
      const { ano } = req.query;
      const anoFiltro = ano ? Number(ano) : new Date().getFullYear();

      const dataInicio = new Date(anoFiltro, 0, 1);
      const dataFim = new Date(anoFiltro, 11, 31, 23, 59, 59);

      const solicitacoes = await prisma.solicitacaoBeneficio.groupBy({
        by: ["programaId", "status"],
        where: {
          datasolicitacao: {
            gte: dataInicio,
            lte: dataFim,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          valorCalculado: true,
        },
      });

      // Buscar nomes dos programas
      const programaIds = [...new Set(solicitacoes.map((s) => s.programaId))];
      const programas = await prisma.programa.findMany({
        where: {
          id: { in: programaIds },
        },
        select: {
          id: true,
          nome: true,
        },
      });

      const programaMap = new Map(programas.map((p) => [p.id, p.nome]));

      // Agrupar por programa
      const porPrograma: Record<
        number,
        {
          programaId: number;
          programaNome: string;
          totalSolicitacoes: number;
          totalAprovado: number;
          totalPago: number;
          valorTotal: number;
        }
      > = {};

      solicitacoes.forEach((s) => {
        if (!porPrograma[s.programaId]) {
          porPrograma[s.programaId] = {
            programaId: s.programaId,
            programaNome: programaMap.get(s.programaId) || "Desconhecido",
            totalSolicitacoes: 0,
            totalAprovado: 0,
            totalPago: 0,
            valorTotal: 0,
          };
        }

        porPrograma[s.programaId].totalSolicitacoes += s._count.id;

        if (s.status === "aprovada") {
          porPrograma[s.programaId].totalAprovado += s._count.id;
        }
        if (s.status === "paga") {
          porPrograma[s.programaId].totalPago += s._count.id;
        }
        if (s.status === "aprovada" || s.status === "paga") {
          porPrograma[s.programaId].valorTotal += Number(s._sum.valorCalculado || 0);
        }
      });

      const resultado = Object.values(porPrograma).sort(
        (a, b) => b.valorTotal - a.valorTotal
      );

      return res.status(200).json({
        ano: anoFiltro,
        programas: resultado,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar estatísticas por programa:", error);
      return res.status(500).json({ erro: "Erro ao buscar estatísticas por programa" });
    }
  },

  /**
   * Estatísticas por período - Para gráfico de linha temporal
   */
  porPeriodo: async (req: Request, res: Response) => {
    try {
      const { ano } = req.query;
      const anoFiltro = ano ? Number(ano) : new Date().getFullYear();

      const dataInicio = new Date(anoFiltro, 0, 1);
      const dataFim = new Date(anoFiltro, 11, 31, 23, 59, 59);

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: {
          datasolicitacao: {
            gte: dataInicio,
            lte: dataFim,
          },
          status: {
            in: ["aprovada", "paga"],
          },
        },
        select: {
          datasolicitacao: true,
          valorCalculado: true,
        },
        orderBy: {
          datasolicitacao: "asc",
        },
      });

      // Agrupar por mês
      const porMes: Record<
        string,
        { ano: number; mes: number; totalSolicitacoes: number; valorTotal: number }
      > = {};

      // Inicializar todos os meses do ano
      for (let mes = 0; mes < 12; mes++) {
        const chave = `${anoFiltro}-${String(mes + 1).padStart(2, "0")}`;
        porMes[chave] = {
          ano: anoFiltro,
          mes: mes + 1,
          totalSolicitacoes: 0,
          valorTotal: 0,
        };
      }

      // Preencher com dados reais
      solicitacoes.forEach((s) => {
        const data = new Date(s.datasolicitacao);
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;

        if (porMes[chave]) {
          porMes[chave].totalSolicitacoes++;
          porMes[chave].valorTotal += Number(s.valorCalculado || 0);
        }
      });

      const resultado = Object.values(porMes);

      return res.status(200).json({
        ano: anoFiltro,
        meses: resultado,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar estatísticas por período:", error);
      return res.status(500).json({ erro: "Erro ao buscar estatísticas por período" });
    }
  },

  /**
   * Top produtores beneficiados
   */
  topProdutores: async (req: Request, res: Response) => {
    try {
      const { ano, limite } = req.query;
      const anoFiltro = ano ? Number(ano) : new Date().getFullYear();
      const limiteResultados = limite ? Number(limite) : 10;

      const dataInicio = new Date(anoFiltro, 0, 1);
      const dataFim = new Date(anoFiltro, 11, 31, 23, 59, 59);

      const solicitacoes = await prisma.solicitacaoBeneficio.groupBy({
        by: ["pessoaId"],
        where: {
          datasolicitacao: {
            gte: dataInicio,
            lte: dataFim,
          },
          status: {
            in: ["aprovada", "paga"],
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          valorCalculado: true,
        },
        orderBy: {
          _sum: {
            valorCalculado: "desc",
          },
        },
        take: limiteResultados,
      });

      // Buscar nomes das pessoas
      const pessoaIds = solicitacoes.map((s) => s.pessoaId);
      const pessoas = await prisma.pessoa.findMany({
        where: {
          id: { in: pessoaIds },
        },
        select: {
          id: true,
          nome: true,
        },
      });

      const pessoaMap = new Map(pessoas.map((p) => [p.id, p.nome]));

      const resultado = solicitacoes.map((s) => ({
        pessoaId: s.pessoaId,
        pessoaNome: pessoaMap.get(s.pessoaId) || "Desconhecido",
        totalSolicitacoes: s._count.id,
        valorTotal: Number(s._sum.valorCalculado || 0),
      }));

      return res.status(200).json({
        ano: anoFiltro,
        produtores: resultado,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar top produtores:", error);
      return res.status(500).json({ erro: "Erro ao buscar top produtores" });
    }
  },

  /**
   * Resumo para o dashboard - Todos os dados em uma única chamada
   */
  resumoCompleto: async (req: Request, res: Response) => {
    try {
      const { ano } = req.query;
      const anoFiltro = ano ? Number(ano) : new Date().getFullYear();

      const dataInicio = new Date(anoFiltro, 0, 1);
      const dataFim = new Date(anoFiltro, 11, 31, 23, 59, 59);

      // Buscar todas as solicitações do ano
      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: {
          datasolicitacao: {
            gte: dataInicio,
            lte: dataFim,
          },
        },
        include: {
          programa: {
            select: {
              id: true,
              nome: true,
            },
          },
          pessoa: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      // Filtrar aprovadas/pagas para estatísticas
      const aprovadas = solicitacoes.filter(
        (s) => s.status === "aprovada" || s.status === "paga"
      );

      // Estatísticas gerais
      const totalInvestido = aprovadas.reduce(
        (sum, s) => sum + (s.valorCalculado ? Number(s.valorCalculado) : 0),
        0
      );

      const produtoresUnicos = new Set(aprovadas.map((s) => s.pessoaId));
      const produtoresAtendidos = produtoresUnicos.size;

      const mediaPorProdutor =
        produtoresAtendidos > 0 ? totalInvestido / produtoresAtendidos : 0;

      // Por programa
      const porPrograma: Record<number, { nome: string; valor: number; quantidade: number }> = {};
      aprovadas.forEach((s) => {
        if (!porPrograma[s.programaId]) {
          porPrograma[s.programaId] = {
            nome: s.programa.nome,
            valor: 0,
            quantidade: 0,
          };
        }
        porPrograma[s.programaId].valor += Number(s.valorCalculado || 0);
        porPrograma[s.programaId].quantidade++;
      });

      // Por mês
      const porMes: Record<number, { mes: number; valor: number; quantidade: number }> = {};
      for (let i = 1; i <= 12; i++) {
        porMes[i] = { mes: i, valor: 0, quantidade: 0 };
      }
      aprovadas.forEach((s) => {
        const mes = new Date(s.datasolicitacao).getMonth() + 1;
        porMes[mes].valor += Number(s.valorCalculado || 0);
        porMes[mes].quantidade++;
      });

      // Top 5 produtores
      const porProdutor: Record<number, { nome: string; valor: number; quantidade: number }> = {};
      aprovadas.forEach((s) => {
        if (!porProdutor[s.pessoaId]) {
          porProdutor[s.pessoaId] = {
            nome: s.pessoa.nome,
            valor: 0,
            quantidade: 0,
          };
        }
        porProdutor[s.pessoaId].valor += Number(s.valorCalculado || 0);
        porProdutor[s.pessoaId].quantidade++;
      });

      const topProdutores = Object.entries(porProdutor)
        .map(([id, dados]) => ({ id: Number(id), ...dados }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

      // Por status (para mostrar funil)
      const porStatus = solicitacoes.reduce(
        (acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return res.status(200).json({
        ano: anoFiltro,
        estatisticas: {
          totalInvestido,
          totalSolicitacoes: aprovadas.length,
          produtoresAtendidos,
          mediaPorProdutor,
        },
        porPrograma: Object.entries(porPrograma)
          .map(([id, dados]) => ({ id: Number(id), ...dados }))
          .sort((a, b) => b.valor - a.valor),
        porMes: Object.values(porMes),
        topProdutores,
        porStatus,
        ultimaAtualizacao: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Erro ao buscar resumo completo:", error);
      return res.status(500).json({ erro: "Erro ao buscar resumo completo" });
    }
  },
};
