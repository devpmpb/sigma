
// backend/src/routes/comum/pessoaRoutes.ts - VERSÃO ATUALIZADA
import { Router } from "express";
import { pessoaController } from "../../controllers/comum/pessoaController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Rotas básicas CRUD (mantidas)
router.get("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), pessoaController.findAll);
router.get("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), pessoaController.findById);
router.post("/", requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE), pessoaController.create);
router.put("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), pessoaController.update);
router.delete("/:id", requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE), pessoaController.delete);

// Rotas específicas existentes
router.get("/tipo/:tipo", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), pessoaController.findByTipo);

// 🆕 NOVAS ROTAS PARA PRODUTORES RURAIS
router.get("/produtores-rurais", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  pessoaController.findProdutoresRurais
);

router.get("/:id/area-efetiva", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  pessoaController.findWithAreaEfetiva
);

// Rota para busca por termo (mantida)
//router.get("/search/:term", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), pessoaController.searchByTerm);

export default router;