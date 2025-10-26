// src/routes/comum/propriedadeRoutes.ts - ARQUIVO ATUALIZADO
import { Router } from "express";
import { propriedadeController } from "../../controllers/comum/propriedadeController";
import { ModuloSistema, AcaoPermissao } from "@prisma/client";
import { requirePermission } from "../../middleware/authMiddleware";
import propriedadeCondominoRoutes from "./propriedadeCondominoRoutes";

const router = Router();

router.use("/", propriedadeCondominoRoutes);

// Rotas básicas
router.get(
  "/",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  propriedadeController.findAll
);
router.get(
  "/busca",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  propriedadeController.buscarPorTermo
); // Nova rota para busca
router.get(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  propriedadeController.findById
);
router.get(
  "/:id/detalhes",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  propriedadeController.findByIdWithDetails
);
router.get(
  "/proprietario/:proprietarioId",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  propriedadeController.findByProprietario
);
router.get(
  "/tipo/:tipo",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW),
  propriedadeController.findByTipo
);
router.get("/situacao/:situacao", requirePermission(ModuloSistema.COMUM, AcaoPermissao.VIEW), propriedadeController.findBySituacao);
router.post(
  "/",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.CREATE),
  propriedadeController.create
);
router.put(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.EDIT),
  propriedadeController.update
);
router.delete(
  "/:id",
  requirePermission(ModuloSistema.COMUM, AcaoPermissao.DELETE),
  propriedadeController.delete
);

export default router;
