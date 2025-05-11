import { Router } from "express";
import bairroRoutes from "./obras/bairroRoutes";
import grupoProdutoRoutes from "./agricultura/grupoProdutoRoutes"

// Importe outras rotas de entidades aqui
// import usuarioRoutes from "./usuarioRoutes";
// import empresaRoutes from "./empresaRoutes";
// etc.

const router = Router();

// Aplica os roteadores específicos, cada um com seu prefixo
router.use("/bairros", bairroRoutes);
router.use("/grupoProdutos", grupoProdutoRoutes)
// router.use("/usuarios", usuarioRoutes);
// router.use("/empresas", empresaRoutes);
// etc.

export default router;