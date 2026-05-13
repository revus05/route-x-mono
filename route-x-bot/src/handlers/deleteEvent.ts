import type { CallbackQueryContext, CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

export async function handleDeleteEvent(ctx: CommandContext<MyContext>) {
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    take: 20,
    include: {
      _count: { select: { registrations: true, results: true } },
    },
  });

  if (events.length === 0) {
    await ctx.reply("ℹ️ Мероприятий нет.", { parse_mode: "HTML" });
    return;
  }

  const kb = new InlineKeyboard();
  for (const event of events) {
    const dateStr = event.date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const info = `(${event._count.registrations} уч., ${event._count.results} рез.)`;
    kb.text(`🗑 ${event.name} — ${dateStr} ${info}`, `del_event:${event.id}`).row();
  }

  await ctx.reply("🗑 <b>Удаление мероприятия</b>\n\nВыберите мероприятие для удаления:", {
    reply_markup: kb,
    parse_mode: "HTML",
  });
}

export async function handleDeleteEventSelect(ctx: CallbackQueryContext<MyContext>) {
  const eventId = parseInt(ctx.callbackQuery.data.split(":")[1], 10);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { registrations: true, results: true } } },
  });

  if (!event) {
    await ctx.answerCallbackQuery("Мероприятие не найдено.");
    return;
  }

  const dateStr = event.date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const kb = new InlineKeyboard()
    .text("✅ Да, удалить", `del_event_confirm:${eventId}`)
    .text("❌ Отмена", "del_event_cancel");

  await ctx.editMessageText(
    `⚠️ <b>Удалить мероприятие?</b>\n\n` +
      `🏁 <b>${event.name}</b> — ${dateStr}\n` +
      `👥 Регистраций: <b>${event._count.registrations}</b>\n` +
      `📊 Результатов: <b>${event._count.results}</b>\n\n` +
      `<i>Все регистрации и результаты будут удалены безвозвратно.</i>`,
    { reply_markup: kb, parse_mode: "HTML" }
  );
  await ctx.answerCallbackQuery();
}

export async function handleDeleteEventConfirm(ctx: CallbackQueryContext<MyContext>) {
  const eventId = parseInt(ctx.callbackQuery.data.split(":")[1], 10);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    await ctx.answerCallbackQuery("Мероприятие не найдено.");
    return;
  }

  // Delete in order: results → registrations → event
  await prisma.raceResult.deleteMany({ where: { eventId } });
  await prisma.eventRegistration.deleteMany({ where: { eventId } });
  await prisma.event.delete({ where: { id: eventId } });

  await ctx.editMessageText(
    `✅ <b>Мероприятие «${event.name}» удалено.</b>`,
    { parse_mode: "HTML" }
  );
  await ctx.answerCallbackQuery();
}

export async function handleDeleteEventCancel(ctx: CallbackQueryContext<MyContext>) {
  await ctx.editMessageText("❌ Удаление отменено.", { parse_mode: "HTML" });
  await ctx.answerCallbackQuery();
}
