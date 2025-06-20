// backend/src/routes/agricultura/produtorRoutes.ts
import { Router } from "express";
import { produtorController } from "../../controllers/comum/produtorController";

const router = Router();

// Rotas básicas
router.get("/", produtorController.findAll);
router.get("/busca", produtorController.buscarPorTermo);
router.get("/com-dap", produtorController.findComDAP);
router.get("/com-assistencia", produtorController.findComAssistencia);
router.get("/tipo/:tipo", produtorController.findByTipo);
router.get("/:id", produtorController.findById);
router.get("/:id/detalhes", produtorController.findWithDetails);
router.post("/", produtorController.create);
router.put("/:id", produtorController.update);
router.put("/:id/area-efetiva", produtorController.updateAreaEfetiva);
router.delete("/:id", produtorController.delete);

export default router;