import { createGenericController } from "./GenericController";

export const bairroController = createGenericController({
  modelName: "bairro",
  displayName: "Bairro",
  uniqueField: "nome",
  softDelete: true,
  orderBy: { nome: "asc" },
});
