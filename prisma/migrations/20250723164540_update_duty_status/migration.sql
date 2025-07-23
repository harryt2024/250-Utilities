/*
  Warnings:

  - You are about to drop the column `juniorConfirmed` on the `DutyRota` table. All the data in the column will be lost.
  - You are about to drop the column `seniorConfirmed` on the `DutyRota` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `DutyRota` DROP COLUMN `juniorConfirmed`,
    DROP COLUMN `seniorConfirmed`,
    ADD COLUMN `juniorStatus` ENUM('UNCONFIRMED', 'ATTENDED', 'ABSENT') NOT NULL DEFAULT 'UNCONFIRMED',
    ADD COLUMN `seniorStatus` ENUM('UNCONFIRMED', 'ATTENDED', 'ABSENT') NOT NULL DEFAULT 'UNCONFIRMED';
