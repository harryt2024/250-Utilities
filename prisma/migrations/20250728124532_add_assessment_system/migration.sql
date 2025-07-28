-- CreateTable
CREATE TABLE `Cadet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serial` VARCHAR(191) NOT NULL,
    `sqn` VARCHAR(191) NOT NULL,
    `rank` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Cadet_serial_key`(`serial`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssessmentCohort` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `instructorName` VARCHAR(191) NOT NULL,
    `instructorSqn` VARCHAR(191) NOT NULL,
    `assessorName` VARCHAR(191) NOT NULL,
    `assessorSqn` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RadioAssessment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cadetId` INTEGER NOT NULL,
    `cohortId` INTEGER NOT NULL,
    `firstClassLogbookCompleted` BOOLEAN NOT NULL DEFAULT false,
    `basicCyberSecurityVideoWatched` BOOLEAN NOT NULL DEFAULT false,
    `correctUseOfBothFullCallsigns` BOOLEAN NOT NULL DEFAULT false,
    `authenticateRequested` BOOLEAN NOT NULL DEFAULT false,
    `authenticateAnsweredCorrectly` BOOLEAN NOT NULL DEFAULT false,
    `radioCheckRequested` BOOLEAN NOT NULL DEFAULT false,
    `radioCheckAnsweredCorrectly` BOOLEAN NOT NULL DEFAULT false,
    `tacticalMessageFullyAnswered` BOOLEAN NOT NULL DEFAULT false,
    `iSayAgainUsedCorrectly` BOOLEAN NOT NULL DEFAULT false,
    `sayAgainUsed` BOOLEAN NOT NULL DEFAULT false,
    `prowordKnowledgeCompletedOK` BOOLEAN NOT NULL DEFAULT false,
    `securityKnowledgeCompletedOK` BOOLEAN NOT NULL DEFAULT false,
    `generalOperatingAndConfidence` BOOLEAN NOT NULL DEFAULT false,
    `passFail` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `RadioAssessment_cadetId_cohortId_key`(`cadetId`, `cohortId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RadioAssessment` ADD CONSTRAINT `RadioAssessment_cadetId_fkey` FOREIGN KEY (`cadetId`) REFERENCES `Cadet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RadioAssessment` ADD CONSTRAINT `RadioAssessment_cohortId_fkey` FOREIGN KEY (`cohortId`) REFERENCES `AssessmentCohort`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
