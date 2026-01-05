// backend/src/routes/auth/authRoutes.ts - ARQUIVO COMPLETO
import { Router } from "express";
import { authController } from "../../controllers/auth/authController";
import { authenticateToken } from "../../middleware/authMiddleware";
import { loginRateLimiter, refreshTokenRateLimiter } from "../../middleware/rateLimitMiddleware";

const router = Router();

// Rotas públicas (com rate limiting em produção)
router.post("/login", loginRateLimiter, authController.login);
router.post("/refresh", refreshTokenRateLimiter, authController.refreshToken);

// Rotas protegidas
router.post("/logout", authenticateToken, authController.logout);
router.get("/verify", authenticateToken, authController.verifyToken);

export default router;