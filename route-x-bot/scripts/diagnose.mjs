/**
 * Временная диагностика: показывает, что бот реально видит в базе.
 * Запуск:  DATABASE_URL="<прод-url>" node scripts/diagnose.mjs
 */
import { PrismaClient } from "@prisma/client";

const raw = process.env.DATABASE_URL;
if (!raw) { console.error("DATABASE_URL не задан"); process.exit(1); }

const u = new URL(raw);
if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "1");

console.log(`БД: ${u.hostname}${u.pathname}\n`);

const p = new PrismaClient({ datasourceUrl: u.toString() });
const today = new Date(); today.setHours(0, 0, 0, 0);
console.log("сейчас:", new Date().toISOString(), "| отсечка today:", today.toISOString(), "\n");

const all = await p.event.findMany({ orderBy: { date: "asc" } });
console.log(`ВСЕ мероприятия (${all.length}) — так их видит /delreg и /deletevent:`);
for (const e of all) {
  console.log(`  #${e.id} ${e.date.toISOString()} [${e.eventType}] ${e.name} | будущее=${e.date >= today}`);
}

console.log("\nРовно те же запросы, что делают команды:");
const q = (where) => p.event.count({ where });
console.log("  /start, /results  (gte today):        ", await q({ date: { gte: today } }));
console.log("  /register трек-дни (gte + TRACK_DAY): ", await q({ date: { gte: today }, eventType: "TRACK_DAY" }));
console.log("  /register чемпионат (gte + TRAINING): ", await q({ date: { gte: today }, eventType: "TRAINING" }));

const states = await p.conversationState.findMany({ select: { key: true, updatedAt: true, data: true } });
console.log(`\nConversationState (${states.length} строк) — застрявшие диалоги глотают все апдейты чата:`);
for (const s of states) {
  const diag = s.key === "__last_error" || s.key === "__last_update";
  console.log(`  ${s.key}  ${s.updatedAt.toISOString()}${diag ? "\n    " + s.data.slice(0, 400) : ""}`);
}

console.log("\nusers:", await p.user.count(), "| регистрации:", await p.eventRegistration.count());
await p.$disconnect();
