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
import arrendamentosRoutes from "./agricultura/arrendamentoRoutes";
import transferenciaPropiedadeRoutes from "./comum/transferenciaPropiedadeRoutes";
import solicitacoesBeneficioRoutes from "./comum/solicitacoesBeneficioRoutes";
import ordemServicoRoutes from "./obras/ordemServicoRoutes";
import tipoServicoRoutes from "./obras/tipoServicoRoutes";
import areaRuralRoutes from "./comum/areaRuralRoutes";
import relatorioBeneficioRoutes from "./comum/relatorioBeneficioRoutes";
import relatorioArrendamentoRoutes from "./agricultura/relatorioArrendamentoRoutes";
import dashboardRoutes from "./comum/dashboardRoutes";
import dashboardPublicoRoutes from "./comum/dashboardPublicoRoutes";

// Importar middleware de autenticação
import {
  authenticateToken,
  requireModuleAccess,
} from "../middleware/authMiddleware";
import { ModuloSistema } from "@prisma/client";
import veiculoRoutes from "./comum/veiculoRoutes";
import saldoRoutes from "./comum/saldoRoutes";

const router = Router();

// AUTENTICAÇÃO (rotas públicas)
router.use("/auth", authRoutes);

// DASHBOARD PÚBLICO (sem autenticação - para prefeito/secretário)
router.use("/dashboard-publico", dashboardPublicoRoutes);

// MIDDLEWARE DE AUTENTICAÇÃO para todas as rotas abaixo
router.use(authenticateToken);

// ADMINISTRAÇÃO (requer acesso ao módulo ADMIN)
router.use(
  "/usuarios",
  requireModuleAccess(ModuloSistema.ADMIN),
  usuarioRoutes
);
router.use("/perfis", requireModuleAccess(ModuloSistema.ADMIN), perfilRoutes);

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
  "/transferencias-propriedade",
  requireModuleAccess(ModuloSistema.COMUM),
  transferenciaPropiedadeRoutes
);
router.use(
  "/solicitacoesBeneficio",
  requireModuleAccess(ModuloSistema.COMUM),
  solicitacoesBeneficioRoutes
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

router.use(
  "/areas-rurais",
  requireModuleAccess(ModuloSistema.COMUM),
  areaRuralRoutes
);

// AGRICULTURA (requer acesso ao módulo agricultura)
router.use(
  "/grupoProdutos",
  requireModuleAccess(ModuloSistema.AGRICULTURA),
  grupoProdutoRoutes
);

router.use(
  "/arrendamentos",
  requireModuleAccess(ModuloSistema.AGRICULTURA),
  arrendamentosRoutes
);

router.use(
  "/ordens-servico",
  requireModuleAccess(ModuloSistema.OBRAS),
  ordemServicoRoutes
);

router.use(
  "/tipos-servico",
  requireModuleAccess(ModuloSistema.OBRAS),
  tipoServicoRoutes
);

// RELATÓRIOS
router.use(
  "/relatorios/beneficios",
  requireModuleAccess(ModuloSistema.COMUM),
  relatorioBeneficioRoutes
);

router.use(
  "/relatorios/arrendamentos",
  requireModuleAccess(ModuloSistema.AGRICULTURA),
  relatorioArrendamentoRoutes
);

router.use(
  "/comum/saldo",
  requireModuleAccess(ModuloSistema.COMUM),
  saldoRoutes
);

// DASHBOARD EXECUTIVO (requer autenticação, sem restrição de módulo específico)
router.use("/dashboard", dashboardRoutes);

export default router;
