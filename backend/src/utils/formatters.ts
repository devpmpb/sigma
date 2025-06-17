/**
 * Utilitários para formatação e conversão de dados no backend
 */

/**
 * Converte strings de data para objetos Date com timezone UTC
 * Usado para campos que vêm do frontend como input type="date"
 *
 * @param dateString - String no formato "YYYY-MM-DD"
 * @returns Date object com timezone UTC
 */
export const convertDateString = (dateString: string): Date => {
  console.log(dateString);
  if (!dateString || typeof dateString !== "string") {
    throw new Error("Invalid date string provided");
  }

  // Adiciona o horário UTC para evitar problemas de timezone
  return new Date(dateString + "T00:00:00.000Z");
};

/**
 * Converte múltiplos campos de data em um objeto
 * Percorre o objeto procurando por campos de data e os converte
 *
 * @param data - Objeto com os dados
 * @param dateFields - Array com nomes dos campos que são datas
 * @returns Objeto com as datas convertidas
 */
export const convertDateFields = (data: any, dateFields: string[]): any => {
  const convertedData = { ...data };
  dateFields.forEach((field) => {
    if (convertedData[field] && typeof convertedData[field] === "string") {
      convertedData[field] = convertDateString(convertedData[field]);
    }
  });
  return convertedData;
};

/**
 * Converte campos específicos de pessoa (PF e PJ)
 * Função específica para o modelo Pessoa
 *
 * @param data - Dados da pessoa
 * @returns Dados com datas convertidas
 */
export const convertPessoaDateFields = (data: any): any => {
  const convertedData = { ...data };

  // Campos de data na pessoa física
  if (
    convertedData.dataNascimento &&
    typeof convertedData.dataNascimento === "string"
  ) {
    convertedData.dataNascimento = convertDateString(
      convertedData.dataNascimento
    );
  }

  // Campos de data na pessoa jurídica
  if (
    convertedData.dataFundacao &&
    typeof convertedData.dataFundacao === "string"
  ) {
    convertedData.dataFundacao = convertDateString(convertedData.dataFundacao);
  }

  return convertedData;
};

/**
 * Converte campos específicos de arrendamento
 * Função específica para o modelo Arrendamento
 *
 * @param data - Dados do arrendamento
 * @returns Dados com datas convertidas
 */
export const convertArrendamentoDateFields = (data: any): any => {
  return convertDateFields(data, ["dataInicio", "dataFim"]);
};

/**
 * Converte campos específicos de produtor/área efetiva
 * Função específica para modelos que tenham campos de data relacionados à agricultura
 *
 * @param data - Dados do produtor
 * @returns Dados com datas convertidas
 */
export const convertProdutorDateFields = (data: any): any => {
  const convertedData = { ...data };

  // Se houver área efetiva com data de referência
  if (
    convertedData.areaEfetiva?.dataReferencia &&
    typeof convertedData.areaEfetiva.dataReferencia === "string"
  ) {
    convertedData.areaEfetiva.dataReferencia = convertDateString(
      convertedData.areaEfetiva.dataReferencia
    );
  }

  return convertedData;
};

/**
 * Formata valor decimal para string
 * Útil para campos Decimal do Prisma
 *
 * @param value - Valor a ser formatado
 * @param decimals - Número de casas decimais (default: 2)
 * @returns String formatada
 */
export const formatDecimal = (
  value: number | string,
  decimals: number = 2
): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return numValue.toFixed(decimals);
};

/**
 * Converte string para número
 * Útil para campos que vêm como string do frontend mas devem ser number
 *
 * @param value - Valor a ser convertido
 * @returns Número convertido ou null se inválido
 */
export const safeParseNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Sanitiza string removendo caracteres especiais
 * Útil para CPF, CNPJ, telefones etc
 *
 * @param value - String a ser sanitizada
 * @returns String apenas com números
 */
export const sanitizeNumericString = (value: string): string => {
  if (!value || typeof value !== "string") return "";
  return value.replace(/\D/g, "");
};

/**
 * Valida se uma string é uma data válida
 *
 * @param dateString - String da data
 * @returns true se válida, false se inválida
 */
export const isValidDateString = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== "string") return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
