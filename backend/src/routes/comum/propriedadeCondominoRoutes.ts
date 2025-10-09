// backend/src/routes/comum/propriedadeCondominoRoutes.ts
import { Router } from "express";
import { propriedadeCondominoController } from "../../controllers/comum/propriedadeCondominoController";

const router = Router();

// Rotas para condôminos de propriedade
router.post(
  "/:propriedadeId/condominos",
  propriedadeCondominoController.addCondomino
);
router.get(
  "/:propriedadeId/condominos",
  propriedadeCondominoController.getCondominos
);
router.delete(
  "/:propriedadeId/condominos/:condominoId",
  propriedadeCondominoController.removeCondomino
);
router.patch(
  "/:propriedadeId/condominos/:id",
  propriedadeCondominoController.updateCondomino
);

export default router;
