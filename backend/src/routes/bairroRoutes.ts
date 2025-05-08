// src/routes/bairroRoutes.ts
import { Router } from "express";
import { bairroController } from "../controllers/bairroController";

const router = Router();

router.get("/bairros", bairroController.listar);
router.get("/bairros/:id", bairroController.buscarPorId);
router.post("/bairros", bairroController.criar);
router.put("/bairros/:id", bairroController.update);
router.patch("/bairros/:id/status", bairroController.status);
router.delete("/bairros/:id", bairroController.excluir);

export default router;
