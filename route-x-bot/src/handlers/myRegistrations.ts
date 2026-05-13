import type { CallbackQueryContext, CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

export async function handleMyRegistrations(ctx: CommandContext<MyContext>) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const registrations = await prisma.eventRegistration.findMany({
    where: { telegramId: BigInt(telegramId) },
    include: { event: true },
    orderBy: { event: { date: "desc" } },
  });

  if (registrations.length === 0) {
    await ctx.reply(
      "ℹ️ Вы ещё не зарегистрированы ни на одно мероприятие.\n\nИспользуйте /register для регистрации.",
      { parse_mode: "HTML" }
    );
    return;
  }

  const lines: string[] = [];
  const kb = new InlineKeyboard();

  for (const reg of registrations) {
    const dateStr = reg.event.date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    lines.push(
      `🏁 <b>${reg.event.name}</b> — ${dateStr}\n` +
        `   🏷️ <code>${reg.rxNumber}</code>  🚗 ${reg.car}  ⚙️ ${reg.driveType}`
    );
    kb.text(`🗑 Отменить: ${reg.event.name}`, `cancel_reg:${reg.id}`).row();
  }

  await ctx.reply(
    `📋 <b>Ваши регистрации</b>\n\n${lines.join("\n\n")}\n\n<i>Нажмите кнопку ниже, чтобы отменить регистрацию на мероприятие.</i>`,
    { reply_markup: kb, parse_mode: "HTML" }
  );
}

export async function handleCancelRegistration(ctx: CallbackQueryContext<MyContext>) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.answerCallbackQuery();
    return;
  }

  const regId = parseInt(ctx.callbackQuery.data.split(":")[1], 10);

  const reg = await prisma.eventRegistration.findUnique({
    where: { id: regId },
    include: { event: true },
  });

  if (!reg || reg.telegramId !== BigInt(telegramId)) {
    await ctx.answerCallbackQuery("Регистрация не найдена.");
    return;
  }

  const dateStr = reg.event.date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const kb = new InlineKeyboard()
    .text("✅ Да, отменить", `cancel_reg_confirm:${regId}`)
    .text("❌ Нет", "cancel_reg_abort");

  await ctx.reply(
    `⚠️ <b>Отменить регистрацию?</b>\n\n` +
      `🏁 <b>${reg.event.name}</b> — ${dateStr}\n` +
      `🏷️ RX-номер: <code>${reg.rxNumber}</code>`,
    { reply_markup: kb, parse_mode: "HTML" }
  );
  await ctx.answerCallbackQuery();
}

export async function handleCancelRegistrationConfirm(ctx: CallbackQueryContext<MyContext>) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.answerCallbackQuery();
    return;
  }

  const regId = parseInt(ctx.callbackQuery.data.split(":")[1], 10);

  const reg = await prisma.eventRegistration.findUnique({
    where: { id: regId },
    include: { event: true },
  });

  if (!reg || reg.telegramId !== BigInt(telegramId)) {
    await ctx.answerCallbackQuery("Регистрация не найдена.");
    return;
  }

  await prisma.eventRegistration.delete({ where: { id: regId } });

  await ctx.editMessageText(
    `✅ <b>Регистрация на «${reg.event.name}» отменена.</b>`,
    { parse_mode: "HTML" }
  );
  await ctx.answerCallbackQuery();
}

export async function handleCancelRegistrationAbort(ctx: CallbackQueryContext<MyContext>) {
  await ctx.editMessageText("❌ Отмена регистрации отклонена.", { parse_mode: "HTML" });
  await ctx.answerCallbackQuery();
}
