import { Router } from "express";
import { transferenciaPropiedadeController } from "../../controllers/comum/TransferenciaPropiedadeController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Rotas específicas (devem vir antes das genéricas)
router.post("/transferir", requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE), transferenciaPropiedadeController.transferir);
router.get("/historico/:propriedadeId", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), transferenciaPropiedadeController.getHistorico);
router.get("/propriedade/:propriedadeId", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), transferenciaPropiedadeController.getByPropriedade);
router.get("/recentes", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), transferenciaPropiedadeController.getRecentes);

// Rotas genéricas (CRUD básico)
router.get("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), transferenciaPropiedadeController.findAll);
router.get("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), transferenciaPropiedadeController.findById);
router.put("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), transferenciaPropiedadeController.update);
router.delete("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE), transferenciaPropiedadeController.delete);

export default router;
