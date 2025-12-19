// backend/src/controllers/comum/programaController.ts - ARQUIVO ATUALIZADO
import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { TipoPerfil } from "@prisma/client";
import { createGenericController } from "../GenericController";
import { Prisma } from "@prisma/client";

// Interface para dados do programa - ATUALIZADA
export interface ProgramaData {
  nome: string;
  descricao?: string;
  leiNumero?: string;
  tipoPrograma: string;
  secretaria: TipoPerfil; // NOVO CAMPO ADICIONADO
  ativo?: boolean;
}

// Controlador com métodos genéricos - ATUALIZADO
const genericController = createGenericController({
  modelName: "programa",
  displayName: "Programa",
  orderBy: { nome: "asc" },
  validateCreate: (data: ProgramaData) => {
    const errors = [];

    if (!data.nome || data.nome.trim() === "") {
      errors.push("Nome é obrigatório");
    }

    if (!data.tipoPrograma || data.tipoPrograma.trim() === "") {
      errors.push("Tipo de programa é obrigatório");
    }

    // NOVA VALIDAÇÃO ADICIONADA
    if (!data.secretaria) {
      errors.push("Secretaria é obrigatória");
    }

    if (!Object.values(TipoPerfil).includes(data.secretaria)) {
      errors.push("Secretaria deve ser OBRAS ou AGRICULTURA");
    }

    if (data.leiNumero && data.leiNumero.trim()) {
      const leiPattern = /^(LEI\s+)?N[°º]?\s*\d+/i;
      if (!leiPattern.test(data.leiNumero)) {
        errors.push("Formato da lei inválido. Ex: LEI Nº 1234/2023");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  validateUpdate: (data: ProgramaData) => {
    const errors = [];

    if (data.nome !== undefined && data.nome.trim() === "") {
      errors.push("Nome não pode ser vazio");
    }

    if (data.tipoPrograma !== undefined && data.tipoPrograma.trim() === "") {
      errors.push("Tipo de programa não pode ser vazio");
    }

    // NOVA VALIDAÇÃO ADICIONADA
    if (
      data.secretaria !== undefined &&
      !Object.values(TipoPerfil).includes(data.secretaria)
    ) {
      errors.push("Secretaria deve ser OBRAS ou AGRICULTURA");
    }

    if (data.leiNumero && data.leiNumero.trim()) {
      const leiPattern = /^(LEI\s+)?N[°º]?\s*\d+/i;
      if (!leiPattern.test(data.leiNumero)) {
        errors.push("Formato da lei inválido. Ex: LEI Nº 1234/2023");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// Métodos específicos - ATUALIZADOS
export const programaController = {
  ...genericController,

  // Sobrescrever findAll para incluir relações (_count)
  async findAll(req: Request, res: Response) {
    try {
      const { ativo } = req.query;
      const whereClause: any = {};

      // Filtrar por status ativo/inativo se o parâmetro for fornecido
      if (ativo !== undefined) {
        whereClause.ativo = ativo === "true";
      }

      const programas = await prisma.programa.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              solicitacoes: true,
              regras: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(programas);
    } catch (error) {
      console.error("Erro ao listar programas:", error);
      return res.status(500).json({
        erro: "Erro ao listar programas",
      });
    }
  },

  buscarPorTermo: async (req: Request, res: Response) => {
    try {
      const { termo } = req.query;

      if (!termo) {
        return res.status(400).json({ erro: "Termo de busca é obrigatório" });
      }

      const programas = await prisma.programa.findMany({
        where: {
          OR: [
            {
              nome: {
                contains: termo as string,
                mode: "insensitive",
              },
            },
            {
              descricao: {
                contains: termo as string,
                mode: "insensitive",
              },
            },
            {
              leiNumero: {
                contains: termo as string,
                mode: "insensitive",
              },
            },
          ],
        },
        include: {
          _count: {
            select: {
              solicitacoes: true,
              regras: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.status(200).json(programas);
    } catch (error) {
      console.log("Chegou no BUSCAR POR TERMO");
      console.error("Erro ao buscar programas por termo:", error);
      return res.status(500).json({
        erro: "Erro ao buscar programas",
      });
    }
  },

  // Sobrescrever método status para validar regras antes de ativar
  async status(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar se programa existe
      const programa = await prisma.programa.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: {
              regras: true,
            },
          },
        },
      });

      if (!programa) {
        return res.status(404).json({ erro: "Programa não encontrado" });
      }

      // Se está tentando ATIVAR um programa, verificar se tem regras
      if (!programa.ativo) {
        const quantidadeRegras = programa._count.regras;

        if (quantidadeRegras === 0) {
          return res.status(400).json({
            erro: "Não é possível ativar um programa sem regras de negócio",
            detalhes: [
              "Configure ao menos uma regra de negócio antes de ativar o programa.",
              "As regras definem os critérios de elegibilidade e valores dos benefícios.",
            ],
            sugestao:
              "Acesse 'Gerenciar Regras' no formulário do programa para configurar as regras.",
          });
        }
      }

      // Atualizar status
      const programaAtualizado = await prisma.programa.update({
        where: { id: parseInt(id) },
        data: { ativo: !programa.ativo },
      });

      return res.status(200).json({
        mensagem: `Programa ${programaAtualizado.ativo ? "ativado" : "desativado"} com sucesso`,
        programa: programaAtualizado,
      });
    } catch (error) {
      console.error("Erro ao alterar status do programa:", error);
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // Sobrescrever método delete para prevenir exclusão com solicitações vinculadas
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar se programa existe
      const programa = await prisma.programa.findUnique({
        where: { id: parseInt(id) },
        select: {
          nome: true,
          _count: {
            select: {
              solicitacoes: true,
              regras: true,
            },
          },
        },
      });

      if (!programa) {
        return res.status(404).json({ erro: "Programa não encontrado" });
      }

      // Verificar se há solicitações vinculadas
      const quantidadeSolicitacoes = programa._count.solicitacoes;

      if (quantidadeSolicitacoes > 0) {
        return res.status(400).json({
          erro: "Não é possível excluir este programa",
          detalhes: [
            `Existem ${quantidadeSolicitacoes} solicitação(ões) de benefício vinculadas a este programa.`,
            "A exclusão causaria perda de dados importantes.",
          ],
          sugestao:
            "Desative o programa ao invés de excluí-lo. Programas inativos não aparecem para novas solicitações, mas preservam o histórico.",
          quantidadeSolicitacoes,
        });
      }

      // Se chegou aqui, pode excluir (mas vai excluir as regras em cascata)
      await prisma.programa.delete({
        where: { id: parseInt(id) },
      });

      return res.status(200).json({
        mensagem: "Programa excluído com sucesso",
        avisos:
          programa._count.regras > 0
            ? [
                `${programa._count.regras} regra(s) de negócio também foram excluídas`,
              ]
            : undefined,
      });
    } catch (error) {
      console.error("Erro ao excluir programa:", error);

      // Verificar se é erro de integridade referencial
      if ((error as any).code === "P2003") {
        return res.status(400).json({
          erro: "Não é possível excluir este programa pois está sendo utilizado em outros registros",
        });
      }

      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // Buscar programas por tipo
  async getByTipo(req: Request, res: Response) {
    try {
      const { tipo } = req.params;

      const programas = await prisma.programa.findMany({
        where: {
          tipoPrograma: tipo.toUpperCase() as any,
          ativo: true,
        },
        include: {
          _count: {
            select: {
              solicitacoes: true,
              regras: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      res.json(programas);
    } catch (error) {
      console.log("Chegou no BUSCAR POR TIPO");
      console.error("Erro ao buscar programas por tipo:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // NOVO MÉTODO: Buscar programas por secretaria
  async getBySecretaria(req: Request, res: Response) {
    try {
      const { secretaria } = req.params;

      if (
        !Object.values(TipoPerfil).includes(
          secretaria.toUpperCase() as TipoPerfil
        )
      ) {
        return res.status(400).json({
          erro: "Secretaria inválida. Use OBRAS ou AGRICULTURA",
        });
      }

      const programas = await prisma.programa.findMany({
        where: {
          secretaria: secretaria.toUpperCase() as TipoPerfil,
          ativo: true,
        },
        include: {
          _count: {
            select: {
              solicitacoes: true,
              regras: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      res.json(programas);
    } catch (error) {
      console.log("Chegou no BUSCAR POR ECRETARIA");
      console.error("Erro ao buscar programas por secretaria:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // Buscar programa com suas regras (método existente mantido)
  async getByIdWithRules(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const programa = await prisma.programa.findUnique({
        where: { id: parseInt(id) },
        include: {
          regras: {
            orderBy: { tipoRegra: "asc" },
          },
          _count: {
            select: {
              solicitacoes: true,
              regras: true,
            },
          },
        },
      });

      if (!programa) {
        return res.status(404).json({ erro: "Programa não encontrado" });
      }

      res.json(programa);
    } catch (error) {
      console.log("Chegou no BUSCAR  ID POR REGRAS");
      console.error("Erro ao buscar programa com regras:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // Duplicar programa (método existente mantido)
  async duplicarPrograma(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { novoNome } = req.body;

      if (!novoNome || novoNome.trim() === "") {
        return res
          .status(400)
          .json({ erro: "Nome do novo programa é obrigatório" });
      }

      // Iniciando a transação
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Verificar se o programa original existe (usando tx)
        const programaOriginal = await tx.programa.findUnique({
          where: { id: parseInt(id) },
          include: { regras: true },
        });

        if (!programaOriginal) {
          throw new Error("NOT_FOUND");
        }

        // 2. Verificar se o nome já existe
        const nomeExiste = await tx.programa.findFirst({
          where: { nome: novoNome.trim() },
        });

        if (nomeExiste) {
          throw new Error("NAME_EXISTS");
        }

        // 3. Criar novo programa
        const novoPrograma = await tx.programa.create({
          data: {
            nome: novoNome.trim(),
            descricao: programaOriginal.descricao,
            leiNumero: null,
            tipoPrograma: programaOriginal.tipoPrograma,
            secretaria: programaOriginal.secretaria,
            ativo: false,
          },
        });

        // 4. Duplicar regras (se existirem)
        if (programaOriginal.regras.length > 0) {
          const regrasParaDuplicar = programaOriginal.regras.map((regra) => ({
            programaId: novoPrograma.id,
            tipoRegra: regra.tipoRegra,
            parametro: regra.parametro as Prisma.InputJsonValue,
            valorBeneficio: regra.valorBeneficio,
            limiteBeneficio: regra.limiteBeneficio as Prisma.InputJsonValue,
          }));

          await tx.regrasNegocio.createMany({
            data: regrasParaDuplicar,
          });
        }

        return novoPrograma;
      });

      return res.json({
        sucesso: true,
        mensagem: "Programa duplicado com sucesso",
        programa: resultado,
      });
    } catch (error: any) {
      console.error("Erro ao duplicar programa:", error);

      // Tratamento de erros específicos lançados dentro da transação
      if (error.message === "NOT_FOUND") {
        return res
          .status(404)
          .json({ erro: "Programa original não encontrado" });
      }
      if (error.message === "NAME_EXISTS") {
        return res
          .status(400)
          .json({ erro: "Já existe um programa com este nome" });
      }

      return res
        .status(500)
        .json({ erro: "Erro interno do servidor ao duplicar" });
    }
  },

  async getEstatisticas(req: Request, res: Response) {
    try {
      const [
        totalProgramas,
        programasAtivos,
        porTipo,
        porSecretaria,
        comMaisRegras,
      ] = await Promise.all([
        prisma.programa.count(),
        prisma.programa.count({ where: { ativo: true } }),
        prisma.programa.groupBy({
          by: ["tipoPrograma"],
          _count: { id: true },
        }),
        // NOVA CONSULTA ADICIONADA
        prisma.programa.groupBy({
          by: ["secretaria"],
          _count: { id: true },
          where: { ativo: true },
        }),
        prisma.programa.findMany({
          include: {
            _count: { select: { regras: true } },
          },
          orderBy: {
            regras: { _count: "desc" },
          },
          take: 5,
        }),
      ]);

      const comMaisRegrasFormatado = comMaisRegras.map((programa) => ({
        id: programa.id,
        nome: programa.nome,
        secretaria: programa.secretaria, // NOVO CAMPO INCLUÍDO
        quantidadeRegras: programa._count.regras,
      }));

      res.json({
        totalProgramas,
        programasAtivos,
        porTipo,
        porSecretaria, // NOVO CAMPO ADICIONADO
        comMaisRegras: comMaisRegrasFormatado,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },
};
