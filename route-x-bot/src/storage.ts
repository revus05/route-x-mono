import type { Prisma } from "@prisma/client";
import type { VersionedState, VersionedStateStorage } from "@grammyjs/conversations";

import prisma from "./prisma";

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
      return (row?.data as VersionedState<S> | undefined) ?? undefined;
    },
    async write(key, state) {
      const data = state as unknown as Prisma.InputJsonValue;
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
