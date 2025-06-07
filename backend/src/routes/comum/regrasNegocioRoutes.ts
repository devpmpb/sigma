// backend/src/routes/agricultura/regrasNegocioRoutes.ts
import { Router } from "express";
import { regrasNegocioController } from "../../controllers/comum/regrasNegocioController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Listar todas as regras
router.get("/", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  regrasNegocioController.findAll
);

// Listar tipos de regra disponíveis
router.get("/tipos", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  regrasNegocioController.getTiposRegra
);

// Obter template de regra por tipo
router.get("/template/:tipo", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  regrasNegocioController.getRuleTemplate
);

// Buscar regras por programa
router.get("/programa/:programaId", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  regrasNegocioController.findByPrograma
);

// Buscar regras por tipo
router.get("/tipo/:tipo", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  regrasNegocioController.findByTipo
);

// Buscar regra por ID
router.get("/:id", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  regrasNegocioController.findById
);

// Validar se produtor atende regra
router.post("/:regraId/validar", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  regrasNegocioController.validateRule
);

// Criar nova regra
router.post("/", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.CREATE), 
  regrasNegocioController.create
);

// Atualizar regra
router.put("/:id", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.EDIT), 
  regrasNegocioController.update
);

// Excluir regra
router.delete("/:id", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.DELETE), 
  regrasNegocioController.delete
);

export default router;