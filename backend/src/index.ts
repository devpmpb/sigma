import express, { Request, Response } from "express";
import routes from "./routes";
import cors from "cors";
import { validateEnv } from "./utils/validateEnv";
import { securityHeaders } from "./middleware/securityHeaders";
import { apiRateLimiter } from "./middleware/rateLimitMiddleware";

// Validar variáveis de ambiente ANTES de inicializar a aplicação
validateEnv();

const app = express();
const port = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV === 'development';

// Headers de segurança (sempre ativo, ajustado por ambiente)
app.use(securityHeaders);

// Configuração de JSON
app.use(express.json());

// CORS - Configuração inteligente por ambiente
const corsOptions = {
  origin: isDevelopment
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'] // Dev: Vite e React
    : process.env.FRONTEND_URL || 'http://localhost:3000', // Prod: URL da prefeitura
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting geral (só em produção)
app.use("/api", apiRateLimiter);

// Rotas
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
