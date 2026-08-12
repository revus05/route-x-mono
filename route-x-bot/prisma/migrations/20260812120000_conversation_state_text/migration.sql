-- Conversation state is now stored as a string with custom serialization
-- (Date/BigInt aware). Existing rows use the old format and cannot be replayed.
DELETE FROM "ConversationState";

-- AlterTable
ALTER TABLE "ConversationState" ALTER COLUMN "data" SET DATA TYPE TEXT;
