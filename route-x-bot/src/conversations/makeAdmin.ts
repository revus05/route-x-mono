import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../types";
import prisma from "../prisma";
import { setAdminCommandsForUser } from "../commands";

type MyConversation = Conversation<MyContext, MyContext>;

export async function makeAdminConversation(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply(
    "👤 <b>Назначение администратора</b>\n\nВведите <code>@username</code> или числовой Telegram ID:\n\n<i>Для отмены введите /exit</i>",
    { parse_mode: "HTML" }
  );

  const msg = await conversation.waitFor("message:text");
  const input = msg.message.text.trim();

  if (input === "/exit") {
    await ctx.reply("❌ Отменено.");
    return;
  }

  if (input.startsWith("@")) {
    await grantByUsername(ctx, conversation, input.slice(1));
    return;
  }

  try {
    const telegramId = BigInt(input);
    await grantByTelegramId(ctx, conversation, telegramId);
  } catch {
    await ctx.reply(
      "⚠️ Не удалось распознать ввод. Используйте <code>@username</code> или числовой Telegram ID.",
      { parse_mode: "HTML" }
    );
  }
}

async function grantByTelegramId(ctx: MyContext, conversation: MyConversation, telegramId: bigint) {
  const user = await conversation.external(() =>
    prisma.user.findUnique({ where: { telegramId } })
  );

  if (user) {
    if (user.isAdmin) {
      await ctx.reply(
        `ℹ️ Пользователь <code>${telegramId}</code> уже является администратором.`,
        { parse_mode: "HTML" }
      );
      return;
    }
    await conversation.external(() =>
      prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } })
    );
    await setAdminCommandsForUser(ctx.api, Number(telegramId));
    await ctx.reply(
      `✅ Telegram ID <code>${telegramId}</code> назначен администратором.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  await conversation.external(() =>
    prisma.adminOverride.upsert({
      where: { telegramId },
      create: { telegramId },
      update: {},
    })
  );
  await setAdminCommandsForUser(ctx.api, Number(telegramId));
  await ctx.reply(
    `✅ Telegram ID <code>${telegramId}</code> добавлен в список администраторов.\n\n` +
      "<i>Права вступят в силу немедленно.</i>",
    { parse_mode: "HTML" }
  );
}

async function grantByUsername(ctx: MyContext, conversation: MyConversation, rawUsername: string) {
  const username = rawUsername.toLowerCase();

  const existingUser = await conversation.external(() =>
    prisma.user.findUnique({ where: { username } })
  );
  if (existingUser) {
    if (existingUser.isAdmin) {
      await ctx.reply(
        `ℹ️ <b>@${username}</b> уже является администратором.`,
        { parse_mode: "HTML" }
      );
      return;
    }
    await conversation.external(() =>
      prisma.user.update({ where: { id: existingUser.id }, data: { isAdmin: true } })
    );
    await setAdminCommandsForUser(ctx.api, Number(existingUser.telegramId));
    await ctx.reply(
      `✅ <b>@${username}</b> назначен администратором.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  let resolvedId: bigint | null = null;
  try {
    const chat = await ctx.api.getChat(`@${username}`);
    if ("id" in chat) resolvedId = BigInt(chat.id);
  } catch {
    // Expected for private/unknown users
  }

  if (resolvedId) {
    const userById = await conversation.external(() =>
      prisma.user.findUnique({ where: { telegramId: resolvedId! } })
    );
    if (userById) {
      if (userById.isAdmin) {
        await ctx.reply(
          `ℹ️ <b>@${username}</b> уже является администратором.`,
          { parse_mode: "HTML" }
        );
        return;
      }
      await conversation.external(() =>
        prisma.user.update({ where: { id: userById.id }, data: { isAdmin: true } })
      );
      await setAdminCommandsForUser(ctx.api, Number(resolvedId));
      await ctx.reply(
        `✅ <b>@${username}</b> назначен администратором.\n` +
          `<i>Telegram ID: <code>${resolvedId}</code></i>`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const existingOverride = await conversation.external(() =>
      prisma.adminOverride.findFirst({
        where: { OR: [{ telegramId: resolvedId! }, { username }] },
      })
    );
    if (existingOverride) {
      if (!existingOverride.telegramId) {
        await conversation.external(() =>
          prisma.adminOverride.update({
            where: { id: existingOverride.id },
            data: { telegramId: resolvedId! },
          })
        );
      }
      await ctx.reply(
        `ℹ️ <b>@${username}</b> уже является администратором.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    await conversation.external(() =>
      prisma.adminOverride.create({
        data: { telegramId: resolvedId!, username },
      })
    );
    await setAdminCommandsForUser(ctx.api, Number(resolvedId));
    await ctx.reply(
      `✅ <b>@${username}</b> добавлен в список администраторов.\n` +
        `🔍 Telegram ID: <code>${resolvedId}</code>\n\n` +
        "<i>После /register флаг будет перенесён на аккаунт.</i>",
      { parse_mode: "HTML" }
    );
    return;
  }

  const existingOverrideByUsername = await conversation.external(() =>
    prisma.adminOverride.findUnique({ where: { username } })
  );
  if (existingOverrideByUsername) {
    await ctx.reply(
      `ℹ️ <b>@${username}</b> уже является администратором.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  await conversation.external(() =>
    prisma.adminOverride.create({ data: { username } })
  );
  await ctx.reply(
    `✅ <b>@${username}</b> добавлен в список администраторов.\n\n` +
      "⚠️ <i>Telegram ID не удалось получить (профиль не публичный). " +
      "Команды администратора появятся при первом сообщении от этого пользователя боту.</i>",
    { parse_mode: "HTML" }
  );
}
