import { Router } from "express";
import { bairroController } from "../../controllers/comum/bairroController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

router.get("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), bairroController.findAll);
router.get("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), bairroController.findById);
router.post("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE), bairroController.create);
router.put("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), bairroController.update);
router.patch("/:id/status", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), bairroController.status);
router.delete("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE), bairroController.delete);

export default router;
