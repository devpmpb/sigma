/**
 * Controller para Dashboard Público (Prefeito/Secretário)
 * Acesso sem autenticação - dados públicos agregados
 * Com filtros por programa e produtor
 * OTIMIZADO: Usa agregações do banco ao invés de filtros em memória
 */

import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { Prisma } from "@prisma/client";

// Status considerados como "aprovados" para estatísticas de valores
const STATUS_APROVADOS = ["aprovada", "paga", "aprovado"];

export const dashboardPublicoController = {
  /**
   * Resumo completo com filtros - OTIMIZADO COM AGREGAÇÕES
   * GET /api/dashboard-publico/resumo
   * Query params: ano (null = todos), programaId, produtorId
   */
  resumoCompleto: async (req: Request, res: Response) => {
    try {
      const { ano, programaId, produtorId } = req.query;

      // ano = null ou "todos" significa todos os anos
      // Validação robusta para evitar NaN
      let anoFiltro: number | null = null;
      if (ano && ano !== "todos" && ano !== "null" && ano !== "undefined") {
        const anoNum = Number(ano);
        if (!isNaN(anoNum) && anoNum > 1900 && anoNum < 2100) {
          anoFiltro = anoNum;
        }
      }

      // Where base (para todas as solicitações)
      const whereBase: Prisma.SolicitacaoBeneficioWhereInput = {};

      // Só filtra por ano se não for "todos"
      if (anoFiltro) {
        whereBase.datasolicitacao = {
          gte: new Date(anoFiltro, 0, 1),
          lte: new Date(anoFiltro, 11, 31, 23, 59, 59),
        };
      }

      if (programaId) {
        whereBase.programaId = Number(programaId);
      }

      if (produtorId) {
        whereBase.pessoaId = Number(produtorId);
      }

      // Where para aprovadas (usado nas estatísticas de valor)
      const whereAprovadas: Prisma.SolicitacaoBeneficioWhereInput = {
        ...whereBase,
        status: { in: STATUS_APROVADOS },
      };

      // Executar todas as queries em paralelo
      const [
        estatisticasAgregadas,
        produtoresUnicos,
        porStatusRaw,
        porProgramaRaw,
        topProdutoresRaw,
        porMesRaw,
      ] = await Promise.all([
        // 1. Estatísticas gerais (soma e contagem)
        prisma.solicitacaoBeneficio.aggregate({
          where: whereAprovadas,
          _sum: { valorCalculado: true },
          _count: { id: true },
        }),

        // 2. Produtores únicos atendidos
        prisma.solicitacaoBeneficio.groupBy({
          by: ["pessoaId"],
          where: whereAprovadas,
        }),

        // 3. Contagem por status
        prisma.solicitacaoBeneficio.groupBy({
          by: ["status"],
          where: whereBase,
          _count: { id: true },
        }),

        // 4. Por programa (com soma e contagem)
        prisma.solicitacaoBeneficio.groupBy({
          by: ["programaId"],
          where: whereAprovadas,
          _sum: { valorCalculado: true },
          _count: { id: true },
        }),

        // 5. Top 10 produtores
        prisma.solicitacaoBeneficio.groupBy({
          by: ["pessoaId"],
          where: whereAprovadas,
          _sum: { valorCalculado: true },
          _count: { id: true },
          orderBy: { _sum: { valorCalculado: "desc" } },
          take: 10,
        }),

        // 6. Por mês - usando query raw para melhor performance
        prisma.$queryRaw<Array<{ mes: number; valor: string; quantidade: bigint }>>`
          SELECT
            EXTRACT(MONTH FROM datasolicitacao)::int as mes,
            COALESCE(SUM("valorCalculado"), 0)::text as valor,
            COUNT(*) as quantidade
          FROM "SolicitacaoBeneficio"
          WHERE status IN ('aprovada', 'paga', 'aprovado')
            AND datasolicitacao IS NOT NULL
            ${anoFiltro ? Prisma.sql`AND EXTRACT(YEAR FROM datasolicitacao) = ${anoFiltro}` : Prisma.empty}
            ${programaId ? Prisma.sql`AND "programaId" = ${Number(programaId)}` : Prisma.empty}
            ${produtorId ? Prisma.sql`AND "pessoaId" = ${Number(produtorId)}` : Prisma.empty}
          GROUP BY EXTRACT(MONTH FROM datasolicitacao)
          ORDER BY mes
        `,
      ]);

      // Buscar nomes dos programas
      const programaIds = porProgramaRaw.map((p) => p.programaId);
      const programas = programaIds.length > 0
        ? await prisma.programa.findMany({
            where: { id: { in: programaIds } },
            select: { id: true, nome: true },
          })
        : [];
      const programaMap = Object.fromEntries(programas.map((p) => [p.id, p.nome]));

      // Buscar nomes dos produtores
      const pessoaIds = topProdutoresRaw.map((p) => p.pessoaId);
      const pessoas = pessoaIds.length > 0
        ? await prisma.pessoa.findMany({
            where: { id: { in: pessoaIds } },
            select: { id: true, nome: true },
          })
        : [];
      const pessoaMap = Object.fromEntries(pessoas.map((p) => [p.id, p.nome]));

      // Montar resposta
      const totalInvestido = Number(estatisticasAgregadas._sum.valorCalculado || 0);
      const produtoresAtendidos = produtoresUnicos.length;

      // Por status como objeto
      const porStatus = Object.fromEntries(
        porStatusRaw.map((s) => [s.status, s._count.id])
      );

      // Por programa formatado
      const porPrograma = porProgramaRaw
        .map((p) => ({
          id: p.programaId,
          nome: programaMap[p.programaId] || "Programa não encontrado",
          valor: Number(p._sum.valorCalculado || 0),
          quantidade: p._count.id,
        }))
        .sort((a, b) => b.valor - a.valor);

      // Top produtores formatado
      const topProdutores = topProdutoresRaw.map((p) => ({
        id: p.pessoaId,
        nome: pessoaMap[p.pessoaId] || "Produtor não encontrado",
        valor: Number(p._sum.valorCalculado || 0),
        quantidade: p._count.id,
      }));

      // Por mês - preencher meses vazios com 0
      const porMesMap: Record<number, { mes: number; valor: number; quantidade: number }> = {};
      for (let i = 1; i <= 12; i++) {
        porMesMap[i] = { mes: i, valor: 0, quantidade: 0 };
      }
      porMesRaw.forEach((m) => {
        porMesMap[m.mes] = {
          mes: m.mes,
          valor: parseFloat(m.valor) || 0,
          quantidade: Number(m.quantidade),
        };
      });

      return res.status(200).json({
        ano: anoFiltro || "todos",
        filtros: {
          programaId: programaId ? Number(programaId) : null,
          produtorId: produtorId ? Number(produtorId) : null,
        },
        estatisticas: {
          totalInvestido,
          totalSolicitacoes: estatisticasAgregadas._count.id,
          produtoresAtendidos,
          mediaPorProdutor: produtoresAtendidos > 0 ? totalInvestido / produtoresAtendidos : 0,
        },
        porPrograma,
        porMes: Object.values(porMesMap),
        topProdutores,
        porStatus,
        ultimaAtualizacao: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao buscar resumo público:", error);
      return res.status(500).json({ erro: "Erro ao buscar dados do dashboard" });
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
      console.error("Erro ao listar programas:", error);
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
      console.error("Erro ao buscar produtores:", error);
      return res.status(500).json({ erro: "Erro ao buscar produtores" });
    }
  },

  /**
   * Anos disponíveis para filtro - OTIMIZADO
   * GET /api/dashboard-publico/anos
   */
  listarAnos: async (_req: Request, res: Response) => {
    try {
      // Query otimizada que extrai anos distintos diretamente no banco
      const anosRaw = await prisma.$queryRaw<Array<{ ano: number }>>`
        SELECT DISTINCT EXTRACT(YEAR FROM datasolicitacao)::int as ano
        FROM "SolicitacaoBeneficio"
        WHERE datasolicitacao IS NOT NULL
        ORDER BY ano DESC
      `;

      const anos = anosRaw.map((a) => Number(a.ano));

      // Se não houver dados, retornar pelo menos o ano atual
      if (anos.length === 0) {
        anos.push(new Date().getFullYear());
      }

      return res.status(200).json(anos);
    } catch (error) {
      console.error("Erro ao listar anos:", error);
      return res.status(500).json({ erro: "Erro ao listar anos" });
    }
  },
};
