import type { VercelRequest, VercelResponse } from "@vercel/node";

import { readLastError, readLastUpdate } from "../src/debug";

/**
 * Diagnostics. Reports which env vars are visible to the function, which commit
 * is deployed, whether the bot module and the conversation store are usable,
 * and what the last incoming update / swallowed error looked like.
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

  const deployment = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    env: process.env.VERCEL_ENV ?? null,
    node: process.version,
  };

  const describe = (err: unknown) =>
    err instanceof Error ? `${err.name}: ${err.message.slice(0, 300)}` : String(err);

  let botModule = "ok";
  try {
    await import("../src/bot");
  } catch (err) {
    botModule = describe(err);
  }

  // Exercises the exact query the conversations plugin runs on every update
  let database = "ok";
  try {
    const { default: prisma } = await import("../src/prisma");
    await prisma.conversationState.findUnique({ where: { key: "__health" } });
  } catch (err) {
    database = describe(err);
  }

  return res.status(200).json({
    deployment,
    env,
    botModule,
    database,
    lastUpdate: await readLastUpdate(),
    lastError: await readLastError(),
  });
}
