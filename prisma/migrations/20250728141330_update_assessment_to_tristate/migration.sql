/*
  Warnings:

  - You are about to alter the column `firstClassLogbookCompleted` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `basicCyberSecurityVideoWatched` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `correctUseOfBothFullCallsigns` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `authenticateRequested` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `authenticateAnsweredCorrectly` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `radioCheckRequested` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `radioCheckAnsweredCorrectly` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `tacticalMessageFullyAnswered` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `iSayAgainUsedCorrectly` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `sayAgainUsed` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `prowordKnowledgeCompletedOK` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `securityKnowledgeCompletedOK` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.
  - You are about to alter the column `generalOperatingAndConfidence` on the `RadioAssessment` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(17))`.

*/
-- AlterTable
ALTER TABLE `RadioAssessment` MODIFY `firstClassLogbookCompleted` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `basicCyberSecurityVideoWatched` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `correctUseOfBothFullCallsigns` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `authenticateRequested` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `authenticateAnsweredCorrectly` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `radioCheckRequested` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `radioCheckAnsweredCorrectly` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `tacticalMessageFullyAnswered` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `iSayAgainUsedCorrectly` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `sayAgainUsed` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `prowordKnowledgeCompletedOK` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `securityKnowledgeCompletedOK` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING',
    MODIFY `generalOperatingAndConfidence` ENUM('PENDING', 'PASS', 'FAIL') NOT NULL DEFAULT 'PENDING';
