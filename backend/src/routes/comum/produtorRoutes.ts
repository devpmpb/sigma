// backend/src/routes/agricultura/produtorRoutes.ts
import { Router } from "express";
import { produtorController } from "../../controllers/comum/produtorController";

const router = Router();

// Rotas básicas
router.get("/", produtorController.findAll);
router.get("/busca", produtorController.buscarPorTermo); // Busca por termo
router.get("/com-dap", produtorController.findComDAP); // Produtores com DAP
router.get("/com-assistencia", produtorController.findComAssistencia); // Produtores com assistência
router.get("/tipo/:tipo", produtorController.findByTipo); // Buscar por tipo
router.get("/:id", produtorController.findById);
router.get("/:id/detalhes", produtorController.findWithDetails); // Buscar com detalhes completos
router.post("/", produtorController.create);
router.put("/:id", produtorController.update);
router.put("/:id/area-efetiva", produtorController.updateAreaEfetiva); // Atualizar apenas área efetiva
router.delete("/:id", produtorController.delete);

export default router;