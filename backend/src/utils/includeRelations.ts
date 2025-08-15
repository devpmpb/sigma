// backend/src/utils/includeRelations.ts
/**
 * Constantes para reutilizar includes do Prisma
 * Evita repetição de código nos controllers
 */

// ========================================
// INCLUDES BÁSICOS (SEM DADOS DE PRODUTOR)
// ========================================

export const INCLUDE_PESSOA_BASICO = {
  select: {
    id: true,
    nome: true,
    cpfCnpj: true,
    telefone: true,
    email: true,
    tipoPessoa: true,
    ativo: true,
    produtorRural: true, // Apenas o flag, sem detalhes
  }
};

export const INCLUDE_PROGRAMA_BASICO = {
  select: {
    id: true,
    nome: true,
    tipoPrograma: true,
    secretaria: true,
    descricao: true,
    leiNumero: true,
  }
};

export const INCLUDE_PROPRIEDADE_BASICO = {
  select: {
    id: true,
    nome: true,
    areaTotal: true,
    unidadeArea: true,
    tipoPropriedade: true,
    localizacao: true,
  }
};

// ========================================
// INCLUDES COMPLETOS (COM DADOS DE PRODUTOR)
// ========================================

export const INCLUDE_PESSOA_COMPLETO = {
  select: {
    id: true,
    nome: true,
    cpfCnpj: true,
    telefone: true,
    email: true,
    tipoPessoa: true,
    ativo: true,
    // 🆕 Dados de produtor rural
    produtorRural: true,
    inscricaoEstadual: true,
    // Dados específicos por tipo
    pessoaFisica: {
      select: {
        rg: true,
        dataNascimento: true,
      }
    },
    pessoaJuridica: {
      select: {
        nomeFantasia: true,
        representanteLegal: true,
      }
    },
    // 🆕 Área efetiva (só existe se for produtor)
    areaEfetiva: {
      select: {
        anoReferencia: true,
        areaPropria: true,
        areaArrendadaRecebida: true,
        areaArrendadaCedida: true,
        areaEfetiva: true,
        updatedAt: true,
      }
    }
  }
};

export const INCLUDE_PROPRIEDADE_COMPLETO = {
  select: {
    id: true,
    nome: true,
    areaTotal: true,
    unidadeArea: true,
    tipoPropriedade: true,
    localizacao: true,
    itr: true,
    incra: true,
    situacao: true,
    proprietarioResidente: true,
    matricula: true,
    // Proprietário com dados básicos
    proprietario: INCLUDE_PESSOA_BASICO,
    // Logradouro se houver
    logradouro: {
      select: {
        id: true,
        tipo: true,
        descricao: true,
        cep: true,
      }
    }
  }
};

// ========================================
// INCLUDES PARA SOLICITAÇÃO DE BENEFÍCIO
// ========================================

export const INCLUDE_SOLICITACAO_BASICO = {
  pessoa: INCLUDE_PESSOA_BASICO,
  programa: INCLUDE_PROGRAMA_BASICO,
};

export const INCLUDE_SOLICITACAO_COMPLETO = {
  pessoa: INCLUDE_PESSOA_COMPLETO,
  programa: INCLUDE_PROGRAMA_BASICO,
};

// ========================================
// INCLUDES PARA ARRENDAMENTO  
// ========================================

export const INCLUDE_ARRENDAMENTO_BASICO = {
  propriedade: INCLUDE_PROPRIEDADE_BASICO,
  proprietario: INCLUDE_PESSOA_BASICO,
  arrendatario: INCLUDE_PESSOA_BASICO,
};

export const INCLUDE_ARRENDAMENTO_COMPLETO = {
  propriedade: INCLUDE_PROPRIEDADE_COMPLETO,
  proprietario: INCLUDE_PESSOA_COMPLETO,
  arrendatario: INCLUDE_PESSOA_COMPLETO,
};

// ========================================
// INCLUDES PARA ORDEM DE SERVIÇO
// ========================================

export const INCLUDE_ORDEM_SERVICO_BASICO = {
  pessoa: INCLUDE_PESSOA_BASICO,
  veiculo: {
    select: {
      id: true,
      descricao: true,
      placa: true,
      tipoVeiculo: {
        select: {
          id: true,
          descricao: true,
        }
      }
    }
  }
};

// ========================================
// INCLUDES ESPECÍFICOS PARA BUSCA/LISTAGEM
// ========================================

// Para listagem rápida (menos dados)
export const INCLUDE_LISTAGEM = {
  pessoa: {
    select: {
      id: true,
      nome: true,
      cpfCnpj: true,
      produtorRural: true,
    }
  },
  programa: {
    select: {
      id: true,
      nome: true,
      secretaria: true,
    }
  }
};

// Para detalhes completos
export const INCLUDE_DETALHES = {
  pessoa: INCLUDE_PESSOA_COMPLETO,
  programa: INCLUDE_PROGRAMA_BASICO,
};

// ========================================
// UTILITÁRIOS PARA FILTROS
// ========================================

// Filtro para apenas produtores rurais
export const WHERE_APENAS_PRODUTORES = {
  pessoa: {
    produtorRural: true
  }
};

// Filtro para programas de agricultura
export const WHERE_PROGRAMAS_AGRICULTURA = {
  programa: {
    secretaria: "AGRICULTURA"
  }
};

// Filtro para pessoas ativas
export const WHERE_PESSOAS_ATIVAS = {
  pessoa: {
    ativo: true
  }
};