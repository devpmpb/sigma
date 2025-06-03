// backend/src/routes/admin/usuarioRoutes.ts - ARQUIVO COMPLETO
import { Router } from "express";
import { usuarioController } from "../../controllers/admin/usuarioController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Todas as rotas requerem permissão de admin
router.get("/", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.VIEW), usuarioController.findAll);
router.get("/stats", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.VIEW), usuarioController.getStats);
router.get("/perfil/:perfilNome", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.VIEW), usuarioController.findByProfile);
router.get("/:id", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.VIEW), usuarioController.findById);
router.post("/", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.CREATE), usuarioController.create);
router.put("/:id", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.EDIT), usuarioController.update);
router.patch("/:id/status", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.EDIT), usuarioController.toggleStatus);
router.patch("/:id/senha", usuarioController.changePassword); // Usuário pode alterar própria senha
router.patch("/:id/reset-senha", requirePermission(ModuloSistema.ADMIN, AcaoPermissao.EDIT), usuarioController.resetPassword);

export default router;