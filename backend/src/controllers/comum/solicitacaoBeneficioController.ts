// backend/src/controllers/comum/solicitacaoBeneficioController.ts - VERSÃO CORRIGIDA
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createGenericController } from "../GenericController";
import { 
  INCLUDE_SOLICITACAO_BASICO,
  INCLUDE_SOLICITACAO_COMPLETO,
  INCLUDE_LISTAGEM,
  WHERE_APENAS_PRODUTORES,
  WHERE_PROGRAMAS_AGRICULTURA,
  WHERE_PESSOAS_ATIVAS
} from "../../utils/includeRelations";

const prisma = new PrismaClient();

// Função de validação
const validateSolicitacao = (data: any) => {
  const errors = [];

  if (!data.pessoaId || data.pessoaId === 0) {
    errors.push("Pessoa é obrigatória");
  }

  if (!data.programaId || data.programaId === 0) {
    errors.push("Programa é obrigatório");
  }

  if (!data.datasolicitacao) {
    errors.push("Data da solicitação é obrigatória");
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

// Controlador genérico
const genericController = createGenericController({
  modelName: "solicitacaoBeneficio",
  displayName: "Solicitação de Benefício",
  orderBy: { datasolicitacao: "desc" },
  validateCreate: validateSolicitacao,
  validateUpdate: validateSolicitacao,
});

export const solicitacaoBeneficioController = {
  ...genericController,

  // 🔧 CORRIGIDO: Usar as constantes e campos corretos
  findAll: async (req: Request, res: Response) => {
    try {
      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        include: INCLUDE_SOLICITACAO_BASICO, // 🆕 Usando constante
        orderBy: { datasolicitacao: "desc" },
      });

      return res.status(200).json(solicitacoes);
    } catch (error) {
      console.error("Erro ao listar solicitações de benefício:", error);
      return res.status(500).json({
        erro: "Erro ao listar solicitações de benefício",
      });
    }
  },

  // 🔧 CORRIGIDO: findById com dados completos
  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const solicitacao = await prisma.solicitacaoBeneficio.findUnique({
        where: { id: Number(id) },
        include: INCLUDE_SOLICITACAO_COMPLETO, // 🆕 Dados completos para detalhes
      });

      if (!solicitacao) {
        return res.status(404).json({ 
          erro: "Solicitação de benefício não encontrada" 
        });
      }

      return res.status(200).json(solicitacao);
    } catch (error) {
      console.error("Erro ao buscar solicitação de benefício:", error);
      return res.status(500).json({ 
        erro: "Erro ao buscar solicitação de benefício" 
      });
    }
  },

  // 🆕 NOVO: Buscar solicitações por pessoa
  findByPessoa: async (req: Request, res: Response) => {
    try {
      const { pessoaId } = req.params;

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: { pessoaId: Number(pessoaId) },
        include: INCLUDE_LISTAGEM, // Dados básicos para listagem
        orderBy: { datasolicitacao: "desc" },
      });

      return res.status(200).json(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações por pessoa:", error);
      return res.status(500).json({
        erro: "Erro ao buscar solicitações por pessoa",
      });
    }
  },

  // 🆕 NOVO: Buscar solicitações por programa
  findByPrograma: async (req: Request, res: Response) => {
    try {
      const { programaId } = req.params;

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: { programaId: Number(programaId) },
        include: INCLUDE_LISTAGEM,
        orderBy: { datasolicitacao: "desc" },
      });

      return res.status(200).json(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações por programa:", error);
      return res.status(500).json({
        erro: "Erro ao buscar solicitações por programa",
      });
    }
  },

  // 🆕 NOVO: Buscar apenas solicitações de produtores rurais
  findProdutoresRurais: async (req: Request, res: Response) => {
    try {
      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: WHERE_APENAS_PRODUTORES, // 🆕 Filtro por produtores
        include: INCLUDE_SOLICITACAO_COMPLETO,
        orderBy: { datasolicitacao: "desc" },
      });

      return res.status(200).json(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações de produtores:", error);
      return res.status(500).json({
        erro: "Erro ao buscar solicitações de produtores rurais",
      });
    }
  },

  // 🆕 NOVO: Buscar solicitações por secretaria
  findBySecretaria: async (req: Request, res: Response) => {
    try {
      const { secretaria } = req.params;

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: {
          programa: {
            secretaria: secretaria as any, // ADMIN, OBRAS, AGRICULTURA
          },
        },
        include: INCLUDE_SOLICITACAO_BASICO,
        orderBy: { datasolicitacao: "desc" },
      });

      return res.status(200).json(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações por secretaria:", error);
      return res.status(500).json({
        erro: "Erro ao buscar solicitações por secretaria",
      });
    }
  },

  // 🔧 CORRIGIDO: Validação específica antes de criar
  create: async (req: Request, res: Response) => {
    try {
      const validation = validateSolicitacao(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: validation.errors,
        });
      }

      // 🆕 Verificar se pessoa existe e se é produtor (para programas de agricultura)
      const pessoa = await prisma.pessoa.findUnique({
        where: { id: Number(req.body.pessoaId) },
      });

      if (!pessoa) {
        return res.status(400).json({
          erro: "Pessoa não encontrada",
        });
      }

      // Verificar programa
      const programa = await prisma.programa.findUnique({
        where: { id: Number(req.body.programaId) },
      });

      if (!programa) {
        return res.status(400).json({
          erro: "Programa não encontrado",
        });
      }

      // 🆕 Validação: programas de agricultura só para produtores rurais
      if (programa.secretaria === "AGRICULTURA" && !pessoa.produtorRural) {
        return res.status(400).json({
          erro: "Programas de agricultura são exclusivos para produtores rurais",
        });
      }

      // Criar solicitação
      const solicitacao = await prisma.solicitacaoBeneficio.create({
        data: {
          ...req.body,
          datasolicitacao: new Date(req.body.datasolicitacao),
        },
        include: INCLUDE_SOLICITACAO_COMPLETO,
      });

      return res.status(201).json(solicitacao);
    } catch (error: any) {
      console.error("Erro ao criar solicitação de benefício:", error);
      
      if (error.code === "P2002") {
        return res.status(400).json({
          erro: "Já existe uma solicitação com esses dados",
        });
      }

      return res.status(500).json({
        erro: "Erro ao criar solicitação de benefício",
      });
    }
  },

  // 🆕 NOVO: Estatísticas das solicitações
  getEstatisticas: async (req: Request, res: Response) => {
    try {
      const [
        total,
        pendentes,
        aprovadas,
        rejeitadas,
        deProdutores,
        porSecretaria,
      ] = await Promise.all([
        // Total de solicitações
        prisma.solicitacaoBeneficio.count(),
        
        // Por status
        prisma.solicitacaoBeneficio.count({
          where: { status: "pendente" },
        }),
        
        prisma.solicitacaoBeneficio.count({
          where: { status: "aprovada" },
        }),
        
        prisma.solicitacaoBeneficio.count({
          where: { status: "rejeitada" },
        }),
        
        // De produtores rurais
        prisma.solicitacaoBeneficio.count({
          where: WHERE_APENAS_PRODUTORES,
        }),
        
        // Por secretaria
        prisma.$queryRaw`
          SELECT p.secretaria, COUNT(*)::int as total
          FROM "SolicitacaoBeneficio" sb
          INNER JOIN "Programa" p ON p.id = sb."programaId"
          GROUP BY p.secretaria
        `,
      ]);

      return res.status(200).json({
        total,
        porStatus: {
          pendentes,
          aprovadas,
          rejeitadas,
        },
        deProdutores,
        porSecretaria,
      });
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
      return res.status(500).json({
        erro: "Erro ao calcular estatísticas",
      });
    }
  },
};