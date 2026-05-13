-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "eventType" TEXT NOT NULL DEFAULT 'TRACK_DAY';

-- CreateTable
CREATE TABLE "MarshalRegistration" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarshalRegistration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MarshalRegistration" ADD CONSTRAINT "MarshalRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
