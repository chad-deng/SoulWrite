-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deliveryChannel" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "deliveryContactJson" TEXT;
