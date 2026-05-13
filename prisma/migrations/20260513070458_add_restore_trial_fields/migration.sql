-- AlterTable
ALTER TABLE `prayerlog` ADD COLUMN `isOnTime` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `restoreReflectionDate` DATE NULL,
    ADD COLUMN `restoreReflectionDone` BOOLEAN NOT NULL DEFAULT false;
