// backend/src/controllers/comum/solicitacaoBeneficioController.ts
import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { createGenericController } from "../GenericController";
import {
  calcularBeneficio,
  verificarLimitesPeriodo,
} from "../../services/calculoBeneficioService";
import {
  registrarMudancaStatus,
  buscarHistoricoFormatado,
} from "../../services/historicoService";

// Status das solicitações
export enum StatusSolicitacao {
  PENDENTE = "pendente",
  EM_ANALISE = "em_analise",
  APROVADA = "aprovada",
  REJEITADA = "rejeitada",
  CANCELADA = "cancelada",
}

// Interface para dados da solicitação
export interface SolicitacaoBeneficioData {
  pessoaId: number;
  programaId: number;
  observacoes?: string;
  status?: string;
}

// Controlador com métodos genéricos
// NÃO colocamos validações específicas aqui porque o GenericController é usado por TODOS os models
const genericController = createGenericController({
  modelName: "solicitacaoBeneficio",
  displayName: "Solicitação de Benefício",
  orderBy: { datasolicitacao: "desc" },
});

// Métodos específicos
export const solicitacaoBeneficioController = {
  ...genericController,

  findAll: async (req: Request, res: Response) => {
    try {
      const { page, pageSize } = req.query;

      // Parâmetros de paginação
      const pageNum = page ? parseInt(page as string, 10) : undefined;
      const pageSizeNum = pageSize
        ? parseInt(pageSize as string, 10)
        : undefined;

      const includeConfig = {
        pessoa: {
          select: {
            id: true,
            nome: true,
            cpfCnpj: true,
          },
        },
        programa: {
          select: {
            id: true,
            nome: true,
            tipoPrograma: true,
            secretaria: true,
            ativo: true,
          },
        },
        regraAplicada: true,
      };

      // Se paginação foi solicitada
      if (pageNum !== undefined && pageSizeNum !== undefined) {
        const skip = (pageNum - 1) * pageSizeNum;
        const take = pageSizeNum;

        // Buscar registros paginados e total
        const [solicitacoes, total] = await Promise.all([
          prisma.solicitacaoBeneficio.findMany({
            include: includeConfig,
            orderBy: { datasolicitacao: "desc" },
            skip,
            take,
          }),
          prisma.solicitacaoBeneficio.count(),
        ]);

        // Retornar com metadados de paginação
        return res.status(200).json({
          data: solicitacoes,
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            total,
            totalPages: Math.ceil(total / pageSizeNum),
          },
        });
      }

      // Sem paginação - retornar todos os registros
      const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
        include: includeConfig,
        orderBy: { datasolicitacao: "desc" },
      });

      return res.status(200).json(solicitacoes);
    } catch (error) {
      console.error("Erro ao listar solicitações:", error);
      return res.status(500).json({
        erro: "Erro ao listar solicitações",
      });
    }
  },

  // SOBRESCREVER: Método findById com relacionamentos
  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const solicitacao = await prisma.solicitacaoBeneficio.findUnique({
        where: { id: parseInt(id) },
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              telefone: true,
              email: true,
              isProdutor: true,
            },
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true,
              ativo: true,
              descricao: true,
              leiNumero: true,
            },
          },
          regraAplicada: true,
        },
      });

      if (!solicitacao) {
        return res.status(404).json({ erro: "Solicitação não encontrada" });
      }

      return res.status(200).json(solicitacao);
    } catch (error) {
      console.error("Erro ao buscar solicitação:", error);
      return res.status(500).json({
        erro: "Erro ao buscar solicitação",
      });
    }
  },

  // SOBRESCREVER: Método create com validações assíncronas
  async create(req: Request, res: Response) {
    try {
      const data = req.body;

      const errors: string[] = [];

      // Validações síncronas básicas
      if (!data.pessoaId) {
        errors.push("Pessoa é obrigatória");
      }

      if (!data.programaId) {
        errors.push("Programa é obrigatório");
      }

      if (errors.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: errors,
        });
      }

      // Validação assíncrona 1: Verificar se programa existe e está ativo
      const programa = await prisma.programa.findUnique({
        where: { id: data.programaId },
        select: { ativo: true, nome: true },
      });

      if (!programa) {
        errors.push("Programa não encontrado");
      } else if (!programa.ativo) {
        errors.push(
          `O programa "${programa.nome}" está inativo e não pode receber novas solicitações`
        );
      }

      // Validação assíncrona 2: Verificar duplicidade
      const solicitacaoExistente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId: data.pessoaId,
          programaId: data.programaId,
          status: {
            in: ["pendente", "em_analise"],
          },
        },
        select: {
          id: true,
          status: true,
          datasolicitacao: true,
        },
      });

      if (solicitacaoExistente) {
        const dataFormatada = new Date(
          solicitacaoExistente.datasolicitacao
        ).toLocaleDateString("pt-BR");
        errors.push(
          `Já existe uma solicitação ativa (${solicitacaoExistente.status}) ` +
            `para este programa criada em ${dataFormatada}. ` +
            `Aguarde a conclusão da solicitação anterior ou cancele-a antes de criar uma nova.`
        );
      }

      if (errors.length > 0) {
        return res.status(400).json({
          erro: "Validação falhou",
          detalhes: errors,
        });
      }

      // Criar solicitação
      const solicitacao = await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId: data.pessoaId,
          programaId: data.programaId,
          observacoes: data.observacoes,
          status: data.status || "pendente",
        },
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
            },
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true,
            },
          },
        },
      });

      // Registrar no histórico
      await registrarMudancaStatus(
        solicitacao.id,
        null,
        solicitacao.status,
        undefined,
        "Solicitação criada"
      );

      return res.status(201).json(solicitacao);
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      return res.status(500).json({ erro: "Erro interno do servidor" });
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
            },
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true,
            },
          },
        },
        orderBy: { datasolicitacao: "desc" },
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
            },
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true,
            },
          },
        },
        orderBy: { datasolicitacao: "desc" },
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
            secretaria: secretaria.toUpperCase() as any,
          },
        },
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
            },
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true,
            },
          },
        },
        orderBy: { datasolicitacao: "desc" },
      });

      res.json(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações por secretaria:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // NOVO: Calcular benefício para uma solicitação
  async calcularBeneficio(req: Request, res: Response) {
    try {
      const { pessoaId, programaId } = req.body;
      const { quantidadeSolicitada } = req.body;

      if (!pessoaId || !programaId) {
        return res.status(400).json({
          erro: "Pessoa e Programa são obrigatórios",
        });
      }

      // Calcular benefício
      const resultado = await calcularBeneficio(
        parseInt(pessoaId),
        parseInt(programaId),
        quantidadeSolicitada ? parseFloat(quantidadeSolicitada) : undefined
      );

      // Verificar limites de período se uma regra foi aplicada
      let verificacaoLimite = null;
      if (resultado.regraAplicadaId) {
        verificacaoLimite = await verificarLimitesPeriodo(
          parseInt(pessoaId),
          parseInt(programaId),
          resultado.regraAplicadaId
        );
      }

      res.json({
        sucesso: true,
        calculo: resultado,
        limitePeriodo: verificacaoLimite,
      });
    } catch (error) {
      console.error("Erro ao calcular benefício:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // NOVO: Criar solicitação com cálculo automático
  async createComCalculo(req: Request, res: Response) {
    try {
      const { pessoaId, programaId, quantidadeSolicitada, observacoes } =
        req.body;

      console.log("🔍 BACKEND - createComCalculo recebeu:", {
        pessoaId,
        programaId,
        quantidadeSolicitada,
        observacoes,
      });

      if (!pessoaId || !programaId) {
        return res.status(400).json({
          erro: "Pessoa e Programa são obrigatórios",
        });
      }

      // Validações manuais (mesmas do validateCreate)
      const errors = [];

      // Validação 1: Verificar se programa existe e está ativo
      const programa = await prisma.programa.findUnique({
        where: { id: parseInt(programaId) },
        select: { ativo: true, nome: true },
      });

      if (!programa) {
        errors.push("Programa não encontrado");
      } else if (!programa.ativo) {
        errors.push(
          `O programa "${programa.nome}" está inativo e não pode receber novas solicitações`
        );
      }

      // Validação 2: Verificar duplicidade - não permitir solicitação ativa duplicada
      const solicitacaoExistente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId: parseInt(pessoaId),
          programaId: parseInt(programaId),
          status: {
            in: ["pendente", "em_analise"],
          },
        },
        select: {
          id: true,
          status: true,
          datasolicitacao: true,
        },
      });

      if (solicitacaoExistente) {
        const dataFormatada = new Date(
          solicitacaoExistente.datasolicitacao
        ).toLocaleDateString("pt-BR");
        errors.push(
          `Já existe uma solicitação ativa (${solicitacaoExistente.status}) ` +
            `para este programa criada em ${dataFormatada}. ` +
            `Aguarde a conclusão da solicitação anterior ou cancele-a antes de criar uma nova.`
        );
      }

      if (errors.length > 0) {
        return res.status(400).json({
          erro: "Validação falhou",
          detalhes: errors,
        });
      }

      // Calcular benefício
      const calculo = await calcularBeneficio(
        parseInt(pessoaId),
        parseInt(programaId),
        quantidadeSolicitada ? parseFloat(quantidadeSolicitada) : undefined
      );

      console.log("💰 BACKEND - Resultado do cálculo:", {
        regraAplicadaId: calculo.regraAplicadaId,
        valorCalculado: calculo.valorCalculado,
        quantidadeSolicitada: quantidadeSolicitada,
        temDetalhes: !!calculo.calculoDetalhes,
      });

      // Verificar limites se há regra aplicada
      if (calculo.regraAplicadaId) {
        const verificacaoLimite = await verificarLimitesPeriodo(
          parseInt(pessoaId),
          parseInt(programaId),
          calculo.regraAplicadaId
        );

        if (!verificacaoLimite.permitido) {
          return res.status(400).json({
            erro: "Limite de benefícios atingido",
            detalhes: [verificacaoLimite.mensagem],
            informacoes: verificacaoLimite.detalhes,
          });
        }
      }

      // Criar solicitação com dados calculados
      const solicitacao = await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId: parseInt(pessoaId),
          programaId: parseInt(programaId),
          observacoes,
          status: "pendente",
          // Dados calculados
          regraAplicadaId: calculo.regraAplicadaId,
          valorCalculado: calculo.valorCalculado,
          quantidadeSolicitada: quantidadeSolicitada
            ? parseFloat(quantidadeSolicitada)
            : null,
          calculoDetalhes: calculo.calculoDetalhes as any,
        },
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
            },
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true,
            },
          },
          regraAplicada: true,
        },
      });

      // Registrar no histórico
      await registrarMudancaStatus(
        solicitacao.id,
        null,
        "pendente",
        undefined,
        "Solicitação criada",
        calculo.mensagem
      );

      res.status(201).json({
        sucesso: true,
        mensagem: "Solicitação criada com sucesso",
        solicitacao,
        calculo: {
          mensagem: calculo.mensagem,
          avisos: calculo.avisos,
        },
      });
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // NOVO: Buscar histórico de uma solicitação
  async getHistorico(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const historico = await buscarHistoricoFormatado(parseInt(id));

      res.json({ historico });
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // ATUALIZADO: Alterar status da solicitação com histórico
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, observacoes, motivo, usuarioId } = req.body;

      // Buscar status atual
      const solicitacaoAtual = await prisma.solicitacaoBeneficio.findUnique({
        where: { id: parseInt(id) },
        select: { status: true },
      });

      if (!solicitacaoAtual) {
        return res.status(404).json({ erro: "Solicitação não encontrada" });
      }

      // Atualizar status
      const solicitacao = await prisma.solicitacaoBeneficio.update({
        where: { id: parseInt(id) },
        data: {
          status,
          observacoes,
        },
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
            },
          },
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              secretaria: true,
            },
          },
        },
      });

      // Registrar mudança no histórico
      await registrarMudancaStatus(
        parseInt(id),
        solicitacaoAtual.status,
        status,
        usuarioId ? parseInt(usuarioId) : undefined,
        motivo,
        observacoes
      );

      res.json({
        sucesso: true,
        mensagem: "Status da solicitação atualizado com sucesso",
        solicitacao,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // Obter estatísticas das solicitações
  async getEstatisticas(req: Request, res: Response) {
    try {
      const [totalSolicitacoes, porStatus, porSecretaria, porPrograma] =
        await Promise.all([
          // Total de solicitações
          prisma.solicitacaoBeneficio.count(),

          // Por status
          prisma.solicitacaoBeneficio.groupBy({
            by: ["status"],
            _count: { id: true },
          }),

          // Por secretaria
          prisma.solicitacaoBeneficio.groupBy({
            by: ["programaId"],
            _count: { id: true },
          }),

          // Programas mais solicitados
          prisma.solicitacaoBeneficio.groupBy({
            by: ["programaId"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 5,
          }),
        ]);

      // Buscar nomes dos programas
      const programaIds = porPrograma.map((p) => p.programaId);
      const programas = await prisma.programa.findMany({
        where: { id: { in: programaIds } },
        select: { id: true, nome: true, secretaria: true },
      });

      const programasComNomes = porPrograma.map((p) => ({
        ...p,
        programa: programas.find((prog) => prog.id === p.programaId),
      }));

      res.json({
        totalSolicitacoes,
        porStatus,
        porSecretaria,
        programasMaisSolicitados: programasComNomes,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },
};
