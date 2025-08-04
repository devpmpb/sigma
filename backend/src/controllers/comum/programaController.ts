// backend/src/controllers/comum/programaController.ts - ARQUIVO ATUALIZADO
import { Request, Response } from "express";
import { PrismaClient, TipoPerfil } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

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
  includeRelations: {
    _count: {
      select: {
        solicitacoes: true,
        regras: true
      }
    }
  },
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
      errors: errors.length > 0 ? errors : undefined
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
    if (data.secretaria !== undefined && !Object.values(TipoPerfil).includes(data.secretaria)) {
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
      errors: errors.length > 0 ? errors : undefined
    };
  }
});

// Métodos específicos - ATUALIZADOS
export const programaController = {
  ...genericController,

  // Buscar programas por tipo
  async getByTipo(req: Request, res: Response) {
    try {
      const { tipo } = req.params;

      const programas = await prisma.programa.findMany({
        where: { 
          tipoPrograma: tipo.toUpperCase() as any,
          ativo: true 
        },
        include: {
          _count: {
            select: {
              solicitacoes: true,
              regras: true
            }
          }
        },
        orderBy: { nome: "asc" }
      });

      res.json(programas);
    } catch (error) {
      console.error("Erro ao buscar programas por tipo:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  // NOVO MÉTODO: Buscar programas por secretaria
  async getBySecretaria(req: Request, res: Response) {
    try {
      const { secretaria } = req.params;
      
      if (!Object.values(TipoPerfil).includes(secretaria.toUpperCase() as TipoPerfil)) {
        return res.status(400).json({ 
          erro: "Secretaria inválida. Use OBRAS ou AGRICULTURA" 
        });
      }

      const programas = await prisma.programa.findMany({
        where: { 
          secretaria: secretaria.toUpperCase() as TipoPerfil,
          ativo: true 
        },
        include: {
          _count: {
            select: {
              solicitacoes: true,
              regras: true
            }
          }
        },
        orderBy: { nome: "asc" }
      });

      res.json(programas);
    } catch (error) {
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

      res.json(programa);
    } catch (error) {
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
        return res.status(400).json({ erro: "Nome do novo programa é obrigatório" });
      }

      // Verificar se programa existe
      const programaOriginal = await prisma.programa.findUnique({
        where: { id: parseInt(id) },
        include: { regras: true }
      });

      if (!programaOriginal) {
        return res.status(404).json({ erro: "Programa não encontrado" });
      }

      // Verificar se nome já existe
      const nomeExiste = await prisma.programa.findFirst({
        where: { nome: novoNome.trim() }
      });

      if (nomeExiste) {
        return res.status(400).json({ erro: "Já existe um programa com este nome" });
      }

      // Criar novo programa
      const novoPrograma = await prisma.programa.create({
        data: {
          nome: novoNome.trim(),
          descricao: programaOriginal.descricao,
          leiNumero: null, // Lei não deve ser duplicada
          tipoPrograma: programaOriginal.tipoPrograma,
          secretaria: programaOriginal.secretaria, // NOVO CAMPO INCLUÍDO
          ativo: false // Novo programa inicia inativo
        }
      });

      // Duplicar regras se existirem
      if (programaOriginal.regras.length > 0) {
        const regrasParaDuplicar = programaOriginal.regras.map(regra => ({
          programaId: novoPrograma.id,
          tipoRegra: regra.tipoRegra,
          parametro: regra.parametro,
          valorBeneficio: regra.valorBeneficio,
          limiteBeneficio: regra.limiteBeneficio
        }));

        await prisma.regrasNegocio.createMany({
          data: regrasParaDuplicar
        });
      }

      res.json({
        sucesso: true,
        mensagem: "Programa duplicado com sucesso",
        programa: novoPrograma
      });
    } catch (error) {
      console.error("Erro ao duplicar programa:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },

  async getEstatisticas(req: Request, res: Response) {
    try {
      const [
        totalProgramas,
        programasAtivos,
        porTipo,
        porSecretaria,
        comMaisRegras
      ] = await Promise.all([
        prisma.programa.count(),
        prisma.programa.count({ where: { ativo: true } }),
        prisma.programa.groupBy({
          by: ['tipoPrograma'],
          _count: { id: true }
        }),
        // NOVA CONSULTA ADICIONADA
        prisma.programa.groupBy({
          by: ['secretaria'],
          _count: { id: true },
          where: { ativo: true }
        }),
        prisma.programa.findMany({
          include: {
            _count: { select: { regras: true } }
          },
          orderBy: {
            regras: { _count: 'desc' }
          },
          take: 5
        })
      ]);

      const comMaisRegrasFormatado = comMaisRegras.map(programa => ({
        id: programa.id,
        nome: programa.nome,
        secretaria: programa.secretaria, // NOVO CAMPO INCLUÍDO
        quantidadeRegras: programa._count.regras
      }));

      res.json({
        totalProgramas,
        programasAtivos,
        porTipo,
        porSecretaria, // NOVO CAMPO ADICIONADO
        comMaisRegras: comMaisRegrasFormatado
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }
};