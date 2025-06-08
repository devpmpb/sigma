// backend/src/routes/agricultura/programaRoutes.ts
import { Router } from "express";
import { programaController } from "../../controllers/comum/programaController";
import { requirePermission } from "../../middleware/authMiddleware";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";

const router = Router();

// Listar todos os programas
router.get("/", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  programaController.findAll
);

// Buscar estatísticas dos programas
router.get("/stats", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  programaController.getStats
);

// Buscar programas por tipo
router.get("/tipo/:tipo", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  programaController.findByTipo
);

// Buscar programa por ID
router.get("/:id", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  programaController.findById
);

// Buscar programa com suas regras
router.get("/:id/regras", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.VIEW), 
  programaController.findByIdWithRules
);

// Criar novo programa
router.post("/", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.CREATE), 
  programaController.create
);

// Duplicar programa
router.post("/:id/duplicar", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.CREATE), 
  programaController.duplicate
);

// Atualizar programa
router.put("/:id", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.EDIT), 
  programaController.update
);

// Alterar status do programa
router.patch("/:id/status", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.EDIT), 
  programaController.status
);

// Excluir programa
router.delete("/:id", 
  requirePermission(ModuloSistema.AGRICULTURA, AcaoPermissao.DELETE), 
  programaController.delete
);

export default router;