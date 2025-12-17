/**
 * Rotas Públicas do Dashboard (sem autenticação)
 * Para acesso do prefeito/secretário via PWA
 */

import { Router } from "express";
import { dashboardPublicoController } from "../../controllers/comum/dashboardPublicoController";

const router = Router();

// Rotas PÚBLICAS - Não requerem autenticação

// GET /api/dashboard-publico/resumo - Resumo completo com filtros
router.get("/resumo", dashboardPublicoController.resumoCompleto);

// GET /api/dashboard-publico/programas - Lista de programas para filtro
router.get("/programas", dashboardPublicoController.listarProgramas);

// GET /api/dashboard-publico/produtores - Busca de produtores para filtro
router.get("/produtores", dashboardPublicoController.buscarProdutores);

// GET /api/dashboard-publico/anos - Anos disponíveis para filtro
router.get("/anos", dashboardPublicoController.listarAnos);

export default router;
