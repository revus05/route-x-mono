import type { CallbackQueryContext, CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

const PAGE_SIZE = 10;

export async function handleDeleteRegistration(ctx: CommandContext<MyContext>) {
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    take: 20,
    include: { _count: { select: { registrations: true } } },
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
    kb.text(
      `🏁 ${event.name} — ${dateStr} (${event._count.registrations})`,
      `dreg_event:${event.id}:1`
    ).row();
  }

  await ctx.reply(
    "🗑 <b>Удаление регистрации</b>\n\nВыберите мероприятие:",
    { reply_markup: kb, parse_mode: "HTML" }
  );
}

async function showDregPage(ctx: CallbackQueryContext<MyContext>, eventId: number, page: number) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    await ctx.answerCallbackQuery("Мероприятие не найдено.");
    return;
  }

  const total = await prisma.eventRegistration.count({ where: { eventId } });
  if (total === 0) {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `ℹ️ На мероприятие <b>${event.name}</b> нет регистраций.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const skip = (page - 1) * PAGE_SIZE;

  const regs = await prisma.eventRegistration.findMany({
    where: { eventId },
    orderBy: { rxNumber: "asc" },
    take: PAGE_SIZE,
    skip,
  });

  const dateStr = event.date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const kb = new InlineKeyboard();
  for (const reg of regs) {
    kb.text(
      `🗑 ${reg.rxNumber} — ${reg.fullName}`,
      `dreg_select:${reg.id}`
    ).row();
  }

  if (page > 1) kb.text("◀ Назад", `dreg_event:${eventId}:${page - 1}`);
  kb.text(`${page} / ${totalPages}`, "dreg:noop");
  if (page < totalPages) kb.text("Вперёд ▶", `dreg_event:${eventId}:${page + 1}`);

  const text =
    `🗑 <b>Удаление регистрации</b>\n` +
    `🏁 ${event.name} — ${dateStr}\n` +
    `Страница ${page}/${totalPages} · Всего: ${total}\n\n` +
    `Выберите участника:`;

  if (ctx.callbackQuery.message) {
    await ctx.editMessageText(text, { reply_markup: kb, parse_mode: "HTML" });
  } else {
    await ctx.reply(text, { reply_markup: kb, parse_mode: "HTML" });
  }
  await ctx.answerCallbackQuery();
}

export async function handleDregEventSelect(ctx: CallbackQueryContext<MyContext>) {
  const parts = ctx.callbackQuery.data.split(":");
  const eventId = parseInt(parts[1], 10);
  const page = parseInt(parts[2], 10) || 1;
  await showDregPage(ctx, eventId, page);
}

export async function handleDregSelect(ctx: CallbackQueryContext<MyContext>) {
  const regId = parseInt(ctx.callbackQuery.data.split(":")[1], 10);

  const reg = await prisma.eventRegistration.findUnique({
    where: { id: regId },
    include: { event: true },
  });

  if (!reg) {
    await ctx.answerCallbackQuery("Регистрация не найдена.");
    return;
  }

  const dateStr = reg.event.date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const kb = new InlineKeyboard()
    .text("✅ Да, удалить", `dreg_confirm:${regId}`)
    .text("❌ Отмена", `dreg_event:${reg.eventId}:1`);

  await ctx.editMessageText(
    `⚠️ <b>Удалить регистрацию?</b>\n\n` +
      `🏁 <b>${reg.event.name}</b> — ${dateStr}\n` +
      `🏷️ RX-номер: <code>${reg.rxNumber}</code>\n` +
      `👤 ФИО: <b>${reg.fullName}</b>\n` +
      `🚗 ${reg.car} [${reg.driveType}]`,
    { reply_markup: kb, parse_mode: "HTML" }
  );
  await ctx.answerCallbackQuery();
}

export async function handleDregConfirm(ctx: CallbackQueryContext<MyContext>) {
  const regId = parseInt(ctx.callbackQuery.data.split(":")[1], 10);

  const reg = await prisma.eventRegistration.findUnique({
    where: { id: regId },
    include: { event: true },
  });

  if (!reg) {
    await ctx.answerCallbackQuery("Регистрация не найдена.");
    return;
  }

  await prisma.eventRegistration.delete({ where: { id: regId } });

  await ctx.editMessageText(
    `✅ <b>Регистрация удалена.</b>\n\n` +
      `🏷️ <code>${reg.rxNumber}</code> — <b>${reg.fullName}</b> снят(а) с мероприятия «${reg.event.name}».`,
    { parse_mode: "HTML" }
  );
  await ctx.answerCallbackQuery();
}

export async function handleDregNoop(ctx: CallbackQueryContext<MyContext>) {
  await ctx.answerCallbackQuery();
}
