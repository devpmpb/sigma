// backend/src/middleware/rateLimitMiddleware.ts
import { Request, Response, NextFunction } from "express";

/**
 * Rate Limiting Simples e Eficiente
 *
 * Armazena em memória as tentativas por IP.
 * Em produção, considere usar Redis para ambientes com múltiplas instâncias.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Limpar registros antigos a cada 10 minutos
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 10 * 60 * 1000);

/**
 * Cria um middleware de rate limiting
 *
 * @param windowMs - Janela de tempo em milissegundos (padrão: 15 minutos)
 * @param max - Máximo de requisições permitidas na janela (padrão: 100)
 * @param message - Mensagem de erro customizada
 */
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
} = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    max = 100,
    message = "Muitas requisições deste IP, tente novamente mais tarde.",
    skipSuccessfulRequests = false
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Em desenvolvimento, não aplicar rate limiting
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${ip}`;
    const now = Date.now();

    // Inicializar ou resetar se expirou
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // Incrementar contador
    store[key].count++;

    // Verificar se excedeu o limite
    if (store[key].count > max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);

      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

      return res.status(429).json({
        error: message,
        retryAfter: `${retryAfter} segundos`
      });
    }

    // Adicionar headers informativos
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', (max - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    // Se configurado para pular requisições bem-sucedidas, decrementar no final
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400 && store[key]) {
          store[key].count = Math.max(0, store[key].count - 1);
        }
      });
    }

    next();
  };
};

/**
 * Rate limiter específico para login (mais restritivo)
 */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: "Muitas tentativas de login. Tente novamente em alguns minutos.",
  skipSuccessfulRequests: true // Só conta tentativas falhadas
});

/**
 * Rate limiter geral para API
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições
  message: "Muitas requisições. Tente novamente em alguns minutos."
});

/**
 * Rate limiter para criação de recursos (POST)
 */
export const createResourceRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 criações por minuto
  message: "Muitas tentativas de criação. Aguarde um momento."
});
