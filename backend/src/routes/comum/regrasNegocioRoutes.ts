import { Router } from "express";
import { regrasNegocioController } from "../../controllers/comum/regrasNegocioController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Listar todas as regras
router.get("/", 
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), 
  regrasNegocioController.findAll
);

// Listar tipos de regra disponíveis
router.get("/tipos", 
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), 
  regrasNegocioController.getTiposRegra
);

// Obter template de regra por tipo
router.get("/template/:tipo", 
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), 
  regrasNegocioController.getRuleTemplate
);

// Buscar regras por programa
router.get("/programa/:programaId", 
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), 
  regrasNegocioController.findByPrograma
);

// Buscar regras por tipo
router.get("/tipo/:tipo", 
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), 
  regrasNegocioController.findByTipo
);

// Buscar regra por ID
router.get("/:id", 
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), 
  regrasNegocioController.findById
);

// Validar se produtor atende regra
router.post("/:regraId/validar", 
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), 
  regrasNegocioController.validateRule
);

// Criar nova regra
router.post("/", 
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE), 
  regrasNegocioController.create
);

// Atualizar regra
router.put("/:id", 
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT), 
  regrasNegocioController.update
);

// Excluir regra
router.delete("/:id", 
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE), 
  regrasNegocioController.delete
);

export default router;