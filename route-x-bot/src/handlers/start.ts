import type { CommandContext } from "grammy";
import type { MyContext } from "../types";
import prisma from "../prisma";

export async function handleStart(ctx: CommandContext<MyContext>) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Keep username up to date for admin users
  const currentUsername = ctx.from?.username?.toLowerCase() ?? null;
  const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
  if (user && user.username !== currentUsername) {
    await prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { username: currentUsername },
    });
  }

  // Show upcoming events
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.event.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
    take: 5,
  });

  let eventsText = "";
  if (events.length > 0) {
    const lines = events.map((e) => {
      const dateStr = e.date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return `🏁 <b>${e.name}</b> — ${dateStr}`;
    });
    eventsText = `\n\n<b>Ближайшие мероприятия:</b>\n${lines.join("\n")}\n\nДля регистрации используйте /register.`;
  } else {
    eventsText = "\n\nПока нет запланированных мероприятий. Следите за объявлениями!";
  }

  await ctx.reply(
    `🏁 <b>Добро пожаловать в GYMKHANA Route Race!</b>\n\nЗдесь проходит регистрация участников и хранятся результаты заездов.${eventsText}`,
    { parse_mode: "HTML" }
  );
}
