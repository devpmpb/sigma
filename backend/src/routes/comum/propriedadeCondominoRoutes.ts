// backend/src/routes/comum/propriedadeCondominoRoutes.ts
import { Router } from "express";
import { propriedadeCondominoController } from "../../controllers/comum/propriedadeCondominoController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Rotas para condôminos de propriedade
router.post(
  "/:propriedadeId/condominos",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE),
  propriedadeCondominoController.addCondomino
);
router.get(
  "/:propriedadeId/condominos",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  propriedadeCondominoController.getCondominos
);
router.delete(
  "/:propriedadeId/condominos/:condominoId",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE),
  propriedadeCondominoController.removeCondomino
);
router.patch(
  "/:propriedadeId/condominos/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT),
  propriedadeCondominoController.updateCondomino
);
router.post(
  "/:propriedadeId/condominos/transferir",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE),
  propriedadeCondominoController.transferirCondomino
);

export default router;
