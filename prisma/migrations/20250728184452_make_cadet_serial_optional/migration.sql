/*
  Warnings:

  - You are about to drop the column `serial` on the `Cadet` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Cadet_serial_key` ON `Cadet`;

-- AlterTable
ALTER TABLE `Cadet` DROP COLUMN `serial`;
