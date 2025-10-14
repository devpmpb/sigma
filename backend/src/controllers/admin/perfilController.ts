// backend/src/controllers/admin/perfilController.ts - ARQUIVO COMPLETO
import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { TipoPerfil } from "@prisma/client";

export const perfilController = {
  // Listar todos os perfis
  findAll: async (req: Request, res: Response) => {
    try {
      const perfis = await prisma.perfil.findMany({
        include: {
          permissoes: {
            include: {
              permissao: true,
            },
          },
          _count: {
            select: { usuarios: true },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(perfis);
    } catch (error) {
      console.error("Erro ao listar perfis:", error);
      return res.status(500).json({
        erro: "Erro ao listar perfis",
      });
    }
  },

  // Buscar perfil por ID
  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const perfil = await prisma.perfil.findUnique({
        where: { id: Number(id) },
        include: {
          permissoes: {
            include: {
              permissao: true,
            },
          },
          usuarios: {
            select: {
              id: true,
              nome: true,
              email: true,
              ativo: true,
            },
          },
        },
      });

      if (!perfil) {
        return res.status(404).json({ erro: "Perfil não encontrado" });
      }

      return res.status(200).json(perfil);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      return res.status(500).json({
        erro: "Erro ao buscar perfil",
      });
    }
  },

  // Buscar perfil por nome (usando ENUM)
  findByName: async (req: Request, res: Response) => {
    try {
      const { nome } = req.params;

      // Validar se o nome do perfil é válido
      if (!Object.values(TipoPerfil).includes(nome as TipoPerfil)) {
        return res.status(400).json({ erro: "Nome de perfil inválido" });
      }

      const perfil = await prisma.perfil.findUnique({
        where: { nome: nome as TipoPerfil },
        include: {
          permissoes: {
            include: {
              permissao: true,
            },
          },
          usuarios: {
            select: {
              id: true,
              nome: true,
              email: true,
              ativo: true,
            },
          },
          _count: {
            select: { usuarios: true },
          },
        },
      });

      if (!perfil) {
        return res.status(404).json({ erro: "Perfil não encontrado" });
      }

      return res.status(200).json(perfil);
    } catch (error) {
      console.error("Erro ao buscar perfil por nome:", error);
      return res.status(500).json({
        erro: "Erro ao buscar perfil por nome",
      });
    }
  },

  // Listar perfis ativos
  findActive: async (req: Request, res: Response) => {
    try {
      const perfis = await prisma.perfil.findMany({
        where: { ativo: true },
        include: {
          _count: {
            select: { usuarios: true },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(perfis);
    } catch (error) {
      console.error("Erro ao listar perfis ativos:", error);
      return res.status(500).json({
        erro: "Erro ao listar perfis ativos",
      });
    }
  },

  // Obter permissões de um perfil
  getPermissions: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const perfil = await prisma.perfil.findUnique({
        where: { id: Number(id) },
        include: {
          permissoes: {
            include: {
              permissao: true,
            },
          },
        },
      });

      if (!perfil) {
        return res.status(404).json({ erro: "Perfil não encontrado" });
      }

      const permissoes = perfil.permissoes.map((p) => ({
        id: p.permissao.id,
        modulo: p.permissao.modulo,
        acao: p.permissao.acao,
        descricao: p.permissao.descricao,
      }));

      return res.status(200).json({
        perfil: {
          id: perfil.id,
          nome: perfil.nome,
          descricao: perfil.descricao,
        },
        permissoes,
      });
    } catch (error) {
      console.error("Erro ao buscar permissões do perfil:", error);
      return res.status(500).json({
        erro: "Erro ao buscar permissões do perfil",
      });
    }
  },

  // Estatísticas dos perfis
  getStats: async (req: Request, res: Response) => {
    try {
      const totalPerfis = await prisma.perfil.count();
      const perfisAtivos = await prisma.perfil.count({ where: { ativo: true } });

      const estatisticasPorPerfil = await prisma.perfil.findMany({
        include: {
          _count: {
            select: { 
              usuarios: true,
              permissoes: true,
            },
          },
        },
      });

      const usuariosPorPerfil = estatisticasPorPerfil.map((perfil) => ({
        perfil: perfil.nome,
        totalUsuarios: perfil._count.usuarios,
        totalPermissoes: perfil._count.permissoes,
        descricao: perfil.descricao,
      }));

      return res.status(200).json({
        totalPerfis,
        perfisAtivos,
        usuariosPorPerfil,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas dos perfis:", error);
      return res.status(500).json({
        erro: "Erro ao buscar estatísticas dos perfis",
      });
    }
  },
};