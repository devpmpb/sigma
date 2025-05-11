import { createGenericController } from "../GenericController";

export const grupoProdutoController = createGenericController({
  modelName: "grupoProduto",
  displayName: "Grupo de Produto",
  uniqueField: "descricao",
  softDelete: true,
  orderBy: { descricao: "asc" },
});
