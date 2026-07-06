-- CreateTable
CREATE TABLE `resume_optimizations` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `resumeId` VARCHAR(191) NOT NULL,
    `jobPositionId` VARCHAR(191) NOT NULL,
    `originalText` TEXT NOT NULL,
    `optimizedText` TEXT NULL,
    `embedding` TEXT NULL,
    `tokensUsed` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `resume_optimizations_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `resume_optimizations` ADD CONSTRAINT `resume_optimizations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resume_optimizations` ADD CONSTRAINT `resume_optimizations_resumeId_fkey` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resume_optimizations` ADD CONSTRAINT `resume_optimizations_jobPositionId_fkey` FOREIGN KEY (`jobPositionId`) REFERENCES `job_positions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
