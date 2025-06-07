import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

// Controlador com métodos genéricos
const genericController = createGenericController({
  modelName: "programa",
  displayName: "Programa",
  uniqueField: "nome",
  softDelete: true,
  orderBy: { nome: "asc" },
  validateCreate: (data: any) => {
    const errors = [];
    
    if (!data.nome || data.nome.trim() === "") {
      errors.push("Nome é obrigatório");
    }
    
    if (!data.tipoPrograma || data.tipoPrograma.trim() === "") {
      errors.push("Tipo de programa é obrigatório");
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
});

// Controlador específico para Programa
export const programaController = {
  ...genericController,
  
  // Buscar programa com suas regras
  findByIdWithRules: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const programa = await prisma.programa.findUnique({
        where: { id: Number(id) },
        include: {
          regras: {
            orderBy: { tipoRegra: "asc" }
          },
          _count: {
            select: { 
              solicitacoes: true,
              regras: true 
            }
          }
        }
      });
      
      if (!programa) {
        return res.status(404).json({ erro: "Programa não encontrado" });
      }
      
      return res.status(200).json(programa);
    } catch (error) {
      console.error("Erro ao buscar programa com regras:", error);
      return res.status(500).json({
        erro: "Erro ao buscar programa com regras"
      });
    }
  },
  
  // Listar programas por tipo
  findByTipo: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.params;
      
      const programas = await prisma.programa.findMany({
        where: {
          tipoPrograma: tipo,
          ativo: true
        },
        include: {
          _count: {
            select: { regras: true }
          }
        },
        orderBy: { nome: "asc" }
      });
      
      return res.status(200).json(programas);
    } catch (error) {
      console.error("Erro ao buscar programas por tipo:", error);
      return res.status(500).json({
        erro: "Erro ao buscar programas por tipo"
      });
    }
  },
  
  // Duplicar programa (útil para criar variações)
  duplicate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { novoNome } = req.body;
      
      if (!novoNome) {
        return res.status(400).json({ erro: "Nome do novo programa é obrigatório" });
      }
      
      // Buscar programa original
      const programaOriginal = await prisma.programa.findUnique({
        where: { id: Number(id) },
        include: {
          regras: true
        }
      });
      
      if (!programaOriginal) {
        return res.status(404).json({ erro: "Programa não encontrado" });
      }
      
      // Verificar se já existe programa com o novo nome
      const existente = await prisma.programa.findFirst({
        where: { 
          nome: {
            equals: novoNome,
            mode: "insensitive"
          }
        }
      });
      
      if (existente) {
        return res.status(400).json({
          erro: "Já existe um programa com este nome"
        });
      }
      
      // Criar novo programa com suas regras
      const result = await prisma.$transaction(async (tx) => {
        // Criar programa
        const novoPrograma = await tx.programa.create({
          data: {
            nome: novoNome,
            descricao: programaOriginal.descricao,
            leiNumero: null, // Não duplicar número da lei
            tipoPrograma: programaOriginal.tipoPrograma,
            ativo: true
          }
        });
        
        // Duplicar regras
        if (programaOriginal.regras.length > 0) {
          await tx.regrasNegocio.createMany({
            data: programaOriginal.regras.map(regra => ({
              programaId: novoPrograma.id,
              tipoRegra: regra.tipoRegra,
              parametro: regra.parametro,
              valorBeneficio: regra.valorBeneficio,
              limiteBeneficio: regra.limiteBeneficio
            }))
          });
        }
        
        return novoPrograma;
      });
      
      return res.status(201).json({
        mensagem: "Programa duplicado com sucesso",
        programa: result
      });
    } catch (error) {
      console.error("Erro ao duplicar programa:", error);
      return res.status(500).json({
        erro: "Erro ao duplicar programa"
      });
    }
  },
  
  // Estatísticas dos programas
  getStats: async (req: Request, res: Response) => {
    try {
      const totalProgramas = await prisma.programa.count();
      const programasAtivos = await prisma.programa.count({ 
        where: { ativo: true } 
      });
      
      const porTipo = await prisma.programa.groupBy({
        by: ['tipoPrograma'],
        _count: {
          id: true
        },
        where: { ativo: true }
      });
      
      const comMaisRegras = await prisma.programa.findMany({
        include: {
          _count: {
            select: { regras: true }
          }
        },
        orderBy: {
          regras: {
            _count: 'desc'
          }
        },
        take: 5
      });
      
      return res.status(200).json({
        totalProgramas,
        programasAtivos,
        porTipo,
        comMaisRegras: comMaisRegras.map(p => ({
          id: p.id,
          nome: p.nome,
          quantidadeRegras: p._count.regras
        }))
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas dos programas:", error);
      return res.status(500).json({
        erro: "Erro ao buscar estatísticas dos programas"
      });
    }
  }
};