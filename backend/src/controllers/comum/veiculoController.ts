import { createGenericController } from "../GenericController";

const genericController = createGenericController({
  modelName: "veiculo",
  displayName: "Veículo",
  orderBy: { descricao: "asc" },

  validateCreate: (data: any) => {
    const errors = [];

    if (!data.tipoVeiculoId) {
      errors.push("Tipo de veículo é obrigatório");
    }

    if (!data.descricao || data.descricao.trim() === "") {
      errors.push("Descrição é obrigatória");
    }

    if (!data.placa || data.placa.trim() === "") {
      errors.push("Placa é obrigatória");
    }

    // Validar formato da placa (Mercosul ou padrão brasileiro)
    const placaRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$|^[A-Z]{3}-?[0-9]{4}$/;
    if (
      data.placa &&
      !placaRegex.test(data.placa.replace(/[-\s]/g, "").toUpperCase())
    ) {
      errors.push("Formato da placa inválido");
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  validateUpdate: (data: any) => {
    const errors = [];

    if (data.tipoVeiculoId !== undefined && !data.tipoVeiculoId) {
      errors.push("Tipo de veículo é obrigatório");
    }

    if (
      data.descricao !== undefined &&
      (!data.descricao || data.descricao.trim() === "")
    ) {
      errors.push("Descrição é obrigatória");
    }

    if (data.placa !== undefined && (!data.placa || data.placa.trim() === "")) {
      errors.push("Placa é obrigatória");
    }

    // Validar formato da placa se fornecida
    if (data.placa) {
      const placaRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$|^[A-Z]{3}-?[0-9]{4}$/;
      if (!placaRegex.test(data.placa.replace(/[-\s]/g, "").toUpperCase())) {
        errors.push("Formato da placa inválido");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

export const veiculoController = genericController;
