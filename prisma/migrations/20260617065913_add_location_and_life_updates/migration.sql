-- AlterTable
ALTER TABLE "SoulProfile" ADD COLUMN     "location" TEXT;

-- CreateTable
CREATE TABLE "LifeUpdate" (
    "id" TEXT NOT NULL,
    "soulProfileId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifeUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LifeUpdate_soulProfileId_idx" ON "LifeUpdate"("soulProfileId");

-- CreateIndex
CREATE INDEX "LifeUpdate_createdAt_idx" ON "LifeUpdate"("createdAt");

-- AddForeignKey
ALTER TABLE "LifeUpdate" ADD CONSTRAINT "LifeUpdate_soulProfileId_fkey" FOREIGN KEY ("soulProfileId") REFERENCES "SoulProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
