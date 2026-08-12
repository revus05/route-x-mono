import { PrismaClient } from "@prisma/client";

/**
 * Neon's pooled endpoint runs PgBouncer in transaction mode, where prepared
 * statements are shared across clients. Without `pgbouncer=true` Prisma caches
 * query plans that break after any schema change:
 * `cached plan must not change result type`.
 *
 * `connection_limit=1` keeps every serverless instance to a single connection.
 */
function poolerSafeUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;

  try {
    const url = new URL(raw);
    if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
    if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
    return url.toString();
  } catch {
    return raw;
  }
}

// Reuse the client across serverless invocations that hit a warm instance,
// otherwise every request would open a new pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: poolerSafeUrl() });

globalForPrisma.prisma = prisma;

export default prisma;
