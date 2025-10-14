import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { createGenericController } from "../GenericController";

// Controlador com métodos genéricos
const genericController = createGenericController({
  modelName: "transferenciaPropriedade",
  displayName: "Transferência de Propriedade",
  orderBy: { dataTransferencia: "desc" },
  validateCreate: (data: any) => {
    const errors = [];

    if (!data.propriedadeId) {
      errors.push("Propriedade é obrigatória");
    }

    if (!data.proprietarioAnteriorId) {
      errors.push("Proprietário atual é obrigatório");
    }

    if (!data.proprietarioNovoId) {
      errors.push("Novo proprietário é obrigatório");
    }

    if (data.proprietarioAnteriorId === data.proprietarioNovoId) {
      errors.push("O novo proprietário deve ser diferente do atual");
    }

    if (!data.dataTransferencia) {
      errors.push("Data da transferência é obrigatória");
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// Controlador específico para Transferência de Propriedade
export const transferenciaPropiedadeController = {
  ...genericController,

  /**
   * Realizar transferência de propriedade
   * POST /api/comum/transferencias-propriedade/transferir
   */
  transferir: async (req: Request, res: Response) => {
    try {
      const {
        propriedadeId,
        proprietarioAnteriorId,
        proprietarioNovoId,
        situacaoPropriedade,
        nuProprietarioNovoId,
        dataTransferencia,
        observacoes,
        condominos,
      } = req.body;

      // Validações básicas
      if (
        !propriedadeId ||
        !proprietarioAnteriorId ||
        !proprietarioNovoId ||
        !dataTransferencia
      ) {
        return res.status(400).json({
          erro: "Propriedade, proprietários e data são obrigatórios",
        });
      }

      if (!situacaoPropriedade) {
        return res.status(400).json({
          erro: "Situação da propriedade é obrigatória",
        });
      }

      // ✅ NOVO: Verificar se há mudança no proprietário
      const mudaProprietario =
        Number(proprietarioAnteriorId) !== Number(proprietarioNovoId);
      const temCondominos =
        condominos && Array.isArray(condominos) && condominos.length > 0;

      // ✅ NOVO: Pelo menos uma coisa precisa mudar
      if (!mudaProprietario && !temCondominos) {
        return res.status(400).json({
          erro: "É necessário alterar o proprietário ou adicionar condôminos",
        });
      }

      // ✅ MODIFICADO: Validação de condôminos apenas se situação for CONDOMINIO E adicionar condôminos
      if (
        situacaoPropriedade === "CONDOMINIO" &&
        mudaProprietario &&
        !temCondominos
      ) {
        return res.status(400).json({
          erro: "Para alterar situação para CONDOMÍNIO, é necessário informar condôminos",
        });
      }

      if (situacaoPropriedade === "USUFRUTO" && !nuProprietarioNovoId) {
        return res.status(400).json({
          erro: "Para transferência de usufruto, o nu-proprietário é obrigatório",
        });
      }

      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Verificar se propriedade existe
        const propriedade = await tx.propriedade.findUnique({
          where: { id: Number(propriedadeId) },
        });

        if (!propriedade) {
          throw new Error("Propriedade não encontrada");
        }

        // 2. ✅ MODIFICADO: Verificar proprietário apenas se for mudar
        if (mudaProprietario) {
          if (propriedade.proprietarioId !== Number(proprietarioAnteriorId)) {
            throw new Error(
              "O proprietário anterior informado não é o atual proprietário"
            );
          }

          const novoProprietario = await tx.pessoa.findUnique({
            where: { id: Number(proprietarioNovoId) },
          });

          if (!novoProprietario) {
            throw new Error("Novo proprietário não encontrado");
          }
        }

        // 3. Validar nu-proprietário se for usufruto
        if (situacaoPropriedade === "USUFRUTO") {
          const nuProprietario = await tx.pessoa.findUnique({
            where: { id: Number(nuProprietarioNovoId) },
          });

          if (!nuProprietario) {
            throw new Error("Nu-proprietário não encontrado");
          }

          if (Number(nuProprietarioNovoId) === Number(proprietarioNovoId)) {
            throw new Error(
              "Nu-proprietário deve ser diferente do usufrutuário"
            );
          }
        }

        // 4. Criar registro de transferência
        const transferencia = await tx.transferenciaPropriedade.create({
          data: {
            propriedadeId: Number(propriedadeId),
            proprietarioAnteriorId: Number(proprietarioAnteriorId),
            proprietarioNovoId: Number(proprietarioNovoId),
            situacaoPropriedade,
            nuProprietarioNovoId: nuProprietarioNovoId
              ? Number(nuProprietarioNovoId)
              : null,
            dataTransferencia: new Date(dataTransferencia),
            observacoes: observacoes || null,
          },
          include: {
            propriedade: true,
            proprietarioAnterior: true,
            proprietarioNovo: true,
            nuProprietarioNovo: true,
          },
        });

        // 5. ✅ MODIFICADO: Atualizar propriedade apenas se proprietário mudou
        if (mudaProprietario) {
          const updateData: any = {
            proprietarioId: Number(proprietarioNovoId),
            situacao: situacaoPropriedade,
            updatedAt: new Date(),
          };

          if (situacaoPropriedade === "USUFRUTO") {
            updateData.nuProprietarioId = Number(nuProprietarioNovoId);
          } else {
            updateData.nuProprietarioId = null;
          }

          await tx.propriedade.update({
            where: { id: Number(propriedadeId) },
            data: updateData,
          });
        } else {
          // Se não muda proprietário, apenas atualizar situação se necessário
          if (propriedade.situacao !== situacaoPropriedade) {
            await tx.propriedade.update({
              where: { id: Number(propriedadeId) },
              data: {
                situacao: situacaoPropriedade,
                updatedAt: new Date(),
              },
            });
          }
        }

        // 6. Gerenciar condôminos (adicionar novos e remover excluídos)
        if (situacaoPropriedade === "CONDOMINIO") {
          // 6.1 Buscar condôminos ativos atuais
          const condominosAtuais = await tx.propriedadeCondomino.findMany({
            where: {
              propriedadeId: Number(propriedadeId),
              dataFim: null, // Apenas ativos
            },
          });

          // 6.2 IDs dos condôminos que devem permanecer/ser adicionados
          const condominoIdsNovos = temCondominos
            ? condominos.map((c: any) => Number(c.condominoId))
            : [];

          // 6.3 Remover condôminos que não estão mais na lista (marcar dataFim)
          for (const condominoAtual of condominosAtuais) {
            if (!condominoIdsNovos.includes(condominoAtual.condominoId)) {
              // Este condômino foi removido, marcar como inativo
              await tx.propriedadeCondomino.update({
                where: { id: condominoAtual.id },
                data: {
                  dataFim: new Date(dataTransferencia),
                  observacoes: condominoAtual.observacoes
                    ? `${condominoAtual.observacoes}\nRemovido na transferência em ${new Date(dataTransferencia).toLocaleDateString()}`
                    : `Removido na transferência em ${new Date(dataTransferencia).toLocaleDateString()}`,
                },
              });
            }
          }

          // 6.4 Adicionar novos condôminos
          if (temCondominos) {
            for (const condomino of condominos) {
              const pessoa = await tx.pessoa.findUnique({
                where: { id: Number(condomino.condominoId) },
              });

              if (!pessoa) {
                throw new Error(
                  `Condômino com ID ${condomino.condominoId} não encontrado`
                );
              }

              // Verificar se já é condômino ativo
              const jaCondomino = await tx.propriedadeCondomino.findFirst({
                where: {
                  propriedadeId: Number(propriedadeId),
                  condominoId: Number(condomino.condominoId),
                  dataFim: null,
                },
              });

              // Se não existe, criar
              if (!jaCondomino) {
                await tx.propriedadeCondomino.create({
                  data: {
                    propriedadeId: Number(propriedadeId),
                    condominoId: Number(condomino.condominoId),
                    percentual: condomino.percentual
                      ? Number(condomino.percentual)
                      : null,
                    dataInicio: new Date(dataTransferencia),
                    observacoes: condomino.observacoes || null,
                  },
                });
              }
            }
          }
        }

        return transferencia;
      });

      return res.status(201).json(resultado);
    } catch (error: any) {
      console.error("Erro ao realizar transferência:", error);

      if (
        error.message.includes("não encontrada") ||
        error.message.includes("não encontrado") ||
        error.message.includes("não é o atual proprietário") ||
        error.message.includes("deve ser diferente") ||
        error.message.includes("já é condômino") ||
        error.message.includes("É necessário alterar")
      ) {
        return res.status(400).json({ erro: error.message });
      }

      return res.status(500).json({
        erro: "Erro interno do servidor ao realizar transferência",
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

  findAll: async (req: Request, res: Response) => {
    try {
      const { search } = req.query;

      let transferencias;

      if (search) {
        // Busca com filtro
        transferencias = await prisma.transferenciaPropriedade.findMany({
          where: {
            OR: [
              {
                propriedade: {
                  nome: { contains: String(search), mode: "insensitive" },
                },
              },
              {
                propriedade: {
                  matricula: { contains: String(search), mode: "insensitive" },
                },
              },
              {
                proprietarioAnterior: {
                  nome: { contains: String(search), mode: "insensitive" },
                },
              },
              {
                proprietarioNovo: {
                  nome: { contains: String(search), mode: "insensitive" },
                },
              },
            ],
          },
          include: {
            propriedade: true,
            proprietarioAnterior: true,
            proprietarioNovo: true,
          },
          orderBy: { dataTransferencia: "desc" },
        });
      } else {
        // Busca sem filtro
        transferencias = await prisma.transferenciaPropriedade.findMany({
          include: {
            propriedade: true,
            proprietarioAnterior: true,
            proprietarioNovo: true,
          },
          orderBy: { dataTransferencia: "desc" },
        });
      }

      return res.status(200).json(transferencias);
    } catch (error) {
      console.error("Erro ao buscar transferências:", error);
      return res.status(500).json({
        erro: "Erro ao buscar transferências",
      });
    }
  },

  /**
   * Buscar transferências por propriedade
   * GET /api/comum/transferencias-propriedade/propriedade/:propriedadeId
   */
  getByPropriedade: async (req: Request, res: Response) => {
    try {
      const { propriedadeId } = req.params;

      const transferencias = await prisma.transferenciaPropriedade.findMany({
        where: { propriedadeId: Number(propriedadeId) },
        include: {
          proprietarioAnterior: true,
          proprietarioNovo: true,
        },
        orderBy: { dataTransferencia: "desc" },
      });

      return res.status(200).json(transferencias);
    } catch (error) {
      console.error("Erro ao buscar transferências:", error);
      return res.status(500).json({
        erro: "Erro ao buscar transferências da propriedade",
      });
    }
  },

  /**
   * Buscar transferências recentes (últimos 30 dias)
   * GET /api/comum/transferencias-propriedade/recentes
   */
  getRecentes: async (req: Request, res: Response) => {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);

      const transferencias = await prisma.transferenciaPropriedade.findMany({
        where: {
          dataTransferencia: {
            gte: dataLimite,
          },
        },
        include: {
          propriedade: true,
          proprietarioAnterior: true,
          proprietarioNovo: true,
        },
        orderBy: { dataTransferencia: "desc" },
      });

      return res.status(200).json(transferencias);
    } catch (error) {
      console.error("Erro ao buscar transferências recentes:", error);
      return res.status(500).json({
        erro: "Erro ao buscar transferências recentes",
      });
    }
  },
};
