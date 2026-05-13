import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../types";
import prisma from "../prisma";

type MyConversation = Conversation<MyContext, MyContext>;

function parseDate(input: string): Date | null {
  const match = input.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(date.getTime())) return null;
  return date;
}

export async function createEventConversation(conversation: MyConversation, ctx: MyContext) {
  // Step 1: Event name
  await ctx.reply(
    "📋 <b>Создание мероприятия</b>\n\n<b>Шаг 1 из 2</b> — введите название мероприятия\nНапример: <i>Этап 1 — Весенний кубок</i>",
    { parse_mode: "HTML" }
  );
  const nameMsg = await conversation.waitFor("message:text");
  const name = nameMsg.message.text.trim();

  // Step 2: Date
  await nameMsg.reply(
    "<b>Шаг 2 из 2</b> — введите дату мероприятия в формате <code>ДД.ММ.ГГГГ</code>\nНапример: <code>08.05.2026</code>",
    { parse_mode: "HTML" }
  );
  let eventDate: Date | null = null;
  while (!eventDate) {
    const dateMsg = await conversation.waitFor("message:text");
    eventDate = parseDate(dateMsg.message.text);
    if (!eventDate) {
      await dateMsg.reply(
        "⚠️ Неверный формат даты. Используйте <code>ДД.ММ.ГГГГ</code>\nНапример: <code>08.05.2026</code>",
        { parse_mode: "HTML" }
      );
    }
  }

  const event = await conversation.external(() =>
    prisma.event.create({ data: { name, date: eventDate! } })
  );

  const dateStr = eventDate!.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  await ctx.reply(
    `✅ <b>Мероприятие создано!</b>\n\n🏁 <b>${event.name}</b>\n📅 Дата: <b>${dateStr}</b>\n🆔 ID: <code>${event.id}</code>\n\n<i>Участники могут регистрироваться через /register.</i>`,
    { parse_mode: "HTML" }
  );
}
