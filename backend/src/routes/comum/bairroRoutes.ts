import { Router } from "express";
import { bairroController } from "../../controllers/comum/bairroController";

const router = Router();

router.get("/", bairroController.findAll);
router.get("/:id", bairroController.findById);
router.post("/", bairroController.create);
router.put("/:id", bairroController.update);
router.patch("/:id/status", bairroController.status);
router.delete("/:id", bairroController.delete);

export default router;
