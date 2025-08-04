// backend/src/controllers/comum/solicitacaoBeneficioController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

// Status das solicitações
export enum StatusSolicitacao {
  PENDENTE = "pendente",
  EM_ANALISE = "em_analise",
  APROVADA = "aprovada",
  REJEITADA = "rejeitada",
  CANCELADA = "cancelada"
}

// Interface para dados da solicitação
export interface SolicitacaoBeneficioData {
  pessoaId: number;
  programaId: number;
  observacoes?: string;
  status?: string;
}

// Controlador com métodos genéricos
const genericController = createGenericController({
  modelName: "solicitacaoBeneficio",
  displayName: "Solicitação de Benefício",
  orderBy: { datasolicitacao: "desc" },

  validateCreate: (data: SolicitacaoBeneficioData) => {
    const errors = [];
    
    if (!data.pessoaId) {
      errors.push("Pessoa é obrigatória");
    }
    
    if (!data.programaId) {
      errors.push("Programa é obrigatório");
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  },
  validateUpdate: (data: SolicitacaoBeneficioData) => {
    const errors = [];
    
    // Para atualização, não há validações específicas além das básicas
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
});

// Métodos específicos
export const solicitacaoBeneficioController = {
  ...genericController,

  findAll: async (req: Request, res: Response) => {
      try {
        const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
          include: {
            pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              
            }
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true
            }
          }
          },
          orderBy: { datasolicitacao: "asc" },
        });
  
        return res.status(200).json(solicitacoes);
      } catch (error) {
        console.error("Erro ao listar solicitações:", error);
        return res.status(500).json({
          erro: "Erro ao listar solicitações",
        });
      }
    },

  // Buscar solicitações por pessoa
  async getByPessoa(req: Request, res: Response) {
    try {
      const { pessoaId } = req.params;

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: { pessoaId: parseInt(pessoaId) },
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              produtor: {
                select: {
                  id: true,
                  dap: true,
                  tipoProdutor: true
                }
              }
            }
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true
            }
          }
        },
        orderBy: { datasolicitacao: "desc" }
      });

      res.json(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações por pessoa:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // Buscar solicitações por programa
  async getByPrograma(req: Request, res: Response) {
    try {
      const { programaId } = req.params;

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: { programaId: parseInt(programaId) },
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              produtor: {
                select: {
                  id: true,
                  dap: true,
                  tipoProdutor: true
                }
              }
            }
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true
            }
          }
        },
        orderBy: { datasolicitacao: "desc" }
      });

      res.json(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações por programa:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // Buscar solicitações por secretaria
  async getBySecretaria(req: Request, res: Response) {
    try {
      const { secretaria } = req.params;

      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        where: {
          programa: {
            secretaria: secretaria.toUpperCase() as any
          }
        },
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              produtor: {
                select: {
                  id: true,
                  dap: true,
                  tipoProdutor: true
                }
              }
            }
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true
            }
          }
        },
        orderBy: { datasolicitacao: "desc" }
      });

      res.json(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações por secretaria:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // Alterar status da solicitação
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, observacoes } = req.body;

      const solicitacao = await prisma.solicitacaoBeneficio.update({
        where: { id: parseInt(id) },
        data: {
          status,
          observacoes
        },
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true
            }
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true
            }
          }
        }
      });

      res.json({
        sucesso: true,
        mensagem: "Status da solicitação atualizado com sucesso",
        solicitacao
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // Obter estatísticas das solicitações
  async getEstatisticas(req: Request, res: Response) {
    try {
      const [
        totalSolicitacoes,
        porStatus,
        porSecretaria,
        porPrograma
      ] = await Promise.all([
        // Total de solicitações
        prisma.solicitacaoBeneficio.count(),
        
        // Por status
        prisma.solicitacaoBeneficio.groupBy({
          by: ['status'],
          _count: { id: true }
        }),
        
        // Por secretaria
        prisma.solicitacaoBeneficio.groupBy({
          by: ['programaId'],
          _count: { id: true }
        }),
        
        // Programas mais solicitados
        prisma.solicitacaoBeneficio.groupBy({
          by: ['programaId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5
        })
      ]);

      // Buscar nomes dos programas
      const programaIds = porPrograma.map(p => p.programaId);
      const programas = await prisma.programa.findMany({
        where: { id: { in: programaIds } },
        select: { id: true, nome: true, secretaria: true }
      });

      const programasComNomes = porPrograma.map(p => ({
        ...p,
        programa: programas.find(prog => prog.id === p.programaId)
      }));

      res.json({
        totalSolicitacoes,
        porStatus,
        porSecretaria,
        programasMaisSolicitados: programasComNomes
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }
};