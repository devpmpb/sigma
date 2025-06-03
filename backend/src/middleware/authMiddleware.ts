// backend/src/middleware/authMiddleware.ts - ARQUIVO COMPLETO
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, ModuloSistema, AcaoPermissao } from "@prisma/client";

const prisma = new PrismaClient();

// Estender a interface Request para incluir dados do usuário
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userPermissions?: Array<{ modulo: ModuloSistema; acao: AcaoPermissao }>;
    }
  }
}

// Middleware para verificar se o usuário está autenticado
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Token de acesso requerido" });
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: "Token de acesso requerido" });
    }

    // Verificar se o token é válido
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "sigma_secret_key"
    ) as { userId: number };

    // Verificar se a sessão ainda é válida
    const sessao = await prisma.usuarioSessao.findFirst({
      where: {
        token,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        usuario: {
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
        },
      },
    });

    if (!sessao || !sessao.usuario.ativo) {
      return res.status(401).json({ error: "Sessão inválida ou expirada" });
    }

    // Adicionar dados do usuário à requisição
    req.userId = sessao.usuario.id;
    req.userPermissions = sessao.usuario.perfil.permissoes.map((p) => ({
      modulo: p.permissao.modulo,
      acao: p.permissao.acao,
    }));

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Token inválido" });
    }

    console.error("Erro no middleware de autenticação:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Middleware para verificar permissões específicas
export const requirePermission = (modulo: ModuloSistema, acao: AcaoPermissao) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userPermissions) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Verificar se o usuário tem a permissão específica
    const hasPermission = req.userPermissions.some(
      (permission) => permission.modulo === modulo && permission.acao === acao
    );

    // Verificar se é admin (tem acesso total)
    const isAdmin = req.userPermissions.some(
      (permission) => permission.modulo === ModuloSistema.ADMIN
    );

    if (!hasPermission && !isAdmin) {
      return res.status(403).json({
        error: "Acesso negado",
        message: `Permissão requerida: ${modulo}:${acao}`,
      });
    }

    next();
  };
};

// Middleware para verificar se o usuário tem acesso a um módulo
export const requireModuleAccess = (modulo: ModuloSistema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userPermissions) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Verificar se o usuário tem pelo menos uma permissão no módulo
    const hasModuleAccess = req.userPermissions.some(
      (permission) => permission.modulo === modulo
    );

    // Verificar se é admin
    const isAdmin = req.userPermissions.some(
      (permission) => permission.modulo === ModuloSistema.ADMIN
    );

    if (!hasModuleAccess && !isAdmin) {
      return res.status(403).json({
        error: "Acesso negado",
        message: `Acesso requerido ao módulo: ${modulo}`,
      });
    }

    next();
  };
};

// Middleware opcional para autenticação (não falha se não autenticado)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1];

      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "sigma_secret_key"
        ) as { userId: number };

        const sessao = await prisma.usuarioSessao.findFirst({
          where: {
            token,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          include: {
            usuario: {
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
            },
          },
        });

        if (sessao && sessao.usuario.ativo) {
          req.userId = sessao.usuario.id;
          req.userPermissions = sessao.usuario.perfil.permissoes.map((p) => ({
            modulo: p.permissao.modulo,
            acao: p.permissao.acao,
          }));
        }
      }
    }

    next();
  } catch (error) {
    // Se houver erro na autenticação opcional, continua sem autenticar
    next();
  }
};