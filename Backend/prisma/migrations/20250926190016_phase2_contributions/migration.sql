/*
  Warnings:

  - You are about to drop the column `userId` on the `Adoption` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `AiReport` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[adopterUserId,projectId]` on the table `Adoption` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[botRepoFullName]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `adopterUserId` to the `Adoption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `report` to the `AiReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerUserId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Adoption" DROP CONSTRAINT "Adoption_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_ownerId_fkey";

-- DropIndex
DROP INDEX "Adoption_userId_projectId_key";

-- DropIndex
DROP INDEX "Project_ownerId_idx";

-- AlterTable
ALTER TABLE "Adoption" DROP COLUMN "userId",
ADD COLUMN     "adopterUserId" TEXT NOT NULL,
ADD COLUMN     "forkFullName" TEXT;

-- AlterTable
ALTER TABLE "AiReport" DROP COLUMN "content",
ADD COLUMN     "report" JSONB NOT NULL,
ALTER COLUMN "kind" DROP NOT NULL,
ALTER COLUMN "kind" SET DEFAULT 'analysis';

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "ownerId",
ADD COLUMN     "aiHealth" TEXT,
ADD COLUMN     "aiLastGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "aiNextSteps" TEXT,
ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "botRepoFullName" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "demoUrl" TEXT,
ADD COLUMN     "documentationUrl" TEXT,
ADD COLUMN     "keywords" TEXT,
ADD COLUMN     "languages" TEXT,
ADD COLUMN     "originalRepoUrl" TEXT,
ADD COLUMN     "ownerUserId" TEXT NOT NULL,
ADD COLUMN     "reasonHalted" TEXT,
ADD COLUMN     "s3ObjectKey" TEXT,
ADD COLUMN     "s3ObjectUrl" TEXT,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contributorUserId" TEXT,
    "baseCommit" TEXT NOT NULL,
    "headCommit" TEXT NOT NULL,
    "diffTruncated" TEXT NOT NULL,
    "diffSize" INTEGER NOT NULL,
    "aiContributionSummary" TEXT,
    "aiNextSteps" TEXT,
    "aiUpdatedProjectSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSummarySnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "previousSummary" TEXT,
    "newSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSummarySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contribution_projectId_idx" ON "Contribution"("projectId");

-- CreateIndex
CREATE INDEX "Contribution_contributorUserId_idx" ON "Contribution"("contributorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSummarySnapshot_contributionId_key" ON "ProjectSummarySnapshot"("contributionId");

-- CreateIndex
CREATE INDEX "ProjectSummarySnapshot_projectId_idx" ON "ProjectSummarySnapshot"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Adoption_adopterUserId_projectId_key" ON "Adoption"("adopterUserId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_botRepoFullName_key" ON "Project"("botRepoFullName");

-- CreateIndex
CREATE INDEX "Project_ownerUserId_idx" ON "Project"("ownerUserId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adoption" ADD CONSTRAINT "Adoption_adopterUserId_fkey" FOREIGN KEY ("adopterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_contributorUserId_fkey" FOREIGN KEY ("contributorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSummarySnapshot" ADD CONSTRAINT "ProjectSummarySnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSummarySnapshot" ADD CONSTRAINT "ProjectSummarySnapshot_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
