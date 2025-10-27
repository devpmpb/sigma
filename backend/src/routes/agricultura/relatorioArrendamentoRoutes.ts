// backend/src/routes/agricultura/relatorioArrendamentoRoutes.ts
import { Router } from "express";
import { relatorioArrendamentoController } from "../../controllers/agricultura/relatorioArrendamentoController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Todos os relatórios exigem permissão VIEW no módulo AGRICULTURA
router.get(
  "/geral",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  relatorioArrendamentoController.geral
);

router.get(
  "/por-propriedade",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  relatorioArrendamentoController.porPropriedade
);

router.get(
  "/por-arrendatario",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  relatorioArrendamentoController.porArrendatario
);

router.get(
  "/por-atividade",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  relatorioArrendamentoController.porAtividadeProdutiva
);

router.get(
  "/vencendo",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  relatorioArrendamentoController.vencendo
);

export default router;
