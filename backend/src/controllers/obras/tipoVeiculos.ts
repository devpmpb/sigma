import { createGenericController } from "../GenericController";

export const tipoVeiculoController = createGenericController({
  modelName: "tipoVeiculo",
  displayName: "Tipo de Veículo",
  uniqueField: "descricao",
  softDelete: true,
  orderBy: { descricao: "asc" },
});
