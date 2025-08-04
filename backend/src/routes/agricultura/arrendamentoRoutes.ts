import { Router } from "express";
import { arrendamentoController } from "../../controllers/agricultura/arrendamentoController";
import {
  requirePermission,
  requireModuleAccess,
} from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Aplicar verificação de acesso ao módulo comum
router.use(requireModuleAccess(ModuloSistema.AGRICULTURA));

// Rotas básicas CRUD
router.get(
  "/",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  arrendamentoController.findAll
);
//router.get("/busca",
//  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
//  arrendamentoController.buscarPorTermo
//);
router.get(
  "/:id",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  arrendamentoController.findById
);
router.post(
  "/",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.CREATE),
  arrendamentoController.create
);
router.put(
  "/:id",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.EDIT),
  arrendamentoController.update
);
router.delete(
  "/:id",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.DELETE),
  arrendamentoController.delete
);

// Rotas específicas do arrendamento
router.get(
  "/proprietario/:proprietarioId",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  arrendamentoController.findByProprietario
);

router.get(
  "/arrendatario/:arrendatarioId",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  arrendamentoController.findByArrendatario
);

router.get(
  "/propriedade/:propriedadeId",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  arrendamentoController.findByPropriedade
);

router.get(
  "/status/:status",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  arrendamentoController.findByStatus
);

router.get(
  "/:id/detalhes",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  arrendamentoController.findByIdWithDetails
);

router.post(
  "/validar-conflito",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.CREATE),
  arrendamentoController.validarConflito
);

router.patch(
  "/:id/status",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.EDIT),
  arrendamentoController.updateStatus
);

router.patch(
  "/:id/finalizar",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.EDIT),
  arrendamentoController.finalizarArrendamento
);

router.get(
  "/estatisticas/dashboard",
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW),
  arrendamentoController.getEstatisticas
);

export default router;
