-- DropForeignKey
ALTER TABLE "RaceResult" DROP CONSTRAINT IF EXISTS "RaceResult_eventId_fkey";

-- DropTable
DROP TABLE IF EXISTS "RaceResult";
