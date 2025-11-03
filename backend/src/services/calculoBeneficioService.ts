// backend/src/services/calculoBeneficioService.ts
import prisma from "../utils/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Interface para o resultado do cálculo
export interface ResultadoCalculo {
  regraAplicadaId: number | null;
  valorCalculado: number;
  calculoDetalhes: {
    areaEfetiva?: number;
    areaEfetivaHectares?: number;
    tipoEquipamento?: string;
    tipoAnimal?: string;
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
 * Converte hectares para alqueires paulistas
 * 1 alqueire paulista = 2,42 hectares
 */
function hectaresParaAlqueires(hectares: number): number {
  return hectares / 2.42;
}

/**
 * Normaliza a área para a unidade especificada no parâmetro
 * Por padrão, a área efetiva está em HECTARES no banco
 */
function normalizarArea(areaHectares: number, unidadeEsperada: string): number {
  if (!unidadeEsperada || unidadeEsperada === 'hectares') {
    return areaHectares;
  }

  if (unidadeEsperada === 'alqueires') {
    return hectaresParaAlqueires(areaHectares);
  }

  // Se não reconhecer a unidade, assume hectares
  return areaHectares;
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

  // 1. Buscar área efetiva da pessoa
  const areaEfetiva = await prisma.areaEfetiva.findUnique({
    where: { id: pessoaId }
  });

  if (!areaEfetiva) {
    return {
      regraAplicadaId: null,
      valorCalculado: 0,
      calculoDetalhes: {
        observacoes: ["Pessoa não possui área efetiva cadastrada"]
      },
      mensagem: "Não foi possível calcular o benefício: área efetiva não cadastrada"
    };
  }

  // 2. Buscar regras do programa
  const regras = await prisma.regrasNegocio.findMany({
    where: { programaId },
    orderBy: { id: 'asc' }
  });

  if (regras.length === 0) {
    return {
      regraAplicadaId: null,
      valorCalculado: 0,
      calculoDetalhes: {
        observacoes: ["Programa não possui regras cadastradas"]
      },
      mensagem: "Não foi possível calcular o benefício: programa sem regras"
    };
  }

  // 3. Avaliar cada regra e encontrar a aplicável
  // Área está armazenada em HECTARES no banco
  const areaEmHectares = Number(areaEfetiva.areaEfetiva);
  const avisos: string[] = [];

  for (const regra of regras) {
    const parametro = regra.parametro as any;

    // Verificar se é regra baseada em área de propriedade
    if (regra.tipoRegra === "area_propriedade") {
      const condicao = parametro.condicao;
      const valor = parametro.valor;

      // IMPORTANTE: Normalizar área para a unidade esperada pela regra
      // A área no banco está em HECTARES, mas as regras podem estar em ALQUEIRES
      const unidadeRegra = parametro.unidade || 'hectares';
      const areaTotal = normalizarArea(areaEmHectares, unidadeRegra);

      let regraAtendida = false;

      if (condicao === "menor_igual" && areaTotal <= valor) {
        regraAtendida = true;
      } else if (condicao === "maior" && areaTotal > valor) {
        regraAtendida = true;
      } else if (condicao === "entre" && areaTotal >= parametro.minimo && areaTotal <= parametro.maximo) {
        regraAtendida = true;
      }

      if (regraAtendida) {
        // Calcular valor do benefício
        const valorBase = Number(regra.valorBeneficio);
        const limite = regra.limiteBeneficio as any;

        let valorCalculado = 0;
        let percentualAplicado = 100;

        // Se tem quantidade solicitada (ex: toneladas de adubo)
        if (quantidadeSolicitada && quantidadeSolicitada > 0) {
          // Verificar limite de quantidade
          if (limite?.limite && quantidadeSolicitada > limite.limite) {
            avisos.push(
              `Quantidade solicitada (${quantidadeSolicitada} ${limite.unidade || 'unidades'}) ` +
              `excede o limite de ${limite.limite} ${limite.unidade || 'unidades'}`
            );
            quantidadeSolicitada = limite.limite;
          }

          // Aplicar percentual se houver
          if (limite?.percentual) {
            percentualAplicado = limite.percentual;
            valorCalculado = (quantidadeSolicitada || 0) * valorBase * (percentualAplicado / 100);
          } else {
            valorCalculado = (quantidadeSolicitada || 0) * valorBase;
          }
        } else {
          // Sem quantidade informada, retorna 0
          // O usuário precisa informar a quantidade para calcular o benefício
          valorCalculado = 0;
          avisos.push(
            `Informe a quantidade desejada para calcular o valor do benefício`
          );
        }

        return {
          regraAplicadaId: regra.id,
          valorCalculado: Number(valorCalculado.toFixed(2)),
          calculoDetalhes: {
            areaEfetiva: areaTotal,
            areaEfetivaHectares: areaEmHectares,
            regraAtendida: regra.tipoRegra,
            condicao: `${condicao} ${valor} ${parametro.unidade || 'alqueires'}`,
            valorBase: valorBase,
            quantidadeSolicitada: quantidadeSolicitada,
            percentualAplicado: percentualAplicado,
            limiteAplicado: limite,
            observacoes: [
              `Área efetiva: ${areaTotal.toFixed(2)} ${parametro.unidade || 'alqueires'} (${areaEmHectares.toFixed(2)} hectares)`,
              `Valor base: R$ ${valorBase.toFixed(2)}${quantidadeSolicitada ? ` por ${limite?.unidade || 'unidade'}` : ''}`,
              percentualAplicado < 100 ? `Percentual aplicado: ${percentualAplicado}%` : '',
              limite?.descricao || ''
            ].filter(Boolean)
          },
          mensagem: `Benefício calculado: R$ ${valorCalculado.toFixed(2)}`,
          avisos: avisos.length > 0 ? avisos : undefined
        };
      }
    }

    // Regras de equipamentos (ordenhadeiras, resfriadores)
    if (regra.tipoRegra === "tipo_equipamento") {
      const limite = regra.limiteBeneficio as any;
      const valorBase = Number(regra.valorBeneficio);

      // Para equipamentos, aceita qualquer produtor
      // (as validações de produção mínima serão feitas na análise da solicitação)
      let valorCalculado = valorBase; // Valor máximo do equipamento

      // Se foi informado valor da nota fiscal
      if (quantidadeSolicitada && quantidadeSolicitada > 0) {
        if (limite?.percentual) {
          valorCalculado = quantidadeSolicitada * (limite.percentual / 100);

          // Aplicar teto se houver
          if (limite?.limite && valorCalculado > limite.limite) {
            avisos.push(
              `Valor calculado (R$ ${valorCalculado.toFixed(2)}) excede o limite de R$ ${limite.limite.toFixed(2)}`
            );
            valorCalculado = limite.limite;
          }
        }
      } else {
        valorCalculado = 0;
        avisos.push(
          `Informe o valor da nota fiscal para calcular o benefício`
        );
      }

      return {
        regraAplicadaId: regra.id,
        valorCalculado: Number(valorCalculado.toFixed(2)),
        calculoDetalhes: {
          regraAtendida: regra.tipoRegra,
          tipoEquipamento: parametro.tipoEquipamento,
          valorBase: valorBase,
          quantidadeSolicitada: quantidadeSolicitada,
          percentualAplicado: limite?.percentual || 100,
          limiteAplicado: limite,
          observacoes: [
            `Equipamento: ${parametro.tipoEquipamento}`,
            limite?.percentual ? `Subsídio: ${limite.percentual}% do valor` : '',
            limite?.limite ? `Limite máximo: R$ ${limite.limite.toFixed(2)}` : '',
            limite?.descricao || ''
          ].filter(Boolean)
        },
        mensagem: quantidadeSolicitada
          ? `Benefício calculado: R$ ${valorCalculado.toFixed(2)}`
          : `Informe o valor da nota fiscal`,
        avisos: avisos.length > 0 ? avisos : undefined
      };
    }

    // Regras de inseminação artificial
    if (regra.tipoRegra.startsWith("inseminacao_")) {
      const limite = regra.limiteBeneficio as any;
      const valorBase = Number(regra.valorBeneficio);

      // Para inseminação, aceita qualquer produtor com atividade pecuária
      // (as validações específicas serão feitas na análise da solicitação)
      let valorCalculado = valorBase;

      // Se é modalidade de reembolso e tem quantidade de doses
      if (regra.tipoRegra.includes("opcao3") || regra.tipoRegra.includes("suinos")) {
        if (quantidadeSolicitada && quantidadeSolicitada > 0) {
          valorCalculado = quantidadeSolicitada * valorBase;
        } else {
          valorCalculado = 0;
          avisos.push(
            `Informe a quantidade de ${parametro.tipoAnimal === 'suino' ? 'matrizes' : 'doses'}`
          );
        }
      } else {
        // Modalidades de fornecimento direto (opcao1, opcao2)
        valorCalculado = 0;
        avisos.push(
          `Modalidade: ${parametro.modalidade}. Valor será definido na análise.`
        );
      }

      return {
        regraAplicadaId: regra.id,
        valorCalculado: Number(valorCalculado.toFixed(2)),
        calculoDetalhes: {
          regraAtendida: regra.tipoRegra,
          tipoAnimal: parametro.tipoAnimal,
          modalidade: parametro.modalidade,
          valorBase: valorBase,
          quantidadeSolicitada: quantidadeSolicitada,
          limiteAplicado: limite,
          observacoes: [
            `Animal: ${parametro.tipoAnimal}`,
            `Modalidade: ${parametro.descricao}`,
            limite?.descricao || ''
          ].filter(Boolean)
        },
        mensagem: quantidadeSolicitada && valorCalculado > 0
          ? `Benefício calculado: R$ ${valorCalculado.toFixed(2)}`
          : `Modalidade: ${parametro.modalidade}`,
        avisos: avisos.length > 0 ? avisos : undefined
      };
    }

    // Outros tipos de regras podem ser implementados aqui
  }

  // Nenhuma regra se aplicou
  const areaEmAlqueires = hectaresParaAlqueires(areaEmHectares);
  return {
    regraAplicadaId: null,
    valorCalculado: 0,
    calculoDetalhes: {
      areaEfetiva: areaEmAlqueires,
      areaEfetivaHectares: areaEmHectares,
      observacoes: [
        `Área efetiva: ${areaEmHectares.toFixed(2)} hectares (${areaEmAlqueires.toFixed(2)} alqueires)`,
        "Nenhuma regra do programa se aplica a esta situação"
      ]
    },
    mensagem: "Produtor não se enquadra nos critérios do programa",
    avisos: ["Verifique os critérios de elegibilidade do programa"]
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
    where: { id: regraId }
  });

  if (!regra) {
    return { permitido: false, mensagem: "Regra não encontrada" };
  }

  const limite = regra.limiteBeneficio as any;

  // Se não tem limite de período, permitir
  if (!limite?.limitePorPeriodo) {
    return { permitido: true, mensagem: "Sem limite de período" };
  }

  // Calcular data de início do período
  const periodo = limite.limitePorPeriodo.periodo;
  const quantidade = limite.limitePorPeriodo.quantidade || 1;

  let dataInicio = new Date();

  if (periodo === "bienal") {
    dataInicio.setFullYear(dataInicio.getFullYear() - 2);
  } else if (periodo === "anual") {
    dataInicio.setFullYear(dataInicio.getFullYear() - 1);
  } else if (periodo === "mensal") {
    dataInicio.setMonth(dataInicio.getMonth() - 1);
  }

  // Buscar solicitações aprovadas no período
  const solicitacoesNoPeriodo = await prisma.solicitacaoBeneficio.findMany({
    where: {
      pessoaId,
      programaId,
      regraAplicadaId: regraId,
      status: "aprovada",
      datasolicitacao: {
        gte: dataInicio
      }
    }
  });

  if (solicitacoesNoPeriodo.length >= quantidade) {
    return {
      permitido: false,
      mensagem: `Limite de ${quantidade} solicitação(ões) por ${periodo} já atingido`,
      detalhes: {
        solicitacoesNoPeriodo: solicitacoesNoPeriodo.length,
        limite: quantidade,
        periodo: periodo,
        dataInicio: dataInicio
      }
    };
  }

  return {
    permitido: true,
    mensagem: `Ainda pode solicitar ${quantidade - solicitacoesNoPeriodo.length} vez(es) neste ${periodo}`,
    detalhes: {
      solicitacoesNoPeriodo: solicitacoesNoPeriodo.length,
      limite: quantidade,
      periodo: periodo
    }
  };
}
