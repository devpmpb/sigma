import prisma from "../utils/prisma";

// Interface para o resultado do cálculo
export interface ResultadoCalculo {
  regraAplicadaId: number | null;
  valorCalculado: number;
  enquadramento?: string;
  calculoDetalhes: {
    areaEfetiva?: number;
    unidadeArea?: string;
    regraAtendida?: string;
    condicao?: string;
    valorBase?: number;
    quantidadeSolicitada?: number;
    percentualAplicado?: number;
    limiteAplicado?: any;
    observacoes?: string[];
  };
  mensagem: string;
  avisos?: string[];
}

/**
 * Calcula o benefício para uma solicitação baseado nas regras do programa
 */
export async function calcularBeneficio(
  pessoaId: number,
  programaId: number,
  quantidadeSolicitada?: number,
  dadosAdicionais?: any
): Promise<ResultadoCalculo> {
  const avisos: string[] = [];
  const anoAtual = new Date().getFullYear();

  // ============================================================================
  // 1. BUSCAR ÁREA EFETIVA DA PESSOA (CORRIGIDO!)
  // ============================================================================
  const areaEfetiva = await prisma.areaEfetiva.findFirst({
    where: {
      pessoaId: pessoaId,
      anoReferencia: anoAtual,
    },
    orderBy: {
      anoReferencia: "desc",
    },
  });

  // Se não tem do ano atual, busca o mais recente
  let areaEfetivaUsada = areaEfetiva;
  if (!areaEfetivaUsada) {
    areaEfetivaUsada = await prisma.areaEfetiva.findFirst({
      where: { pessoaId },
      orderBy: { anoReferencia: "desc" },
    });

    if (areaEfetivaUsada) {
      avisos.push(
        `Usando área efetiva de ${areaEfetivaUsada.anoReferencia} (não há dados de ${anoAtual})`
      );
    }
  }

  if (!areaEfetivaUsada) {
    return {
      regraAplicadaId: null,
      valorCalculado: 0,
      calculoDetalhes: {
        observacoes: ["Pessoa não possui área efetiva cadastrada"],
      },
      mensagem:
        "Não foi possível calcular o benefício: área efetiva não cadastrada",
      avisos: [
        "Cadastre a área efetiva do produtor antes de solicitar benefícios",
      ],
    };
  }

  // Área em ALQUEIRES (como está no banco)
  const areaEmAlqueires = Number(areaEfetivaUsada.areaEfetiva);

  // ============================================================================
  // 2. BUSCAR REGRAS DO PROGRAMA
  // ============================================================================
  const regras = await prisma.regrasNegocio.findMany({
    where: { programaId },
    orderBy: { id: "asc" },
  });

  if (regras.length === 0) {
    return {
      regraAplicadaId: null,
      valorCalculado: 0,
      calculoDetalhes: {
        areaEfetiva: areaEmAlqueires,
        observacoes: ["Programa não possui regras cadastradas"],
      },
      mensagem: "Não foi possível calcular o benefício: programa sem regras",
    };
  }

  // ============================================================================
  // 3. AVALIAR CADA REGRA
  // ============================================================================
  for (const regra of regras) {
    const parametro = regra.parametro as any;
    const limite = regra.limiteBeneficio as any;

    // REGRAS BASEADAS EM ÁREA (tipoRegra: "area_efetiva" ou "area_propriedade")
    if (
      regra.tipoRegra === "area_efetiva" ||
      regra.tipoRegra === "area_propriedade"
    ) {
      const areaMaxima = parametro.area_maxima ?? parametro.valor ?? null;
      const areaMinima = parametro.area_minima ?? 0;
      const enquadramento = parametro.enquadramento || "UNICO";

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
        const valorBase = Number(regra.valorBeneficio);
        let valorCalculado = 0;
        let percentualAplicado = 100;

        // Se tem quantidade solicitada (ex: toneladas de adubo, cargas de esterco)
        if (quantidadeSolicitada && quantidadeSolicitada > 0) {
          let quantidadeFinal = quantidadeSolicitada;

          // Verificar limite de quantidade (quantidade_maxima ou quantidade_maxima_absoluta)
          const limiteQtd =
            limite?.quantidade_maxima_absoluta ||
            limite?.quantidade_maxima ||
            limite?.limite;
          if (limiteQtd && quantidadeFinal > limiteQtd) {
            avisos.push(
              `Quantidade solicitada (${quantidadeSolicitada}) excede o limite de ${limiteQtd} unidades. Limitado a ${limiteQtd}.`
            );
            quantidadeFinal = limiteQtd;
          }
          console.log(limite.percentual);
          // Aplicar percentual se houver
          valorCalculado = quantidadeFinal * valorBase;
        } else {
          // Sem quantidade - apenas retorna info da regra
          avisos.push("Informe a quantidade desejada para calcular o valor");
        }

        return {
          regraAplicadaId: regra.id,
          valorCalculado: Number(valorCalculado.toFixed(2)),
          enquadramento: enquadramento,
          calculoDetalhes: {
            areaEfetiva: areaEmAlqueires,
            unidadeArea: "alqueires",
            regraAtendida: regra.tipoRegra,
            condicao: `${areaMinima || 0} ≤ área ≤ ${areaMaxima || "∞"} alqueires`,
            valorBase,
            quantidadeSolicitada,
            percentualAplicado,
            limiteAplicado: limite,
            observacoes: [
              `Área efetiva: ${areaEmAlqueires.toFixed(2)} alqueires`,
              `Enquadramento: ${enquadramento}`,
              `Valor base: R$ ${valorBase.toFixed(2)} por unidade`,
              quantidadeSolicitada ? `Quantidade: ${quantidadeSolicitada}` : "",
              limite?.periodicidade_meses
                ? `Interstício: ${limite.periodicidade_meses} meses`
                : "",
            ].filter(Boolean),
          },
          mensagem:
            quantidadeSolicitada && valorCalculado > 0
              ? `Benefício calculado: R$ ${valorCalculado.toFixed(2)}`
              : `Produtor enquadrado como ${enquadramento}. Informe a quantidade.`,
          avisos: avisos.length > 0 ? avisos : undefined,
        };
      }
    }

    // REGRAS DE EQUIPAMENTOS (ordenhadeiras, resfriadores)
    if (
      regra.tipoRegra === "tipo_equipamento" ||
      regra.tipoRegra === "equipamento"
    ) {
      const valorBase = Number(regra.valorBeneficio);
      let valorCalculado = 0;

      if (quantidadeSolicitada && quantidadeSolicitada > 0) {
        // quantidadeSolicitada = valor da nota fiscal
        if (limite?.percentual) {
          valorCalculado = quantidadeSolicitada * (limite.percentual / 100);
          if (limite?.limite && valorCalculado > limite.limite) {
            valorCalculado = limite.limite;
            avisos.push(
              `Valor limitado ao teto de R$ ${limite.limite.toFixed(2)}`
            );
          }
        } else {
          valorCalculado = Math.min(quantidadeSolicitada, valorBase);
        }
      } else {
        avisos.push("Informe o valor da nota fiscal do equipamento");
      }

      return {
        regraAplicadaId: regra.id,
        valorCalculado: Number(valorCalculado.toFixed(2)),
        calculoDetalhes: {
          areaEfetiva: areaEmAlqueires,
          regraAtendida: regra.tipoRegra,
          valorBase,
          quantidadeSolicitada,
          percentualAplicado: limite?.percentual || 100,
          observacoes: [
            `Equipamento: ${parametro.tipoEquipamento || "N/A"}`,
            limite?.percentual
              ? `Subsídio: ${limite.percentual}% do valor`
              : "",
            limite?.limite
              ? `Limite máximo: R$ ${limite.limite.toFixed(2)}`
              : "",
          ].filter(Boolean),
        },
        mensagem:
          valorCalculado > 0
            ? `Benefício calculado: R$ ${valorCalculado.toFixed(2)}`
            : "Informe o valor da nota fiscal",
        avisos: avisos.length > 0 ? avisos : undefined,
      };
    }

    // REGRAS DE VALOR FIXO (sêmen, ultrassom, etc)
    if (
      regra.tipoRegra.includes("inseminacao") ||
      regra.tipoRegra.includes("semen") ||
      regra.tipoRegra === "valor_fixo"
    ) {
      const valorBase = Number(regra.valorBeneficio);
      let valorCalculado = 0;

      if (quantidadeSolicitada && quantidadeSolicitada > 0) {
        valorCalculado = quantidadeSolicitada * valorBase;

        const limiteAbsoluto = limite?.quantidade_maxima_absoluta;
        if (limiteAbsoluto && quantidadeSolicitada > limiteAbsoluto) {
          avisos.push(`Quantidade limitada a ${limiteAbsoluto} unidades`);
          valorCalculado = limiteAbsoluto * valorBase;
        }
      } else {
        avisos.push("Informe a quantidade desejada");
      }

      return {
        regraAplicadaId: regra.id,
        valorCalculado: Number(valorCalculado.toFixed(2)),
        calculoDetalhes: {
          areaEfetiva: areaEmAlqueires,
          regraAtendida: regra.tipoRegra,
          valorBase,
          quantidadeSolicitada,
          observacoes: [
            `Valor por unidade: R$ ${valorBase.toFixed(2)}`,
            limite?.quantidade_maxima_absoluta
              ? `Limite: ${limite.quantidade_maxima_absoluta} unidades`
              : "",
          ].filter(Boolean),
        },
        mensagem:
          valorCalculado > 0
            ? `Benefício calculado: R$ ${valorCalculado.toFixed(2)}`
            : "Informe a quantidade",
        avisos: avisos.length > 0 ? avisos : undefined,
      };
    }
  }

  // Nenhuma regra se aplicou
  return {
    regraAplicadaId: null,
    valorCalculado: 0,
    calculoDetalhes: {
      areaEfetiva: areaEmAlqueires,
      observacoes: [
        `Área efetiva: ${areaEmAlqueires.toFixed(2)} alqueires`,
        "Nenhuma regra do programa se aplica a este produtor",
      ],
    },
    mensagem: "Produtor não se enquadra nos critérios do programa",
    avisos: ["Verifique os critérios de elegibilidade do programa"],
  };
}

