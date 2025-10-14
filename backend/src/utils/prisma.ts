import { PrismaClient } from '@prisma/client';

// Singleton instance of PrismaClient
// This prevents multiple instances and connection pool exhaustion
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the instance
  // across hot reloads (prevents connection pool exhaustion during dev)
  const globalWithPrisma = global as typeof globalThis & {
    prisma: PrismaClient;
  };

  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = globalWithPrisma.prisma;
}

export default prisma;
