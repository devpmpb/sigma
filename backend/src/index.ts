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
    ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Em desenvolvimento, permitir localhost e IPs de rede local (192.168.x.x, 10.x.x.x, etc)
        const allowedPatterns = [
          /^http:\/\/localhost(:\d+)?$/,
          /^http:\/\/127\.0\.0\.1(:\d+)?$/,
          /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
          /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
          /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/,
        ];

        // Permitir requisições sem origin (ex: curl, Postman)
        if (!origin) {
          return callback(null, true);
        }

        const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn(`CORS: Origin não permitido: ${origin}`);
          callback(null, true); // Em dev, permitir mesmo assim para debug
        }
      }
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
