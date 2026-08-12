import bot from "./bot";
import { syncCommands } from "./setup";

async function main() {
  const adminCount = await syncCommands();

  // Long polling conflicts with a webhook — drop it when running locally
  await bot.api.deleteWebhook();

  console.log(`Starting Route-X Bot... (${adminCount} admin(s) synced)`);

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
