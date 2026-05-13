/*
  Warnings:

  - You are about to drop the column `car` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `rxNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `RaceEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RaceResult" DROP CONSTRAINT "RaceResult_eventId_fkey";

-- DropIndex
DROP INDEX "User_rxNumber_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "car",
DROP COLUMN "fullName",
DROP COLUMN "rxNumber";

-- DropTable
DROP TABLE "RaceEvent";

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "rxNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "car" TEXT NOT NULL,
    "instagram" TEXT,
    "driveType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_telegramId_key" ON "EventRegistration"("eventId", "telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_rxNumber_key" ON "EventRegistration"("eventId", "rxNumber");

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
