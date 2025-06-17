/**
 * @param dateString - String no formato "YYYY-MM-DD"
 * @returns Date object com timezone UTC
 */
export const convertDateString = (dateString: string): Date => {
  if (!dateString || typeof dateString !== "string") {
    throw new Error("Invalid date string provided");
  }
  
  return new Date(dateString + "T00:00:00.000Z");
};

/**
 * @param data - Objeto com os dados
 * @param dateFields - Array com nomes dos campos que são datas
 * @returns Objeto com as datas convertidas
 */
export const convertDateFields = (data: any, dateFields: string[]): any => {
  const convertedData = { ...data };
  dateFields.forEach((field) => {
    if (convertedData[field] && 
        typeof convertedData[field] === "string" && 
        convertedData[field].trim() !== "") { // ✅ ESTA É A ÚNICA CORREÇÃO NECESSÁRIA
      convertedData[field] = convertDateString(convertedData[field]);
    } else if (convertedData[field] === "" || convertedData[field] === null) {
      convertedData[field] = null; // ✅ CAMPOS VAZIOS VIRAM NULL
    }
  });
  return convertedData;
};

/**
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
 * @param data - Dados do arrendamento
 * @returns Dados com datas convertidas
 */
export const convertArrendamentoDateFields = (data: any): any => {
  return convertDateFields(data, ["dataInicio", "dataFim"]);
};

/**
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
 * @param value - String a ser sanitizada
 * @returns String apenas com números
 */
export const sanitizeNumericString = (value: string): string => {
  if (!value || typeof value !== "string") return "";
  return value.replace(/\D/g, "");
};

/**
 * @param dateString - String da data
 * @returns true se válida, false se inválida
 */
export const isValidDateString = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== "string") return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
