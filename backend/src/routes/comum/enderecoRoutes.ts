// src/routes/comum/enderecoRoutes.ts
import { Router } from "express";
import { enderecoController } from "../../controllers/comum/enderecoController";

const router = Router();

// Rotas básicas
router.get("/", enderecoController.findAll);
router.get("/:id", enderecoController.findById);
router.get("/pessoa/:pessoaId", enderecoController.findByPessoa);
router.get("/propriedade/:propriedadeId", enderecoController.findByPropriedade);
router.post("/", enderecoController.create);
router.put("/:id", enderecoController.update);
router.patch("/:id/principal", enderecoController.setPrincipal);
router.delete("/:id", enderecoController.delete);

export default router;