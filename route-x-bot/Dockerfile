FROM oven/bun:1.1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install

FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bunx prisma generate

# Версия хранилища диалогов считается из исходников — пересчитываем в образе,
# чтобы закоммиченный файл не разъехался с кодом
RUN bun scripts/gen-conversations-version.mjs

CMD ["bun", "run", "src/index.ts"]
