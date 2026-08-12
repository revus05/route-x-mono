import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Diagnostics. Reports which env vars are visible to the function and whether
 * the bot module and Prisma client can be loaded at all.
 *
 *   GET /api/health
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const env = {
    BOT_TOKEN: Boolean(process.env.BOT_TOKEN),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DATABASE_URL_UNPOOLED: Boolean(process.env.DATABASE_URL_UNPOOLED),
    TELEGRAM_WEBHOOK_SECRET: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
    SETUP_SECRET: Boolean(process.env.SETUP_SECRET),
    SUPER_ADMIN_IDS: Boolean(process.env.SUPER_ADMIN_IDS),
  };

  const describe = (err: unknown) =>
    err instanceof Error ? `${err.name}: ${err.message.slice(0, 300)}` : String(err);

  let botModule = "ok";
  try {
    await import("../src/bot");
  } catch (err) {
    botModule = describe(err);
  }

  let database = "ok";
  try {
    const { default: prisma } = await import("../src/prisma");
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    database = describe(err);
  }

  return res.status(200).json({
    node: process.version,
    env,
    botModule,
    database,
  });
}
