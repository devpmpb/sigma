import { Router } from "express";
import { saldoController } from "../../controllers/comum/saldoController";
import { requirePermission } from "../../middleware/authMiddleware";
import { AcaoPermissao, ModuloSistema } from "@prisma/client";

const router = Router();

// Todas as rotas requerem autenticação

// Rotas de saldo
router.get(
  "/pessoa/:pessoaId",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  saldoController.getSaldosPorPessoa
);
router.get(
  "/:pessoaId/:programaId",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  saldoController.getSaldo
);
router.get(
  "/:pessoaId/:programaId/rapido",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  saldoController.getSaldoRapido
);
router.post(
  "/verificar",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  saldoController.verificarQuantidade
);

export default router;