/**
 * Verificar se a pessoa já atingiu limite de benefícios no período
 */
export async function verificarLimitesPeriodo(
  pessoaId: number,
  programaId: number,
  regraId: number
): Promise<{ permitido: boolean; mensagem: string; detalhes?: any }> {
  const regra = await prisma.regrasNegocio.findUnique({
    where: { id: regraId },
  });

  if (!regra) {
    return { permitido: false, mensagem: "Regra não encontrada" };
  }

  const limite = regra.limiteBeneficio as any;
  const periodicidadeMeses = limite?.periodicidade_meses;

  // Se não tem periodicidade definida, permitir
  if (!periodicidadeMeses) {
    return { permitido: true, mensagem: "Sem limite de período definido" };
  }

  // Calcular data de início do período
  const dataInicio = new Date();
  dataInicio.setMonth(dataInicio.getMonth() - periodicidadeMeses);

  // Buscar solicitações aprovadas no período
  const solicitacoesNoPeriodo = await prisma.solicitacaoBeneficio.findMany({
    where: {
      pessoaId,
      programaId,
      status: { in: ["aprovada", "paga"] },
      datasolicitacao: { gte: dataInicio },
    },
  });

  if (solicitacoesNoPeriodo.length > 0) {
    const ultimaSolicitacao = solicitacoesNoPeriodo[0];
    const dataProximaPermitida = new Date(ultimaSolicitacao.datasolicitacao);
    dataProximaPermitida.setMonth(
      dataProximaPermitida.getMonth() + periodicidadeMeses
    );

    return {
      permitido: false,
      mensagem: `Interstício de ${periodicidadeMeses} meses não cumprido`,
      detalhes: {
        ultimaSolicitacao: ultimaSolicitacao.datasolicitacao,
        proximaPermitida: dataProximaPermitida,
        mesesRestantes: Math.ceil(
          (dataProximaPermitida.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24 * 30)
        ),
      },
    };
  }

  return {
    permitido: true,
    mensagem: `Pode solicitar (interstício de ${periodicidadeMeses} meses OK)`,
  };
}
