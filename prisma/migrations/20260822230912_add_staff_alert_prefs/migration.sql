-- AlterTable
ALTER TABLE "User" ADD COLUMN     "staffNotifyEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "staffNotifySms" BOOLEAN NOT NULL DEFAULT false;
