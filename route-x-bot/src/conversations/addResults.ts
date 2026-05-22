import type { Conversation } from "@grammyjs/conversations";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

type MyConversation = Conversation<MyContext, MyContext>;

function isExit(text: string): boolean {
  return text.trim() === "/exit";
}

function getEventEmoji(eventType: string): string {
  return eventType === "TRAINING" ? "🏆" : "🏁";
}

export async function addResultsConversation(conversation: MyConversation, ctx: MyContext) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await conversation.external(() =>
    prisma.event.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
      take: 10,
    })
  );

  if (events.length === 0) {
    await ctx.reply(
      "ℹ️ Нет созданных мероприятий. Сначала создайте мероприятие через /createevent.",
      { parse_mode: "HTML" }
    );
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
    kb.text(`${emoji} ${event.name} — ${dateStr}`, `addres_event:${event.id}`).row();
  }

  await ctx.reply(
    "📅 <b>Добавление результатов</b>\n\nВыберите мероприятие:\n\n<i>Для отмены введите /exit</i>",
    { reply_markup: kb, parse_mode: "HTML" }
  );

  let cbData = "";
  while (!cbData) {
    const update = await conversation.wait();
    if (update.message?.text && isExit(update.message.text)) {
      await ctx.reply("❌ Добавление результатов отменено.");
      return;
    }
    const data = update.callbackQuery?.data;
    if (data?.startsWith("addres_event:")) {
      cbData = data;
    }
    if (update.callbackQuery) await update.answerCallbackQuery();
  }

  const eventId = parseInt(cbData.split(":")[1], 10);
  const selectedEvent = await conversation.external(() =>
    prisma.event.findUnique({ where: { id: eventId } })
  );
  if (!selectedEvent) return;

  await ctx.reply(
    `🔗 <b>${selectedEvent.name}</b>\n\nВведите ссылку на Google Диск с результатами:\n\n<i>Для отмены введите /exit</i>`,
    { parse_mode: "HTML" }
  );

  let link = "";
  while (!link) {
    const msg = await conversation.waitFor("message:text");
    if (isExit(msg.message.text)) {
      await ctx.reply("❌ Добавление результатов отменено.");
      return;
    }
    link = msg.message.text.trim();
  }

  await conversation.external(() =>
    prisma.event.update({
      where: { id: eventId },
      data: { resultsLink: link },
    })
  );

  await ctx.reply(
    `✅ <b>Результаты сохранены!</b>\n\n${getEventEmoji(selectedEvent.eventType)} <b>${selectedEvent.name}</b>\n\n🔗 ${link}`,
    { parse_mode: "HTML" }
  );
}
