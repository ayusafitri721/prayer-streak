-- CreateTable
CREATE TABLE `QuranBookmark` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `surahNumber` INTEGER NOT NULL,
    `verseNumber` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `QuranBookmark_userId_surahNumber_verseNumber_key` ON `QuranBookmark`(`userId`, `surahNumber`, `verseNumber`);

-- CreateIndex
CREATE INDEX `QuranBookmark_userId_createdAt_idx` ON `QuranBookmark`(`userId`, `createdAt`);

-- AddForeignKey
ALTER TABLE `QuranBookmark` ADD CONSTRAINT `QuranBookmark_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
