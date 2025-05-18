import { Router } from "express";
import { pessoaController } from "../../controllers/comum/pessoaController";

const router = Router();

// Rotas básicas
router.get("/", pessoaController.findAll);
router.get("/completo", pessoaController.findAllWithEnderecos);
router.get("/:id", pessoaController.findById);
router.get("/:id/detalhes", pessoaController.findByIdWithDetails);
router.get("/cpfCnpj/:cpfCnpj", pessoaController.findByCpfCnpj);
router.post("/", pessoaController.create);
router.put("/:id", pessoaController.update);
router.delete("/:id", pessoaController.delete);

export default router;