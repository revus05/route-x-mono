# Деплой бота на Vercel

Бот переведён с long polling на webhook. На Vercel это две serverless-функции:

| Файл              | URL              | Назначение                                        |
| ----------------- | ---------------- | ------------------------------------------------- |
| `api/telegram.ts` | `/api/telegram`  | приём апдейтов от Telegram                        |
| `api/setup.ts`    | `/api/setup`     | разовая настройка: webhook + меню команд          |

Локально всё работает как раньше: `bun run dev` (polling, вебхук снимается автоматически).

---

## 1. База данных

Vercel Dashboard → **Storage** → **Create Database** → **Neon (Serverless Postgres)** →
регион поближе (например `Frankfurt eu-central-1`) → **Connect Project** → выбрать проект бота
(проект нужно создать сначала, см. шаг 2 — либо подключить БД после).

Neon положит в проект переменные автоматически, нам важны две:

- `DATABASE_URL` — пул (`...-pooler...`), его использует бот;
- `DATABASE_UNPOOLED_URL` / `DATABASE_URL_UNPOOLED` — прямое соединение, его требует `prisma migrate`.

> Prisma Postgres из маркетплейса тоже подойдёт, но требует Prisma Accelerate-адаптер в коде.
> Neon даёт обычный Postgres-URL и работает с текущей схемой без изменений.

## 2. Проект на Vercel

**Add New → Project** → импорт этого git-репозитория → **Root Directory: `route-x-bot`**
(важно, иначе Vercel соберёт фронтенд). Framework Preset — **Other**.

Build Command трогать не нужно: в `package.json` есть `vercel-build`, который делает
`prisma generate && prisma migrate deploy` — миграции накатываются на каждый деплой.

## 3. Переменные окружения (Settings → Environment Variables)

| Имя                       | Значение                                                        |
| ------------------------- | --------------------------------------------------------------- |
| `BOT_TOKEN`               | токен от @BotFather                                              |
| `SUPER_ADMIN_IDS`         | `805218286` (как в локальном `.env`)                             |
| `DATABASE_URL_UNPOOLED`   | значение `DATABASE_UNPOOLED_URL` из Neon (скопировать вручную)   |
| `TELEGRAM_WEBHOOK_SECRET` | случайная строка, напр. `03f29d0316c9d29871fb0146e6b11371b1fa110083dc1850` |
| `SETUP_SECRET`            | случайная строка, напр. `e309f9739a0cf70ee44c2af8fdab0c0bb0609d7ef57931ad` |

`DATABASE_URL` добавляет интеграция Neon — руками его создавать не надо.
Все переменные ставить для окружения **Production** (и Preview, если нужен тестовый бот).

## 4. Деплой и активация webhook

1. **Deploy**. В логах сборки должно быть `Applying migration ...` / `No pending migrations`.
2. Открыть в браузере:
   `https://<project>.vercel.app/api/setup?secret=<SETUP_SECRET>`
   Ответ `{"ok":true,...}` означает: webhook установлен, меню команд опубликовано.
3. Написать боту `/start`.

Этот же URL нужно дёргать после деплоев, где менялись списки команд (`src/commands.ts`).

## 5. Выключить старый инстанс

Telegram отдаёт апдейты либо в polling, либо в webhook — одновременно нельзя.
Любой запущенный polling-инстанс (`bun run dev`, `bun run start`, контейнер)
на старте вызывает `bot.api.deleteWebhook()` (`src/index.ts`) и молча уводит
все апдейты у вебхука на себя — вместе со своей базой из своего `.env`.

Именно так и вышло 18.08.2026: после перезапуска сервера docker-compose поднял
контейнер `routex-bot`, тот снял вебхук, и бот отвечал из серверной базы, где
не было актуальных мероприятий. Снаружи это выглядело как «бот не видит данные».
Корневой `docker-compose.yml` с сервисами `bot` и `postgres` поэтому удалён —
на сервере остался только фронтенд (`route-x/docker-compose.yml`).

Если бот всё же где-то запущен, проверить и погасить:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"   # url пустой => апдейты забирает polling
docker ps                                                       # ищем контейнер с ботом
docker rm -f routex-bot                                         # именно rm: stop не спасёт от restart: unless-stopped
```

После этого заново дёрнуть `/api/setup?secret=...` и убедиться, что в
`/api/health` поле `lastUpdate.at` стало свежим — значит апдейты снова у Vercel.

## 6. Перенос существующих данных (если нужно)

```bash
# дамп из текущей базы
pg_dump --no-owner --no-privileges -d "postgresql://postgres:12345678@localhost:5432/routex" -f dump.sql
# заливка в Neon (взять DATABASE_UNPOOLED_URL)
psql "<DATABASE_UNPOOLED_URL>" -f dump.sql
```

Если базу заливаешь дампом со схемой — сначала сделай деплой (он создаст таблицы миграциями),
потом лей только данные: `pg_dump --data-only`.

---

## Что изменилось в коде

- `prisma/schema.prisma` — модель `ConversationState` + `directUrl`.
  Состояние диалогов (`/register`, `/createevent`, …) должно жить в БД: serverless-процесс
  умирает после каждого апдейта, in-memory хранилище потеряло бы диалог на первом же шаге.
- `src/storage.ts` — адаптер хранилища conversations поверх Prisma.
- `src/prisma.ts` — переиспользование `PrismaClient` между вызовами тёплого инстанса.
- `src/setup.ts` — публикация меню команд, общая для polling и webhook.
- `src/index.ts` — снимает webhook перед стартом polling.
- `api/*` + `vercel.json` + `public/index.html` — точки входа Vercel.

## Ограничения

- Hobby-план: 60 секунд на вызов функции. Хендлеры бота укладываются с запасом.
- Холодный старт первой функции после простоя — ~1–2 с задержки на ответ бота.
- Cron/фоновые задачи на serverless не работают — если появятся напоминания об эвентах,
  их нужно будет делать через Vercel Cron Jobs.
