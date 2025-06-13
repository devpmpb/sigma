import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

// Validação para criação de arrendamento
const validateArrendamentoCreate = (data: any) => {
  const errors = [];
  
  if (!data.propriedadeId || data.propriedadeId === 0) {
    errors.push("Propriedade é obrigatória");
  }
  
  if (!data.proprietarioId || data.proprietarioId === 0) {
    errors.push("Proprietário é obrigatório");
  }
  
  if (!data.arrendatarioId || data.arrendatarioId === 0) {
    errors.push("Arrendatário é obrigatório");
  }
  
  if (data.proprietarioId === data.arrendatarioId) {
    errors.push("Proprietário e arrendatário devem ser diferentes");
  }
  
  if (!data.areaArrendada || Number(data.areaArrendada) <= 0) {
    errors.push("Área arrendada deve ser maior que zero");
  }
  
  if (!data.dataInicio) {
    errors.push("Data de início é obrigatória");
  }
  
  if (data.dataFim && data.dataInicio) {
    const dataInicio = new Date(data.dataInicio);
    const dataFim = new Date(data.dataFim);
    
    if (dataFim <= dataInicio) {
      errors.push("Data fim deve ser posterior à data de início");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

// Configuração dos relacionamentos para busca
const includeRelations = {
  propriedade: {
    select: {
      id: true,
      nome: true,
      tipoPropriedade: true,
      areaTotal: true,
      localizacao: true,
      matricula: true,
    },
  },
  proprietario: {
    include: {
      pessoa: {
        select: {
          id: true,
          nome: true,
          cpfCnpj: true,
          telefone: true,
          email: true,
        },
      },
    },
  },
  arrendatario: {
    include: {
      pessoa: {
        select: {
          id: true,
          nome: true,
          cpfCnpj: true,
          telefone: true,
          email: true,
        },
      },
    },
  },
};

// Controlador genérico
const genericController = createGenericController({
  modelName: "arrendamento",
  displayName: "Arrendamento",
  orderBy: { dataInicio: "desc" },
  validateCreate: validateArrendamentoCreate,
  validateUpdate: validateArrendamentoCreate,
});

// Controlador com métodos específicos para Arrendamento
export const arrendamentoController = {
  ...genericController,

  // Sobrescrever findAll para incluir relacionamentos
  findAll: async (req: Request, res: Response) => {
    try {
      const arrendamentos = await prisma.arrendamento.findMany({
        include: includeRelations,
        orderBy: { dataInicio: "desc" },
      });

      return res.status(200).json(arrendamentos);
    } catch (error) {
      console.error("Erro ao listar arrendamentos:", error);
      return res.status(500).json({
        erro: "Erro ao listar arrendamentos",
      });
    }
  },

  // Sobrescrever findById para incluir relacionamentos
  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const arrendamento = await prisma.arrendamento.findUnique({
        where: { id: Number(id) },
        include: includeRelations,
      });

      if (!arrendamento) {
        return res.status(404).json({ erro: "Arrendamento não encontrado" });
      }

      return res.status(200).json(arrendamento);
    } catch (error) {
      console.error("Erro ao buscar arrendamento:", error);
      return res.status(500).json({ erro: "Erro ao buscar arrendamento" });
    }
  },

  // Buscar arrendamentos por proprietário
  findByProprietario: async (req: Request, res: Response) => {
    try {
      const { proprietarioId } = req.params;
      
      const arrendamentos = await prisma.arrendamento.findMany({
        where: { proprietarioId: Number(proprietarioId) },
        include: includeRelations,
        orderBy: { dataInicio: "desc" },
      });
      
      return res.status(200).json(arrendamentos);
    } catch (error) {
      console.error("Erro ao buscar arrendamentos por proprietário:", error);
      return res.status(500).json({ erro: "Erro ao buscar arrendamentos por proprietário" });
    }
  },

  // Buscar arrendamentos por arrendatário
  findByArrendatario: async (req: Request, res: Response) => {
    try {
      const { arrendatarioId } = req.params;
      
      const arrendamentos = await prisma.arrendamento.findMany({
        where: { arrendatarioId: Number(arrendatarioId) },
        include: includeRelations,
        orderBy: { dataInicio: "desc" },
      });
      
      return res.status(200).json(arrendamentos);
    } catch (error) {
      console.error("Erro ao buscar arrendamentos por arrendatário:", error);
      return res.status(500).json({ erro: "Erro ao buscar arrendamentos por arrendatário" });
    }
  },

  // Buscar arrendamentos por propriedade
  findByPropriedade: async (req: Request, res: Response) => {
    try {
      const { propriedadeId } = req.params;
      
      const arrendamentos = await prisma.arrendamento.findMany({
        where: { propriedadeId: Number(propriedadeId) },
        include: includeRelations,
        orderBy: { dataInicio: "desc" },
      });
      
      return res.status(200).json(arrendamentos);
    } catch (error) {
      console.error("Erro ao buscar arrendamentos por propriedade:", error);
      return res.status(500).json({ erro: "Erro ao buscar arrendamentos por propriedade" });
    }
  },

  // Buscar arrendamentos por status
  findByStatus: async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      
      const arrendamentos = await prisma.arrendamento.findMany({
        where: { status },
        include: includeRelations,
        orderBy: { dataInicio: "desc" },
      });
      
      return res.status(200).json(arrendamentos);
    } catch (error) {
      console.error("Erro ao buscar arrendamentos por status:", error);
      return res.status(500).json({ erro: "Erro ao buscar arrendamentos por status" });
    }
  },

  // Buscar detalhes completos do arrendamento
  findByIdWithDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const arrendamento = await prisma.arrendamento.findUnique({
        where: { id: Number(id) },
        include: {
          propriedade: {
            include: {
              proprietario: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true,
                  telefone: true,
                  email: true,
                },
              },
              enderecos: {
                include: {
                  logradouro: {
                    select: {
                      tipo: true,
                      descricao: true,
                      cep: true,
                    },
                  },
                  bairro: {
                    select: {
                      nome: true,
                    },
                  },
                  areaRural: {
                    select: {
                      nome: true,
                      localizacao: true,
                    },
                  },
                },
              },
            },
          },
          proprietario: {
            include: {
              pessoa: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true,
                  telefone: true,
                  email: true,
                  enderecos: {
                    where: { principal: true },
                    include: {
                      logradouro: true,
                      bairro: true,
                    },
                  },
                },
              },
            },
          },
          arrendatario: {
            include: {
              pessoa: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true,
                  telefone: true,
                  email: true,
                  enderecos: {
                    where: { principal: true },
                    include: {
                      logradouro: true,
                      bairro: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      
      if (!arrendamento) {
        return res.status(404).json({ erro: "Arrendamento não encontrado" });
      }
      
      // Adicionar informações calculadas
      const dataInicio = new Date(arrendamento.dataInicio);
      const dataFim = arrendamento.dataFim ? new Date(arrendamento.dataFim) : null;
      const hoje = new Date();
      
      const detalhesCalculados = {
        ...arrendamento,
        calculado: {
          duracao: calcularDuracao(dataInicio, dataFim),
          diasRestantes: dataFim ? Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : null,
          vencido: dataFim ? dataFim < hoje : false,
          proximoVencimento: dataFim ? (dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24) <= 30 && dataFim > hoje : false,
          percentualArea: ((Number(arrendamento.areaArrendada) / Number(arrendamento.propriedade.areaTotal)) * 100).toFixed(2),
        },
      };
      
      return res.status(200).json(detalhesCalculados);
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
      return res.status(500).json({ erro: "Erro ao buscar detalhes" });
    }
  },

  // Validar conflitos de arrendamento
  validarConflito: async (req: Request, res: Response) => {
    try {
      const { 
        propriedadeId, 
        areaArrendada, 
        dataInicio, 
        dataFim, 
        arrendamentoId 
      } = req.body;
      
      // Primeiro, verificar se a área total da propriedade comporta
      const propriedade = await prisma.propriedade.findUnique({
        where: { id: Number(propriedadeId) },
        select: { areaTotal: true },
      });
      
      if (!propriedade) {
        return res.status(404).json({ erro: "Propriedade não encontrada" });
      }
      
      // Buscar arrendamentos ativos da mesma propriedade
      const arrendamentosExistentes = await prisma.arrendamento.findMany({
        where: {
          propriedadeId: Number(propriedadeId),
          status: "ativo",
          ...(arrendamentoId && { id: { not: Number(arrendamentoId) } }),
        },
        select: {
          id: true,
          dataInicio: true,
          dataFim: true,
          areaArrendada: true,
        },
      });
      
      // Verificar conflitos de período
      const conflitos = arrendamentosExistentes.filter((arr) => {
        const inicioExistente = new Date(arr.dataInicio);
        const fimExistente = arr.dataFim ? new Date(arr.dataFim) : null;
        const novoInicio = new Date(dataInicio);
        const novoFim = dataFim ? new Date(dataFim) : null;
        
        let temSobreposicaoPeriodo = false;
        
        if (!fimExistente && !novoFim) {
          // Ambos por prazo indeterminado - sempre conflito
          temSobreposicaoPeriodo = true;
        } else if (!fimExistente) {
          // Existente é indeterminado, novo tem fim
          temSobreposicaoPeriodo = novoInicio <= inicioExistente || !novoFim || novoFim >= inicioExistente;
        } else if (!novoFim) {
          // Novo é indeterminado, existente tem fim
          temSobreposicaoPeriodo = novoInicio <= fimExistente;
        } else {
          // Ambos têm fim definido
          temSobreposicaoPeriodo = !(novoFim <= inicioExistente || novoInicio >= fimExistente);
        }
        
        return temSobreposicaoPeriodo;
      });
      
      // Verificar se a área total comporta
      const areaTotalAtiva = arrendamentosExistentes.reduce((sum, arr) => {
        return sum + Number(arr.areaArrendada);
      }, 0);
      
      const areaDisponivel = Number(propriedade.areaTotal) - areaTotalAtiva;
      const areaExcedente = Number(areaArrendada) > areaDisponivel;
      
      const temConflito = conflitos.length > 0 || areaExcedente;
      const mensagensConflito = [];
      
      if (conflitos.length > 0) {
        mensagensConflito.push(`Há ${conflitos.length} arrendamento(s) com sobreposição de período`);
      }
      
      if (areaExcedente) {
        mensagensConflito.push(
          `Área excede o disponível. Disponível: ${areaDisponivel.toFixed(2)} ha, Solicitada: ${Number(areaArrendada).toFixed(2)} ha`
        );
      }
      
      return res.status(200).json({
        temConflito,
        conflitos: conflitos.map(c => ({
          id: c.id,
          dataInicio: c.dataInicio,
          dataFim: c.dataFim,
          areaArrendada: c.areaArrendada,
        })),
        areaDisponivel: areaDisponivel.toFixed(2),
        areaSolicitada: Number(areaArrendada).toFixed(2),
        mensagens: mensagensConflito,
      });
    } catch (error) {
      console.error("Erro ao validar conflitos:", error);
      return res.status(500).json({ erro: "Erro ao validar conflitos" });
    }
  },

  // Atualizar status do arrendamento
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validar status
      const statusValidos = ["ativo", "inativo", "vencido", "cancelado"];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({ 
          erro: `Status inválido. Use: ${statusValidos.join(", ")}` 
        });
      }
      
      const arrendamento = await prisma.arrendamento.update({
        where: { id: Number(id) },
        data: { 
          status,
          updatedAt: new Date(),
        },
        include: includeRelations,
      });
      
      return res.status(200).json(arrendamento);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      if (error.code === "P2025") {
        return res.status(404).json({ erro: "Arrendamento não encontrado" });
      }
      return res.status(500).json({ erro: "Erro ao atualizar status" });
    }
  },

  // Finalizar arrendamento
  finalizarArrendamento: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { dataFim } = req.body;
      
      // Validar se o arrendamento existe e está ativo
      const arrendamentoExistente = await prisma.arrendamento.findUnique({
        where: { id: Number(id) },
        select: { status: true, dataInicio: true },
      });
      
      if (!arrendamentoExistente) {
        return res.status(404).json({ erro: "Arrendamento não encontrado" });
      }
      
      if (arrendamentoExistente.status !== "ativo") {
        return res.status(400).json({ 
          erro: "Apenas arrendamentos ativos podem ser finalizados" 
        });
      }
      
      // Validar data fim
      const dataFinalizada = dataFim || new Date().toISOString().split('T')[0];
      const dataInicio = new Date(arrendamentoExistente.dataInicio);
      const dataTermino = new Date(dataFinalizada);
      
      if (dataTermino < dataInicio) {
        return res.status(400).json({ 
          erro: "Data de finalização não pode ser anterior à data de início" 
        });
      }
      
      const arrendamento = await prisma.arrendamento.update({
        where: { id: Number(id) },
        data: { 
          status: "inativo",
          dataFim: dataFinalizada,
          updatedAt: new Date(),
        },
        include: includeRelations,
      });
      
      return res.status(200).json(arrendamento);
    } catch (error) {
      console.error("Erro ao finalizar arrendamento:", error);
      if (error.code === "P2025") {
        return res.status(404).json({ erro: "Arrendamento não encontrado" });
      }
      return res.status(500).json({ erro: "Erro ao finalizar arrendamento" });
    }
  },

  // Obter estatísticas gerais
  getEstatisticas: async (req: Request, res: Response) => {
    try {
      const hoje = new Date();
      const trintaDiasFrente = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      // Contar totais
      const [total, ativos, vencidos, proximosVencimento] = await Promise.all([
        prisma.arrendamento.count(),
        prisma.arrendamento.count({ where: { status: "ativo" } }),
        prisma.arrendamento.count({ 
          where: { 
            dataFim: { lt: hoje },
            status: "ativo"
          } 
        }),
        prisma.arrendamento.count({
          where: {
            dataFim: { 
              gte: hoje,
              lte: trintaDiasFrente
            },
            status: "ativo"
          }
        }),
      ]);
      
      // Calcular área total
      const areasResult = await prisma.arrendamento.aggregate({
        where: { status: "ativo" },
        _sum: { areaArrendada: true },
      });
      
      const areaTotal = Number(areasResult._sum.areaArrendada || 0);
      
      return res.status(200).json({
        total,
        ativos,
        vencidos,
        proximosVencimento,
        areaTotal: areaTotal.toFixed(2),
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return res.status(500).json({ erro: "Erro ao buscar estatísticas" });
    }
  },
};

// Função auxiliar para calcular duração
const calcularDuracao = (dataInicio: Date, dataFim: Date | null): string => {
  const fim = dataFim || new Date();
  const diffTime = Math.abs(fim.getTime() - dataInicio.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const meses = Math.round(diffDays / 30);
  
  if (meses < 1) {
    return `${diffDays} dias`;
  } else if (meses < 12) {
    return `${meses} meses`;
  } else {
    const anos = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;
    return mesesRestantes > 0 
      ? `${anos} anos e ${mesesRestantes} meses`
      : `${anos} anos`;
  }
};