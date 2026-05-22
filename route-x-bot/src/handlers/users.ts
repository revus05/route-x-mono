import type { CallbackQueryContext, CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

const PAGE_SIZE = 12;

function getEventEmoji(eventType: string): string {
  return eventType === "TRAINING" ? "🏆" : "🏁";
}

function buildRegistrationsMessage(
  regs: { rxNumber: string; fullName: string; car: string; instagram: string | null; driveType: string }[],
  marshals: { name: string; phone: string }[],
  eventName: string,
  eventId: number,
  page: number,
  total: number
) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const lines = regs.map((r, i) => {
    const num = (page - 1) * PAGE_SIZE + i + 1;
    const ig = r.instagram ? ` · ${r.instagram}` : "";
    return `${num}. <code>${r.rxNumber}</code>  <b>${r.fullName}</b>  <i>${r.car}</i> [${r.driveType}]${ig}`;
  });

  let text =
    `👥 <b>Участники: ${eventName}</b>\n` +
    `Страница ${page}/${totalPages} · Всего: <b>${total}</b>\n` +
    `${"─".repeat(28)}\n` +
    (lines.length > 0 ? lines.join("\n") : "<i>Нет участников</i>");

  if (marshals.length > 0) {
    const marshalLines = marshals.map((m, i) => `${i + 1}. <b>${m.name}</b> — <code>${m.phone}</code>`);
    text += `\n\n🚦 <b>Маршалы: ${marshals.length}</b>\n${"─".repeat(28)}\n` + marshalLines.join("\n");
  }

  const kb = new InlineKeyboard();
  if (page > 1) kb.text("◀ Назад", `users_page:${eventId}:${page - 1}`);
  kb.text(`${page} / ${totalPages}`, "users:noop");
  if (page < totalPages) kb.text("Вперёд ▶", `users_page:${eventId}:${page + 1}`);

  return { text, keyboard: kb };
}

export async function handleUsers(ctx: CommandContext<MyContext>) {
  const kb = new InlineKeyboard()
    .text("🏆 Соревнования", "users_type:TRAINING").row()
    .text("🏁 Трек-дни", "users_type:TRACK_DAY");

  await ctx.reply("👥 <b>Участники</b>\n\nВыберите тип мероприятия:", {
    reply_markup: kb,
    parse_mode: "HTML",
  });
}

export async function handleUsersTypeSelect(ctx: CallbackQueryContext<MyContext>) {
  const eventType = ctx.callbackQuery.data.split(":")[1];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.event.findMany({
    where: { date: { gte: today }, eventType },
    orderBy: { date: "asc" },
    take: 20,
    include: {
      _count: { select: { registrations: true, marshals: true } },
    },
  });

  await ctx.answerCallbackQuery();

  if (events.length === 0) {
    await ctx.reply("ℹ️ Мероприятий этого типа пока нет.", { parse_mode: "HTML" });
    return;
  }

  const emoji = getEventEmoji(eventType);
  const kb = new InlineKeyboard();
  for (const event of events) {
    const dateStr = event.date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const counts = `${event._count.registrations} уч.${event._count.marshals > 0 ? ` · ${event._count.marshals} марш.` : ""}`;
    kb.text(
      `${emoji} ${event.name} — ${dateStr} (${counts})`,
      `users_event:${event.id}`
    ).row();
  }

  const typeLabel = eventType === "TRAINING" ? "Соревнования" : "Трек-дни";
  await ctx.reply(`👥 <b>Участники — ${typeLabel}</b>\n\nВыберите мероприятие:`, {
    reply_markup: kb,
    parse_mode: "HTML",
  });
}

export async function handleUsersEventSelect(ctx: CallbackQueryContext<MyContext>) {
  const eventId = parseInt(ctx.callbackQuery.data.split(":")[1], 10);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    await ctx.answerCallbackQuery("Мероприятие не найдено.");
    return;
  }

  const [total, marshals] = await Promise.all([
    prisma.eventRegistration.count({ where: { eventId } }),
    prisma.marshalRegistration.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (total === 0 && marshals.length === 0) {
    await ctx.answerCallbackQuery();
    await ctx.reply(`ℹ️ На мероприятие <b>${event.name}</b> пока нет регистраций.`, {
      parse_mode: "HTML",
    });
    return;
  }

  const regs = total > 0
    ? await prisma.eventRegistration.findMany({
        where: { eventId },
        orderBy: { rxNumber: "asc" },
        take: PAGE_SIZE,
        skip: 0,
      })
    : [];

  const { text, keyboard } = buildRegistrationsMessage(regs, marshals, event.name, eventId, 1, total);
  await ctx.answerCallbackQuery();
  await ctx.reply(text, { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function handleUsersPagination(ctx: CallbackQueryContext<MyContext>) {
  const data = ctx.callbackQuery.data;
  if (data === "users:noop") {
    await ctx.answerCallbackQuery();
    return;
  }

  // users_page:eventId:page
  const parts = data.split(":");
  const eventId = parseInt(parts[1], 10);
  const page = parseInt(parts[2], 10);
  if (isNaN(eventId) || isNaN(page) || page < 1) {
    await ctx.answerCallbackQuery();
    return;
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    await ctx.answerCallbackQuery();
    return;
  }

  const [total, marshals] = await Promise.all([
    prisma.eventRegistration.count({ where: { eventId } }),
    prisma.marshalRegistration.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (page > totalPages) {
    await ctx.answerCallbackQuery();
    return;
  }

  const regs = await prisma.eventRegistration.findMany({
    where: { eventId },
    orderBy: { rxNumber: "asc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const { text, keyboard } = buildRegistrationsMessage(regs, marshals, event.name, eventId, page, total);
  await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: "HTML" });
  await ctx.answerCallbackQuery();
}
