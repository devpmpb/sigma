// src/routes/index.ts
import { Router } from "express";
import bairroRoutes from "./comum/bairroRoutes";
import grupoProdutoRoutes from "./agricultura/grupoProdutoRoutes";
import tipoVeiculoRoutes from "./obras/tipoVeiculoRoutes";
import logradouroRoutes from "./comum/logradouroRoutes";
import pessoaRoutes from "./comum/pessoaRoutes";
import propriedadeRoutes from "./comum/propriedadeRoutes";
import enderecoRoutes from "./comum/enderecoRoutes";

const router = Router();

// COMUM
router.use("/bairros", bairroRoutes);
router.use("/logradouros", logradouroRoutes);
router.use("/pessoas", pessoaRoutes);
router.use("/enderecos", enderecoRoutes);
router.use("/propriedades", propriedadeRoutes);

// AGRICULTURA
router.use("/grupoProdutos", grupoProdutoRoutes);

// OBRAS
router.use("/tipoVeiculos", tipoVeiculoRoutes);

/* 
Para implementação futura:
- Produtor
- Arrendamento
- AreaEfetiva
- SolicitacaoBeneficio
- Programa
- RegrasNegocio
*/

export default router;