-- CreateTable
CREATE TABLE `FavoriteContent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `FavoriteContent_userId_type_reference_key` ON `FavoriteContent`(`userId`, `type`, `reference`);

-- CreateIndex
CREATE INDEX `FavoriteContent_userId_createdAt_idx` ON `FavoriteContent`(`userId`, `createdAt`);

-- AddForeignKey
ALTER TABLE `FavoriteContent` ADD CONSTRAINT `FavoriteContent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
