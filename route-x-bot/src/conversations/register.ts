import type { Conversation } from "@grammyjs/conversations";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

type MyConversation = Conversation<MyContext, MyContext>;

const DRIVE_TYPES = ["RWD", "FWD", "AWD"];

const EXIT_MSG = "❌ Регистрация отменена. Введите /register чтобы начать заново.";

function isExit(text: string): boolean {
  return text.trim() === "/exit";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function registerConversation(conversation: MyConversation, ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Step 0: Choose registration type
  const regTypeKb = new InlineKeyboard()
    .text("🏁 Трек-день", "regtype:track_day").row()
    .text("🏋️ Соревнования", "regtype:training").row()
    .text("🚦 Аккредитация маршалов и сми", "regtype:marshal");

  await ctx.reply(
    "🏁 <b>GYMKHANA Route Race</b>\n\nВыберите тип регистрации:\n\n<i>Для отмены в любой момент введите /exit</i>",
    { reply_markup: regTypeKb, parse_mode: "HTML" }
  );

  let regType = "";
  while (!regType) {
    const update = await conversation.wait();

    // Handle /exit sent as text while waiting for callback
    if (update.message?.text && isExit(update.message.text)) {
      await ctx.reply(EXIT_MSG);
      return;
    }

    const data = update.callbackQuery?.data;
    if (data === "regtype:marshal" || data === "regtype:track_day" || data === "regtype:training") {
      regType = data.split(":")[1];
      await update.answerCallbackQuery?.();
    } else if (update.callbackQuery) {
      await update.answerCallbackQuery?.();
    }
  }

  if (regType === "marshal") {
    await handleMarshalRegistration(conversation, ctx);
  } else {
    const eventType = regType === "track_day" ? "TRACK_DAY" : "TRAINING";
    const typeLabel = regType === "track_day" ? "Трек-дни" : "Тренировки";
    await handleParticipantRegistration(conversation, ctx, telegramId, eventType, typeLabel);
  }
}

async function handleMarshalRegistration(
  conversation: MyConversation,
  ctx: MyContext,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await conversation.external(() =>
    prisma.event.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
      take: 20,
    })
  );

  if (events.length === 0) {
    await ctx.reply(
      "ℹ️ <b>Нет доступных мероприятий для регистрации маршалом.</b>\n\nСледите за объявлениями.",
      { parse_mode: "HTML" }
    );
    return;
  }

  const EVENT_TYPE_LABELS: Record<string, string> = {
    TRACK_DAY: "Трек-дни",
    TRAINING: "Тренировки",
  };

  const kb = new InlineKeyboard();
  for (const event of events) {
    const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? event.eventType;
    kb.text(`🚦 ${event.name} — ${formatDate(event.date)} [${typeLabel}]`, `mreg_event:${event.id}`).row();
  }

  await ctx.reply(
    "🚦 <b>Регистрация маршала</b>\n\nВыберите мероприятие:",
    { reply_markup: kb, parse_mode: "HTML" }
  );

  let eventId = 0;
  while (!eventId) {
    const update = await conversation.wait();

    if (update.message?.text && isExit(update.message.text)) {
      await ctx.reply(EXIT_MSG);
      return;
    }

    const data = update.callbackQuery?.data;
    if (data?.startsWith("mreg_event:")) {
      eventId = parseInt(data.split(":")[1], 10);
      await update.answerCallbackQuery?.();
    } else if (update.callbackQuery) {
      await update.answerCallbackQuery?.();
    }
  }

  const selectedEvent = await conversation.external(() =>
    prisma.event.findUnique({ where: { id: eventId } })
  );
  if (!selectedEvent) return;

  // Step: Name
  await ctx.reply(
    `🚦 <b>Регистрация маршала</b>\n🏁 ${selectedEvent.name} — ${formatDate(selectedEvent.date)}\n\n<b>Шаг 1 из 2</b> — введите ваше имя:\n\n<i>Для отмены введите /exit</i>`,
    { parse_mode: "HTML" }
  );

  const nameMsg = await conversation.waitFor("message:text");
  if (isExit(nameMsg.message.text)) {
    await ctx.reply(EXIT_MSG);
    return;
  }
  const marshalName = nameMsg.message.text.trim();

  // Step: Phone
  await nameMsg.reply(
    "<b>Шаг 2 из 2</b> — введите ваш номер телефона:\nНапример: <code>+375291234567</code>\n\n<i>Для отмены введите /exit</i>",
    { parse_mode: "HTML" }
  );

  let phone = "";
  while (!phone) {
    const phoneMsg = await conversation.waitFor("message:text");
    if (isExit(phoneMsg.message.text)) {
      await ctx.reply(EXIT_MSG);
      return;
    }
    const val = phoneMsg.message.text.trim().replace(/[\s\-()]/g, "");
    // +375XX1234567 or 80XX1234567, where XX is operator code (25,29,33,44)
    if (/^(\+375|80)(25|29|33|44)\d{7}$/.test(val)) {
      // Normalize: 80XXXXXXXXX → +375XXXXXXXXX
      phone = val.startsWith("80") ? "+375" + val.slice(2) : val;
    } else {
      await phoneMsg.reply(
        "⚠️ Неверный формат номера. Введите белорусский номер:\n<code>+375291234567</code> или <code>80291234567</code>",
        { parse_mode: "HTML" }
      );
    }
  }

  await conversation.external(() =>
    prisma.marshalRegistration.create({
      data: { eventId, name: marshalName, phone },
    })
  );

  await ctx.reply(
    `✅ <b>Регистрация маршала завершена!</b>\n\n` +
      `🏁 <b>${selectedEvent.name}</b> — ${formatDate(selectedEvent.date)}\n` +
      `👤 Имя: <b>${marshalName}</b>\n` +
      `📞 Телефон: <code>${phone}</code>\n\n` +
      `Спасибо! До встречи на мероприятии.`,
    { parse_mode: "HTML" }
  );
}

