import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { createGenericController } from "../GenericController";

// Tipos de custos por veículo
const CUSTOS_VEICULOS: Record<string, any> = {
  "CAMINHAO TRUCK": {
    custos: { ate3h: 0.1, de4a10h: 0.3, acima11h: 0.5 },
    unidade: "carga"
  },
  "PA CARREGADEIRA": {
    custos: { ate3h: 0.35, de4a10h: 0.40, acima11h: 0.50 },
    unidade: "hora"
  },
  "PATROLA": {
    custos: { ate3h: 0.35, de4a10h: 0.40, acima11h: 0.50 },
    unidade: "hora"
  }
};

// Função para calcular horas trabalhadas
const calcularHorasTrabalhadas = (horaInicio: string, horaFim: string): number => {
  const [inicioHora, inicioMin] = horaInicio.split(':').map(Number);
  const [fimHora, fimMin] = horaFim.split(':').map(Number);
  
  const inicioEmMinutos = inicioHora * 60 + inicioMin;
  const fimEmMinutos = fimHora * 60 + fimMin;
  
  let diferencaMinutos = fimEmMinutos - inicioEmMinutos;
  
  if (diferencaMinutos < 0) {
    diferencaMinutos += 24 * 60;
  }
  
  return diferencaMinutos / 60;
};

// Função para calcular valor do serviço (atualizada)
const calcularValorServico = (
  tipoVeiculo: string, 
  horaInicio?: string, 
  horaFim?: string, 
  horasEstimadas?: number,
  valorReferencial: number = 180
): number => {
  let horas = 0;
  
  // Se tem horários reais, usar eles
  if (horaInicio && horaFim) {
    horas = calcularHorasTrabalhadas(horaInicio, horaFim);
  }
  // Senão, usar horas estimadas
  else if (horasEstimadas) {
    horas = horasEstimadas;
  }
  // Se não tem nenhum, retorna 0
  else {
    return 0;
  }

  const custoVeiculo = CUSTOS_VEICULOS[tipoVeiculo.toUpperCase()];
  
  if (!custoVeiculo) {
    return 0;
  }

  let multiplicador = 0;
  
  if (horas <= 3) {
    multiplicador = custoVeiculo.custos.ate3h;
  } else if (horas <= 10) {
    multiplicador = custoVeiculo.custos.de4a10h;
  } else {
    multiplicador = custoVeiculo.custos.acima11h;
  }

  if (custoVeiculo.unidade === "carga") {
    return valorReferencial * multiplicador;
  }
  
  return valorReferencial * multiplicador * horas;
};

// Gerar número sequencial da ordem
const gerarNumeroOrdem = async (): Promise<string> => {
  const ano = new Date().getFullYear();
  const count = await prisma.ordemServico.count({
    where: {
      createdAt: {
        gte: new Date(ano, 0, 1),
        lt: new Date(ano + 1, 0, 1)
      }
    }
  });
  
  return `OS${ano}${String(count + 1).padStart(4, '0')}`;
};

