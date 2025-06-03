import { Router } from "express";
import { pessoaController } from "../../controllers/comum/pessoaController";

const router = Router();

// Rotas básicas
router.get("/", pessoaController.findAll);
router.get("/enderecos", pessoaController.findAllWithEnderecos);
router.get("/tipo/:tipo", pessoaController.findByTipo);
router.get("/:id", pessoaController.findById);
router.get("/:id/detalhes", pessoaController.findByIdWithDetails);
router.get("/cpfCnpj/:cpfCnpj", pessoaController.findByCpfCnpj);
router.patch("/:id/status", pessoaController.status);
router.post("/", pessoaController.create);
router.put("/:id", pessoaController.update);
router.delete("/:id", pessoaController.delete);

export default router;