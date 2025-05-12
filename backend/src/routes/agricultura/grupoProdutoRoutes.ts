import { Router } from "express";
import { grupoProdutoController } from "../../controllers/agricultura/grupoProdutoController";

const router = Router();

router.get("/", grupoProdutoController.findAll);
router.get("/:id", grupoProdutoController.findById);
router.post("/", grupoProdutoController.create);
router.put("/:id", grupoProdutoController.update);
router.patch("/:id/status", grupoProdutoController.status);
router.delete("/:id", grupoProdutoController.delete);

export default router;
