import type { VercelRequest, VercelResponse } from "@vercel/node";
import { webhookCallback } from "grammy";

import bot from "../src/bot";
import { recordLastUpdate } from "../src/debug";

export const config = {
  maxDuration: 60,
};

const handleUpdate = webhookCallback(bot, "next-js", {
  secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
  timeoutMilliseconds: 55_000,
  onTimeout: "return",
});

// Telegram -> POST /api/telegram
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await recordLastUpdate(req.body, req.headers["x-telegram-bot-api-secret-token"]);
  return handleUpdate(req, res);
}
