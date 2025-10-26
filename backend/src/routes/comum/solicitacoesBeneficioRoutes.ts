// backend/src/routes/comum/solicitacoesBeneficioRoutes.ts
import { Router } from "express";
import { solicitacaoBeneficioController } from "../../controllers/comum/solicitacaoBeneficioController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";
const router = Router();

// IMPORTANTE: Rotas específicas DEVEM vir ANTES das rotas genéricas com :id
// para evitar conflitos de roteamento

// Rotas específicas (sem :id)
router.get(
  "/stats/estatisticas",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  solicitacaoBeneficioController.getEstatisticas
);

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

// NOVAS ROTAS: Cálculo automático e histórico
router.post(
  "/calcular",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  solicitacaoBeneficioController.calcularBeneficio
);

router.post(
  "/com-calculo",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE),
  solicitacaoBeneficioController.createComCalculo
);

router.get(
  "/:id/historico",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  solicitacaoBeneficioController.getHistorico
);

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

router.put(
  "/:id/status",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT),
  solicitacaoBeneficioController.updateStatus
);

router.delete(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE),
  solicitacaoBeneficioController.delete
);

export default router;
