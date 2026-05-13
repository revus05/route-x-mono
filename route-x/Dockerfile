# ---------- Stage 1: Deps ----------
FROM oven/bun:1.1.6-alpine AS deps

WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install


# ---------- Stage 2: Build ----------
FROM oven/bun:1.3.6-alpine AS builder

WORKDIR /app

ARG GOOGLE_SHEET_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN GOOGLE_SHEET_URL=${GOOGLE_SHEET_URL} bun run build

# ---------- Stage 3: Run ----------
FROM oven/bun:1.3.6-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["bun", "run", "start"]