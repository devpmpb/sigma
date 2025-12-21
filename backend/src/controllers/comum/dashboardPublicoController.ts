/**
 * Controller para Dashboard Público (Prefeito/Secretário)
 * Acesso sem autenticação - dados públicos agregados
 * Com filtros por programa e produtor
 */

import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export const dashboardPublicoController = {
  /**
   * Resumo completo com filtros
   * GET /api/dashboard-publico/resumo
   * Query params: ano, programaId, produtorId
   */
  resumoCompleto: async (req: Request, res: Response) => {
    try {
      const { ano, programaId, produtorId } = req.query;
      const anoFiltro = ano ? Number(ano) : new Date().getFullYear();

      const dataInicio = new Date(anoFiltro, 0, 1);
      const dataFim = new Date(anoFiltro, 11, 31, 23, 59, 59);

      // Construir where dinâmico
      const where: any = {
        datasolicitacao: {
          gte: dataInicio,
          lte: dataFim,
        },
      };

      if (programaId) {
        where.programaId = Number(programaId);
      }

      if (produtorId) {
        where.pessoaId = Number(produtorId);
      }

      // Buscar todas as solicitações do ano com filtros
      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where,
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

      console.log(solicitacoes.length);

      // Filtrar aprovadas/pagas para estatísticas
      const aprovadas = solicitacoes.filter(
        (s) =>
          s.status === "aprovada" ||
          s.status === "paga" ||
          s.status === "aprovado"
      );
      console.log(aprovadas.length);
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
      const porPrograma: Record<
        number,
        { nome: string; valor: number; quantidade: number }
      > = {};
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
      const porMes: Record<
        number,
        { mes: number; valor: number; quantidade: number }
      > = {};
      for (let i = 1; i <= 12; i++) {
        porMes[i] = { mes: i, valor: 0, quantidade: 0 };
      }
      aprovadas.forEach((s) => {
        const mes = new Date(s.datasolicitacao).getMonth() + 1;
        porMes[mes].valor += Number(s.valorCalculado || 0);
        porMes[mes].quantidade++;
      });

      // Top 10 produtores
      const porProdutor: Record<
        number,
        { nome: string; valor: number; quantidade: number }
      > = {};
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
        .slice(0, 10);

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
        filtros: {
          programaId: programaId ? Number(programaId) : null,
          produtorId: produtorId ? Number(produtorId) : null,
        },
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
      console.error("❌ Erro ao buscar resumo público:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao buscar dados do dashboard" });
    }
  },

  /**
   * Lista de programas para filtro
   * GET /api/dashboard-publico/programas
   */
  listarProgramas: async (_req: Request, res: Response) => {
    try {
      const programas = await prisma.programa.findMany({
        select: {
          id: true,
          nome: true,
        },
        orderBy: {
          nome: "asc",
        },
      });

      return res.status(200).json(programas);
    } catch (error) {
      console.error("❌ Erro ao listar programas:", error);
      return res.status(500).json({ erro: "Erro ao listar programas" });
    }
  },

  /**
   * Lista de produtores para filtro (autocomplete)
   * GET /api/dashboard-publico/produtores?busca=nome
   */
  buscarProdutores: async (req: Request, res: Response) => {
    try {
      const { busca } = req.query;

      // Buscar pessoas que têm solicitações de benefício
      const produtores = await prisma.pessoa.findMany({
        where: {
          ativo: true,
          nome: busca
            ? {
                contains: String(busca),
                mode: "insensitive",
              }
            : undefined,
          solicitacoesBeneficio: {
            some: {},
          },
        },
        select: {
          id: true,
          nome: true,
          cpfCnpj: true,
        },
        orderBy: {
          nome: "asc",
        },
        take: 20,
      });

      return res.status(200).json(produtores);
    } catch (error) {
      console.error("❌ Erro ao buscar produtores:", error);
      return res.status(500).json({ erro: "Erro ao buscar produtores" });
    }
  },

  /**
   * Anos disponíveis para filtro
   * GET /api/dashboard-publico/anos
   */
  listarAnos: async (_req: Request, res: Response) => {
    try {
      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        select: {
          datasolicitacao: true,
        },
        distinct: ["datasolicitacao"],
      });

      const anos = [
        ...new Set(
          solicitacoes.map((s) => new Date(s.datasolicitacao).getFullYear())
        ),
      ].sort((a, b) => b - a);

      // Se não houver dados, retornar pelo menos o ano atual
      if (anos.length === 0) {
        anos.push(new Date().getFullYear());
      }

      return res.status(200).json(anos);
    } catch (error) {
      console.error("❌ Erro ao listar anos:", error);
      return res.status(500).json({ erro: "Erro ao listar anos" });
    }
  },
};
