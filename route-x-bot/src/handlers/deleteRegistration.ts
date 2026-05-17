import type { CallbackQueryContext, CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

const PAGE_SIZE = 10;

export async function handleDeleteRegistration(ctx: CommandContext<MyContext>) {
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    take: 20,
    include: { _count: { select: { registrations: true, marshals: true } } },
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
    const total = event._count.registrations + event._count.marshals;
    kb.text(
      `🏁 ${event.name} — ${dateStr} (${total})`,
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

  const [participantRegs, marshalRegs] = await Promise.all([
    prisma.eventRegistration.findMany({
      where: { eventId },
      orderBy: { rxNumber: "asc" },
    }),
    prisma.marshalRegistration.findMany({
      where: { eventId },
      orderBy: { name: "asc" },
    }),
  ]);

  type RegEntry = { label: string; callbackData: string };
  const allEntries: RegEntry[] = [
    ...participantRegs.map((r) => ({
      label: `🗑 ${r.rxNumber} — ${r.fullName}`,
      callbackData: `dreg_select:r:${r.id}`,
    })),
    ...marshalRegs.map((r) => ({
      label: `🚦 ${r.name} (маршал)`,
      callbackData: `dreg_select:m:${r.id}`,
    })),
  ];

  const total = allEntries.length;
  if (total === 0) {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `ℹ️ На мероприятие <b>${event.name}</b> нет регистраций.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageEntries = allEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const dateStr = event.date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const kb = new InlineKeyboard();
  for (const entry of pageEntries) {
    kb.text(entry.label, entry.callbackData).row();
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
  // data format: dreg_select:r:{id} or dreg_select:m:{id}
  const parts = ctx.callbackQuery.data.split(":");
  const kind = parts[1]; // "r" or "m"
  const id = parseInt(parts[2], 10);

  if (kind === "m") {
    const reg = await prisma.marshalRegistration.findUnique({
      where: { id },
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
      .text("✅ Да, удалить", `dreg_confirm:m:${id}`)
      .text("❌ Отмена", `dreg_event:${reg.eventId}:1`);
    await ctx.editMessageText(
      `⚠️ <b>Удалить регистрацию маршала?</b>\n\n` +
        `🏁 <b>${reg.event.name}</b> — ${dateStr}\n` +
        `👤 Имя: <b>${reg.name}</b>\n` +
        `📞 Телефон: <code>${reg.phone}</code>`,
      { reply_markup: kb, parse_mode: "HTML" }
    );
    await ctx.answerCallbackQuery();
    return;
  }

  // kind === "r" — participant registration
  const reg = await prisma.eventRegistration.findUnique({
    where: { id },
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
    .text("✅ Да, удалить", `dreg_confirm:r:${id}`)
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
  // data format: dreg_confirm:r:{id} or dreg_confirm:m:{id}
  const parts = ctx.callbackQuery.data.split(":");
  const kind = parts[1]; // "r" or "m"
  const id = parseInt(parts[2], 10);

  if (kind === "m") {
    const reg = await prisma.marshalRegistration.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!reg) {
      await ctx.answerCallbackQuery("Регистрация не найдена.");
      return;
    }
    await prisma.marshalRegistration.delete({ where: { id } });
    await ctx.editMessageText(
      `✅ <b>Регистрация маршала удалена.</b>\n\n` +
        `🚦 <b>${reg.name}</b> снят(а) с мероприятия «${reg.event.name}».`,
      { parse_mode: "HTML" }
    );
    await ctx.answerCallbackQuery();
    return;
  }

  // kind === "r" — participant registration
  const reg = await prisma.eventRegistration.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!reg) {
    await ctx.answerCallbackQuery("Регистрация не найдена.");
    return;
  }
  await prisma.eventRegistration.delete({ where: { id } });
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
