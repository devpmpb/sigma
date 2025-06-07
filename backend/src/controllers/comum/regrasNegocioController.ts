// backend/src/controllers/agricultura/regrasNegocioController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

// Tipos de regras disponíveis
export enum TipoRegra {
  AREA_EFETIVA = "area_efetiva",
  AREA_CONSTRUCAO = "area_construcao", 
  TIPO_PRODUTOR = "tipo_produtor",
  RENDA_FAMILIAR = "renda_familiar",
  TEMPO_ATIVIDADE = "tempo_atividade",
  CULTIVO_ORGANICO = "cultivo_organico",
  POSSUI_DAP = "possui_dap",
  IDADE_PRODUTOR = "idade_produtor",
  LOCALIZAÇÃO = "localizacao",
  CUSTOM = "custom"
}

// Estrutura para parâmetros das regras
export interface ParametroRegra {
  condicao: "menor_que" | "maior_que" | "igual_a" | "entre" | "contem" | "nao_contem";
  valor?: number | string | boolean;
  valorMinimo?: number;
  valorMaximo?: number;
  unidade?: string;
  descricao?: string;
}

// Estrutura para limites de benefício
export interface LimiteBeneficio {
  tipo: "quantidade" | "valor" | "percentual" | "area";
  limite: number;
  unidade?: string;
  limitePorPeriodo?: {
    periodo: "anual" | "bienal" | "mensal";
    quantidade: number;
  };
  multiplicador?: {
    base: "area" | "renda" | "fixo";
    fator: number;
  };
}

// Controlador com métodos genéricos
const genericController = createGenericController({
  modelName: "regrasNegocio",
  displayName: "Regra de Negócio",
  orderBy: { tipoRegra: "asc" },
  validateCreate: (data: any) => {
    const errors = [];
    
    if (!data.programaId) {
      errors.push("Programa é obrigatório");
    }
    
    if (!data.tipoRegra || data.tipoRegra.trim() === "") {
      errors.push("Tipo de regra é obrigatório");
    }
    
    if (!data.valorBeneficio || isNaN(Number(data.valorBeneficio))) {
      errors.push("Valor do benefício é obrigatório e deve ser numérico");
    }
    
    if (!data.parametro) {
      errors.push("Parâmetros da regra são obrigatórios");
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
});

// Controlador específico para Regras de Negócio  
export const regrasNegocioController = {
  ...genericController,
  
  // Listar regras por programa
  findByPrograma: async (req: Request, res: Response) => {
    try {
      const { programaId } = req.params;
      
      const regras = await prisma.regrasNegocio.findMany({
        where: {
          programaId: Number(programaId)
        },
        include: {
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true
            }
          }
        },
        orderBy: { tipoRegra: "asc" }
      });
      
      return res.status(200).json(regras);
    } catch (error) {
      console.error("Erro ao buscar regras por programa:", error);
      return res.status(500).json({
        erro: "Erro ao buscar regras por programa"
      });
    }
  },
  
  // Listar regras por tipo
  findByTipo: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.params;
      
      const regras = await prisma.regrasNegocio.findMany({
        where: {
          tipoRegra: tipo
        },
        include: {
          programa: {
            select: {
              id: true,
              nome: true,
              tipoPrograma: true,
              ativo: true
            }
          }
        },
        orderBy: [
          { programa: { nome: "asc" } },
          { createdAt: "desc" }
        ]
      });
      
      return res.status(200).json(regras);
    } catch (error) {
      console.error("Erro ao buscar regras por tipo:", error);
      return res.status(500).json({
        erro: "Erro ao buscar regras por tipo"
      });
    }
  },
  
  // Validar se produtor atende uma regra específica
  validateRule: async (req: Request, res: Response) => {
    try {
      const { regraId } = req.params;
      const { produtorData } = req.body;
      
      const regra = await prisma.regrasNegocio.findUnique({
        where: { id: Number(regraId) },
        include: {
          programa: true
        }
      });
      
      if (!regra) {
        return res.status(404).json({ erro: "Regra não encontrada" });
      }
      
      // Lógica de validação baseada no tipo de regra
      const resultado = validateProducerAgainstRule(regra, produtorData);
      
      return res.status(200).json({
        regraId: regra.id,
        programa: regra.programa.nome,
        tipoRegra: regra.tipoRegra,
        atende: resultado.atende,
        motivo: resultado.motivo,
        valorCalculado: resultado.valorCalculado,
        limiteCalculado: resultado.limiteCalculado
      });
    } catch (error) {
      console.error("Erro ao validar regra:", error);
      return res.status(500).json({
        erro: "Erro ao validar regra"
      });
    }
  },
  
  // Obter template de regra por tipo
  getRuleTemplate: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.params;
      
      const template = getRuleTemplate(tipo as TipoRegra);
      
      return res.status(200).json(template);
    } catch (error) {
      console.error("Erro ao buscar template de regra:", error);
      return res.status(500).json({
        erro: "Erro ao buscar template de regra"
      });
    }
  },
  
  // Listar tipos de regra disponíveis
  getTiposRegra: async (req: Request, res: Response) => {
    try {
      const tipos = Object.values(TipoRegra).map(tipo => ({
        valor: tipo,
        label: formatTipoRegraLabel(tipo),
        descricao: getTipoRegraDescricao(tipo)
      }));
      
      return res.status(200).json(tipos);
    } catch (error) {
      console.error("Erro ao buscar tipos de regra:", error);
      return res.status(500).json({
        erro: "Erro ao buscar tipos de regra"
      });
    }
  }
};

