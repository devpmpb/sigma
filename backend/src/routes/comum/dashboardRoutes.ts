/**
 * Rotas do Dashboard Executivo
 */

import { Router } from "express";
import { dashboardController } from "../../controllers/comum/dashboardController";
import { authenticateToken } from "../../middleware/authMiddleware";

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// GET /api/dashboard/estatisticas-gerais
router.get("/estatisticas-gerais", dashboardController.estatisticasGerais);

// GET /api/dashboard/por-programa
router.get("/por-programa", dashboardController.porPrograma);

// GET /api/dashboard/por-periodo
router.get("/por-periodo", dashboardController.porPeriodo);

// GET /api/dashboard/top-produtores
router.get("/top-produtores", dashboardController.topProdutores);

// GET /api/dashboard/resumo-completo (todos os dados em uma chamada)
router.get("/resumo-completo", dashboardController.resumoCompleto);

// GET /api/dashboard/anos - Anos disponíveis para filtro
router.get("/anos", dashboardController.listarAnos);

export default router;
