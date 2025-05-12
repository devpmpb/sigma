import { createGenericController } from "../GenericController";

export const logradouroController = createGenericController({
  modelName: "logradouro",
  displayName: "Logradouro",
  uniqueField: "cep",
  softDelete: true,
  orderBy: { descricao: "asc" },
});
