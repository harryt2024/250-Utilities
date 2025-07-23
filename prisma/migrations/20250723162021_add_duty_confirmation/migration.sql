-- AlterTable
ALTER TABLE `DutyRota` ADD COLUMN `juniorConfirmed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `seniorConfirmed` BOOLEAN NOT NULL DEFAULT false;
