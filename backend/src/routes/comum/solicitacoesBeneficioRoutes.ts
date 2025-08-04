// backend/src/routes/comum/solicitacoesBeneficioRoutes.ts
import { Router } from "express";
import { solicitacaoBeneficioController } from "../../controllers/comum/solicitacaoBeneficioController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";
const router = Router();

// Rotas CRUD básicas (usando generic controller)
router.get(
  "/",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  solicitacaoBeneficioController.findAll
);

router.get(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  solicitacaoBeneficioController.findById
);

router.post(
  "/",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE),
  solicitacaoBeneficioController.create
);

router.put(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT),
  solicitacaoBeneficioController.update
);

router.delete(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE),
  solicitacaoBeneficioController.delete
);

router.patch(
  "/:id/toggle",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT),
  solicitacaoBeneficioController.toggleStatus
);

// Rotas específicas
router.get(
  "/pessoa/:pessoaId",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  solicitacaoBeneficioController.getByPessoa
);

router.get(
  "/programa/:programaId",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  solicitacaoBeneficioController.getByPrograma
);

router.get(
  "/secretaria/:secretaria",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  solicitacaoBeneficioController.getBySecretaria
);

router.put(
  "/:id/status",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT),
  solicitacaoBeneficioController.updateStatus
);

router.get(
  "/stats/estatisticas",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  solicitacaoBeneficioController.getEstatisticas
);

export default router;
