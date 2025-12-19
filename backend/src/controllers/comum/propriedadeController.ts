import { Request, Response } from "express";
import {
  PrismaClient,
  TipoPropriedade,
  SituacaoPropriedade,
  AtividadeProdutiva,
} from "@prisma/client";
import { createGenericController } from "../GenericController";
import prisma from "../../utils/prisma";

const validate = (data: any) => {
  const errors = [];

  if (!data.nome || data.nome.trim() === "") {
    errors.push("Nome é obrigatório");
  }

  if (!data.areaTotal || isNaN(Number(data.areaTotal))) {
    errors.push("Área total é obrigatória e deve ser um número");
  }

  if (!data.proprietarioId) {
    errors.push("Proprietário é obrigatório");
  }

  if (
    data.tipoPropriedade &&
    !Object.values(TipoPropriedade).includes(data.tipoPropriedade)
  ) {
    errors.push("Tipo de propriedade inválido");
  }

  // NOVA VALIDAÇÃO: Situação da propriedade
  if (!data.situacao) {
    errors.push("Situação da propriedade é obrigatória");
  } else if (!Object.values(SituacaoPropriedade).includes(data.situacao)) {
    errors.push("Situação da propriedade inválida");
  }

  // NOVAS VALIDAÇÕES: Campos rurais
  if (data.tipoPropriedade === TipoPropriedade.RURAL) {
    if (data.itr && typeof data.itr !== "string") {
      errors.push("ITR deve ser um texto válido");
    }

    if (data.incra && typeof data.incra !== "string") {
      errors.push("INCRA deve ser um texto válido");
    }
  }

  if (data.situacao === SituacaoPropriedade.USUFRUTO) {
    if (!data.nuProprietarioId) {
      errors.push("Nu-proprietário é obrigatório quando a situação é Usufruto");
    }
    if (data.nuProprietarioId === data.proprietarioId) {
      errors.push("Nu-proprietário deve ser diferente do usufrutuário");
    }
  } else {
    // Limpar nu-proprietário se não for usufruto
    data.nuProprietarioId = null;
  }

  if (data.tipoPropriedade === TipoPropriedade.RURAL) {
    if (!data.atividadeProdutiva) {
      errors.push("Atividade produtiva é obrigatória para propriedades rurais");
    } else if (
      !Object.values(AtividadeProdutiva).includes(data.atividadeProdutiva)
    ) {
      errors.push("Atividade produtiva inválida");
    }
  } else {
    // Limpar atividade produtiva se não for rural
    data.atividadeProdutiva = null;
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};
// Controlador com os métodos genéricos ATUALIZADO
const genericController = createGenericController({
  modelName: "propriedade",
  displayName: "Propriedade",
  orderBy: { nome: "asc" },
  validateCreate: validate,
  validateUpdate: validate,

});

// Controlador com métodos específicos para Propriedade ATUALIZADO
export const propriedadeController = {
  ...genericController,

  // Sobrescrever create para usar transformação de dados e processar condôminos
  create: async (req: Request, res: Response) => {
    try {
      const validation = validate(req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: validation.errors,
        });
      }

      const { condominos, ...proprietyData } = req.body;

      // Transformar dados antes de salvar
      const transformedData = {
        nome: proprietyData.nome,
        tipoPropriedade: proprietyData.tipoPropriedade,
        numero: proprietyData.numero || null,
        areaTotal: Number(proprietyData.areaTotal),
        unidadeArea:
          proprietyData.tipoPropriedade === TipoPropriedade.RURAL
            ? "alqueires"
            : "metros_quadrados",
        itr:
          proprietyData.tipoPropriedade === TipoPropriedade.RURAL
            ? proprietyData.itr || null
            : null,
        incra:
          proprietyData.tipoPropriedade === TipoPropriedade.RURAL
            ? proprietyData.incra || null
            : null,
        atividadeProdutiva:
          proprietyData.tipoPropriedade === TipoPropriedade.RURAL
            ? proprietyData.atividadeProdutiva
            : null,
        situacao: proprietyData.situacao,
        isproprietarioResidente: Boolean(proprietyData.isproprietarioResidente),
        localizacao: proprietyData.localizacao || null,
        matricula: proprietyData.matricula || null,
        proprietarioId: Number(proprietyData.proprietarioId),
        nuProprietarioId: proprietyData.nuProprietarioId
          ? Number(proprietyData.nuProprietarioId)
          : null,
      };

      // Usar transação para criar propriedade e condôminos
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Criar propriedade
        const propriedade = await tx.propriedade.create({
          data: transformedData,
          include: {
            proprietario: {
              select: {
                id: true,
                nome: true,
                cpfCnpj: true,
                tipoPessoa: true,
              },
            },
            endereco: {
              include: {
                logradouro: true,
                bairro: true,
                areaRural: true,
              },
            },
            nuProprietario: {
              select: {
                id: true,
                nome: true,
                cpfCnpj: true,
                tipoPessoa: true,
              },
            },
          },
        });

        // 2. Se for CONDOMÍNIO e tiver condôminos, cadastrá-los
        if (
          proprietyData.situacao === SituacaoPropriedade.CONDOMINIO &&
          condominos &&
          Array.isArray(condominos) &&
          condominos.length > 0
        ) {
          for (const condomino of condominos) {
            await tx.propriedadeCondomino.create({
              data: {
                propriedadeId: propriedade.id,
                condominoId: Number(condomino.condominoId),
                percentual: condomino.percentual
                  ? Number(condomino.percentual)
                  : null,
                dataInicio: new Date(),
                observacoes: condomino.observacoes || null,
              },
            });
          }
        }

        return propriedade;
      });

      return res.status(201).json(resultado);
    } catch (error) {
      console.error("Erro ao criar propriedade:", error);
      return res.status(500).json({
        erro: "Erro ao criar propriedade",
      });
    }
  },

  // Sobrescrever update para usar transformação de dados e processar condôminos
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const validation = validate(req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: validation.errors,
        });
      }

      const { condominos, ...proprietyData } = req.body;

      // Transformar dados antes de atualizar
      const transformedData = {
        nome: proprietyData.nome,
        tipoPropriedade: proprietyData.tipoPropriedade,
        numero: proprietyData.numero || null,
        areaTotal: Number(proprietyData.areaTotal),
        unidadeArea:
          proprietyData.tipoPropriedade === TipoPropriedade.RURAL
            ? "alqueires"
            : "metros_quadrados",
        itr:
          proprietyData.tipoPropriedade === TipoPropriedade.RURAL
            ? proprietyData.itr || null
            : null,
        incra:
          proprietyData.tipoPropriedade === TipoPropriedade.RURAL
            ? proprietyData.incra || null
            : null,
        atividadeProdutiva:
          proprietyData.tipoPropriedade === TipoPropriedade.RURAL
            ? proprietyData.atividadeProdutiva
            : null,
        situacao: proprietyData.situacao,
        isproprietarioResidente: Boolean(proprietyData.isproprietarioResidente),
        localizacao: proprietyData.localizacao || null,
        matricula: proprietyData.matricula || null,
        proprietarioId: Number(proprietyData.proprietarioId),
        nuProprietarioId: proprietyData.nuProprietarioId
          ? Number(proprietyData.nuProprietarioId)
          : null,
      };

      // Usar transação para atualizar propriedade e condôminos
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Atualizar propriedade
        const propriedade = await tx.propriedade.update({
          where: { id: Number(id) },
          data: transformedData,
          include: {
            proprietario: {
              select: {
                id: true,
                nome: true,
                cpfCnpj: true,
                tipoPessoa: true,
              },
            },
            endereco: {
              include: {
                logradouro: true,
                bairro: true,
                areaRural: true,
              },
            },
            nuProprietario: {
              select: {
                id: true,
                nome: true,
                cpfCnpj: true,
                tipoPessoa: true,
              },
            },
          },
        });

        // 2. Gerenciar condôminos (se for CONDOMÍNIO)
        if (proprietyData.situacao === SituacaoPropriedade.CONDOMINIO) {
          // 2.1 Buscar condôminos ativos atuais
          const condominosAtuais = await tx.propriedadeCondomino.findMany({
            where: {
              propriedadeId: Number(id),
              dataFim: null,
            },
          });

          // 2.2 IDs dos condôminos que devem permanecer/ser adicionados
          const condominoIdsNovos =
            condominos && Array.isArray(condominos)
              ? condominos.map((c: any) => Number(c.condominoId))
              : [];

          // 2.3 Remover condôminos que não estão mais na lista (marcar dataFim)
          for (const condominoAtual of condominosAtuais) {
            if (!condominoIdsNovos.includes(condominoAtual.condominoId)) {
              await tx.propriedadeCondomino.update({
                where: { id: condominoAtual.id },
                data: {
                  dataFim: new Date(),
                  observacoes: condominoAtual.observacoes
                    ? `${condominoAtual.observacoes}\nRemovido na edição em ${new Date().toLocaleDateString()}`
                    : `Removido na edição em ${new Date().toLocaleDateString()}`,
                },
              });
            }
          }

          // 2.4 Adicionar novos condôminos
          if (condominos && Array.isArray(condominos)) {
            for (const condomino of condominos) {
              const jaCondomino = await tx.propriedadeCondomino.findFirst({
                where: {
                  propriedadeId: Number(id),
                  condominoId: Number(condomino.condominoId),
                  dataFim: null,
                },
              });

              // Se não existe, criar
              if (!jaCondomino) {
                await tx.propriedadeCondomino.create({
                  data: {
                    propriedadeId: Number(id),
                    condominoId: Number(condomino.condominoId),
                    percentual: condomino.percentual
                      ? Number(condomino.percentual)
                      : null,
                    dataInicio: new Date(),
                    observacoes: condomino.observacoes || null,
                  },
                });
              }
            }
          }
        }

        return propriedade;
      });

      return res.status(200).json(resultado);
    } catch (error) {
      console.error("Erro ao atualizar propriedade:", error);
      return res.status(500).json({
        erro: "Erro ao atualizar propriedade",
      });
    }
  },

  // Sobrescrever findAll para incluir dados do proprietário
  findAll: async (req: Request, res: Response) => {
    try {
      const propriedades = await prisma.propriedade.findMany({
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
          endereco: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
            },
          },
          nuProprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error("Erro ao listar propriedades:", error);
      return res.status(500).json({
        erro: "Erro ao listar propriedades",
      });
    }
  },

  // Sobrescrever findById para incluir dados do proprietário
  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const propriedade = await prisma.propriedade.findUnique({
        where: { id: Number(id) },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
          endereco: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
            },
          },
          nuProprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
        },
      });

      if (!propriedade) {
        return res.status(404).json({ erro: "Propriedade não encontrada" });
      }

      return res.status(200).json(propriedade);
    } catch (error) {
      console.error("Erro ao buscar propriedade:", error);
      return res.status(500).json({ erro: "Erro ao buscar propriedade" });
    }
  },

  // Buscar propriedades por proprietário
  findByProprietario: async (req: Request, res: Response) => {
    try {
      const { proprietarioId } = req.params;

      const propriedades = await prisma.propriedade.findMany({
        where: { proprietarioId: Number(proprietarioId) },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
          endereco: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
            },
          },
          nuProprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error("Erro ao buscar propriedades por proprietário:", error);
      return res.status(500).json({
        erro: "Erro ao buscar propriedades por proprietário",
      });
    }
  },

  buscarPorTermo: async (req: Request, res: Response) => {
    try {
      const { termo } = req.query;

      if (!termo) {
        return res.status(400).json({ erro: "Termo de busca é obrigatório" });
      }

      const propriedades = await prisma.propriedade.findMany({
        where: {
          OR: [
            {
              nome: {
                contains: termo as string,
                mode: "insensitive",
              },
            },
            {
              matricula: {
                contains: termo as string,
                mode: "insensitive",
              },
            },
            {
              localizacao: {
                contains: termo as string,
                mode: "insensitive",
              },
            },
            {
              proprietario: {
                nome: {
                  contains: termo as string,
                  mode: "insensitive",
                },
              },
            },
            {
              proprietario: {
                cpfCnpj: {
                  contains: termo as string,
                  mode: "insensitive",
                },
              },
            },
          ],
        },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error("Erro ao buscar propriedades por termo:", error);
      return res.status(500).json({
        erro: "Erro ao buscar propriedades",
      });
    }
  },

  findByIdWithDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const propriedade = await prisma.propriedade.findUnique({
        where: { id: Number(id) },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
              telefone: true,
              email: true,
            },
          },
          endereco: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
            },
          },
          arrendamentos: {
            include: {
              arrendatario: {
                select: {
                  id: true,

                  nome: true,
                  cpfCnpj: true,
                },
              },
              proprietario: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true,
                },
              },
            },
          },
        },
      });

      if (!propriedade) {
        return res.status(404).json({ erro: "Propriedade não encontrada" });
      }

      return res.status(200).json(propriedade);
    } catch (error) {
      console.error("Erro ao buscar detalhes da propriedade:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao buscar detalhes da propriedade" });
    }
  },

  // Buscar propriedades por tipo
  findByTipo: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.params;

      const propriedades = await prisma.propriedade.findMany({
        where: { tipoPropriedade: tipo as any },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
          endereco: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error("Erro ao buscar propriedades por tipo:", error);
      return res.status(500).json({
        erro: "Erro ao buscar propriedades por tipo",
      });
    }
  },

  // NOVA: Buscar propriedades por situação
  findBySituacao: async (req: Request, res: Response) => {
    try {
      const { situacao } = req.params;

      const propriedades = await prisma.propriedade.findMany({
        where: { situacao: situacao as any },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
          endereco: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error("Erro ao buscar propriedades por situação:", error);
      return res.status(500).json({
        erro: "Erro ao buscar propriedades por situação",
      });
    }
  },

  // NOVA: Buscar propriedades rurais com ITR/INCRA
  findRuraisComDocumentos: async (req: Request, res: Response) => {
    try {
      const propriedades = await prisma.propriedade.findMany({
        where: {
          tipoPropriedade: TipoPropriedade.RURAL,
          OR: [{ itr: { not: null } }, { incra: { not: null } }],
        },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
          endereco: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error(
        "Erro ao buscar propriedades rurais com documentos:",
        error
      );
      return res.status(500).json({
        erro: "Erro ao buscar propriedades rurais com documentos",
      });
    }
  },

  // Buscar propriedades com proprietários residentes
  findComProprietariosResidentes: async (req: Request, res: Response) => {
    try {
      const propriedades = await prisma.propriedade.findMany({
        where: { isproprietarioResidente: true },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
          endereco: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(propriedades);
    } catch (error) {
      console.error(
        "Erro ao buscar propriedades com proprietários residentes:",
        error
      );
      return res.status(500).json({
        erro: "Erro ao buscar propriedades com proprietários residentes",
      });
    }
  },

  // Buscar propriedade com todos os detalhes
  findWithDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const propriedade = await prisma.propriedade.findUnique({
        where: { id: Number(id) },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
          endereco: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
            },
          },
          arrendamentos: {
            include: {
              arrendatario: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true,
                },
              },
            },
          },
        },
      });

      if (!propriedade) {
        return res.status(404).json({ erro: "Propriedade não encontrada" });
      }

      return res.status(200).json(propriedade);
    } catch (error) {
      console.error("Erro ao buscar propriedade com detalhes:", error);
      return res.status(500).json({
        erro: "Erro ao buscar propriedade com detalhes",
      });
    }
  },
};
