import type { VersionedState, VersionedStateStorage } from "@grammyjs/conversations";

import prisma from "./prisma";

const DATE_TAG = "$__date";
const BIGINT_TAG = "$__bigint";

/**
 * Values returned by `conversation.external()` end up in the replay log, so the
 * log has to survive a round trip through the database. Plain JSON would turn
 * Prisma `Date` fields into strings (breaking `date.toLocaleDateString()` on
 * replay) and would throw on `BigInt` columns such as `telegramId`.
 */
function replacer(this: unknown, key: string, value: unknown): unknown {
  // Dates are already stringified by `toJSON` when the replacer runs,
  // so the original value has to be read from the holder object.
  const original = (this as Record<string, unknown>)[key];
  if (original instanceof Date) return { [DATE_TAG]: original.toISOString() };
  if (typeof value === "bigint") return { [BIGINT_TAG]: value.toString() };
  return value;
}

function reviver(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === "object") {
    const tagged = value as Record<string, unknown>;
    if (typeof tagged[DATE_TAG] === "string") return new Date(tagged[DATE_TAG] as string);
    if (typeof tagged[BIGINT_TAG] === "string") return BigInt(tagged[BIGINT_TAG] as string);
  }
  return value;
}

export function serializeState(state: unknown): string {
  return JSON.stringify(state, replacer);
}

export function deserializeState<S>(raw: string): S {
  return JSON.parse(raw, reviver) as S;
}

/**
 * Persists conversation state in Postgres.
 *
 * Required on serverless (Vercel): the process dies after every update, so the
 * default in-memory storage would lose every running conversation.
 */
export function prismaConversationStorage<S>(): VersionedStateStorage<string, S> {
  return {
    async read(key) {
      const row = await prisma.conversationState.findUnique({ where: { key } });
      if (!row) return undefined;
      try {
        return deserializeState<VersionedState<S>>(row.data);
      } catch {
        // Corrupted or outdated payload — start over instead of crashing
        return undefined;
      }
    },
    async write(key, state) {
      const data = serializeState(state);
      await prisma.conversationState.upsert({
        where: { key },
        create: { key, data },
        update: { data },
      });
    },
    async delete(key) {
      await prisma.conversationState.deleteMany({ where: { key } });
    },
  };
}
