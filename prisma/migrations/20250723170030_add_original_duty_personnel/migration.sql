/*
  Warnings:

  - You are about to drop the column `dutyJuniorId` on the `DutyRota` table. All the data in the column will be lost.
  - You are about to drop the column `dutySeniorId` on the `DutyRota` table. All the data in the column will be lost.
  - Added the required column `actualJuniorId` to the `DutyRota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actualSeniorId` to the `DutyRota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalJuniorId` to the `DutyRota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalSeniorId` to the `DutyRota` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `DutyRota` DROP FOREIGN KEY `DutyRota_dutyJuniorId_fkey`;

-- DropForeignKey
ALTER TABLE `DutyRota` DROP FOREIGN KEY `DutyRota_dutySeniorId_fkey`;

-- DropIndex
DROP INDEX `DutyRota_dutyJuniorId_fkey` ON `DutyRota`;

-- DropIndex
DROP INDEX `DutyRota_dutySeniorId_fkey` ON `DutyRota`;

-- AlterTable
ALTER TABLE `DutyRota` DROP COLUMN `dutyJuniorId`,
    DROP COLUMN `dutySeniorId`,
    ADD COLUMN `actualJuniorId` INTEGER NOT NULL,
    ADD COLUMN `actualSeniorId` INTEGER NOT NULL,
    ADD COLUMN `originalJuniorId` INTEGER NOT NULL,
    ADD COLUMN `originalSeniorId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `DutyRota` ADD CONSTRAINT `DutyRota_originalSeniorId_fkey` FOREIGN KEY (`originalSeniorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DutyRota` ADD CONSTRAINT `DutyRota_originalJuniorId_fkey` FOREIGN KEY (`originalJuniorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DutyRota` ADD CONSTRAINT `DutyRota_actualSeniorId_fkey` FOREIGN KEY (`actualSeniorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DutyRota` ADD CONSTRAINT `DutyRota_actualJuniorId_fkey` FOREIGN KEY (`actualJuniorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
