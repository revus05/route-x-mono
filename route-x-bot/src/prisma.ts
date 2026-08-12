import { PrismaClient } from "@prisma/client";

// Reuse the client across serverless invocations that hit a warm instance,
// otherwise every request would open a new pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = prisma;

export default prisma;
