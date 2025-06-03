// backend/src/controllers/auth/authController.ts - ARQUIVO COMPLETO
import { Request, Response } from "express";
import { PrismaClient, TipoPerfil, ModuloSistema, AcaoPermissao } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const prisma = new PrismaClient();

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token é obrigatório"),
});

// Interface para o usuário autenticado
interface AuthenticatedUser {
  id: number;
  nome: string;
  email: string;
  perfil: {
    id: number;
    nome: TipoPerfil;
    descricao: string | null;
  };
  permissions: Array<{
    modulo: ModuloSistema;
    acao: AcaoPermissao;
  }>;
}

// Função para gerar tokens
const generateTokens = (userId: number) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET || "sigma_secret_key",
    { expiresIn: "15m" } // Token de acesso expira em 15 minutos
  );

  const refreshToken = jwt.sign(
    { userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET || "sigma_refresh_secret_key",
    { expiresIn: "7d" } // Refresh token expira em 7 dias
  );

  return { accessToken, refreshToken };
};

// Função para buscar usuário com permissões
const getUserWithPermissions = async (userId: number): Promise<AuthenticatedUser | null> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId, ativo: true },
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

  if (!usuario) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: {
      id: usuario.perfil.id,
      nome: usuario.perfil.nome,
      descricao: usuario.perfil.descricao,
    },
    permissions: usuario.perfil.permissoes.map((p) => ({
      modulo: p.permissao.modulo,
      acao: p.permissao.acao,
    })),
  };
};

export const authController = {
  // Login
  login: async (req: Request, res: Response) => {
    try {
      // Validar dados de entrada
      const { email, password } = loginSchema.parse(req.body);

      // Buscar usuário
      const usuario = await prisma.usuario.findUnique({
        where: { email },
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

      // Log de auditoria para tentativa de login
      await prisma.auditoriaLogin.create({
        data: {
          email,
          sucesso: false,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          motivo: !usuario ? "usuario_nao_encontrado" : "senha_incorreta",
        },
      });

      // Verificar se usuário existe
      if (!usuario) {
        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }

      // Verificar se usuário está ativo
      if (!usuario.ativo) {
        await prisma.auditoriaLogin.updateMany({
          where: { email, createdAt: { gte: new Date(Date.now() - 1000) } },
          data: { motivo: "usuario_inativo" },
        });

        return res.status(401).json({
          error: "Usuário inativo",
        });
      }

      // Verificar se usuário está bloqueado
      if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
        await prisma.auditoriaLogin.updateMany({
          where: { email, createdAt: { gte: new Date(Date.now() - 1000) } },
          data: { motivo: "usuario_bloqueado" },
        });

        return res.status(401).json({
          error: "Usuário temporariamente bloqueado",
        });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(password, usuario.senha);
      if (!senhaValida) {
        // Incrementar tentativas de login
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            tentativasLogin: { increment: 1 },
            // Bloquear após 5 tentativas por 30 minutos
            bloqueadoAte: usuario.tentativasLogin >= 4 
              ? new Date(Date.now() + 30 * 60 * 1000) 
              : undefined,
          },
        });

        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }

      // Login bem-sucedido - resetar tentativas
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          ultimoLogin: new Date(),
          tentativasLogin: 0,
          bloqueadoAte: null,
        },
      });

      // Gerar tokens
      const { accessToken, refreshToken } = generateTokens(usuario.id);

      // Salvar sessão
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
      await prisma.usuarioSessao.create({
        data: {
          usuarioId: usuario.id,
          token: accessToken,
          refreshToken,
          expiresAt,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        },
      });

      // Log de sucesso
      await prisma.auditoriaLogin.updateMany({
        where: { email, createdAt: { gte: new Date(Date.now() - 1000) } },
        data: { sucesso: true, motivo: "login_sucesso" },
      });

      // Buscar dados completos do usuário
      const userData = await getUserWithPermissions(usuario.id);

      return res.status(200).json({
        message: "Login realizado com sucesso",
        user: userData,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      console.error("Erro no login:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
      });
    }
  },

  // Refresh Token
  refreshToken: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      // Verificar se refresh token é válido
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || "sigma_refresh_secret_key"
      ) as { userId: number; type: string };

      if (decoded.type !== "refresh") {
        return res.status(401).json({ error: "Token inválido" });
      }

      // Verificar se sessão existe e é válida
      const sessao = await prisma.usuarioSessao.findUnique({
        where: { refreshToken },
        include: { usuario: true },
      });

      if (!sessao || sessao.revokedAt || sessao.expiresAt < new Date()) {
        return res.status(401).json({ error: "Sessão inválida ou expirada" });
      }

      // Gerar novos tokens
      const tokens = generateTokens(sessao.usuarioId);

      // Atualizar sessão
      await prisma.usuarioSessao.update({
        where: { id: sessao.id },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Buscar dados do usuário
      const userData = await getUserWithPermissions(sessao.usuarioId);

      return res.status(200).json({
        user: userData,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Token inválido" });
      }

      console.error("Erro no refresh token:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  },

  // Logout
  logout: async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido" });
      }

      const token = authHeader.split(" ")[1];

      // Revogar sessão
      await prisma.usuarioSessao.updateMany({
        where: { token },
        data: { revokedAt: new Date() },
      });

      return res.status(200).json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error("Erro no logout:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  },

  // Verificar token (middleware)
  verifyToken: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const userData = await getUserWithPermissions(userId);

      if (!userData) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      return res.status(200).json({ user: userData });
    } catch (error) {
      console.error("Erro na verificação do token:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
};