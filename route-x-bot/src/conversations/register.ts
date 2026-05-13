import type { Conversation } from "@grammyjs/conversations";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

type MyConversation = Conversation<MyContext, MyContext>;

const DRIVE_TYPES = ["RWD", "FWD", "AWD"];

export async function registerConversation(conversation: MyConversation, ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Step 0: Show list of upcoming events
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
      "ℹ️ <b>Нет доступных мероприятий для регистрации.</b>\n\nСледите за объявлениями — мероприятия появятся здесь.",
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
    kb.text(`🏁 ${event.name} — ${dateStr}`, `reg_event:${event.id}`).row();
  }

  await ctx.reply(
    "🏁 <b>GYMKHANA Route Race</b>\n\nВыберите мероприятие для регистрации:",
    { reply_markup: kb, parse_mode: "HTML" }
  );

  const eventCbq = await conversation.waitFor("callback_query:data");
  const cbData = eventCbq.callbackQuery.data;
  await eventCbq.answerCallbackQuery();

  if (!cbData.startsWith("reg_event:")) return;
  const eventId = parseInt(cbData.split(":")[1], 10);

  const selectedEvent = await conversation.external(() =>
    prisma.event.findUnique({ where: { id: eventId } })
  );
  if (!selectedEvent) return;

  // Check if already registered for this event
  const alreadyRegistered = await conversation.external(() =>
    prisma.eventRegistration.findUnique({
      where: { eventId_telegramId: { eventId, telegramId: BigInt(telegramId) } },
    })
  );

  if (alreadyRegistered) {
    await ctx.reply(
      `ℹ️ Вы уже зарегистрированы на это мероприятие под номером <code>${alreadyRegistered.rxNumber}</code>.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  const eventDateStr = selectedEvent.date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  await ctx.reply(
    `📋 <b>Регистрация на мероприятие</b>\n🏁 ${selectedEvent.name} — ${eventDateStr}\n\n<b>Шаг 1 из 5</b> — введите ваш RX-номер\nНапример: <code>RX555</code>`,
    { parse_mode: "HTML" }
  );

  // Step 1: RX number
  let rxNumber = "";
  while (true) {
    const rxMsg = await conversation.waitFor("message:text");
    const val = rxMsg.message.text.trim().toUpperCase();
    if (/^RX\d+$/.test(val)) {
      const taken = await conversation.external(() =>
        prisma.eventRegistration.findUnique({
          where: { eventId_rxNumber: { eventId, rxNumber: val } },
        })
      );
      if (taken) {
        await rxMsg.reply(
          `⚠️ Номер <code>${val}</code> уже занят на этом мероприятии. Введите другой:`,
          { parse_mode: "HTML" }
        );
        continue;
      }
      rxNumber = val;
      break;
    }
    await rxMsg.reply(
      "⚠️ Неверный формат. Номер должен начинаться с <code>RX</code> и содержать только цифры.\nНапример: <code>RX555</code>",
      { parse_mode: "HTML" }
    );
  }

  // Step 2: Full name
  await ctx.reply(
    "<b>Шаг 2 из 5</b> — введите ваше ФИО\nНапример: <i>Иванов Иван Иванович</i>",
    { parse_mode: "HTML" }
  );
  const nameMsg = await conversation.waitFor("message:text");
  const fullName = nameMsg.message.text.trim();

  // Step 3: Car
  await nameMsg.reply(
    "<b>Шаг 3 из 5</b> — введите марку и модель вашего автомобиля\nНапример: <i>Toyota Supra</i>",
    { parse_mode: "HTML" }
  );
  const carMsg = await conversation.waitFor("message:text");
  const car = carMsg.message.text.trim();

  // Step 4: Instagram (optional)
  await carMsg.reply(
    "<b>Шаг 4 из 5</b> — введите ваш Instagram\nНапример: <code>@route_papa</code>\n\n<i>Если у вас нет Instagram, напишите /skip или «нет»</i>",
    { parse_mode: "HTML" }
  );
  const igMsg = await conversation.waitFor("message:text");
  const igRaw = igMsg.message.text.trim();
  let instagram: string | null = null;
  if (igRaw !== "/skip" && igRaw.toLowerCase() !== "нет" && igRaw !== "-") {
    instagram = igRaw.startsWith("@") ? igRaw : `@${igRaw}`;
  }

  // Step 5: Drive type
  const driveKb = new InlineKeyboard()
    .text("RWD", "drive:RWD")
    .text("FWD", "drive:FWD")
    .text("AWD", "drive:AWD");

  await igMsg.reply(
    "<b>Шаг 5 из 5</b> — выберите тип привода вашего автомобиля:",
    { reply_markup: driveKb, parse_mode: "HTML" }
  );

  let driveType = "";
  while (!driveType) {
    const driveCbq = await conversation.waitFor("callback_query:data");
    const driveData = driveCbq.callbackQuery.data;
    if (driveData.startsWith("drive:")) {
      const val = driveData.split(":")[1];
      if (DRIVE_TYPES.includes(val)) {
        driveType = val;
        await driveCbq.editMessageText(
          `<b>Шаг 5 из 5</b> — тип привода: <b>${driveType}</b>`,
          { parse_mode: "HTML" }
        );
      }
    }
    await driveCbq.answerCallbackQuery();
  }

  // Save registration
  await conversation.external(() =>
    prisma.eventRegistration.create({
      data: {
        eventId,
        telegramId: BigInt(telegramId),
        rxNumber,
        fullName,
        car,
        instagram,
        driveType,
      },
    })
  );

  await ctx.reply(
    `✅ <b>Регистрация завершена!</b>\n\n` +
      `🏁 <b>${selectedEvent.name}</b> — ${eventDateStr}\n` +
      `🏷️ RX-номер: <code>${rxNumber}</code>\n` +
      `👤 ФИО: <b>${fullName}</b>\n` +
      `🚗 Автомобиль: <i>${car}</i>\n` +
      `📱 Instagram: ${instagram ?? "—"}\n` +
      `⚙️ Привод: <b>${driveType}</b>\n\n` +
      `Добро пожаловать на GYMKHANA Route Race!`,
    { parse_mode: "HTML" }
  );
}
