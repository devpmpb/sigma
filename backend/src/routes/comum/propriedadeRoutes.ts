// src/routes/comum/propriedadeRoutes.ts - ARQUIVO ATUALIZADO
import { Router } from "express";
import { propriedadeController } from "../../controllers/comum/propriedadeController";

const router = Router();

// Rotas básicas
router.get("/", propriedadeController.findAll);
router.get("/busca", propriedadeController.buscarPorTermo); // Nova rota para busca
router.get("/:id", propriedadeController.findById);
router.get("/:id/detalhes", propriedadeController.findByIdWithDetails);
router.get(
  "/proprietario/:proprietarioId",
  propriedadeController.findByProprietario
);
router.get("/tipo/:tipo", propriedadeController.findByTipo);
router.post("/", propriedadeController.create);
router.put("/:id", propriedadeController.update);
router.delete("/:id", propriedadeController.delete);

export default router;
