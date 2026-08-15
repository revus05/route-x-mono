import prisma from "./prisma";

/**
 * Temporary diagnostics: `bot.catch` swallows handler errors and still answers
 * 200 to Telegram, so failures are invisible from the outside. The last error
 * is parked in the key/value table and exposed via `/api/health`.
 *
 * Remove once the current issue is resolved.
 */
const LAST_ERROR_KEY = "__last_error";
const LAST_UPDATE_KEY = "__last_update";

export async function recordLastError(err: unknown): Promise<void> {
  const payload = JSON.stringify({
    at: new Date().toISOString(),
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack?.slice(0, 2000) : undefined,
  });

  try {
    await prisma.conversationState.upsert({
      where: { key: LAST_ERROR_KEY },
      create: { key: LAST_ERROR_KEY, data: payload },
      update: { data: payload },
    });
  } catch {
    // diagnostics must never break the bot
  }
}

/** Records that an update reached the function, and whether its secret matched. */
export async function recordLastUpdate(
  update: unknown,
  secretHeader: string | string[] | undefined
): Promise<void> {
  const u = (update ?? {}) as Record<string, unknown>;
  const payload = JSON.stringify({
    at: new Date().toISOString(),
    updateId: u.update_id ?? null,
    kinds: Object.keys(u).filter((k) => k !== "update_id"),
    secretHeaderPresent: Boolean(secretHeader),
    secretMatches: secretHeader === process.env.TELEGRAM_WEBHOOK_SECRET,
  });

  try {
    await prisma.conversationState.upsert({
      where: { key: LAST_UPDATE_KEY },
      create: { key: LAST_UPDATE_KEY, data: payload },
      update: { data: payload },
    });
  } catch {
    // diagnostics must never break the bot
  }
}

async function readKey(key: string): Promise<unknown> {
  try {
    const row = await prisma.conversationState.findUnique({ where: { key } });
    return row ? JSON.parse(row.data) : null;
  } catch (err) {
    return `unreadable: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export const readLastError = () => readKey(LAST_ERROR_KEY);
export const readLastUpdate = () => readKey(LAST_UPDATE_KEY);
