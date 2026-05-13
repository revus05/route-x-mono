import type { Api } from "grammy";

export const USER_COMMANDS = [
  { command: "start", description: "Главная" },
  { command: "register", description: "Зарегистрироваться на мероприятие" },
  { command: "myregistrations", description: "Мои регистрации / отменить" },
  { command: "results", description: "Результаты заездов" },
];

export const ADMIN_COMMANDS = [
  ...USER_COMMANDS,
  { command: "users", description: "Список участников мероприятия" },
  { command: "createevent", description: "Создать мероприятие" },
  { command: "deletevent", description: "Удалить мероприятие" },
  { command: "addresults", description: "Добавить результаты заезда" },
  { command: "delreg", description: "Удалить регистрацию участника" },
  { command: "makeadmin", description: "Назначить администратора" },
];

/**
 * Set admin command list for a specific user's chat.
 * Silently ignores errors (e.g. user has never started the bot).
 */
export async function setAdminCommandsForUser(api: Api, chatId: number): Promise<void> {
  try {
    await api.setMyCommands(ADMIN_COMMANDS, {
      scope: { type: "chat", chat_id: chatId },
    });
  } catch {
    // User hasn't started the bot yet — commands will be set on first interaction
  }
}
