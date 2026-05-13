-- CreateTable
CREATE TABLE "AdminOverride" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT,
    "username" TEXT,

    CONSTRAINT "AdminOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminOverride_telegramId_key" ON "AdminOverride"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminOverride_username_key" ON "AdminOverride"("username");
