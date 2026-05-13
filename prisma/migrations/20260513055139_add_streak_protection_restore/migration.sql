-- AlterTable
ALTER TABLE `user` ADD COLUMN `lastStreakEvaluatedDate` DATE NULL,
    ADD COLUMN `restoreChallengeActive` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `restoreChallengeProgress` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `streakProtection` INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE `StreakDay` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `completedCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL,
    `protectionUsed` BOOLEAN NOT NULL DEFAULT false,
    `restoreProgressAfter` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StreakDay_userId_date_idx`(`userId`, `date`),
    UNIQUE INDEX `StreakDay_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StreakDay` ADD CONSTRAINT `StreakDay_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
