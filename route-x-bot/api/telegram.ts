import { webhookCallback } from "grammy";

import bot from "../src/bot";

export const config = {
  maxDuration: 60,
};

// Telegram -> POST /api/telegram
export default webhookCallback(bot, "next-js", {
  secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
  timeoutMilliseconds: 55_000,
  onTimeout: "return",
});
