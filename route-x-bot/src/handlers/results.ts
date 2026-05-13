import type { CallbackQueryContext, CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

function formatEventResults(
  name: string,
  date: Date,
  results: { position: number; rxNumber: string; lapTimes: string[] }[]
): string {
  const dateStr = date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const lines = results
    .sort((a, b) => a.position - b.position)
    .map((r) => {
      const times = r.lapTimes.join("; ") + ";";
      return `${r.position}. <b>${r.rxNumber}</b>  ${times}`;
    });

  return `🏁 <b>${name}</b> — ${dateStr} 🏁\n\n${lines.join("\n")}`;
}

export async function handleResults(ctx: CommandContext<MyContext>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.event.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
    take: 20,
    include: { _count: { select: { results: true } } },
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
    const hasResults = event._count.results > 0 ? "" : " ⏳";
    kb.text(`🏁 ${event.name} — ${dateStr}${hasResults}`, `result:${event.id}`).row();
  }

  await ctx.reply("📋 <b>Результаты заездов</b>\n\nВыберите мероприятие:", {
    reply_markup: kb,
    parse_mode: "HTML",
  });
}

export async function handleResultDetail(ctx: CallbackQueryContext<MyContext>) {
  const eventId = parseInt(ctx.callbackQuery.data.split(":")[1], 10);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { results: true },
  });

  if (!event) {
    await ctx.answerCallbackQuery("Мероприятие не найдено.");
    return;
  }

  if (event.results.length === 0) {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `ℹ️ Результаты мероприятия <b>${event.name}</b> ещё не добавлены.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  const text = formatEventResults(event.name, event.date, event.results);
  await ctx.reply(text, { parse_mode: "HTML" });
  await ctx.answerCallbackQuery();
}
