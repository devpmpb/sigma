// backend/src/routes/comum/relatorioBeneficioRoutes.ts
import { Router } from "express";
import { relatorioBeneficioController } from "../../controllers/comum/relatorioBeneficioController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Todos os relatórios exigem permissão VIEW no módulo COMUM
router.get(
  "/por-programa",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  relatorioBeneficioController.porPrograma
);

router.get(
  "/produtores-beneficiados",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  relatorioBeneficioController.produtoresBeneficiados
);

router.get(
  "/investimento-periodo",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  relatorioBeneficioController.investimentoPorPeriodo
);

router.get(
  "/por-secretaria",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  relatorioBeneficioController.porSecretaria
);

export default router;
