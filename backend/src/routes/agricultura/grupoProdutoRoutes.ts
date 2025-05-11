// src/routes/bairroRoutes.ts
import { Router } from "express";
import { grupoProdutoController } from "../../controllers/agricultura/grupoProdutoController";

const router = Router();

router.get("/", grupoProdutoController.listar);
router.get("/grupoProdutos/:id", grupoProdutoController.buscarPorId);
router.post("/grupoProdutos", grupoProdutoController.criar);
router.put("/grupoProdutos/:id", grupoProdutoController.update);
router.patch("/grupoProdutos/:id/status", grupoProdutoController.status);
router.delete("/grupoProdutos/:id", grupoProdutoController.excluir);

export default router;
