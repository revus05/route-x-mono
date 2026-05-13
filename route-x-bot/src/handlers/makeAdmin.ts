import type { CommandContext } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";
import { isSuperAdmin } from "../middleware/adminGuard";
import { setAdminCommandsForUser } from "../commands";

export async function handleMakeAdmin(ctx: CommandContext<MyContext>) {
  const callerId = ctx.from?.id;
  if (!callerId) return;

  if (!isSuperAdmin(callerId)) {
    await ctx.reply("🚫 У вас нет прав для выполнения этой команды.", { parse_mode: "HTML" });
    return;
  }

  const args = ctx.match?.trim();
  if (!args) {
    await ctx.reply(
      "ℹ️ <b>Использование:</b>\n" +
        "/makeadmin <code>@username</code> — по юзернейму\n" +
        "/makeadmin <code>123456789</code> — по Telegram ID\n\n" +
        "<i>Работает даже если пользователь ещё не регистрировался в боте.</i>",
      { parse_mode: "HTML" }
    );
    return;
  }

  if (args.startsWith("@")) return grantByUsername(ctx, args.slice(1));

  try {
    const telegramId = BigInt(args);
    return grantByTelegramId(ctx, telegramId);
  } catch {
    await ctx.reply(
      "⚠️ Не удалось распознать аргумент. Используйте <code>@username</code>, <code>rx555</code> или числовой Telegram ID.",
      { parse_mode: "HTML" }
    );
  }
}

async function grantByTelegramId(ctx: CommandContext<MyContext>, telegramId: bigint) {
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (user) {
    if (user.isAdmin) {
      await ctx.reply(
        `ℹ️ Пользователь <code>${telegramId}</code> уже является администратором.`,
        { parse_mode: "HTML" }
      );
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
    await setAdminCommandsForUser(ctx.api, Number(telegramId));
    await ctx.reply(
      `✅ Telegram ID <code>${telegramId}</code> назначен администратором.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // Not in User table — add to AdminOverride
  await prisma.adminOverride.upsert({
    where: { telegramId },
    create: { telegramId },
    update: {},
  });
  await setAdminCommandsForUser(ctx.api, Number(telegramId));
  await ctx.reply(
    `✅ Telegram ID <code>${telegramId}</code> добавлен в список администраторов.\n\n` +
      "<i>Права вступят в силу немедленно.</i>",
    { parse_mode: "HTML" }
  );
}

async function grantByUsername(ctx: CommandContext<MyContext>, rawUsername: string) {
  const username = rawUsername.toLowerCase();

  // 1. Already in User table
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    if (existingUser.isAdmin) {
      await ctx.reply(
        `ℹ️ <b>@${username}</b> уже является администратором.`,
        { parse_mode: "HTML" }
      );
      return;
    }
    await prisma.user.update({ where: { id: existingUser.id }, data: { isAdmin: true } });
    await setAdminCommandsForUser(ctx.api, Number(existingUser.telegramId));
    await ctx.reply(
      `✅ <b>@${username}</b> назначен администратором.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // 2. Try to resolve username → Telegram ID via Bot API
  let resolvedId: bigint | null = null;
  try {
    const chat = await ctx.api.getChat(`@${username}`);
    if ("id" in chat) resolvedId = BigInt(chat.id);
  } catch {
    // Expected for private/unknown users
  }

  if (resolvedId) {
    const userById = await prisma.user.findUnique({ where: { telegramId: resolvedId } });
    if (userById) {
      if (userById.isAdmin) {
        await ctx.reply(
          `ℹ️ <b>@${username}</b> уже является администратором.`,
          { parse_mode: "HTML" }
        );
        return;
      }
      await prisma.user.update({ where: { id: userById.id }, data: { isAdmin: true } });
      await setAdminCommandsForUser(ctx.api, Number(resolvedId));
      await ctx.reply(
        `✅ <b>@${username}</b> назначен администратором.\n` +
          `<i>Telegram ID: <code>${resolvedId}</code></i>`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Not registered — save to AdminOverride with both ID and username
    await prisma.adminOverride.upsert({
      where: { telegramId: resolvedId },
      create: { telegramId: resolvedId, username },
      update: { username },
    });
    await setAdminCommandsForUser(ctx.api, Number(resolvedId));
    await ctx.reply(
      `✅ <b>@${username}</b> добавлен в список администраторов.\n` +
        `🔍 Telegram ID: <code>${resolvedId}</code>\n\n` +
        "<i>После /register флаг будет перенесён на аккаунт.</i>",
      { parse_mode: "HTML" }
    );
    return;
  }

  // 3. Username-only (commands will be set on first interaction via promote middleware)
  await prisma.adminOverride.upsert({
    where: { username },
    create: { username },
    update: {},
  });
  await ctx.reply(
    `✅ <b>@${username}</b> добавлен в список администраторов.\n\n` +
      "⚠️ <i>Telegram ID не удалось получить (профиль не публичный). " +
      "Команды администратора появятся при первом сообщении от этого пользователя боту.</i>",
    { parse_mode: "HTML" }
  );
}
