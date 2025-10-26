// src/routes/logradouroRoutes.ts
import { Router } from "express";
import { logradouroController } from "../../controllers/comum/logradouroController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

router.get("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), logradouroController.findAll);
router.get("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), logradouroController.findById);
router.post("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE), logradouroController.create);
router.put("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), logradouroController.update);
router.patch("/:id/status", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), logradouroController.status);
router.delete("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE), logradouroController.delete);

export default router;
