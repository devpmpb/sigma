import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { TipoPerfil } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Schemas de validação com ENUMs
const createUserSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  perfilId: z.number().int().positive("Perfil é obrigatório"),
  ativo: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  perfilId: z.number().int().positive("Perfil é obrigatório").optional(),
  ativo: z.boolean().optional(),
});

const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
    novaSenha: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
    confirmarSenha: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: "Nova senha e confirmação devem ser iguais",
    path: ["confirmarSenha"],
  });

export const usuarioController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const { ativo, perfilId } = req.query;

      const whereClause: any = {};

      if (ativo !== undefined) {
        whereClause.ativo = ativo === "true";
      }

      if (perfilId) {
        whereClause.perfilId = Number(perfilId);
      }

      const usuarios = await prisma.usuario.findMany({
        where: whereClause,
        include: {
          perfil: true,
        },
        orderBy: { nome: "asc" },
      });

      // Remover senhas da resposta
      const usuariosSemSenha = usuarios.map(({ senha, ...usuario }) => usuario);

      return res.status(200).json(usuariosSemSenha);
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      return res.status(500).json({
        erro: "Erro ao listar usuários",
      });
    }
  },

  // Buscar usuário por ID
  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const usuario = await prisma.usuario.findUnique({
        where: { id: Number(id) },
        include: {
          perfil: {
            include: {
              permissoes: {
                include: {
                  permissao: true,
                },
              },
            },
          },
        },
      });

      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      // Remover senha da resposta
      const { senha, ...usuarioSemSenha } = usuario;

      return res.status(200).json(usuarioSemSenha);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return res.status(500).json({
        erro: "Erro ao buscar usuário",
      });
    }
  },

  // Buscar usuários por perfil
  findByProfile: async (req: Request, res: Response) => {
    try {
      const { perfilNome } = req.params;

      // Validar se o perfil existe
      if (!Object.values(TipoPerfil).includes(perfilNome as TipoPerfil)) {
        return res.status(400).json({ erro: "Tipo de perfil inválido" });
      }

      const usuarios = await prisma.usuario.findMany({
        where: {
          perfil: {
            nome: perfilNome as TipoPerfil,
          },
        },
        include: {
          perfil: true,
        },
        orderBy: { nome: "asc" },
      });

      // Remover senhas da resposta
      const usuariosSemSenha = usuarios.map(({ senha, ...usuario }) => usuario);

      return res.status(200).json(usuariosSemSenha);
    } catch (error) {
      console.error("Erro ao buscar usuários por perfil:", error);
      return res.status(500).json({
        erro: "Erro ao buscar usuários por perfil",
      });
    }
  },

  // Criar novo usuário
  create: async (req: Request, res: Response) => {
    try {
      const data = createUserSchema.parse(req.body);

      // Verificar se email já existe
      const emailExistente = await prisma.usuario.findUnique({
        where: { email: data.email },
      });

      if (emailExistente) {
        return res.status(400).json({
          erro: "Já existe um usuário com este email",
        });
      }

      // Verificar se perfil existe
      const perfil = await prisma.perfil.findUnique({
        where: { id: data.perfilId },
      });

      if (!perfil) {
        return res.status(400).json({
          erro: "Perfil não encontrado",
        });
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(data.senha, 10);

      // Criar usuário
      const novoUsuario = await prisma.usuario.create({
        data: {
          ...data,
          senha: senhaHash,
        },
        include: {
          perfil: true,
        },
      });

      // Remover senha da resposta
      const { senha, ...usuarioSemSenha } = novoUsuario;

      return res.status(201).json(usuarioSemSenha);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(error);
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: error.errors,
        });
      }

      console.error("Erro ao criar usuário:", error);
      return res.status(500).json({ erro: "Erro ao criar usuário" });
    }
  },

  // Atualizar usuário
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateUserSchema.parse(req.body);

      // Verificar se usuário existe
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id: Number(id) },
      });

      if (!usuarioExistente) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      // Verificar se email já existe (se estiver sendo alterado)
      if (data.email && data.email !== usuarioExistente.email) {
        const emailExistente = await prisma.usuario.findUnique({
          where: { email: data.email },
        });

        if (emailExistente) {
          return res.status(400).json({
            erro: "Já existe outro usuário com este email",
          });
        }
      }

      // Verificar se perfil existe (se estiver sendo alterado)
      if (data.perfilId) {
        const perfil = await prisma.perfil.findUnique({
          where: { id: data.perfilId },
        });

        if (!perfil) {
          return res.status(400).json({
            erro: "Perfil não encontrado",
          });
        }
      }

      const usuarioAtualizado = await prisma.usuario.update({
        where: { id: Number(id) },
        data,
        include: {
          perfil: true,
        },
      });

      // Remover senha da resposta
      const { senha, ...usuarioSemSenha } = usuarioAtualizado;

      return res.status(200).json(usuarioSemSenha);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: error.errors,
        });
      }

      console.error("Erro ao atualizar usuário:", error);
      return res.status(500).json({
        erro: "Erro ao atualizar usuário",
      });
    }
  },

  // Alterar status do usuário
  toggleStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const usuario = await prisma.usuario.findUnique({
        where: { id: Number(id) },
      });

      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      // Não permitir desativar o próprio usuário
      if (Number(id) === req.userId) {
        return res.status(400).json({
          erro: "Você não pode desativar sua própria conta",
        });
      }

      await prisma.usuario.update({
        where: { id: Number(id) },
        data: { ativo: !usuario.ativo },
      });

      return res.status(200).json({
        mensagem: `Usuário ${usuario.ativo ? "desativado" : "ativado"} com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao alterar status do usuário:", error);
      return res.status(500).json({
        erro: "Erro ao alterar status do usuário",
      });
    }
  },

  // Alterar senha
  changePassword: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = changePasswordSchema.parse(req.body);

      const usuario = await prisma.usuario.findUnique({
        where: { id: Number(id) },
      });

      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      // Verificar se é o próprio usuário ou admin
      if (Number(id) !== req.userId) {
        // Verificar se o usuário atual é admin
        const isAdmin = req.userPermissions?.some((p) => p.modulo === "ADMIN");

        if (!isAdmin) {
          return res.status(403).json({
            erro: "Você só pode alterar sua própria senha",
          });
        }
      }

      // Verificar senha atual (apenas se for o próprio usuário)
      if (Number(id) === req.userId) {
        const senhaValida = await bcrypt.compare(
          data.senhaAtual,
          usuario.senha
        );
        if (!senhaValida) {
          return res.status(400).json({
            erro: "Senha atual incorreta",
          });
        }
      }

      // Hash da nova senha
      const novaSenhaHash = await bcrypt.hash(data.novaSenha, 10);

      await prisma.usuario.update({
        where: { id: Number(id) },
        data: { senha: novaSenhaHash },
      });

      // Revogar todas as sessões do usuário
      await prisma.usuarioSessao.updateMany({
        where: { usuarioId: Number(id) },
        data: { revokedAt: new Date() },
      });

      return res.status(200).json({
        mensagem: "Senha alterada com sucesso",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: error.errors,
        });
      }

      console.error("Erro ao alterar senha:", error);
      return res.status(500).json({
        erro: "Erro ao alterar senha",
      });
    }
  },

  // Reset de senha (gera nova senha aleatória)
  resetPassword: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const usuario = await prisma.usuario.findUnique({
        where: { id: Number(id) },
      });

      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      // Gerar nova senha aleatória
      const novaSenha = Math.random().toString(36).slice(-8);
      const senhaHash = await bcrypt.hash(novaSenha, 10);

      await prisma.usuario.update({
        where: { id: Number(id) },
        data: { senha: senhaHash },
      });

      // Revogar todas as sessões do usuário
      await prisma.usuarioSessao.updateMany({
        where: { usuarioId: Number(id) },
        data: { revokedAt: new Date() },
      });

      return res.status(200).json({
        mensagem: "Senha resetada com sucesso",
        novaSenha, // Em produção, enviar por email
      });
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      return res.status(500).json({
        erro: "Erro ao resetar senha",
      });
    }
  },

  // Estatísticas de usuários
  getStats: async (req: Request, res: Response) => {
    try {
      const total = await prisma.usuario.count();
      const ativos = await prisma.usuario.count({ where: { ativo: true } });
      const inativos = total - ativos;

      const porPerfil = await prisma.perfil.findMany({
        include: {
          _count: {
            select: { usuarios: true },
          },
        },
      });

      const estatisticas = {
        total,
        ativos,
        inativos,
        porPerfil: porPerfil.map((p) => ({
          perfil: p.nome,
          count: p._count.usuarios,
        })),
      };

      return res.status(200).json(estatisticas);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return res.status(500).json({
        erro: "Erro ao buscar estatísticas",
      });
    }
  },
};
