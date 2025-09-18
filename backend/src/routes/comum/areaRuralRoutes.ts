// backend/src/routes/comum/areaRuralRoutes.ts
import { Router } from "express";
import { areaRuralController } from "../../controllers/comum/areaRuralController";

const router = Router();

// Rotas básicas CRUD
router.get("/", areaRuralController.findAll);
router.get("/ativas", areaRuralController.findAtivas);
router.get("/buscar", areaRuralController.findByNome);
router.get("/:id", areaRuralController.findById);
router.post("/", areaRuralController.create);
router.put("/:id", areaRuralController.update);
router.delete("/:id", areaRuralController.delete);
router.patch("/:id/toggle-status", areaRuralController.toggleStatus);

export default router;
