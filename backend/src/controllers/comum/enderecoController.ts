import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { TipoEndereco } from "@prisma/client";
import { createGenericController } from "../GenericController";

// Controlador com os métodos genéricos
const genericController = createGenericController({
  modelName: "endereco",
  displayName: "Endereço",
  validateCreate: (data: any) => {
    const errors = [];

    if (!data.pessoaId) {
      errors.push("Pessoa é obrigatória");
    }

    if (
      !data.tipoEndereco ||
      !Object.values(TipoEndereco).includes(data.tipoEndereco)
    ) {
      errors.push("Tipo de endereço é obrigatório e deve ser válido");
    }

    // Validações para endereço urbano
    if (
      data.tipoEndereco === "RESIDENCIAL" ||
      data.tipoEndereco === "COMERCIAL" ||
      data.tipoEndereco === "CORRESPONDENCIA"
    ) {
      if (!data.logradouroId) {
        errors.push("Logradouro é obrigatório para este tipo de endereço");
      }

      if (!data.numero) {
        errors.push("Número é obrigatório para este tipo de endereço");
      }

      if (!data.bairroId) {
        errors.push("Bairro é obrigatório para este tipo de endereço");
      }
    }

    // Validações para endereço rural
    if (data.tipoEndereco === "RURAL") {
      if (!data.areaRuralId) {
        errors.push("Área rural é obrigatória para este tipo de endereço");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// Controlador com métodos específicos para Endereço
export const enderecoController = {
  ...genericController,

  // Buscar endereços por pessoa
  findByPessoa: async (req: Request, res: Response) => {
    try {
      const { pessoaId } = req.params;

      const enderecos = await prisma.endereco.findMany({
        where: {
          pessoaId: Number(pessoaId),
        },
        include: {
          logradouro: true,
          bairro: true,
          areaRural: true,
        },
        orderBy: {
          principal: "desc", // Endereços principais primeiro
        },
      });

      return res.status(200).json(enderecos);
    } catch (error) {
      console.error("Erro ao buscar endereços por pessoa:", error);
      return res.status(500).json({
        erro: "Erro ao buscar endereços por pessoa",
      });
    }
  },

  // Definir endereço como principal
  setPrincipal: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const enderecoId = Number(id);

      // Buscar o endereço para verificar a pessoa
      const endereco = await prisma.endereco.findUnique({
        where: { id: enderecoId },
      });

      if (!endereco) {
        return res.status(404).json({ erro: "Endereço não encontrado" });
      }

      // Remover o status de principal de todos os endereços da pessoa
      await prisma.endereco.updateMany({
        where: {
          pessoaId: endereco.pessoaId,
          principal: true,
        },
        data: {
          principal: false,
        },
      });

      // Definir o endereço selecionado como principal
      await prisma.endereco.update({
        where: { id: enderecoId },
        data: {
          principal: true,
        },
      });

      return res.status(200).json({
        mensagem: "Endereço definido como principal com sucesso",
      });
    } catch (error) {
      console.error("Erro ao definir endereço como principal:", error);
      return res.status(500).json({
        erro: "Erro ao definir endereço como principal",
      });
    }
  },

  // Buscar endereços por propriedade
  findByPropriedade: async (req: Request, res: Response) => {
    try {
      const { propriedadeId } = req.params;

      const enderecos = await prisma.endereco.findMany({
        where: {
          propriedadeId: Number(propriedadeId),
        },
        include: {
          logradouro: true,
          bairro: true,
          areaRural: true,
          pessoa: true,
        },
      });

      return res.status(200).json(enderecos);
    } catch (error) {
      console.error("Erro ao buscar endereços por propriedade:", error);
      return res.status(500).json({
        erro: "Erro ao buscar endereços por propriedade",
      });
    }
  },

  // Outros métodos específicos podem ser adicionados aqui
};
