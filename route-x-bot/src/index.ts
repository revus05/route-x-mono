import bot from "./bot";
import prisma from "./prisma";
import { ADMIN_COMMANDS, USER_COMMANDS, setAdminCommandsForUser } from "./commands";

async function main() {
  // Default scope: only user-facing commands (no admin commands visible)
  await bot.api.setMyCommands(USER_COMMANDS);

  // Set admin commands for all existing admins in DB
  const adminUsers = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { telegramId: true },
  });
  const adminOverrides = await prisma.adminOverride.findMany({
    where: { telegramId: { not: null } },
    select: { telegramId: true },
  });

  // Collect all known admin telegramIds (DB admins + AdminOverrides + super admins from env)
  const superAdminIds = (process.env.SUPER_ADMIN_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number)
    .filter((id) => !isNaN(id));

  const adminIds = new Set<number>([
    ...adminUsers.map((u) => Number(u.telegramId)),
    ...adminOverrides.map((o) => Number(o.telegramId)),
    ...superAdminIds,
  ]);

  await Promise.allSettled(
    [...adminIds].map((id) => setAdminCommandsForUser(bot.api, id))
  );

  // Set the menu button to show commands list
  await bot.api.setChatMenuButton({ menu_button: { type: "commands" } });

  console.log(
    `Starting Route-X Bot... (${adminIds.size} admin(s) synced)`
  );

  bot.start({
    onStart: (info) => {
      console.log(`Bot started: @${info.username}`);
    },
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
