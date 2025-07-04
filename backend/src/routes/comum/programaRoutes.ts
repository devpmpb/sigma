import { Router } from "express";
import { programaController } from "../../controllers/comum/programaController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Listar todos os programas
router.get(
  "/",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  programaController.findAll
);

// Buscar estatísticas dos programas
router.get(
  "/stats",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  programaController.getStats
);

// Buscar programas por tipo
router.get(
  "/tipo/:tipo",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  programaController.findByTipo
);

// Buscar programa por ID
router.get(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  programaController.findById
);

// Buscar programa com suas regras
router.get(
  "/:id/regras",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  programaController.findByIdWithRules
);

// Criar novo programa
router.post(
  "/",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE),
  programaController.create
);

// Duplicar programa
router.post(
  "/:id/duplicar",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE),
  programaController.duplicate
);

// Atualizar programa
router.put(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT),
  programaController.update
);

// Alterar status do programa
router.patch(
  "/:id/status",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT),
  programaController.status
);

// Excluir programa
router.delete(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE),
  programaController.delete
);

export default router;
