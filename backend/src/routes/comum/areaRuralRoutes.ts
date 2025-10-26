import { Router } from "express";
import { areaRuralController } from "../../controllers/comum/areaRuralController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Rotas básicas CRUD do generic controller
router.get("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), areaRuralController.findAll);
router.get("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), areaRuralController.findById);
router.post("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE), areaRuralController.create);
router.put("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), areaRuralController.update);
router.delete("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE), areaRuralController.delete);

export default router;
