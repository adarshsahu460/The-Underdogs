-- CreateTable
CREATE TABLE "ContributionSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contributorUserId" TEXT,
    "baseCommit" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "manifestVersion" INTEGER NOT NULL DEFAULT 1,
    "archiveObjectKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "resultContributionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContributionSession_resultContributionId_key" ON "ContributionSession"("resultContributionId");

-- CreateIndex
CREATE INDEX "ContributionSession_projectId_idx" ON "ContributionSession"("projectId");

-- CreateIndex
CREATE INDEX "ContributionSession_contributorUserId_idx" ON "ContributionSession"("contributorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionSession_projectId_idempotencyKey_key" ON "ContributionSession"("projectId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "ContributionSession" ADD CONSTRAINT "ContributionSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionSession" ADD CONSTRAINT "ContributionSession_contributorUserId_fkey" FOREIGN KEY ("contributorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionSession" ADD CONSTRAINT "ContributionSession_resultContributionId_fkey" FOREIGN KEY ("resultContributionId") REFERENCES "Contribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