// Controlador genérico
const genericController = createGenericController({
  modelName: "ordemServico",
  displayName: "Ordem de Serviço",
  orderBy: { createdAt: "desc" },
  include: {
    pessoa: {
      select: { id: true, nome: true, cpfCnpj: true }
    },
    veiculo: {
      include: {
        tipoVeiculo: { select: { id: true, descricao: true } }
      }
    }
  },
  validateCreate: (data: any) => {
    const errors = [];
    
    if (!data.pessoaId) {
      errors.push("Pessoa solicitante é obrigatória");
    }
    
    if (!data.veiculoId) {
      errors.push("Veículo é obrigatório");
    }
    
    if (!data.dataServico) {
      errors.push("Data do serviço é obrigatória");
    }
    
    // Horários são opcionais, mas se preenchidos devem estar corretos
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (data.horaInicio && !horaRegex.test(data.horaInicio)) {
      errors.push("Formato da hora de início inválido (use HH:mm)");
    }
    
    if (data.horaFim && !horaRegex.test(data.horaFim)) {
      errors.push("Formato da hora de fim inválido (use HH:mm)");
    }
    
    // Se ambos os horários foram preenchidos, validar se fim > início
    if (data.horaInicio && data.horaFim) {
      const [inicioHora, inicioMin] = data.horaInicio.split(':').map(Number);
      const [fimHora, fimMin] = data.horaFim.split(':').map(Number);
      
      const inicioEmMinutos = inicioHora * 60 + inicioMin;
      const fimEmMinutos = fimHora * 60 + fimMin;
      
      if (fimEmMinutos <= inicioEmMinutos) {
        errors.push("Hora de fim deve ser maior que a hora de início");
      }
    }
    
    // Validar horas estimadas se fornecidas
    if (data.horasEstimadas && data.horasEstimadas <= 0) {
      errors.push("Horas estimadas deve ser maior que zero");
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  // Processar dados antes de salvar
  processDataForSave: async (data: any) => {
    // Buscar o tipo de veículo
    const veiculo = await prisma.veiculo.findUnique({
      where: { id: data.veiculoId },
      include: { tipoVeiculo: true }
    });
    
    if (!veiculo) {
      throw new Error("Veículo não encontrado");
    }
    
    // Gerar número da ordem se não existir
    if (!data.numeroOrdem) {
      data.numeroOrdem = await gerarNumeroOrdem();
    }
    
    // Calcular valor automaticamente
    const valorReferencial = data.valorReferencial || 180;
    const valorCalculado = calcularValorServico(
      veiculo.tipoVeiculo.descricao,
      data.horaInicio,
      data.horaFim,
      data.horasEstimadas,
      valorReferencial
    );
    
    return {
      ...data,
      valorCalculado,
      valorReferencial
    };
  }
});

// Controlador específico para Ordem de Serviço
export const ordemServicoController = {
  ...genericController,
  
  // Buscar por status
  getByStatus: async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      
      const ordens = await prisma.ordemServico.findMany({
        where: { status },
        include: {
          pessoa: { select: { id: true, nome: true, cpfCnpj: true } },
          veiculo: {
            include: {
              tipoVeiculo: { select: { id: true, descricao: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      
      return res.status(200).json(ordens);
    } catch (error) {
      console.error("Erro ao buscar ordens por status:", error);
      return res.status(500).json({ erro: "Erro ao buscar ordens por status" });
    }
  },
  
  // Buscar por pessoa
  getByPessoa: async (req: Request, res: Response) => {
    try {
      const { pessoaId } = req.params;
      
      const ordens = await prisma.ordemServico.findMany({
        where: { pessoaId: Number(pessoaId) },
        include: {
          pessoa: { select: { id: true, nome: true, cpfCnpj: true } },
          veiculo: {
            include: {
              tipoVeiculo: { select: { id: true, descricao: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      
      return res.status(200).json(ordens);
    } catch (error) {
      console.error("Erro ao buscar ordens por pessoa:", error);
      return res.status(500).json({ erro: "Erro ao buscar ordens por pessoa" });
    }
  },
  
  // Buscar por veículo
  getByVeiculo: async (req: Request, res: Response) => {
    try {
      const { veiculoId } = req.params;
      
      const ordens = await prisma.ordemServico.findMany({
        where: { veiculoId: Number(veiculoId) },
        include: {
          pessoa: { select: { id: true, nome: true, cpfCnpj: true } },
          veiculo: {
            include: {
              tipoVeiculo: { select: { id: true, descricao: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      
      return res.status(200).json(ordens);
    } catch (error) {
      console.error("Erro ao buscar ordens por veículo:", error);
      return res.status(500).json({ erro: "Erro ao buscar ordens por veículo" });
    }
  },
  
  // Atualizar status
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const ordem = await prisma.ordemServico.update({
        where: { id: Number(id) },
        data: { status },
        include: {
          pessoa: { select: { id: true, nome: true, cpfCnpj: true } },
          veiculo: {
            include: {
              tipoVeiculo: { select: { id: true, descricao: true } }
            }
          }
        }
      });
      
      return res.status(200).json(ordem);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      return res.status(500).json({ erro: "Erro ao atualizar status" });
    }
  },
  
  // Estatísticas
  getEstatisticas: async (req: Request, res: Response) => {
    try {
      const total = await prisma.ordemServico.count();
      const pendentes = await prisma.ordemServico.count({ where: { status: "pendente" } });
      const emExecucao = await prisma.ordemServico.count({ where: { status: "em_execucao" } });
      const concluidas = await prisma.ordemServico.count({ where: { status: "concluida" } });
      const canceladas = await prisma.ordemServico.count({ where: { status: "cancelada" } });
      
      const valorTotal = await prisma.ordemServico.aggregate({
        _sum: { valorCalculado: true },
        where: { status: { in: ["concluida", "em_execucao"] } }
      });
      
      return res.status(200).json({
        total,
        pendentes,
        emExecucao,
        concluidas,
        canceladas,
        valorTotal: valorTotal._sum.valorCalculado || 0
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return res.status(500).json({ erro: "Erro ao buscar estatísticas" });
    }
  }
};