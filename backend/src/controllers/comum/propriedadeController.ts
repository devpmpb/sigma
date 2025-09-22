import { Request, Response } from "express";
import {
  PrismaClient,
  TipoPropriedade,
  SituacaoPropriedade,
  AtividadeProdutiva,
} from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

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

  // NOVA FUNÇÃO: Transformar dados antes de salvar
  transformDataBeforeSave: (data: any) => {
    // Determinar unidade de área baseada no tipo
    const unidadeArea =
      data.tipoPropriedade === TipoPropriedade.RURAL
        ? "alqueires"
        : "metros_quadrados";

    // Limpar campos rurais se não for rural
    if (data.tipoPropriedade !== TipoPropriedade.RURAL) {
      data.itr = null;
      data.incra = null;
    }

    return {
      ...data,
      unidadeArea,
      isproprietarioResidente: Boolean(data.isproprietarioResidente),
      areaTotal: Number(data.areaTotal),
    };
  },
});

// Controlador com métodos específicos para Propriedade ATUALIZADO
export const propriedadeController = {
  ...genericController,

  // Sobrescrever create para usar transformação de dados
  create: async (req: Request, res: Response) => {
    try {
      const validation = validate(req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: validation.errors,
        });
      }

      // Transformar dados antes de salvar
      const transformedData = {
        nome: req.body.nome,
        tipoPropriedade: req.body.tipoPropriedade,
        logradouroId: req.body.logradouroId
          ? Number(req.body.logradouroId)
          : null,
        numero: req.body.numero || null,
        areaTotal: Number(req.body.areaTotal),
        unidadeArea:
          req.body.tipoPropriedade === TipoPropriedade.RURAL
            ? "alqueires"
            : "metros_quadrados",
        itr:
          req.body.tipoPropriedade === TipoPropriedade.RURAL
            ? req.body.itr || null
            : null,
        incra:
          req.body.tipoPropriedade === TipoPropriedade.RURAL
            ? req.body.incra || null
            : null,
        atividadeProdutiva:
          req.body.tipoPropriedade === TipoPropriedade.RURAL
            ? req.body.atividadeProdutiva
            : null,
        situacao: req.body.situacao,
        isproprietarioResidente: Boolean(req.body.isproprietarioResidente),
        localizacao: req.body.localizacao || null,
        matricula: req.body.matricula || null,
        proprietarioId: Number(req.body.proprietarioId),
      };

      const propriedade = await prisma.propriedade.create({
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
          logradouro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              cep: true,
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

      return res.status(201).json(propriedade);
    } catch (error) {
      console.error("Erro ao criar propriedade:", error);
      return res.status(500).json({
        erro: "Erro ao criar propriedade",
      });
    }
  },

  // Sobrescrever update para usar transformação de dados
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

      // Transformar dados antes de atualizar
      const transformedData = {
        nome: req.body.nome,
        tipoPropriedade: req.body.tipoPropriedade,
        logradouroId: req.body.logradouroId
          ? Number(req.body.logradouroId)
          : null,
        numero: req.body.numero || null,
        areaTotal: Number(req.body.areaTotal),
        unidadeArea:
          req.body.tipoPropriedade === TipoPropriedade.RURAL
            ? "alqueires"
            : "metros_quadrados",
        itr:
          req.body.tipoPropriedade === TipoPropriedade.RURAL
            ? req.body.itr || null
            : null,
        incra:
          req.body.tipoPropriedade === TipoPropriedade.RURAL
            ? req.body.incra || null
            : null,
        situacao: req.body.situacao,
        isproprietarioResidente: Boolean(req.body.isproprietarioResidente),
        localizacao: req.body.localizacao || null,
        matricula: req.body.matricula || null,
        proprietarioId: Number(req.body.proprietarioId),
      };

      const propriedade = await prisma.propriedade.update({
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
          logradouro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              cep: true,
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

      return res.status(200).json(propriedade);
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
          logradouro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              cep: true,
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
          logradouro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              cep: true,
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
          logradouro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              cep: true,
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
          enderecos: {
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
                  pessoa: {
                    select: {
                      nome: true,
                      cpfCnpj: true,
                    },
                  },
                },
              },
              proprietario: {
                select: {
                  id: true,
                  pessoa: {
                    select: {
                      nome: true,
                      cpfCnpj: true,
                    },
                  },
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

      if (!Object.values(TipoPropriedade).includes(tipo as TipoPropriedade)) {
        return res.status(400).json({ erro: "Tipo de propriedade inválido" });
      }

      const propriedades = await prisma.propriedade.findMany({
        where: { tipoPropriedade: tipo as TipoPropriedade },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
          logradouro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              cep: true,
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

      if (
        !Object.values(SituacaoPropriedade).includes(
          situacao as SituacaoPropriedade
        )
      ) {
        return res
          .status(400)
          .json({ erro: "Situação de propriedade inválida" });
      }

      const propriedades = await prisma.propriedade.findMany({
        where: { situacao: situacao as SituacaoPropriedade },
        include: {
          proprietario: {
            select: {
              id: true,
              nome: true,
              cpfCnpj: true,
              tipoPessoa: true,
            },
          },
          logradouro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              cep: true,
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
          logradouro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              cep: true,
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

  // NOVA: Buscar propriedades com proprietários residentes
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
          logradouro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              cep: true,
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
          logradouro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              cep: true,
            },
          },
          arrendamentos: {
            include: {
              arrendatario: {
                include: {
                  pessoa: {
                    select: {
                      id: true,
                      nome: true,
                      cpfCnpj: true,
                    },
                  },
                },
              },
            },
          },
          enderecos: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
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
