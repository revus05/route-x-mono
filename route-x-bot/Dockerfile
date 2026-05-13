FROM oven/bun:1.1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bunx prisma generate

CMD ["bun", "run", "src/index.ts"]
