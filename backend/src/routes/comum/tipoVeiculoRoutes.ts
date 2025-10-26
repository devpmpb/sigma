import { Router } from "express";
import { tipoVeiculoController } from "../../controllers/comum/tipoVeiculoController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

router.get("/ativos", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), tipoVeiculoController.findAtivos);
router.get("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), tipoVeiculoController.findAll);
router.get("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), tipoVeiculoController.findById);
router.post("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE), tipoVeiculoController.create);
router.put("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), tipoVeiculoController.update);
router.patch("/:id/status", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), tipoVeiculoController.status);
router.delete("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE), tipoVeiculoController.delete);

export default router;
