import { PrismaClient } from "@prisma/client";

// Fail loudly at startup if the required env var is missing.
// Better to crash immediately than to get cryptic P1001 errors mid-request.
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Copy .env.example to .env.local and fill in the values.");
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
