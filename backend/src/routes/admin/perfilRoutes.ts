import { Router } from "express";
import { perfilController } from "../../controllers/admin/perfilController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

router.get("/", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.VIEW), perfilController.findAll);
router.get("/ativos", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.VIEW), perfilController.findActive);
router.get("/stats", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.VIEW), perfilController.getStats);
router.get("/:id", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.VIEW), perfilController.findById);
router.get("/:id/permissoes", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.VIEW), perfilController.getPermissions);
router.get("/nome/:nome", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.VIEW), perfilController.findByName);

export default router;