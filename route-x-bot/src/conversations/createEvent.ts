import type { Conversation } from "@grammyjs/conversations";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

type MyConversation = Conversation<MyContext, MyContext>;

const EVENT_TYPE_LABELS: Record<string, string> = {
  TRACK_DAY: "Трек-дни",
  TRAINING: "Соревнования",
};

function parseDate(input: string): Date | null {
  const match = input.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const d = Number(day), m = Number(month), y = Number(year);
  const date = new Date(y, m - 1, d);
  // Reject if JS rolled over the date (e.g. 34.05.2026 → June 3)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function isExit(text: string): boolean {
  return text.trim() === "/exit";
}

export async function createEventConversation(conversation: MyConversation, ctx: MyContext) {
  // Step 1: Event name
  await ctx.reply(
    "📋 <b>Создание мероприятия</b>\n\n<b>Шаг 1 из 3</b> — введите название мероприятия\nНапример: <i>Этап 1 — Весенний кубок</i>\n\n<i>Для отмены введите /exit</i>",
    { parse_mode: "HTML" }
  );
  const nameMsg = await conversation.waitFor("message:text");
  if (isExit(nameMsg.message.text)) {
    await ctx.reply("❌ Создание мероприятия отменено.");
    return;
  }
  const name = nameMsg.message.text.trim();

  // Step 2: Event type
  const typeKb = new InlineKeyboard()
    .text("🏁 Трек-дни", "etype:TRACK_DAY")
    .text("🏆 Соревнования", "etype:TRAINING");

  await nameMsg.reply(
    "<b>Шаг 2 из 3</b> — выберите тип мероприятия:",
    { reply_markup: typeKb, parse_mode: "HTML" }
  );

  let eventType = "";
  while (!eventType) {
    const update = await conversation.wait();
    if (update.message?.text && isExit(update.message.text)) {
      await ctx.reply("❌ Создание мероприятия отменено.");
      return;
    }
    const data = update.callbackQuery?.data;
    if (data === "etype:TRACK_DAY" || data === "etype:TRAINING") {
      eventType = data.split(":")[1];
      await update.editMessageText(
        `<b>Шаг 2 из 3</b> — тип мероприятия: <b>${EVENT_TYPE_LABELS[eventType]}</b>`,
        { parse_mode: "HTML" }
      );
    }
    if (update.callbackQuery) await update.answerCallbackQuery();
  }

  // Step 3: Date
  await ctx.reply(
    "<b>Шаг 3 из 3</b> — введите дату мероприятия в формате <code>ДД.ММ.ГГГГ</code>\nНапример: <code>08.05.2026</code>\n\n<i>Для отмены введите /exit</i>",
    { parse_mode: "HTML" }
  );
  let eventDate: Date | null = null;
  while (!eventDate) {
    const dateMsg = await conversation.waitFor("message:text");
    if (isExit(dateMsg.message.text)) {
      await ctx.reply("❌ Создание мероприятия отменено.");
      return;
    }
    eventDate = parseDate(dateMsg.message.text);
    if (!eventDate) {
      await dateMsg.reply(
        "⚠️ Неверный формат даты. Используйте <code>ДД.ММ.ГГГГ</code>\nНапример: <code>08.05.2026</code>",
        { parse_mode: "HTML" }
      );
    }
  }

  const event = await conversation.external(() =>
    prisma.event.create({ data: { name, date: eventDate!, eventType } })
  );

  const dateStr = eventDate!.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  await ctx.reply(
    `✅ <b>Мероприятие создано!</b>\n\n🏁 <b>${event.name}</b>\n📅 Дата: <b>${dateStr}</b>\n🗂 Тип: <b>${EVENT_TYPE_LABELS[eventType]}</b>\n\n<i>Участники могут регистрироваться через /register.</i>`,
    { parse_mode: "HTML" }
  );
}
