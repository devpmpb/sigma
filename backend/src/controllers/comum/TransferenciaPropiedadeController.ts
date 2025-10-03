// backend/src/controllers/comum/TransferenciaPropiedadeController.ts - ATUALIZADO
import { Request, Response } from "express";
import { PrismaClient, SituacaoPropriedade } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

// Interface para novo proprietário em condomínio
interface NovoProprietarioCondominio {
  pessoaId: number;
  percentual?: number;
}

interface DadosUsufruto {
  usufrutuarioId: number;
  nuProprietarioId: number;
  prazoUsufruto?: string; // Data opcional de término do usufruto
}

const validateCreate = (data: any) => {
  const errors = [];

  if (!data.propriedadeId) {
    errors.push("Propriedade é obrigatória");
  }

  if (!data.dataTransferencia) {
    errors.push("Data da transferência é obrigatória");
  }

  if (!data.situacaoPropriedade) {
    errors.push("Situação da propriedade é obrigatória");
  }

  // Validar baseado na situação
  switch (data.situacaoPropriedade) {
    case SituacaoPropriedade.PROPRIA:
      if (!data.proprietarioAnteriorId) {
        errors.push("Proprietário atual é obrigatório");
      }
      if (!data.proprietarioNovoId) {
        errors.push("Novo proprietário é obrigatório");
      }
      if (data.proprietarioAnteriorId === data.proprietarioNovoId) {
        errors.push("O novo proprietário deve ser diferente do atual");
      }
      break;

    case SituacaoPropriedade.CONDOMINIO:
      if (!data.novosProprietarios || data.novosProprietarios.length < 2) {
        errors.push("Condomínio requer pelo menos 2 proprietários");
      }

      if (data.novosProprietarios && data.novosProprietarios.length > 0) {
        const somaPercentuais = data.novosProprietarios.reduce(
          (sum: number, np: NovoProprietarioCondominio) => sum + np.percentual,
          0
        );

        if (Math.abs(somaPercentuais - 100) > 0.01) {
          errors.push(
            `A soma dos percentuais deve ser 100% (atual: ${somaPercentuais.toFixed(2)}%)`
          );
        }

        // Verificar se há proprietários duplicados
        const pessoasIds = data.novosProprietarios.map(
          (np: NovoProprietarioCondominio) => np.pessoaId
        );
        const pessoasUnicas = new Set(pessoasIds);
        if (pessoasIds.length !== pessoasUnicas.size) {
          errors.push("Não pode haver proprietários duplicados no condomínio");
        }
      }
      break;

    case SituacaoPropriedade.USUFRUTO:
      if (!data.usufruto) {
        errors.push("Dados de usufruto são obrigatórios");
      } else {
        if (!data.usufruto.usufrutuarioId) {
          errors.push("Usufrutuário é obrigatório");
        }
        if (!data.usufruto.nuProprietarioId) {
          errors.push("Nu-proprietário é obrigatório");
        }
        if (data.usufruto.usufrutuarioId === data.usufruto.nuProprietarioId) {
          errors.push("Usufrutuário e nu-proprietário devem ser diferentes");
        }
      }
      break;

    default:
      errors.push("Situação da propriedade inválida");
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

// Controlador com métodos genéricos
const genericController = createGenericController({
  modelName: "transferenciaPropriedade",
  displayName: "Transferência de Propriedade",
  orderBy: { dataTransferencia: "desc" },
  validateCreate,
});

export const transferenciaPropiedadeController = {
  ...genericController,

  /**
   * Realizar transferência de propriedade
   * Suporta transferência única ou para condomínio
   * POST /api/comum/transferencias-propriedade/transferir
   */
  transferir: async (req: Request, res: Response) => {
    try {
      const {
        propriedadeId,
        situacaoPropriedade,
        proprietarioAnteriorId,
        proprietarioNovoId,
        novosProprietarios,
        usufruto,
        dataTransferencia,
        observacoes,
      } = req.body;

      // Validar
      const validation = validateCreate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: validation.errors,
        });
      }

      // Executar transação
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Buscar propriedade
        const propriedade = await tx.propriedade.findUnique({
          where: { id: Number(propriedadeId) },
          include: {
            proprietario: true,
            proprietariosCondominio: {
              where: { ativo: true },
            },
          },
        });

        if (!propriedade) {
          throw new Error("Propriedade não encontrada");
        }

        // 2. Desativar proprietários antigos
        await tx.propriedadeProprietario.updateMany({
          where: {
            propriedadeId: Number(propriedadeId),
            ativo: true,
          },
          data: {
            ativo: false,
            dataFim: new Date(dataTransferencia),
          },
        });

        // 3. Criar registro de transferência
        const transferencia = await tx.transferenciaPropriedade.create({
          data: {
            propriedadeId: Number(propriedadeId),
            situacaoPropriedade: situacaoPropriedade as SituacaoPropriedade,
            proprietarioAnteriorId: proprietarioAnteriorId
              ? Number(proprietarioAnteriorId)
              : null,
            proprietarioNovoId: proprietarioNovoId
              ? Number(proprietarioNovoId)
              : null,
            dataTransferencia: new Date(dataTransferencia),
            observacoes: observacoes || null,
          },
        });

        let novoProprietarioPrincipal: number;
        let novoNuProprietario: number | null = null;

        // 4. Processar baseado na situação
        switch (situacaoPropriedade) {
          case SituacaoPropriedade.PROPRIA: {
            // Transferência simples
            novoProprietarioPrincipal = Number(proprietarioNovoId);

            await tx.propriedadeProprietario.create({
              data: {
                propriedadeId: Number(propriedadeId),
                pessoaId: novoProprietarioPrincipal,
                tipoVinculo: "proprietario",
                percentual: 100,
                dataInicio: new Date(dataTransferencia),
                ativo: true,
              },
            });
            break;
          }

          case SituacaoPropriedade.CONDOMINIO: {
            // Múltiplos proprietários
            novoProprietarioPrincipal = Number(novosProprietarios[0].pessoaId);

            // Criar registros na tabela de condomínio
            await Promise.all(
              novosProprietarios.map((np: NovoProprietarioCondominio) =>
                tx.transferenciaProprietarioCondominio.create({
                  data: {
                    transferenciaId: transferencia.id,
                    pessoaId: Number(np.pessoaId),
                    percentual: np.percentual,
                  },
                })
              )
            );

            // Criar registros de proprietários
            await Promise.all(
              novosProprietarios.map((np: NovoProprietarioCondominio) =>
                tx.propriedadeProprietario.create({
                  data: {
                    propriedadeId: Number(propriedadeId),
                    pessoaId: Number(np.pessoaId),
                    tipoVinculo: "proprietario",
                    percentual: np.percentual,
                    dataInicio: new Date(dataTransferencia),
                    ativo: true,
                  },
                })
              )
            );
            break;
          }

          case SituacaoPropriedade.USUFRUTO: {
            // Usufruto
            novoProprietarioPrincipal = Number(usufruto.usufrutuarioId);
            novoNuProprietario = Number(usufruto.nuProprietarioId);

            // Criar registro de usufruto
            await tx.transferenciaUsufruto.create({
              data: {
                transferenciaId: transferencia.id,
                usufrutuarioId: novoProprietarioPrincipal,
                nuProprietarioId: novoNuProprietario,
                prazoUsufruto: usufruto.prazoUsufruto
                  ? new Date(usufruto.prazoUsufruto)
                  : null,
              },
            });

            // Criar registros de usufrutuário e nu-proprietário
            await tx.propriedadeProprietario.createMany({
              data: [
                {
                  propriedadeId: Number(propriedadeId),
                  pessoaId: novoProprietarioPrincipal,
                  tipoVinculo: "usufrutuario",
                  dataInicio: new Date(dataTransferencia),
                  ativo: true,
                },
                {
                  propriedadeId: Number(propriedadeId),
                  pessoaId: novoNuProprietario,
                  tipoVinculo: "nu_proprietario",
                  dataInicio: new Date(dataTransferencia),
                  ativo: true,
                },
              ],
            });
            break;
          }
        }

        // 5. Atualizar propriedade
        await tx.propriedade.update({
          where: { id: Number(propriedadeId) },
          data: {
            situacao: situacaoPropriedade as SituacaoPropriedade,
            proprietarioId: novoProprietarioPrincipal,
            nuProprietarioId: novoNuProprietario,
            updatedAt: new Date(),
          },
        });

        // 6. Retornar com includes
        return await tx.transferenciaPropriedade.findUnique({
          where: { id: transferencia.id },
          include: {
            propriedade: true,
            proprietarioAnterior: true,
            proprietarioNovo: true,
            novosProprietariosCondominio: {
              include: { pessoa: true },
            },
            usufruto: {
              include: {
                usufrutuario: true,
                nuProprietario: true,
              },
            },
          },
        });
      });

      return res.status(201).json(resultado);
    } catch (error: any) {
      console.error("Erro ao realizar transferência:", error);

      if (error.message.includes("não encontrada")) {
        return res.status(404).json({ erro: error.message });
      }

      if (
        error.message.includes("obrigatório") ||
        error.message.includes("inválid") ||
        error.message.includes("deve ser")
      ) {
        return res.status(400).json({ erro: error.message });
      }

      return res.status(500).json({
        erro: "Erro interno do servidor ao realizar transferência",
        detalhes: error.message,
      });
    }
  },

  /**
   * Buscar proprietários atuais de uma propriedade
   * GET /api/comum/transferencias-propriedade/proprietarios/:propriedadeId
   */
  getProprietariosAtuais: async (req: Request, res: Response) => {
    try {
      const { propriedadeId } = req.params;

      const proprietarios = await prisma.propriedadeProprietario.findMany({
        where: {
          propriedadeId: Number(propriedadeId),
          ativo: true,
        },
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              email: true,
              telefone: true,
            },
          },
        },
        orderBy: [{ percentual: "desc" }, { tipoVinculo: "asc" }],
      });

      return res.status(200).json(proprietarios);
    } catch (error) {
      console.error("Erro ao buscar proprietários:", error);
      return res.status(500).json({
        erro: "Erro ao buscar proprietários da propriedade",
      });
    }
  },

  /**
   * Buscar histórico de transferências de uma propriedade
   * GET /api/comum/transferencias-propriedade/historico/:propriedadeId
   */
  getHistorico: async (req: Request, res: Response) => {
    try {
      const { propriedadeId } = req.params;

      const transferencias = await prisma.transferenciaPropriedade.findMany({
        where: { propriedadeId: Number(propriedadeId) },
        include: {
          proprietarioAnterior: true,
          proprietarioNovo: true,
          novosProprietariosCondominio: {
            include: { pessoa: true },
          },
          usufruto: {
            include: {
              usufrutuario: true,
              nuProprietario: true,
            },
          },
        },
        orderBy: { dataTransferencia: "desc" },
      });

      return res.status(200).json(transferencias);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return res.status(500).json({
        erro: "Erro ao buscar histórico de transferências",
      });
    }
  },
};
