import { Router } from "express";
import { grupoProdutoController } from "../../controllers/agricultura/grupoProdutoController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

router.get("/", requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), grupoProdutoController.findAll);
router.get("/:id", requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), grupoProdutoController.findById);
router.post("/", requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.CREATE), grupoProdutoController.create);
router.put("/:id", requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.EDIT), grupoProdutoController.update);
router.patch("/:id/status", requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.EDIT), grupoProdutoController.status);
router.delete("/:id", requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.DELETE), grupoProdutoController.delete);

export default router;