async function handleParticipantRegistration(
  conversation: MyConversation,
  ctx: MyContext,
  telegramId: number,
  eventType: string,
  typeLabel: string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await conversation.external(() =>
    prisma.event.findMany({
      where: { date: { gte: today }, eventType },
      orderBy: { date: "asc" },
      take: 10,
    })
  );

  if (events.length === 0) {
    await ctx.reply(
      `ℹ️ <b>Нет доступных мероприятий в категории «${typeLabel}».</b>\n\nСледите за объявлениями.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  const kb = new InlineKeyboard();
  for (const event of events) {
    kb.text(`🏁 ${event.name} — ${formatDate(event.date)}`, `reg_event:${event.id}`).row();
  }

  await ctx.reply(
    `🏁 <b>${typeLabel}</b>\n\nВыберите мероприятие для регистрации:`,
    { reply_markup: kb, parse_mode: "HTML" }
  );

  let eventId = 0;
  while (!eventId) {
    const update = await conversation.wait();

    if (update.message?.text && isExit(update.message.text)) {
      await ctx.reply(EXIT_MSG);
      return;
    }

    const data = update.callbackQuery?.data;
    if (data?.startsWith("reg_event:")) {
      eventId = parseInt(data.split(":")[1], 10);
      await update.answerCallbackQuery?.();
    } else if (update.callbackQuery) {
      await update.answerCallbackQuery?.();
    }
  }

  const selectedEvent = await conversation.external(() =>
    prisma.event.findUnique({ where: { id: eventId } })
  );
  if (!selectedEvent) return;

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

  const eventDateStr = formatDate(selectedEvent.date);

  await ctx.reply(
    `📋 <b>Регистрация на мероприятие</b>\n🏁 ${selectedEvent.name} — ${eventDateStr}\n\n<b>Шаг 1 из 5</b> — введите ваш RX-номер\nНапример: <code>RX555</code>\n\n<i>Для отмены введите /exit</i>`,
    { parse_mode: "HTML" }
  );

  // Step 1: RX number
  let rxNumber = "";
  while (true) {
    const rxMsg = await conversation.waitFor("message:text");
    if (isExit(rxMsg.message.text)) {
      await ctx.reply(EXIT_MSG);
      return;
    }
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
    "<b>Шаг 2 из 5</b> — введите ваше ФИО\nНапример: <i>Иванов Иван Иванович</i>\n\n<i>Для отмены введите /exit</i>",
    { parse_mode: "HTML" }
  );
  const nameMsg = await conversation.waitFor("message:text");
  if (isExit(nameMsg.message.text)) {
    await ctx.reply(EXIT_MSG);
    return;
  }
  const fullName = nameMsg.message.text.trim();

  // Step 3: Car
  await nameMsg.reply(
    "<b>Шаг 3 из 5</b> — введите марку и модель вашего автомобиля\nНапример: <i>Toyota Supra</i>\n\n<i>Для отмены введите /exit</i>",
    { parse_mode: "HTML" }
  );
  const carMsg = await conversation.waitFor("message:text");
  if (isExit(carMsg.message.text)) {
    await ctx.reply(EXIT_MSG);
    return;
  }
  const car = carMsg.message.text.trim();

  // Step 4: Instagram (optional)
  await carMsg.reply(
    "<b>Шаг 4 из 5</b> — введите ваш Instagram\nНапример: <code>@route_papa</code>\n\n<i>Если у вас нет Instagram, напишите /skip или «нет»</i>\n<i>Для отмены введите /exit</i>",
    { parse_mode: "HTML" }
  );
  const igMsg = await conversation.waitFor("message:text");
  if (isExit(igMsg.message.text)) {
    await ctx.reply(EXIT_MSG);
    return;
  }
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
    const update = await conversation.wait();

    if (update.message?.text && isExit(update.message.text)) {
      await ctx.reply(EXIT_MSG);
      return;
    }

    const data = update.callbackQuery?.data;
    if (data?.startsWith("drive:")) {
      const val = data.split(":")[1];
      if (DRIVE_TYPES.includes(val)) {
        driveType = val;
        await update.editMessageText?.(
          `<b>Шаг 5 из 5</b> — тип привода: <b>${driveType}</b>`,
          { parse_mode: "HTML" }
        );
      }
      await update.answerCallbackQuery?.();
    } else if (update.callbackQuery) {
      await update.answerCallbackQuery?.();
    }
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
