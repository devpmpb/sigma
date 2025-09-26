import { Router } from "express";
import { transferenciaPropiedadeController } from "../../controllers/comum/TransferenciaPropiedadeController";

const router = Router();

// Rotas específicas (devem vir antes das genéricas)
router.get("/teste", transferenciaPropiedadeController.teste);
router.post("/transferir", transferenciaPropiedadeController.transferir);
router.get(
  "/historico/:propriedadeId",
  transferenciaPropiedadeController.getHistorico
);
router.get(
  "/propriedade/:propriedadeId",
  transferenciaPropiedadeController.getByPropriedade
);
router.get("/recentes", transferenciaPropiedadeController.getRecentes);

// Rotas genéricas (CRUD básico)
router.get("/", transferenciaPropiedadeController.findAll);
router.get("/:id", transferenciaPropiedadeController.findById);
//router.post("/", transferenciaPropiedadeController.create);
router.put("/:id", transferenciaPropiedadeController.update);
router.delete("/:id", transferenciaPropiedadeController.delete);

export default router;
