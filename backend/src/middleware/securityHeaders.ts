// backend/src/middleware/securityHeaders.ts
import { Request, Response, NextFunction } from "express";

/**
 * Middleware para adicionar headers de segurança
 * Baseado no helmet.js, mas sem dependências extras
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // X-Content-Type-Options: Previne MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options: Proteção contra clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // X-XSS-Protection: Ativa proteção XSS do browser (legacy, mas ainda útil)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy: Controla informações de referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy: Controla features do browser
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content-Security-Policy: Em desenvolvimento, mais permissivo
  if (isDevelopment) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' http://localhost:* ws://localhost:*"
    );
  } else {
    // Em produção, mais restritivo
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self'"
    );
  }

  // Strict-Transport-Security: Força HTTPS (só em produção)
  if (!isDevelopment && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Remove header que expõe tecnologia do servidor
  res.removeHeader('X-Powered-By');

  next();
};
