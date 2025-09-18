// backend/src/controllers/comum/areaRuralController.ts
import { createGenericController } from "../GenericController";

export const areaRuralController = createGenericController({
  modelName: "areaRural",
  displayName: "Área Rural",
  uniqueField: "nome",
  softDelete: true,
  orderBy: { nome: "asc" },

  validateCreate: (data: any) => {
    const errors = [];

    if (!data.nome || data.nome.trim() === "") {
      errors.push("Nome da área rural é obrigatório");
    }

    if (data.nome && data.nome.trim().length < 3) {
      errors.push("Nome da área rural deve ter pelo menos 3 caracteres");
    }

    if (data.nome && data.nome.length > 100) {
      errors.push("Nome da área rural não pode ter mais de 100 caracteres");
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  validateUpdate: (data: any) => {
    const errors = [];

    if (data.nome !== undefined) {
      if (!data.nome || data.nome.trim() === "") {
        errors.push("Nome da área rural é obrigatório");
      }

      if (data.nome && data.nome.trim().length < 3) {
        errors.push("Nome da área rural deve ter pelo menos 3 caracteres");
      }

      if (data.nome && data.nome.length > 100) {
        errors.push("Nome da área rural não pode ter mais de 100 caracteres");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
