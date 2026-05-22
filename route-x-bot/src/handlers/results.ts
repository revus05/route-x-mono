import type { CallbackQueryContext, CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

function getEventEmoji(eventType: string): string {
  return eventType === "TRAINING" ? "🏆" : "🏁";
}

export async function handleResults(ctx: CommandContext<MyContext>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.event.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
    take: 20,
  });

  if (events.length === 0) {
    await ctx.reply("ℹ️ Результатов заездов пока нет. Следите за обновлениями!", {
      parse_mode: "HTML",
    });
    return;
  }

  const kb = new InlineKeyboard();
  for (const event of events) {
    const dateStr = event.date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const emoji = getEventEmoji(event.eventType);
    const hasResults = event.resultsLink ? "" : " ⏳";
    kb.text(`${emoji} ${event.name} — ${dateStr}${hasResults}`, `result:${event.id}`).row();
  }

  await ctx.reply("📋 <b>Результаты заездов</b>\n\nВыберите мероприятие:", {
    reply_markup: kb,
    parse_mode: "HTML",
  });
}

export async function handleResultDetail(ctx: CallbackQueryContext<MyContext>) {
  const eventId = parseInt(ctx.callbackQuery.data.split(":")[1], 10);

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    await ctx.answerCallbackQuery("Мероприятие не найдено.");
    return;
  }

  if (!event.resultsLink) {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `ℹ️ Результаты мероприятия <b>${event.name}</b> ещё не добавлены.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.reply(
    `${getEventEmoji(event.eventType)} <b>${event.name}</b>\n\n🔗 ${event.resultsLink}`,
    { parse_mode: "HTML" }
  );
}
