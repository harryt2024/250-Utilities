/*
  Warnings:

  - Added the required column `type` to the `AssessmentCohort` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `AssessmentCohort` ADD COLUMN `type` ENUM('BASIC_RADIO_OPERATOR') NOT NULL;
