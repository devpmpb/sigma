// backend/src/routes/auth/authRoutes.ts - ARQUIVO COMPLETO
import { Router } from "express";
import { authController } from "../../controllers/auth/authController";
import { authenticateToken } from "../../middleware/authMiddleware";

const router = Router();

// Rotas públicas
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);

// Rotas protegidas
router.post("/logout", authenticateToken, authController.logout);
router.get("/verify", authenticateToken, authController.verifyToken);

export default router;