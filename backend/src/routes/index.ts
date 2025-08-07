import { Router } from "express";
import authRoutes from "./auth/authRoutes";
import usuarioRoutes from "./admin/usuarioRoutes";
import perfilRoutes from "./admin/perfilRoutes";
import bairroRoutes from "./comum/bairroRoutes";
import grupoProdutoRoutes from "./agricultura/grupoProdutoRoutes";
import programaRoutes from "./comum/programaRoutes";
import regrasNegocioRoutes from "./comum/regrasNegocioRoutes";
import tipoVeiculoRoutes from "./comum/tipoVeiculoRoutes";
import logradouroRoutes from "./comum/logradouroRoutes";
import pessoaRoutes from "./comum/pessoaRoutes";
import propriedadeRoutes from "./comum/propriedadeRoutes";
import enderecoRoutes from "./comum/enderecoRoutes";
import produtorRoutes from "./comum/produtorRoutes";
import arrendamentosRoutes from "./agricultura/arrendamentoRoutes";
import transferenciaPropiedadeRoutes from "./comum/transferenciaPropiedadeRoutes";
import solicitacoesBeneficioRoutes from "./comum/solicitacoesBeneficioRoutes";

// Importar middleware de autenticação
import {
  authenticateToken,
  requireModuleAccess,
} from "../middleware/authMiddleware";
import { ModuloSistema } from "@prisma/client";
import veiculoRoutes from "./comum/veiculoRoutes";

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
router.use(
  "/logradouros",
  requireModuleAccess(ModuloSistema.COMUM),
  logradouroRoutes
);
router.use("/pessoas", requireModuleAccess(ModuloSistema.COMUM), pessoaRoutes);
router.use(
  "/enderecos",
  requireModuleAccess(ModuloSistema.COMUM),
  enderecoRoutes
);
router.use(
  "/propriedades",
  requireModuleAccess(ModuloSistema.COMUM),
  propriedadeRoutes
);
router.use(
  "/programas",
  requireModuleAccess(ModuloSistema.COMUM),
  programaRoutes
);
router.use(
  "/regrasNegocio",
  requireModuleAccess(ModuloSistema.COMUM),
  regrasNegocioRoutes
);
router.use(
  "/comum/transferencias-propriedade",
  requireModuleAccess(ModuloSistema.COMUM),
  transferenciaPropiedadeRoutes
);
router.use(
  "/solicitacoesBeneficio",
  requireModuleAccess(ModuloSistema.COMUM),
  solicitacoesBeneficioRoutes
);

// AGRICULTURA (requer acesso ao módulo agricultura)
router.use(
  "/grupoProdutos",
  requireModuleAccess(ModuloSistema.AGRICULTURA),
  grupoProdutoRoutes
);
router.use(
  "/produtores",
  requireModuleAccess(ModuloSistema.AGRICULTURA),
  produtorRoutes
);
router.use(
  "/arrendamentos",
  requireModuleAccess(ModuloSistema.AGRICULTURA),
  arrendamentosRoutes
);

router.use(
  "/tipoVeiculos",
  requireModuleAccess(ModuloSistema.COMUM),
  tipoVeiculoRoutes
);
router.use(
  "/veiculos",
  requireModuleAccess(ModuloSistema.COMUM),
  veiculoRoutes
);

export default router;
