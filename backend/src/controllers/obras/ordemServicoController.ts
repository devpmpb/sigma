import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { createGenericController } from "../GenericController";

const CUSTOS_VEICULOS: Record<string, any> = {
  "CAMINHAO TRUCK": { custos: { ate3h: 0.1, de4a10h: 0.3, acima11h: 0.5 }, unidade: "carga" },
  "PA CARREGADEIRA": { custos: { ate3h: 0.35, de4a10h: 0.40, acima11h: 0.50 }, unidade: "hora" },
  "PATROLA": { custos: { ate3h: 0.35, de4a10h: 0.40, acima11h: 0.50 }, unidade: "hora" }
};

const calcularHorasTrabalhadas = (horaInicio: string, horaFim: string): number => {
  const [inicioHora, inicioMin] = horaInicio.split(":").map(Number);
  const [fimHora, fimMin] = horaFim.split(":").map(Number);
  const inicioEmMinutos = inicioHora * 60 + inicioMin;
  const fimEmMinutos = fimHora * 60 + fimMin;
  let diferencaMinutos = fimEmMinutos - inicioEmMinutos;
  if (diferencaMinutos < 0) diferencaMinutos += 24 * 60;
  return diferencaMinutos / 60;
};

const gerarNumeroOrdem = async (): Promise<string> => {
  const ano = new Date().getFullYear();
  const count = await prisma.ordemServico.count({
    where: { createdAt: { gte: new Date(ano, 0, 1), lt: new Date(ano + 1, 0, 1) } }
  });
  return "OS" + ano + String(count + 1).padStart(4, "0");
};

const genericController = createGenericController({
  modelName: "ordemServico",
  displayName: "Ordem de Servico",
  orderBy: { createdAt: "desc" },
  validateCreate: (data: any) => {
    const errors = [];
    if (!data.pessoaId) errors.push("Pessoa solicitante e obrigatoria");
    if (!data.tipoServicoId) errors.push("Tipo de servico e obrigatorio");
    if (!data.quantidadeSolicitada || data.quantidadeSolicitada <= 0) errors.push("Quantidade solicitada deve ser maior que zero");
    if (!data.veiculoId) errors.push("Veiculo e obrigatorio");
    if (!data.dataServico) errors.push("Data do servico e obrigatoria");
    return { isValid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
});

export const ordemServicoController = {
  ...genericController,

  getByStatus: async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const ordens = await prisma.ordemServico.findMany({
        where: { status },
        include: { pessoa: { select: { id: true, nome: true, cpfCnpj: true } }, veiculo: { include: { tipoVeiculo: { select: { id: true, descricao: true } } } } },
        orderBy: { createdAt: "desc" }
      });
      return res.status(200).json(ordens);
    } catch (error) {
      console.error("Erro ao buscar ordens por status:", error);
      return res.status(500).json({ erro: "Erro ao buscar ordens por status" });
    }
  },

  getByPessoa: async (req: Request, res: Response) => {
    try {
      const { pessoaId } = req.params;
      const ordens = await prisma.ordemServico.findMany({
        where: { pessoaId: Number(pessoaId) },
        include: { pessoa: { select: { id: true, nome: true, cpfCnpj: true } }, veiculo: { include: { tipoVeiculo: { select: { id: true, descricao: true } } } } },
        orderBy: { createdAt: "desc" }
      });
      return res.status(200).json(ordens);
    } catch (error) {
      console.error("Erro ao buscar ordens por pessoa:", error);
      return res.status(500).json({ erro: "Erro ao buscar ordens por pessoa" });
    }
  },

  getByVeiculo: async (req: Request, res: Response) => {
    try {
      const { veiculoId } = req.params;
      const ordens = await prisma.ordemServico.findMany({
        where: { veiculoId: Number(veiculoId) },
        include: { pessoa: { select: { id: true, nome: true, cpfCnpj: true } }, veiculo: { include: { tipoVeiculo: { select: { id: true, descricao: true } } } } },
        orderBy: { createdAt: "desc" }
      });
      return res.status(200).json(ordens);
    } catch (error) {
      console.error("Erro ao buscar ordens por veiculo:", error);
      return res.status(500).json({ erro: "Erro ao buscar ordens por veiculo" });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ordem = await prisma.ordemServico.update({
        where: { id: Number(id) },
        data: { status },
        include: { pessoa: { select: { id: true, nome: true, cpfCnpj: true } }, veiculo: { include: { tipoVeiculo: { select: { id: true, descricao: true } } } } }
      });
      return res.status(200).json(ordem);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      return res.status(500).json({ erro: "Erro ao atualizar status" });
    }
  },

  getEstatisticas: async (req: Request, res: Response) => {
    try {
      const total = await prisma.ordemServico.count();
      const pendentes = await prisma.ordemServico.count({ where: { status: "pendente" } });
      const emExecucao = await prisma.ordemServico.count({ where: { status: "em_execucao" } });
      const concluidas = await prisma.ordemServico.count({ where: { status: "concluida" } });
      const canceladas = await prisma.ordemServico.count({ where: { status: "cancelada" } });
      const valorTotal = await prisma.ordemServico.aggregate({ _sum: { valorCalculado: true }, where: { status: { in: ["concluida", "em_execucao"] } } });
      return res.status(200).json({ total, pendentes, emExecucao, concluidas, canceladas, valorTotal: valorTotal._sum.valorCalculado || 0 });
    } catch (error) {
      console.error("Erro ao buscar estatisticas:", error);
      return res.status(500).json({ erro: "Erro ao buscar estatisticas" });
    }
  }
};
