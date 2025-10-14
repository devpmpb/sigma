import { Router } from "express";
import { pessoaController } from "../../controllers/comum/pessoaController";
import { requirePermission } from "../../middleware/authMiddleware";
import { AcaoPermissao, ModuloSistema } from "@prisma/client";

const router = Router();

// Rotas básicas
router.get(
  "/",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  pessoaController.findAll
);
router.get(
  "/enderecos",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  pessoaController.findAllWithEnderecos
);
router.get(
  "/produtores",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  pessoaController.findProdutores
);
router.get(
  "/buscar",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  pessoaController.buscarPorTermo
);
router.get(
  "/tipo/:tipo",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  pessoaController.findByTipo
);
router.get(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  pessoaController.findById
);
router.get(
  "/:id/detalhes",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  pessoaController.findByIdWithDetails
);
router.get(
  "/cpfCnpj/:cpfCnpj",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  pessoaController.findByCpfCnpj
);
router.patch(
  "/:id/status",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT),
  pessoaController.status
);
router.post(
  "/",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE),
  pessoaController.create
);
router.put(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT),
  pessoaController.update
);
router.put("/:id/area-efetiva", pessoaController.updateAreaEfetiva);
router.delete(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE),
  pessoaController.delete
);

export default router;
