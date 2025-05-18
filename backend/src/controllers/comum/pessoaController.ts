// src/controllers/comum/pessoaController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

// Controlador com os métodos genéricos
const genericController = createGenericController({
  modelName: "pessoa",
  displayName: "Pessoa",
  uniqueField: "cpfCnpj",
  orderBy: { nome: "asc" },
  validateCreate: (data: any) => {
    const errors = [];
    
    // Validações básicas
    if (!data.nome || data.nome.trim() === "") {
      errors.push("Nome é obrigatório");
    }
    
    if (!data.cpfCnpj || data.cpfCnpj.trim() === "") {
      errors.push("CPF/CNPJ é obrigatório");
    }
    
    // Aqui você pode adicionar validações de formato de CPF/CNPJ
    // e outras validações específicas
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  },
  validateUpdate: (data: any) => {
    const errors = [];
    
    if (data.nome !== undefined && data.nome.trim() === "") {
      errors.push("Nome não pode ser vazio");
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
});

// Controlador com métodos específicos para Pessoa
export const pessoaController = {
  ...genericController,
  
  // Buscar pessoa por CPF/CNPJ
  findByCpfCnpj: async (req: Request, res: Response) => {
    try {
      const { cpfCnpj } = req.params;
      
      const pessoa = await prisma.pessoa.findUnique({
        where: { cpfCnpj },
      });
      
      if (!pessoa) {
        return res.status(404).json({ erro: "Pessoa não encontrada" });
      }
      
      return res.status(200).json(pessoa);
    } catch (error) {
      console.error("Erro ao buscar pessoa por CPF/CNPJ:", error);
      return res.status(500).json({ erro: "Erro ao buscar pessoa por CPF/CNPJ" });
    }
  },
  
  // Listar pessoas com endereços
  findAllWithEnderecos: async (req: Request, res: Response) => {
    try {
      const pessoas = await prisma.pessoa.findMany({
        include: {
          enderecos: true
        },
        orderBy: { nome: "asc" }
      });
      
      return res.status(200).json(pessoas);
    } catch (error) {
      console.error("Erro ao listar pessoas com endereços:", error);
      return res.status(500).json({ erro: "Erro ao listar pessoas com endereços" });
    }
  },
  
  // Buscar pessoa por ID com todas as relações
  findByIdWithDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const pessoa = await prisma.pessoa.findUnique({
        where: { id: Number(id) },
        include: {
          enderecos: {
            include: {
              logradouro: true,
              bairro: true,
              areaRural: true,
              propriedade: true
            }
          },
          propriedades: true,
          // Os relacionamentos abaixo estão comentados porque serão implementados posteriormente
          // produtor: true,
          // arrendamentos: true,
          // arrendou: true
        }
      });
      
      if (!pessoa) {
        return res.status(404).json({ erro: "Pessoa não encontrada" });
      }
      
      return res.status(200).json(pessoa);
    } catch (error) {
      console.error("Erro ao buscar detalhes da pessoa:", error);
      return res.status(500).json({ erro: "Erro ao buscar detalhes da pessoa" });
    }
  }
  
  // Outros métodos específicos podem ser adicionados aqui
};