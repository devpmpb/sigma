// backend/src/controllers/obras/tipoServicoController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const tipoServicoController = {
  // Listar todos os tipos de serviço com suas faixas
  async getAll(req: Request, res: Response) {
    try {
      const tipos = await prisma.tipoServico.findMany({
        where: { ativo: true },
        include: {
          faixasPreco: {
            where: { ativo: true },
            orderBy: { quantidadeMin: "asc" },
          },
        },
        orderBy: { nome: "asc" },
      });

      return res.json(tipos);
    } catch (error) {
      console.error("Erro ao listar tipos de serviço:", error);
      return res.status(500).json({ error: "Erro ao listar tipos de serviço" });
    }
  },

  // Buscar um tipo de serviço por ID com suas faixas
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tipo = await prisma.tipoServico.findUnique({
        where: { id: parseInt(id) },
        include: {
          faixasPreco: {
            where: { ativo: true },
            orderBy: { quantidadeMin: "asc" },
          },
        },
      });

      if (!tipo) {
        return res.status(404).json({ error: "Tipo de serviço não encontrado" });
      }

      return res.json(tipo);
    } catch (error) {
      console.error("Erro ao buscar tipo de serviço:", error);
      return res
        .status(500)
        .json({ error: "Erro ao buscar tipo de serviço" });
    }
  },

  // Criar tipo de serviço com faixas de preço
  async create(req: Request, res: Response) {
    try {
      const { nome, unidade, faixasPreco } = req.body;

      // Validar campos obrigatórios
      if (!nome || !unidade) {
        return res.status(400).json({
          error: "Nome e unidade são obrigatórios",
        });
      }

      // Verificar se já existe tipo com esse nome
      const existente = await prisma.tipoServico.findUnique({
        where: { nome },
      });

      if (existente) {
        return res.status(400).json({
          error: `Já existe um tipo de serviço com o nome "${nome}"`,
        });
      }

      // Criar tipo de serviço com faixas de preço
      const tipo = await prisma.tipoServico.create({
        data: {
          nome,
          unidade,
          ativo: true,
          faixasPreco: {
            create: faixasPreco?.map((faixa: any) => ({
              quantidadeMin: faixa.quantidadeMin,
              quantidadeMax: faixa.quantidadeMax,
              multiplicadorVR: faixa.multiplicadorVR,
              ativo: true,
            })) || [],
          },
        },
        include: {
          faixasPreco: {
            orderBy: { quantidadeMin: "asc" },
          },
        },
      });

      return res.status(201).json(tipo);
    } catch (error) {
      console.error("Erro ao criar tipo de serviço:", error);
      return res.status(500).json({ error: "Erro ao criar tipo de serviço" });
    }
  },

  // Atualizar tipo de serviço e suas faixas
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome, unidade, ativo, faixasPreco } = req.body;

      // Verificar se o tipo existe
      const existente = await prisma.tipoServico.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existente) {
        return res.status(404).json({ error: "Tipo de serviço não encontrado" });
      }

      // Se mudou o nome, verificar se não duplica
      if (nome && nome !== existente.nome) {
        const duplicado = await prisma.tipoServico.findUnique({
          where: { nome },
        });

        if (duplicado) {
          return res.status(400).json({
            error: `Já existe um tipo de serviço com o nome "${nome}"`,
          });
        }
      }

      // Atualizar tipo de serviço
      const tipo = await prisma.tipoServico.update({
        where: { id: parseInt(id) },
        data: {
          ...(nome && { nome }),
          ...(unidade && { unidade }),
          ...(ativo !== undefined && { ativo }),
        },
        include: {
          faixasPreco: {
            orderBy: { quantidadeMin: "asc" },
          },
        },
      });

      // Se foram enviadas faixas, atualizar
      if (faixasPreco && Array.isArray(faixasPreco)) {
        // Deletar faixas antigas
        await prisma.faixaPrecoServico.deleteMany({
          where: { tipoServicoId: parseInt(id) },
        });

        // Criar novas faixas
        await prisma.faixaPrecoServico.createMany({
          data: faixasPreco.map((faixa: any) => ({
            tipoServicoId: parseInt(id),
            quantidadeMin: faixa.quantidadeMin,
            quantidadeMax: faixa.quantidadeMax,
            multiplicadorVR: faixa.multiplicadorVR,
            ativo: faixa.ativo !== undefined ? faixa.ativo : true,
          })),
        });

        // Buscar o tipo atualizado com as novas faixas
        const tipoAtualizado = await prisma.tipoServico.findUnique({
          where: { id: parseInt(id) },
          include: {
            faixasPreco: {
              orderBy: { quantidadeMin: "asc" },
            },
          },
        });

        return res.json(tipoAtualizado);
      }

      return res.json(tipo);
    } catch (error) {
      console.error("Erro ao atualizar tipo de serviço:", error);
      return res
        .status(500)
        .json({ error: "Erro ao atualizar tipo de serviço" });
    }
  },

  // Desativar tipo de serviço (soft delete)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar se existe
      const existente = await prisma.tipoServico.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existente) {
        return res.status(404).json({ error: "Tipo de serviço não encontrado" });
      }

      // Verificar se está sendo usado em ordens de serviço
      const emUso = await prisma.ordemServico.count({
        where: { tipoServicoId: parseInt(id) },
      });

      if (emUso > 0) {
        return res.status(400).json({
          error: `Este tipo de serviço não pode ser removido pois está sendo usado em ${emUso} ordem(ns) de serviço`,
        });
      }

      // Soft delete
      await prisma.tipoServico.update({
        where: { id: parseInt(id) },
        data: { ativo: false },
      });

      return res.json({ message: "Tipo de serviço desativado com sucesso" });
    } catch (error) {
      console.error("Erro ao desativar tipo de serviço:", error);
      return res
        .status(500)
        .json({ error: "Erro ao desativar tipo de serviço" });
    }
  },

  // Calcular valor de um serviço baseado em quantidade
  async calcularValor(req: Request, res: Response) {
    try {
      const { tipoServicoId, quantidade, valorReferencial } = req.body;

      if (!tipoServicoId || !quantidade || !valorReferencial) {
        return res.status(400).json({
          error: "tipoServicoId, quantidade e valorReferencial são obrigatórios",
        });
      }

      // Buscar tipo de serviço com faixas
      const tipo = await prisma.tipoServico.findUnique({
        where: { id: parseInt(tipoServicoId) },
        include: {
          faixasPreco: {
            where: { ativo: true },
            orderBy: { quantidadeMin: "asc" },
          },
        },
      });

      if (!tipo) {
        return res.status(404).json({ error: "Tipo de serviço não encontrado" });
      }

      // Encontrar a faixa de preço adequada
      const quantidadeNum = parseFloat(quantidade);
      const faixa = tipo.faixasPreco.find(
        (f) =>
          quantidadeNum >= f.quantidadeMin &&
          (f.quantidadeMax === null || quantidadeNum <= f.quantidadeMax)
      );

      if (!faixa) {
        return res.status(400).json({
          error: "Não foi encontrada uma faixa de preço para a quantidade informada",
        });
      }

      // Calcular valor
      const vrNum = parseFloat(valorReferencial);
      const multiplicador = parseFloat(faixa.multiplicadorVR.toString());

      let valorCalculado: number;

      // Se a unidade é "carga", multiplica VR * multiplicador * quantidade
      // Se a unidade é "hora", multiplica VR * multiplicador * quantidade
      if (tipo.unidade === "carga") {
        valorCalculado = vrNum * multiplicador * quantidadeNum;
      } else {
        valorCalculado = vrNum * multiplicador * quantidadeNum;
      }

      return res.json({
        tipoServico: tipo.nome,
        unidade: tipo.unidade,
        quantidade: quantidadeNum,
        faixaAplicada: {
          quantidadeMin: faixa.quantidadeMin,
          quantidadeMax: faixa.quantidadeMax,
          multiplicadorVR: multiplicador,
        },
        valorReferencial: vrNum,
        valorCalculado: parseFloat(valorCalculado.toFixed(2)),
      });
    } catch (error) {
      console.error("Erro ao calcular valor:", error);
      return res.status(500).json({ error: "Erro ao calcular valor" });
    }
  },
};
