import type { VercelRequest, VercelResponse } from "@vercel/node";

import bot from "../src/bot";
import { syncCommands } from "../src/setup";

/**
 * One-off setup endpoint. Registers the Telegram webhook and publishes the
 * command menus. Call it after every deploy that changes commands:
 *
 *   GET https://<project>.vercel.app/api/setup?secret=<SETUP_SECRET>
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.SETUP_SECRET;
  if (!secret || req.query.secret !== secret) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const url = `https://${host}/api/telegram`;

  await bot.api.setWebhook(url, {
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    drop_pending_updates: true,
    allowed_updates: ["message", "callback_query", "my_chat_member"],
  });

  const adminCount = await syncCommands();
  const info = await bot.api.getWebhookInfo();

  return res.status(200).json({ ok: true, url, adminCount, webhook: info });
}
