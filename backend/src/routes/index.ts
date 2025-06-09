// backend/src/routes/index.ts - ARQUIVO ATUALIZADO
import { Router } from "express";
import authRoutes from "./auth/authRoutes";
import usuarioRoutes from "./admin/usuarioRoutes";
import perfilRoutes from "./admin/perfilRoutes";
import bairroRoutes from "./comum/bairroRoutes";
import grupoProdutoRoutes from "./agricultura/grupoProdutoRoutes";
import programaRoutes from "./comum/programaRoutes";
import regrasNegocioRoutes from "./comum/regrasNegocioRoutes";
import tipoVeiculoRoutes from "./obras/tipoVeiculoRoutes";
import logradouroRoutes from "./comum/logradouroRoutes";
import pessoaRoutes from "./comum/pessoaRoutes";
import propriedadeRoutes from "./comum/propriedadeRoutes";
import enderecoRoutes from "./comum/enderecoRoutes";
import produtorRoutes from "./comum/produtorRoutes";

// Importar middleware de autenticação
import { authenticateToken, requireModuleAccess } from "../middleware/authMiddleware";
import { ModuloSistema } from "@prisma/client";

const router = Router();

// AUTENTICAÇÃO (rotas públicas)
router.use("/auth", authRoutes);

// MIDDLEWARE DE AUTENTICAÇÃO para todas as rotas abaixo
router.use(authenticateToken);

// ADMINISTRAÇÃO (requer acesso admin)
router.use("/usuarios", usuarioRoutes);
router.use("/perfis", perfilRoutes);

// COMUM (requer pelo menos acesso ao módulo comum)
router.use("/bairros", requireModuleAccess(ModuloSistema.COMUM), bairroRoutes);
router.use("/logradouros", requireModuleAccess(ModuloSistema.COMUM), logradouroRoutes);
router.use("/pessoas", requireModuleAccess(ModuloSistema.COMUM), pessoaRoutes);
router.use("/enderecos", requireModuleAccess(ModuloSistema.COMUM), enderecoRoutes);
router.use("/propriedades", requireModuleAccess(ModuloSistema.COMUM), propriedadeRoutes);

// AGRICULTURA (requer acesso ao módulo agricultura)
router.use("/grupoProdutos", requireModuleAccess(ModuloSistema.AGRICULTURA), grupoProdutoRoutes);
router.use("/programas", requireModuleAccess(ModuloSistema.AGRICULTURA), programaRoutes);
router.use("/regrasNegocio", requireModuleAccess(ModuloSistema.AGRICULTURA), regrasNegocioRoutes);
router.use("/produtores", requireModuleAccess(ModuloSistema.AGRICULTURA), produtorRoutes);

// OBRAS (requer acesso ao módulo obras)
router.use("/tipoVeiculos", requireModuleAccess(ModuloSistema.OBRAS), tipoVeiculoRoutes);

export default router;