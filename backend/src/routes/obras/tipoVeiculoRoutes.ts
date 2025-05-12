import { Router } from "express";
import { tipoVeiculoController } from "../../controllers/obras/tipoVeiculos";

const router = Router();

router.get("/", tipoVeiculoController.findAll);
router.get("/:id", tipoVeiculoController.findById);
router.post("/", tipoVeiculoController.create);
router.put("/:id", tipoVeiculoController.update);
router.patch("/:id/status", tipoVeiculoController.status);
router.delete("/:id", tipoVeiculoController.delete);

export default router;
