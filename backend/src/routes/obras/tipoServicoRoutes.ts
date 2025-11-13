// backend/src/routes/obras/tipoServicoRoutes.ts
import { Router } from "express";
import { tipoServicoController } from "../../controllers/obras/tipoServicoController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Rotas CRUD básicas
router.get(
  "/",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.VIEW),
  tipoServicoController.getAll
);

router.get(
  "/:id",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.VIEW),
  tipoServicoController.getById
);

router.post(
  "/",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.CREATE),
  tipoServicoController.create
);

router.put(
  "/:id",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.EDIT),
  tipoServicoController.update
);

router.delete(
  "/:id",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.DELETE),
  tipoServicoController.delete
);

// Rota específica para calcular valor de um serviço
router.post(
  "/calcular-valor",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.VIEW),
  tipoServicoController.calcularValor
);

export default router;
