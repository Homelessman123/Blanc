-- AlterTable
ALTER TABLE `contest` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `currentParticipants` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `maxParticipants` INTEGER NULL,
    ADD COLUMN `prize` VARCHAR(191) NULL,
    ADD COLUMN `registrationDeadline` DATETIME(3) NULL,
    ADD COLUMN `requirements` TEXT NULL,
    ADD COLUMN `tags` TEXT NULL;

-- AlterTable
ALTER TABLE `order` MODIFY `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `payoutrequest` MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `product` ADD COLUMN `categories` TEXT NULL,
    ADD COLUMN `downloadUrl` VARCHAR(191) NULL,
    ADD COLUMN `imageUrl` VARCHAR(191) NULL,
    ADD COLUMN `isApproved` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `rating` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `reviewCount` INTEGER NOT NULL DEFAULT 0,
    MODIFY `type` ENUM('COURSE', 'DOCUMENT', 'WORKSHOP', 'CONSULTATION') NOT NULL;

-- AlterTable
ALTER TABLE `transaction` MODIFY `type` ENUM('SALE', 'PAYOUT', 'REFUND', 'DEPOSIT') NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `contestReminders` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `displayName` VARCHAR(191) NULL,
    ADD COLUMN `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `lastLoginDate` DATETIME(3) NULL,
    ADD COLUMN `profileColor` VARCHAR(191) NULL DEFAULT '#6366f1',
    ADD COLUMN `profileGif` VARCHAR(191) NULL,
    ADD COLUMN `pushNotifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `streak` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `ContestParticipation` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `contestId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ContestParticipation_userId_contestId_key`(`userId`, `contestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CalendarEvent` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `type` ENUM('CONTEST_DEADLINE', 'CONTEST_START', 'PERSONAL', 'REMINDER') NOT NULL DEFAULT 'PERSONAL',
    `isAllDay` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NOT NULL,
    `contestId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'CONTEST_REMINDER', 'PAYMENT_SUCCESS', 'PAYOUT_APPROVED') NOT NULL DEFAULT 'INFO',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `actionUrl` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `sender` ENUM('USER', 'ADMIN', 'BOT') NOT NULL DEFAULT 'USER',
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductReview` (
    `id` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `reviewerName` VARCHAR(191) NULL,
    `reviewerEmail` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ContestParticipation` ADD CONSTRAINT `ContestParticipation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContestParticipation` ADD CONSTRAINT `ContestParticipation_contestId_fkey` FOREIGN KEY (`contestId`) REFERENCES `Contest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CalendarEvent` ADD CONSTRAINT `CalendarEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CalendarEvent` ADD CONSTRAINT `CalendarEvent_contestId_fkey` FOREIGN KEY (`contestId`) REFERENCES `Contest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReview` ADD CONSTRAINT `ProductReview_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