// Função auxiliar para validar produtor contra regra
function validateProducerAgainstRule(regra: any, produtorData: any) {
  const parametro = regra.parametro as ParametroRegra;
  const limite = regra.limiteBeneficio as LimiteBeneficio;
  
  let atende = false;
  let motivo = "";
  let valorCalculado = 0;
  let limiteCalculado = 0;
  
  try {
    // Lógica de validação baseada no tipo de regra
    switch (regra.tipoRegra) {
      case TipoRegra.AREA_EFETIVA:
        const areaEfetiva = produtorData.areaEfetiva || 0;
        atende = evaluateCondition(areaEfetiva, parametro);
        valorCalculado = Number(regra.valorBeneficio);
        
        if (limite) {
          if (limite.multiplicador?.base === "area") {
            limiteCalculado = areaEfetiva * limite.multiplicador.fator;
          } else {
            limiteCalculado = limite.limite;
          }
        }
        
        motivo = atende 
          ? `Área efetiva de ${areaEfetiva} alqueires atende ao critério`
          : `Área efetiva de ${areaEfetiva} alqueires não atende ao critério`;
        break;
        
      case TipoRegra.RENDA_FAMILIAR:
        const renda = produtorData.rendaFamiliar || 0;
        atende = evaluateCondition(renda, parametro);
        valorCalculado = Number(regra.valorBeneficio);
        limiteCalculado = limite?.limite || 0;
        
        motivo = atende 
          ? `Renda familiar atende ao critério`
          : `Renda familiar não atende ao critério`;
        break;
        
      // Adicionar outros tipos conforme necessário
      default:
        atende = true;
        valorCalculado = Number(regra.valorBeneficio);
        limiteCalculado = limite?.limite || 0;
        motivo = "Regra personalizada - validação manual necessária";
    }
  } catch (error) {
    atende = false;
    motivo = "Erro ao avaliar regra";
  }
  
  return { atende, motivo, valorCalculado, limiteCalculado };
}

// Função auxiliar para avaliar condições
function evaluateCondition(valor: number, parametro: ParametroRegra): boolean {
  switch (parametro.condicao) {
    case "menor_que":
      return valor < (parametro.valor as number);
    case "maior_que":
      return valor > (parametro.valor as number);
    case "igual_a":
      return valor === (parametro.valor as number);
    case "entre":
      return valor >= (parametro.valorMinimo || 0) && valor <= (parametro.valorMaximo || Infinity);
    default:
      return false;
  }
}

// Função para obter template de regra
function getRuleTemplate(tipo: TipoRegra) {
  const templates = {
    [TipoRegra.AREA_EFETIVA]: {
      parametro: {
        condicao: "menor_que",
        valor: 6,
        unidade: "alqueires",
        descricao: "Área efetiva em alqueires"
      },
      limiteBeneficio: {
        tipo: "quantidade",
        limite: 450,
        unidade: "kg",
        multiplicador: {
          base: "area",
          fator: 150
        }
      }
    },
    [TipoRegra.RENDA_FAMILIAR]: {
      parametro: {
        condicao: "menor_que",
        valor: 50000,
        unidade: "reais",
        descricao: "Renda familiar anual em reais"
      },
      limiteBeneficio: {
        tipo: "valor",
        limite: 5000,
        unidade: "reais"
      }
    }
    // Adicionar outros templates conforme necessário
  };
  
  return templates[tipo] || {
    parametro: {
      condicao: "igual_a",
      valor: "",
      descricao: "Configuração personalizada"
    },
    limiteBeneficio: {
      tipo: "valor",
      limite: 0
    }
  };
}

// Função para formatar label do tipo de regra
function formatTipoRegraLabel(tipo: TipoRegra): string {
  const labels = {
    [TipoRegra.AREA_EFETIVA]: "Área Efetiva",
    [TipoRegra.AREA_CONSTRUCAO]: "Área de Construção",
    [TipoRegra.TIPO_PRODUTOR]: "Tipo de Produtor",
    [TipoRegra.RENDA_FAMILIAR]: "Renda Familiar",
    [TipoRegra.TEMPO_ATIVIDADE]: "Tempo de Atividade",
    [TipoRegra.CULTIVO_ORGANICO]: "Cultivo Orgânico",
    [TipoRegra.POSSUI_DAP]: "Possui DAP",
    [TipoRegra.IDADE_PRODUTOR]: "Idade do Produtor",
    [TipoRegra.LOCALIZAÇÃO]: "Localização",
    [TipoRegra.CUSTOM]: "Personalizada"
  };
  
  return labels[tipo] || tipo;
}

// Função para obter descrição do tipo de regra
function getTipoRegraDescricao(tipo: TipoRegra): string {
  const descricoes = {
    [TipoRegra.AREA_EFETIVA]: "Baseada na área efetiva de produção do agricultor",
    [TipoRegra.AREA_CONSTRUCAO]: "Baseada na área de construção ou benfeitorias",
    [TipoRegra.TIPO_PRODUTOR]: "Baseada no tipo de produtor (familiar, comercial, etc.)",
    [TipoRegra.RENDA_FAMILIAR]: "Baseada na renda familiar do produtor",
    [TipoRegra.TEMPO_ATIVIDADE]: "Baseada no tempo de atividade na agricultura",
    [TipoRegra.CULTIVO_ORGANICO]: "Para produtores que praticam cultivo orgânico",
    [TipoRegra.POSSUI_DAP]: "Para produtores que possuem DAP ativa",
    [TipoRegra.IDADE_PRODUTOR]: "Baseada na idade do produtor",
    [TipoRegra.LOCALIZAÇÃO]: "Baseada na localização da propriedade",
    [TipoRegra.CUSTOM]: "Regra personalizada com critérios específicos"
  };
  
  return descricoes[tipo] || "Regra personalizada";
}