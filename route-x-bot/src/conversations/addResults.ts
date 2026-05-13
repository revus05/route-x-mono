import type { Conversation } from "@grammyjs/conversations";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

type MyConversation = Conversation<MyContext, MyContext>;

function parseLapTimes(input: string): string[] {
  return input
    .trim()
    .split(/[\s;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function addResultsConversation(conversation: MyConversation, ctx: MyContext) {
  // Step 1: Select existing event
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
    kb.text(`🏁 ${event.name} — ${dateStr}`, `addres_event:${event.id}`).row();
  }

  await ctx.reply(
    "📅 <b>Добавление результатов заезда</b>\n\nВыберите мероприятие:",
    { reply_markup: kb, parse_mode: "HTML" }
  );

  const eventCbq = await conversation.waitFor("callback_query:data");
  const cbData = eventCbq.callbackQuery.data;
  await eventCbq.answerCallbackQuery();

  if (!cbData.startsWith("addres_event:")) return;
  const eventId = parseInt(cbData.split(":")[1], 10);

  const selectedEvent = await conversation.external(() =>
    prisma.event.findUnique({ where: { id: eventId } })
  );
  if (!selectedEvent) return;

  // Step 2: Number of participants
  await ctx.reply("👥 Сколько участников финишировало? <i>(от 1 до 20)</i>", {
    parse_mode: "HTML",
  });
  let participantCount = 0;
  while (participantCount < 1 || participantCount > 20) {
    const msg = await conversation.waitFor("message:text");
    participantCount = parseInt(msg.message.text.trim(), 10);
    if (isNaN(participantCount) || participantCount < 1 || participantCount > 20) {
      participantCount = 0;
      await msg.reply("⚠️ Введите число от <b>1</b> до <b>20</b>:", { parse_mode: "HTML" });
    }
  }

  // Step 3: Collect each participant
  const participants: { rxNumber: string; lapTimes: string[] }[] = [];
  const usedRxNumbers = new Set<string>();

  for (let i = 1; i <= participantCount; i++) {
    await ctx.reply(
      `🏎️ <b>Позиция ${i} из ${participantCount}</b>\n\nВведите RX-номер участника\nНапример: <code>RX555</code>`,
      { parse_mode: "HTML" }
    );
    let rxNumber = "";
    while (!rxNumber) {
      const msg = await conversation.waitFor("message:text");
      const val = msg.message.text.trim().toUpperCase();
      if (!/^RX\d+$/.test(val)) {
        await msg.reply(
          "⚠️ Неверный формат. Номер должен начинаться с <code>RX</code> и содержать только цифры.\nНапример: <code>RX555</code>",
          { parse_mode: "HTML" }
        );
        continue;
      }
      if (usedRxNumbers.has(val)) {
        await msg.reply(
          `⚠️ Номер <code>${val}</code> уже добавлен в этот заезд. Введите другой номер:`,
          { parse_mode: "HTML" }
        );
        continue;
      }
      rxNumber = val;
    }
    usedRxNumbers.add(rxNumber);

    await ctx.reply(
      `⏱️ <b>${rxNumber}</b> — введите круговые времена через пробел\nНапример: <code>1.48.66 1.42.10+3 1.43.20</code>\n\n<i>+3 — штрафные секунды, ! — незачётный круг</i>`,
      { parse_mode: "HTML" }
    );
    let lapTimes: string[] = [];
    while (lapTimes.length === 0) {
      const msg = await conversation.waitFor("message:text");
      lapTimes = parseLapTimes(msg.message.text);
      if (lapTimes.length === 0) {
        await msg.reply("⚠️ Введите хотя бы одно время:");
      }
    }

    participants.push({ rxNumber, lapTimes });
  }

  // Save to DB
  const savedEvent = await conversation.external(async () => {
    return prisma.event.update({
      where: { id: eventId },
      data: {
        results: {
          create: participants.map((p, idx) => ({
            position: idx + 1,
            rxNumber: p.rxNumber,
            lapTimes: p.lapTimes,
          })),
        },
      },
      include: { results: true },
    });
  });

  const dateStr = selectedEvent.date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const lines = savedEvent.results
    .sort((a, b) => a.position - b.position)
    .map((r) => `${r.position}. <b>${r.rxNumber}</b>  ${r.lapTimes.join("; ")};`);

  await ctx.reply(
    `✅ <b>Результаты сохранены!</b>\n\n🏁 <b>${selectedEvent.name}</b> — ${dateStr} 🏁\n\n${lines.join("\n")}`,
    { parse_mode: "HTML" }
  );
}
