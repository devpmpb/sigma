// backend/src/services/saldoBeneficioService.ts
// Serviço para calcular saldo disponível de benefícios por produtor

import prisma from "../utils/prisma";
import { Periodicidade } from "@prisma/client";

// ============================================================================
// INTERFACES
// ============================================================================

export interface SaldoDisponivel {
  programaId: number;
  programaNome: string;
  periodicidade: Periodicidade;
  anoReferencia: number;

  // Limites
  limiteTotal: number;
  unidade: string;

  // Uso
  jaUtilizado: number;
  saldoDisponivel: number;

  // Valor
  valorPorUnidade: number;
  valorMaximoRestante: number;

  // Status
  podeNovaSolicitacao: boolean;
  proximaLiberacao?: string; // Data quando poderá solicitar novamente
  mensagem: string;

  // Histórico do período
  solicitacoesNoPeriodo: {
    id: number;
    data: Date;
    quantidade: number;
    valor: number;
    status: string;
  }[];
}

export interface CalculoLimite {
  limiteCalculado: number;
  baseCalculo: string;
  detalhes: string[];
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Determina o período de referência baseado na periodicidade
 * Sempre usando ANO CIVIL (01/jan - 31/dez)
 */
function getPeriodoReferencia(periodicidade: Periodicidade): {
  inicio: Date;
  fim: Date;
  anosAbrangidos: number[];
} {
  const anoAtual = new Date().getFullYear();

  switch (periodicidade) {
    case "ANUAL":
      return {
        inicio: new Date(anoAtual, 0, 1), // 01/jan do ano atual
        fim: new Date(anoAtual, 11, 31, 23, 59, 59), // 31/dez do ano atual
        anosAbrangidos: [anoAtual],
      };

    case "BIENAL":
      // Se estamos em ano par, período é [ano-1, ano]
      // Se estamos em ano ímpar, período é [ano, ano+1]
      const inicioBienal = anoAtual % 2 === 0 ? anoAtual : anoAtual;
      return {
        inicio: new Date(inicioBienal, 0, 1),
        fim: new Date(inicioBienal + 1, 11, 31, 23, 59, 59),
        anosAbrangidos: [inicioBienal, inicioBienal + 1],
      };

    case "TRIENAL":
      // Ciclos de 3 anos: 2024-2026, 2027-2029, etc.
      const cicloTrienal = Math.floor((anoAtual - 2024) / 3);
      const inicioTrienal = 2024 + cicloTrienal * 3;
      return {
        inicio: new Date(inicioTrienal, 0, 1),
        fim: new Date(inicioTrienal + 2, 11, 31, 23, 59, 59),
        anosAbrangidos: [inicioTrienal, inicioTrienal + 1, inicioTrienal + 2],
      };

    case "UNICO":
      // Período "infinito" - desde sempre até sempre
      return {
        inicio: new Date(2000, 0, 1),
        fim: new Date(2100, 11, 31, 23, 59, 59),
        anosAbrangidos: [], // Todos os anos
      };

    default:
      return {
        inicio: new Date(anoAtual, 0, 1),
        fim: new Date(anoAtual, 11, 31, 23, 59, 59),
        anosAbrangidos: [anoAtual],
      };
  }
}

/**
 * Encontra a regra correta baseada na área efetiva do produtor
 */
async function encontrarRegraAplicavel(
  pessoaId: number,
  regras: any[],
  anoReferencia: number
): Promise<{ regra: any | null; areaEfetiva: number }> {
  // Buscar área efetiva do produtor
  let areaEfetivaRecord = await prisma.areaEfetiva.findFirst({
    where: { pessoaId, anoReferencia },
  });

  // Se não tem do ano atual, busca o mais recente
  if (!areaEfetivaRecord) {
    areaEfetivaRecord = await prisma.areaEfetiva.findFirst({
      where: { pessoaId },
      orderBy: { anoReferencia: "desc" },
    });
  }

  if (!areaEfetivaRecord) {
    return { regra: null, areaEfetiva: 0 };
  }

  const areaEmAlqueires = Number(areaEfetivaRecord.areaEfetiva);

  // Procurar regra que se aplica à área do produtor
  for (const regra of regras) {
    const parametro = regra.parametro as any;

    // Regras baseadas em área
    if (
      regra.tipoRegra === "area_efetiva" ||
      regra.tipoRegra === "area_propriedade"
    ) {
      const areaMaxima = parametro.area_maxima ?? parametro.valor ?? null;
      const areaMinima = parametro.area_minima ?? 0;

      let regraAtendida = false;

      // Verificar se a área se encaixa na regra
      if (areaMaxima === null || areaMaxima === 0) {
        // Sem limite máximo - qualquer área acima do mínimo
        if (areaEmAlqueires >= areaMinima) {
          regraAtendida = true;
        }
      } else if (areaMinima === 0 || areaMinima === null) {
        // Sem limite mínimo - qualquer área até o máximo
        if (areaEmAlqueires <= areaMaxima) {
          regraAtendida = true;
        }
      } else {
        // Faixa definida
        if (areaEmAlqueires >= areaMinima && areaEmAlqueires <= areaMaxima) {
          regraAtendida = true;
        }
      }

      if (regraAtendida) {
        return { regra, areaEfetiva: areaEmAlqueires };
      }
    }
  }

  // Se nenhuma regra de área se aplicou, retorna a primeira regra (fallback)
  return { regra: regras[0] || null, areaEfetiva: areaEmAlqueires };
}

/**
 * Calcula o limite do produtor baseado na área e regras do programa
 */
async function calcularLimitePorArea(
  pessoaId: number,
  regra: any,
  anoReferencia: number,
  areaEfetiva?: number
): Promise<CalculoLimite> {
  const detalhes: string[] = [];

  // Se já temos a área, usar ela; senão buscar
  let area = areaEfetiva;
  if (area === undefined) {
    const areaEfetivaRecord = await prisma.areaEfetiva.findFirst({
      where: { pessoaId, anoReferencia },
      orderBy: { anoReferencia: "desc" },
    });

    if (!areaEfetivaRecord) {
      return {
        limiteCalculado: 0,
        baseCalculo: "SEM_AREA",
        detalhes: ["Produtor não possui área efetiva cadastrada"],
      };
    }
    area = Number(areaEfetivaRecord.areaEfetiva);
  }

  detalhes.push(`Área efetiva: ${area.toFixed(2)} alqueires`);

  const limite = regra.limiteBeneficio as any;

  // Se tem multiplicador por área
  if (limite?.multiplicador_area || limite?.quantidade_maxima_por_alqueire) {
    const porAlqueire =
      limite.quantidade_maxima_por_alqueire || limite.multiplicador?.fator || 0;
    let limiteCalculado = area * porAlqueire;

    detalhes.push(
      `Limite por alqueire: ${porAlqueire} ${limite.unidade || "unidades"}`
    );
    detalhes.push(
      `Limite calculado: ${limiteCalculado.toFixed(2)} ${limite.unidade || "unidades"}`
    );

    // Aplicar limite máximo absoluto se existir
    if (
      limite.quantidade_maxima_absoluta &&
      limiteCalculado > limite.quantidade_maxima_absoluta
    ) {
      limiteCalculado = limite.quantidade_maxima_absoluta;
      detalhes.push(
        `Limitado ao máximo: ${limite.quantidade_maxima_absoluta} ${limite.unidade || "unidades"}`
      );
    }

    return {
      limiteCalculado,
      baseCalculo: "AREA",
      detalhes,
    };
  }

  // Limite fixo
  const limiteFixo = limite?.quantidade_maxima || limite?.limite || 0;
  detalhes.push(`Limite fixo: ${limiteFixo} ${limite?.unidade || "unidades"}`);

  return {
    limiteCalculado: limiteFixo,
    baseCalculo: "FIXO",
    detalhes,
  };
}

// ============================================================================
// FUNÇÃO PRINCIPAL: CALCULAR SALDO DISPONÍVEL
// ============================================================================

/**
 * Calcula o saldo disponível de um programa para um produtor
 */
export async function calcularSaldoDisponivel(
  pessoaId: number,
  programaId: number
): Promise<SaldoDisponivel> {
  const anoAtual = new Date().getFullYear();

  // 1. Buscar programa com regras
  const programa = await prisma.programa.findUnique({
    where: { id: programaId },
    include: { regras: true },
  });

  if (!programa) {
    throw new Error("Programa não encontrado");
  }

  if (!programa.ativo) {
    return {
      programaId,
      programaNome: programa.nome,
      periodicidade: programa.periodicidade,
      anoReferencia: anoAtual,
      limiteTotal: 0,
      unidade: programa.unidadeLimite || "",
      jaUtilizado: 0,
      saldoDisponivel: 0,
      valorPorUnidade: 0,
      valorMaximoRestante: 0,
      podeNovaSolicitacao: false,
      mensagem: "Programa inativo",
      solicitacoesNoPeriodo: [],
    };
  }

  // 2. Determinar período de referência
  const periodo = getPeriodoReferencia(programa.periodicidade);

  // 3. Buscar solicitações no período (apenas PAGAS e APROVADAS contam)
  const solicitacoes = await prisma.solicitacaoBeneficio.findMany({
    where: {
      pessoaId,
      programaId,
      datasolicitacao: {
        gte: periodo.inicio,
        lte: periodo.fim,
      },
      status: { in: ["aprovada", "paga", "pendente", "em_analise"] },
    },
    orderBy: { datasolicitacao: "desc" },
  });

  // 4. Calcular quantidade já utilizada
  const jaUtilizado = solicitacoes.reduce((soma, sol) => {
    return soma + Number(sol.quantidadeSolicitada || 0);
  }, 0);

  // 5. CORRIGIDO: Encontrar regra aplicável baseada na área do produtor
  const { regra: regraAplicavel, areaEfetiva } = await encontrarRegraAplicavel(
    pessoaId,
    programa.regras,
    anoAtual
  );

  let limiteTotal = Number(programa.limiteMaximoFamilia) || 0;
  let valorPorUnidade = 0;
  let detalhesCalculo: string[] = [];

  if (regraAplicavel) {
    const calculoLimite = await calcularLimitePorArea(
      pessoaId,
      regraAplicavel,
      anoAtual,
      areaEfetiva // Passa a área já encontrada para evitar busca duplicada
    );
    if (calculoLimite.limiteCalculado > 0) {
      limiteTotal = calculoLimite.limiteCalculado;
    }
    valorPorUnidade = Number(regraAplicavel.valorBeneficio);
    detalhesCalculo = calculoLimite.detalhes;
  }

  // 6. Calcular saldo
  const saldoDisponivel = Math.max(0, limiteTotal - jaUtilizado);
  const valorMaximoRestante = saldoDisponivel * valorPorUnidade;

  // 7. Determinar se pode fazer nova solicitação
  let podeNovaSolicitacao = saldoDisponivel > 0;
  let mensagem = "";
  let proximaLiberacao: string | undefined;

  if (programa.periodicidade === "UNICO" && solicitacoes.length > 0) {
    podeNovaSolicitacao = false;
    mensagem = "Benefício único - já utilizado anteriormente";
  } else if (saldoDisponivel <= 0) {
    podeNovaSolicitacao = false;
    mensagem = `Limite do período esgotado (${jaUtilizado} de ${limiteTotal} ${programa.unidadeLimite || "unidades"})`;

    // Calcular próxima liberação
    if (programa.periodicidade === "ANUAL") {
      proximaLiberacao = `01/01/${anoAtual + 1}`;
    } else if (programa.periodicidade === "BIENAL") {
      proximaLiberacao = `01/01/${periodo.anosAbrangidos[1] + 1}`;
    } else if (programa.periodicidade === "TRIENAL") {
      proximaLiberacao = `01/01/${periodo.anosAbrangidos[2] + 1}`;
    }
  } else {
    mensagem = `Disponível: ${saldoDisponivel.toFixed(2)} ${programa.unidadeLimite || "unidades"} (valor máx: R$ ${valorMaximoRestante.toFixed(2)})`;
  }

  return {
    programaId,
    programaNome: programa.nome,
    periodicidade: programa.periodicidade,
    anoReferencia: anoAtual,
    limiteTotal,
    unidade: programa.unidadeLimite || "",
    jaUtilizado,
    saldoDisponivel,
    valorPorUnidade,
    valorMaximoRestante,
    podeNovaSolicitacao,
    proximaLiberacao,
    mensagem,
    solicitacoesNoPeriodo: solicitacoes.map((s) => ({
      id: s.id,
      data: s.datasolicitacao,
      quantidade: Number(s.quantidadeSolicitada || 0),
      valor: Number(s.valorCalculado || 0),
      status: s.status,
    })),
  };
}

/**
 * Verifica se produtor pode solicitar determinada quantidade
 */
export async function verificarDisponibilidade(
  pessoaId: number,
  programaId: number,
  quantidadeDesejada: number
): Promise<{ permitido: boolean; mensagem: string; quantidadeMaxima: number }> {
  const saldo = await calcularSaldoDisponivel(pessoaId, programaId);

  if (!saldo.podeNovaSolicitacao) {
    return {
      permitido: false,
      mensagem: saldo.mensagem,
      quantidadeMaxima: 0,
    };
  }

  if (quantidadeDesejada > saldo.saldoDisponivel) {
    return {
      permitido: false,
      mensagem: `Quantidade solicitada (${quantidadeDesejada}) excede o saldo disponível (${saldo.saldoDisponivel} ${saldo.unidade})`,
      quantidadeMaxima: saldo.saldoDisponivel,
    };
  }

  return {
    permitido: true,
    mensagem: `Quantidade aprovada. Saldo restante após solicitação: ${(saldo.saldoDisponivel - quantidadeDesejada).toFixed(2)} ${saldo.unidade}`,
    quantidadeMaxima: saldo.saldoDisponivel,
  };
}

/**
 * Consulta rápida de saldo (para exibir na tela)
 */
export async function consultarSaldoRapido(
  pessoaId: number,
  programaId: number
): Promise<{
  disponivel: number;
  unidade: string;
  valorMaximo: number;
  mensagem: string;
}> {
  const saldo = await calcularSaldoDisponivel(pessoaId, programaId);

  return {
    disponivel: saldo.saldoDisponivel,
    unidade: saldo.unidade,
    valorMaximo: saldo.valorMaximoRestante,
    mensagem: saldo.mensagem,
  };
}
