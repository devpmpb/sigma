// src/controllers/bairroController.ts

import { createGenericController } from "./genericController";

// Validação específica para Bairro
const validateBairro = (data: any) => {
  const errors = [];

  if (!data.nome) {
    errors.push("Nome do bairro é obrigatório");
  } else if (data.nome.length < 2) {
    errors.push("Nome do bairro deve ter pelo menos 2 caracteres");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const bairroController = createGenericController({
  modelName: "bairro",
  displayName: "Bairro",
  uniqueField: "nome",
  softDelete: true,
  orderBy: { nome: "asc" },
  validateCreate: validateBairro,
  validateUpdate: validateBairro,
});
