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
    quantidadeAnimais?: number;
    modalidadesDisponiveis?: string[]; // Modalidades disponíveis quando programa tem múltiplas
    modalidadeSelecionada?: string;    // Modalidade selecionada pelo usuário
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
  dadosAdicionais?: any,
  modalidade?: string // Nova opção para filtrar por modalidade
): Promise<ResultadoCalculo> {
  /*console.log("🧮 CALCULO - Iniciando com:", {
    pessoaId,
    programaId,
    quantidadeSolicitada,
    dadosAdicionais,
    modalidade,
  });*/

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
  let regras = await prisma.regrasNegocio.findMany({
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
  // 2.1 VERIFICAR SE PROGRAMA TEM MÚLTIPLAS MODALIDADES
  // ============================================================================
  const modalidadesDisponiveis = regras
    .map((r) => (r.parametro as any)?.modalidade)
    .filter((m) => m !== undefined && m !== null);

  const temModalidades = modalidadesDisponiveis.length > 0;
  const modalidadesUnicas = [...new Set(modalidadesDisponiveis)];

  // Se o programa tem modalidades mas nenhuma foi selecionada, avisar
  if (temModalidades && !modalidade) {
    return {
      regraAplicadaId: null,
      valorCalculado: 0,
      calculoDetalhes: {
        areaEfetiva: areaEmAlqueires,
        modalidadesDisponiveis: modalidadesUnicas,
        observacoes: [
          "Este programa possui múltiplas modalidades",
          "Selecione uma modalidade para continuar",
        ],
      },
      mensagem: "Selecione a modalidade do benefício",
      avisos: modalidadesUnicas.map((m) => `Modalidade disponível: ${m}`),
    };
  }

  // Se modalidade foi informada, filtrar regras
  if (modalidade) {
    regras = regras.filter((r) => {
      const param = r.parametro as any;
      return param?.modalidade === modalidade;
    });

    if (regras.length === 0) {
      return {
        regraAplicadaId: null,
        valorCalculado: 0,
        calculoDetalhes: {
          areaEfetiva: areaEmAlqueires,
          modalidadeSelecionada: modalidade,
          observacoes: [`Nenhuma regra encontrada para modalidade: ${modalidade}`],
        },
        mensagem: `Modalidade "${modalidade}" não encontrada para este programa`,
      };
    }

    avisos.push(`Modalidade selecionada: ${modalidade}`);
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
            unidadeArea: "hectares",
            regraAtendida: regra.tipoRegra,
            condicao: `${areaMinima || 0} ≤ área ≤ ${areaMaxima || "∞"} hectares`,
            valorBase,
            quantidadeSolicitada,
            percentualAplicado,
            limiteAplicado: limite,
            observacoes: [
              `Área efetiva: ${areaEmAlqueires.toFixed(2)} hectares`,
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

    // REGRAS DE INSEMINAÇÃO (calcula limite baseado em quantidade de animais)
    if (regra.tipoRegra.includes("inseminacao")) {
      console.log("💉 INSEMINACAO - dadosAdicionais recebido:", dadosAdicionais);
      const quantidadeAnimais = dadosAdicionais?.quantidadeAnimais || 0;
      console.log("💉 INSEMINACAO - quantidadeAnimais extraída:", quantidadeAnimais);

      const valorBase = Number(regra.valorBeneficio);
      let valorCalculado = 0;

      // Calcular limite baseado em quantidade de animais
      const dosePorAnimal = limite?.quantidade_por_animal || 1;
      const taxaRepeticao = limite?.taxa_repeticao || 0; // % de repetição permitida

      // Limite = (animais × dose/animal) + taxa de repetição
      let limiteCalculado = 0;
      if (quantidadeAnimais > 0) {
        limiteCalculado = Math.ceil(quantidadeAnimais * dosePorAnimal * (1 + taxaRepeticao / 100));
        avisos.push(`Limite calculado: ${limiteCalculado} doses (${quantidadeAnimais} animais × ${dosePorAnimal} dose/animal${taxaRepeticao > 0 ? ` + ${taxaRepeticao}% repetição` : ""})`);
      }

      // Verificar limite máximo absoluto se existir
      const limiteAbsoluto = limite?.quantidade_maxima_absoluta;
      if (limiteAbsoluto && limiteCalculado > limiteAbsoluto) {
        limiteCalculado = limiteAbsoluto;
        avisos.push(`Limite máximo do programa: ${limiteAbsoluto} doses`);
      }

      if (quantidadeSolicitada && quantidadeSolicitada > 0) {
        let quantidadeFinal = quantidadeSolicitada;

        // Aplicar limite calculado
        if (limiteCalculado > 0 && quantidadeFinal > limiteCalculado) {
          avisos.push(
            `Quantidade solicitada (${quantidadeSolicitada}) excede o limite de ${limiteCalculado} doses. Limitado a ${limiteCalculado}.`
          );
          quantidadeFinal = limiteCalculado;
        }

        valorCalculado = quantidadeFinal * valorBase;
      } else if (quantidadeAnimais <= 0) {
        avisos.push("Informe a quantidade de animais para calcular o limite de doses");
      } else {
        avisos.push("Informe a quantidade de doses desejada");
      }

      return {
        regraAplicadaId: regra.id,
        valorCalculado: Number(valorCalculado.toFixed(2)),
        calculoDetalhes: {
          areaEfetiva: areaEmAlqueires,
          quantidadeAnimais: quantidadeAnimais || undefined,
          regraAtendida: regra.tipoRegra,
          valorBase,
          quantidadeSolicitada,
          limiteAplicado: {
            limite: limiteCalculado || undefined,
            unidade: limite?.unidade || "doses",
            dosePorAnimal,
            taxaRepeticao,
          },
          observacoes: [
            `Valor por dose: R$ ${valorBase.toFixed(2)}`,
            quantidadeAnimais > 0 ? `Animais informados: ${quantidadeAnimais}` : "",
            limiteCalculado > 0 ? `Limite: ${limiteCalculado} doses` : "",
            limite?.percentual_subsidio ? `Subsídio: ${limite.percentual_subsidio}%` : "",
          ].filter(Boolean),
        },
        mensagem:
          valorCalculado > 0
            ? `Benefício calculado: R$ ${valorCalculado.toFixed(2)}`
            : quantidadeAnimais <= 0
            ? "Informe a quantidade de animais"
            : "Informe a quantidade de doses",
        avisos: avisos.length > 0 ? avisos : undefined,
      };
    }

    // REGRAS DE SÊMEN SEXADO (verificar ANTES de "semen" genérico)
    if (regra.tipoRegra === "semen_sexado") {
      console.log("🐄 SEMEN_SEXADO - dadosAdicionais recebido:", dadosAdicionais);
      const quantidadeAnimais = dadosAdicionais?.quantidadeAnimais || 0;
      console.log("🐄 SEMEN_SEXADO - quantidadeAnimais extraída:", quantidadeAnimais);
      const vacasMin = parametro.quantidade_vacas_min || 0;
      const vacasMax = parametro.quantidade_vacas_max || Infinity;
      const enquadramento = parametro.enquadramento || "UNICO";

      // Se não informou quantidade de animais, pedir
      if (!quantidadeAnimais || quantidadeAnimais <= 0) {
        console.log("🐄 SEMEN_SEXADO - sem quantidade de animais, pulando regra");
        avisos.push(
          "Informe a quantidade de vacas para determinar o enquadramento"
        );
        continue; // Tentar próxima regra
      }

      // Verificar se enquadra nesta regra
      const enquadrado =
        quantidadeAnimais >= vacasMin && quantidadeAnimais <= vacasMax;

      if (enquadrado) {
        const valorBase = Number(regra.valorBeneficio);
        let valorCalculado = 0;
        const limiteQtd = limite?.quantidade_maxima || 5; // Padrão 5 doses

        if (quantidadeSolicitada && quantidadeSolicitada > 0) {
          let quantidadeFinal = quantidadeSolicitada;

          if (quantidadeFinal > limiteQtd) {
            avisos.push(
              `Quantidade solicitada (${quantidadeSolicitada}) excede o limite de ${limiteQtd} doses. Limitado a ${limiteQtd}.`
            );
            quantidadeFinal = limiteQtd;
          }

          valorCalculado = quantidadeFinal * valorBase;
        } else {
          avisos.push("Informe a quantidade de doses desejada");
        }

        return {
          regraAplicadaId: regra.id,
          valorCalculado: Number(valorCalculado.toFixed(2)),
          enquadramento: enquadramento,
          calculoDetalhes: {
            areaEfetiva: areaEmAlqueires,
            quantidadeAnimais: quantidadeAnimais,
            regraAtendida: "semen_sexado",
            condicao: `${vacasMin} ≤ vacas ≤ ${vacasMax === Infinity ? "∞" : vacasMax}`,
            valorBase,
            quantidadeSolicitada,
            limiteAplicado: limite,
            observacoes: [
              `Quantidade de vacas: ${quantidadeAnimais}`,
              `Enquadramento: ${enquadramento}`,
              `Valor por dose: R$ ${valorBase.toFixed(2)}`,
              `Limite: ${limiteQtd} doses/ano`,
              quantidadeSolicitada
                ? `Doses solicitadas: ${quantidadeSolicitada}`
                : "",
            ].filter(Boolean),
          },
          mensagem:
            quantidadeSolicitada && valorCalculado > 0
              ? `Benefício calculado: R$ ${valorCalculado.toFixed(2)}`
              : `Produtor enquadrado como ${enquadramento}. Informe a quantidade de doses.`,
          avisos: avisos.length > 0 ? avisos : undefined,
        };
      }
    }

    // REGRAS DE SUÍNOS (matrizes)
    if (regra.tipoRegra === "semen_suino") {
      const quantidadeMatrizes = dadosAdicionais?.quantidadeAnimais || 0;
      const valorBase = Number(regra.valorBeneficio); // R$ 34/matriz
      let valorCalculado = 0;

      if (!quantidadeMatrizes || quantidadeMatrizes <= 0) {
        avisos.push(
          "Informe a quantidade de matrizes (conforme relatório ADAPAR)"
        );
        continue;
      }

      // Quantidade solicitada = número de matrizes a subsidiar
      const quantidadeFinal = quantidadeSolicitada || quantidadeMatrizes;
      valorCalculado = quantidadeFinal * valorBase;

      return {
        regraAplicadaId: regra.id,
        valorCalculado: Number(valorCalculado.toFixed(2)),
        calculoDetalhes: {
          quantidadeAnimais: quantidadeMatrizes,
          regraAtendida: "semen_suino",
          valorBase,
          quantidadeSolicitada: quantidadeFinal,
          observacoes: [
            `Matrizes informadas: ${quantidadeMatrizes}`,
            `Valor por matriz: R$ ${valorBase.toFixed(2)}`,
            `Matrizes a subsidiar: ${quantidadeFinal}`,
          ],
        },
        mensagem: `Benefício calculado: R$ ${valorCalculado.toFixed(2)} (${quantidadeFinal} matrizes × R$ ${valorBase.toFixed(2)})`,
        avisos: avisos.length > 0 ? avisos : undefined,
      };
    }

    // REGRAS DE ULTRASSOM
    if (regra.tipoRegra === "ultrassom") {
      const quantidadeAnimais = dadosAdicionais?.quantidadeAnimais || 0;
      const valorBase = Number(regra.valorBeneficio); // R$ 5/exame
      const percentual = limite?.percentual || 50;
      const examePorAnimal = limite?.quantidade_por_animal || 2;
      const limiteExames = limite?.quantidade_maxima || 100;

      if (!quantidadeAnimais || quantidadeAnimais <= 0) {
        avisos.push("Informe a quantidade de animais");
        continue;
      }

      // Quantidade solicitada = número de exames
      let quantidadeExames = quantidadeSolicitada || 0;
      const maxExamesPorRebanho = quantidadeAnimais * examePorAnimal;

      if (!quantidadeExames) {
        avisos.push(
          `Informe a quantidade de exames (máx ${Math.min(maxExamesPorRebanho, limiteExames)} exames)`
        );
      }

      if (quantidadeExames > limiteExames) {
        avisos.push(`Quantidade limitada a ${limiteExames} exames/ano`);
        quantidadeExames = limiteExames;
      }

      if (quantidadeExames > maxExamesPorRebanho) {
        avisos.push(
          `Máximo ${examePorAnimal} exames por animal (${maxExamesPorRebanho} exames para ${quantidadeAnimais} animais)`
        );
        quantidadeExames = maxExamesPorRebanho;
      }

      // Reembolso de 50% até R$ 5/exame
      const valorCalculado = quantidadeExames * valorBase;

      return {
        regraAplicadaId: regra.id,
        valorCalculado: Number(valorCalculado.toFixed(2)),
        calculoDetalhes: {
          quantidadeAnimais,
          regraAtendida: "ultrassom",
          valorBase,
          quantidadeSolicitada: quantidadeExames,
          percentualAplicado: percentual,
          observacoes: [
            `Animais: ${quantidadeAnimais}`,
            `Exames solicitados: ${quantidadeExames}`,
            `Reembolso: ${percentual}% até R$ ${valorBase.toFixed(2)}/exame`,
            `Limite: ${examePorAnimal} exames/animal/ano, máx ${limiteExames}/produtor`,
          ],
        },
        mensagem:
          quantidadeExames > 0
            ? `Benefício calculado: R$ ${valorCalculado.toFixed(2)} (${quantidadeExames} exames)`
            : "Informe a quantidade de exames",
        avisos: avisos.length > 0 ? avisos : undefined,
      };
    }

    // REGRAS DE VALOR FIXO (sêmen genérico, valor_fixo, etc.)
    // IMPORTANTE: Este bloco deve ficar POR ÚLTIMO para não capturar semen_sexado e semen_suino
    if (
      regra.tipoRegra === "valor_fixo" ||
      (regra.tipoRegra.includes("semen") &&
        regra.tipoRegra !== "semen_sexado" &&
        regra.tipoRegra !== "semen_suino")
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
      status: { in: ["aprovada", "paga", "aprovado", "concluido"] },
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
