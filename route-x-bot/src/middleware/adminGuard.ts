import type { NextFunction } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

const superAdminIds = (process.env.SUPER_ADMIN_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean)
  .map(BigInt);

export function isSuperAdmin(telegramId: number | bigint): boolean {
  return superAdminIds.includes(BigInt(telegramId));
}

export async function isAdmin(
  telegramId: number | bigint,
  username?: string | null
): Promise<boolean> {
  if (isSuperAdmin(telegramId)) return true;

  const tid = BigInt(telegramId);
  const uname = username?.toLowerCase() ?? null;

  // Check User.isAdmin
  const user = await prisma.user.findUnique({
    where: { telegramId: tid },
    select: { isAdmin: true },
  });
  if (user?.isAdmin) return true;

  // Check AdminOverride by telegramId
  const overrideById = await prisma.adminOverride.findUnique({
    where: { telegramId: tid },
  });
  if (overrideById) return true;

  // Check AdminOverride by username
  if (uname) {
    const overrideByUsername = await prisma.adminOverride.findUnique({
      where: { username: uname },
    });
    if (overrideByUsername) return true;
  }

  return false;
}

/**
 * If this user is in AdminOverride, promote them (set User.isAdmin if registered,
 * enrich override with telegramId if missing).
 * Returns the telegramId if a promotion action was taken, null otherwise.
 */
export async function promotePendingAdmin(
  telegramId: number | bigint,
  username?: string | null
): Promise<bigint | null> {
  const tid = BigInt(telegramId);
  const uname = username?.toLowerCase() ?? null;

  // Find matching override entry
  const override =
    (await prisma.adminOverride.findUnique({ where: { telegramId: tid } })) ??
    (uname
      ? await prisma.adminOverride.findUnique({ where: { username: uname } })
      : null);

  if (!override) return null;

  // Update or create User record with isAdmin=true
  const user = await prisma.user.findUnique({ where: { telegramId: tid } });
  if (!user) {
    await prisma.user.create({
      data: { telegramId: tid, username: uname, isAdmin: true },
    });
  } else if (!user.isAdmin) {
    await prisma.user.update({
      where: { telegramId: tid },
      data: { isAdmin: true },
    });
  }

  // Enrich override with telegramId if it was username-only
  if (!override.telegramId) {
    await prisma.adminOverride.update({
      where: { id: override.id },
      data: { telegramId: tid },
    });
  }

  return tid;
}

export async function adminGuard(ctx: MyContext, next: NextFunction) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("⚠️ Не удалось определить пользователя.", { parse_mode: "HTML" });
    return;
  }
  const username = ctx.from?.username ?? null;
  if (await isAdmin(userId, username)) {
    return next();
  }
  await ctx.reply("🚫 У вас нет прав для выполнения этой команды.", { parse_mode: "HTML" });
}
