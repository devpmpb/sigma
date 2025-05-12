import { Router } from "express";
import bairroRoutes from "./comum/bairroRoutes";
import grupoProdutoRoutes from "./agricultura/grupoProdutoRoutes";
import tipoVeiculoRoutes from "./obras/tipoVeiculoRoutes";
import logradouroRoutes from "./comum/logradouroRoutes";

const router = Router();

// COMUM
router.use("/bairros", bairroRoutes);
router.use("/logradouros", logradouroRoutes);

// AGRICULTURA
router.use("/grupoProdutos", grupoProdutoRoutes);

// OBRAS
router.use("/tipoVeiculos", tipoVeiculoRoutes);

export default router;
