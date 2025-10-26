// src/routes/comum/enderecoRoutes.ts
import { Router } from "express";
import { enderecoController } from "../../controllers/comum/enderecoController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Rotas básicas
router.get("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), enderecoController.findAll);
router.get("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), enderecoController.findById);
router.get("/pessoa/:pessoaId", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), enderecoController.findByPessoa);
router.get("/propriedade/:propriedadeId", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), enderecoController.findByPropriedade);
router.post("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE), enderecoController.create);
router.put("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), enderecoController.update);
router.patch("/:id/principal", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), enderecoController.setPrincipal);
router.delete("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE), enderecoController.delete);

export default router;