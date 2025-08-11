// backend/src/routes/obras/ordemServicoRoutes.ts
import { Router } from "express";
import { ordemServicoController } from "../../controllers/obras/ordemServicoController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Rotas CRUD básicas
router.get(
  "/",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.VIEW),
  ordemServicoController.findAll
);

router.get(
  "/:id",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.VIEW),
  ordemServicoController.findById
);

router.post(
  "/",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.CREATE),
  ordemServicoController.create
);

router.put(
  "/:id",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.EDIT),
  ordemServicoController.update
);

router.delete(
  "/:id",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.DELETE),
  ordemServicoController.delete
);

// Rotas específicas
router.get(
  "/status/:status",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.VIEW),
  ordemServicoController.getByStatus
);

router.get(
  "/pessoa/:pessoaId",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.VIEW),
  ordemServicoController.getByPessoa
);

router.get(
  "/veiculo/:veiculoId",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.VIEW),
  ordemServicoController.getByVeiculo
);

router.patch(
  "/:id/status",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.EDIT),
  ordemServicoController.updateStatus
);

router.get(
  "/stats/estatisticas",
  requirePermission(ModuloSistema.OBRAS, AcaoPermissao.VIEW),
  ordemServicoController.getEstatisticas
);

export default router;