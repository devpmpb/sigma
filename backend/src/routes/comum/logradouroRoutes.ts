// src/routes/bairroRoutes.ts
import { Router } from "express";
import { logradouroController } from "../../controllers/comum/logradouroController";

const router = Router();

router.get("/", logradouroController.findAll);
router.get("/:id", logradouroController.findById);
router.post("/", logradouroController.create);
router.put("/:id", logradouroController.update);
router.patch("/:id/status", logradouroController.status);
router.delete("/:id", logradouroController.delete);

export default router;
