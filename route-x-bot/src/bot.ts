import { Bot, session } from "grammy";
import {
  conversations,
  createConversation,
  type ConversationData,
} from "@grammyjs/conversations";

import type { MyContext, SessionData } from "./types";
import { handleStart } from "./handlers/start";
import { handleUsers, handleUsersTypeSelect, handleUsersEventSelect, handleUsersPagination } from "./handlers/users";
import { handleResults, handleResultDetail } from "./handlers/results";
import {
  handleDeleteEvent,
  handleDeleteEventSelect,
  handleDeleteEventConfirm,
  handleDeleteEventCancel,
} from "./handlers/deleteEvent";
import {
  handleMyRegistrations,
  handleCancelRegistration,
  handleCancelRegistrationConfirm,
  handleCancelRegistrationAbort,
} from "./handlers/myRegistrations";
import {
  handleDeleteRegistration,
  handleDregEventSelect,
  handleDregSelect,
  handleDregConfirm,
  handleDregNoop,
} from "./handlers/deleteRegistration";
import { adminGuard, promotePendingAdmin } from "./middleware/adminGuard";
import { setAdminCommandsForUser } from "./commands";
import { registerConversation } from "./conversations/register";
import { addResultsConversation } from "./conversations/addResults";
import { createEventConversation } from "./conversations/createEvent";
import { makeAdminConversation } from "./conversations/makeAdmin";
import { prismaConversationStorage } from "./storage";
import { recordLastError } from "./debug";
import { CONVERSATIONS_VERSION } from "./generated/conversationsVersion";
import prisma from "./prisma";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is not set in environment variables");

export const bot = new Bot<MyContext>(token);

// Session + conversations middleware
bot.use(session({ initial: (): SessionData => ({}) }));
bot.use(
  conversations({
    // Conversation state lives in Postgres so it survives serverless invocations
    storage: {
      type: "key",
      // Хэш src/conversations/, пересчитывается на каждой сборке
      // (scripts/gen-conversations-version.mjs). Любое изменение диалога меняет
      // версию, и старые состояния отбрасываются вместо падения при replay.
      version: CONVERSATIONS_VERSION,
      adapter: prismaConversationStorage<ConversationData>(),
    },
  })
);

// Register conversations
bot.use(createConversation(registerConversation, "register"));
bot.use(createConversation(addResultsConversation, "addResults"));
bot.use(createConversation(createEventConversation, "createEvent"));
bot.use(createConversation(makeAdminConversation, "makeAdmin"));

// Auto-promote pending admins on every interaction and update their command menu
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.username ?? null;
  if (userId) {
    const promotedId = await promotePendingAdmin(userId, username).catch(() => null);
    if (promotedId) {
      await setAdminCommandsForUser(ctx.api, Number(promotedId)).catch(() => {});
    }
  }
  return next();
});

// /exit — cancel any active conversation
bot.command("exit", async (ctx) => {
  await ctx.conversation.exitAll();
  await ctx.reply("❌ Диалог отменён.");
});

// Commands — public
bot.command("start", handleStart);
bot.command("register", async (ctx) => { await ctx.conversation.enter("register"); });
bot.command("myregistrations", handleMyRegistrations);
bot.command("results", handleResults);

// Commands — admin only
bot.command("makeadmin", adminGuard, async (ctx) => { await ctx.conversation.enter("makeAdmin"); });
bot.command("users", adminGuard, handleUsers);
bot.command("createevent", adminGuard, async (ctx) => { await ctx.conversation.enter("createEvent"); });
bot.command("addresults", adminGuard, async (ctx) => { await ctx.conversation.enter("addResults"); });
bot.command("deletevent", adminGuard, handleDeleteEvent);
bot.command("delreg", adminGuard, handleDeleteRegistration);

// Callback queries — users list
bot.callbackQuery(/^users_type:/, adminGuard, handleUsersTypeSelect);
bot.callbackQuery(/^users_event:/, adminGuard, handleUsersEventSelect);
bot.callbackQuery(/^users_page:/, adminGuard, handleUsersPagination);
bot.callbackQuery("users:noop", adminGuard, handleUsersPagination);

// Callback queries — results
bot.callbackQuery(/^result:/, handleResultDetail);

// Callback queries — delete event (admin)
bot.callbackQuery(/^del_event:\d+$/, adminGuard, handleDeleteEventSelect);
bot.callbackQuery(/^del_event_confirm:/, adminGuard, handleDeleteEventConfirm);
bot.callbackQuery("del_event_cancel", adminGuard, handleDeleteEventCancel);

// Callback queries — user cancel registration
bot.callbackQuery(/^cancel_reg:\d+$/, handleCancelRegistration);
bot.callbackQuery(/^cancel_reg_confirm:/, handleCancelRegistrationConfirm);
bot.callbackQuery("cancel_reg_abort", handleCancelRegistrationAbort);

// Callback queries — admin delete registration
bot.callbackQuery(/^dreg_event:/, adminGuard, handleDregEventSelect);
bot.callbackQuery(/^dreg_select:/, adminGuard, handleDregSelect);
bot.callbackQuery(/^dreg_confirm:/, adminGuard, handleDregConfirm);
bot.callbackQuery("dreg:noop", adminGuard, handleDregNoop);

/**
 * Снимает застрявшее состояние диалога для чата.
 *
 * Сначала штатный `exitAll()`, затем — безусловно — удаление строки напрямую.
 * Второй шаг нужен потому, что при сломанном плагине `exitAll()` может как
 * бросить исключение, так и тихо отработать вхолостую, не сняв состояние.
 * Удаление идемпотентно, так что лишним оно не будет.
 * Ключ хранилища по умолчанию — `ctx.chatId.toString()`.
 */
async function clearConversationState(ctx: MyContext): Promise<void> {
  try {
    await ctx.conversation?.exitAll();
  } catch {
    // штатный выход недоступен — ниже вычищаем хранилище напрямую
  }

  const chatId = ctx.chatId;
  if (chatId === undefined) return;
  try {
    await prisma.conversationState.deleteMany({ where: { key: chatId.toString() } });
  } catch {
    // больше сделать нечего: ниже пользователь всё равно получит ответ
  }
}

// Catch-all error handler.
//
// Раньше здесь ошибка просто проглатывалась: Telegram получал 200 OK, а чат с
// незавершённым диалогом залипал молча — conversations-middleware перехватывает
// апдейты раньше команд, так что даже /exit до пользователя не доходил.
// Теперь чат расклинивается сам, независимо от причины сбоя.
bot.catch(async (err) => {
  console.error("Bot error:", err);
  await recordLastError(err.error ?? err);

  await clearConversationState(err.ctx);
  await err.ctx
    .reply("⚠️ Что-то пошло не так, диалог сброшен. Попробуйте ещё раз — /start")
    .catch(() => {});
});

export default bot;
