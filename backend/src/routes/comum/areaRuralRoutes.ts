import { Router } from "express";
import { areaRuralController } from "../../controllers/comum/areaRuralController";

const router = Router();

// Aplicar autenticação a todas as rotas

// Rotas básicas CRUD do generic controller
router.get("/", areaRuralController.findAll);
router.get("/:id", areaRuralController.findById);
router.post("/", areaRuralController.create);
router.put("/:id", areaRuralController.update);
router.delete("/:id", areaRuralController.delete);

/* Rota para toggle de status (ativar/desativar)
if (areaRuralController.toggleStatus) {
  router.patch("/:id/toggle-status", areaRuralController.toggleStatus);
}

// Rota de busca/pesquisa
if (areaRuralController.search) {
  router.get("/search", areaRuralController.search);
}*/

export default router;
