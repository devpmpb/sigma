/**
 * Utilitários para formatação de dados
 */

/**
 * Formata uma data para exibição no formato brasileiro
 * @param dataString - String com a data a ser formatada
 * @param includeTime - Se deve incluir horas e minutos (default: true)
 * @returns String formatada da data
 */
export const formatarData = (
  dataString: string | Date,
  includeTime = true
): string => {
  if (!dataString) return "";

  const data = dataString instanceof Date ? dataString : new Date(dataString);

  if (isNaN(data.getTime())) return "";

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

/**
 * Formata um valor monetário para exibição
 * @param valor - Valor a ser formatado
 * @param currency - Moeda a ser usada (default: 'BRL')
 * @returns String formatada do valor
 */
export const formatarMoeda = (valor: number, currency = "BRL"): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(valor);
};

/**
 * Formata um número para exibição
 * @param valor - Valor a ser formatado
 * @param decimais - Casas decimais (default: 2)
 * @returns String formatada do número
 */
export const formatarNumero = (valor: number, decimais = 2): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(valor);
};

/**
 * Formata um CPF
 * @param cpf - CPF a ser formatado
 * @returns String formatada do CPF
 */
export const formatarCPF = (cpf: string): string => {
  if (!cpf) return "";

  // Remove caracteres não numéricos
  const numeros = cpf.replace(/\D/g, "");

  if (numeros.length !== 11) return cpf;

  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

/**
 * Formata um CNPJ
 * @param cnpj - CNPJ a ser formatado
 * @returns String formatada do CNPJ
 */
export const formatarCNPJ = (cnpj: string): string => {
  if (!cnpj) return "";

  // Remove caracteres não numéricos
  const numeros = cnpj.replace(/\D/g, "");

  if (numeros.length !== 14) return cnpj;

  return numeros.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
};

/**
 * Formata um telefone
 * @param telefone - Telefone a ser formatado
 * @returns String formatada do telefone
 */
export const formatarTelefone = (telefone: string): string => {
  if (!telefone) return "";

  // Remove caracteres não numéricos
  const numeros = telefone.replace(/\D/g, "");

  if (numeros.length < 10) return telefone;

  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
  }

  return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
};

/**
 * Formata um CEP
 * @param cep - CEP a ser formatado
 * @returns String formatada do CEP
 */
export const formatarCEP = (cep: string): string => {
  if (!cep) return "";

  // Remove caracteres não numéricos
  const numeros = cep.replace(/\D/g, "");

  if (numeros.length !== 8) return cep;

  return numeros.replace(/(\d{5})(\d{3})/, "$1-$2");
};
