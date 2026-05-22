import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";

import type { MyContext, SessionData } from "./types";
import { handleStart } from "./handlers/start";
import { handleMakeAdmin } from "./handlers/makeAdmin";
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

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is not set in environment variables");

export const bot = new Bot<MyContext>(token);

// Session + conversations middleware
bot.use(session({ initial: (): SessionData => ({}) }));
bot.use(conversations());

// Register conversations
bot.use(createConversation(registerConversation, "register"));
bot.use(createConversation(addResultsConversation, "addResults"));
bot.use(createConversation(createEventConversation, "createEvent"));

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
  await ctx.conversation.exit();
  await ctx.reply("❌ Диалог отменён.");
});

// Commands — public
bot.command("start", handleStart);
bot.command("register", async (ctx) => { await ctx.conversation.enter("register"); });
bot.command("myregistrations", handleMyRegistrations);
bot.command("results", handleResults);

// Commands — admin only
bot.command("makeadmin", handleMakeAdmin);
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

// Catch-all error handler
bot.catch((err) => {
  console.error("Bot error:", err);
});

export default bot;
