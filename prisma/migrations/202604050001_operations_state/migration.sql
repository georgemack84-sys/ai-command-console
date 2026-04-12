-- CreateTable
CREATE TABLE "WorkspaceOperationsState" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "escalationOwner" TEXT,
    "incidentApproverTarget" TEXT,
    "backupApproverTarget" TEXT,
    "snoozedUntil" TIMESTAMP(3),
    "resolutionTaskId" TEXT,
    "resolutionCompletedAt" TIMESTAMP(3),
    "resolutionDescription" TEXT,
    "resolutionOwnerName" TEXT,
    "incidentSummary" TEXT,
    "incidentSummaryUpdatedAt" TIMESTAMP(3),
    "incidentHandoffDraft" TEXT,
    "incidentHandoffDraftUpdatedAt" TIMESTAMP(3),
    "incidentArchiveRecommendation" TEXT,
    "incidentStatus" TEXT NOT NULL DEFAULT 'open',
    "incidentStatusUpdatedAt" TIMESTAMP(3),
    "incidentChecklist" JSONB,
    "lastSweepRunAt" TIMESTAMP(3),
    "lastSweepQueuedAt" TIMESTAMP(3),
    "lastGeneratedCount" INTEGER NOT NULL DEFAULT 0,
    "lastSweepError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceOperationsState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationsFollowup" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "ownerId" TEXT,
    "ownerName" TEXT,
    "linkedInboxItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OperationsFollowup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceOperationsState_workspaceId_key" ON "WorkspaceOperationsState"("workspaceId");

-- CreateIndex
CREATE INDEX "OperationsFollowup_workspaceId_status_idx" ON "OperationsFollowup"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "WorkspaceOperationsState" ADD CONSTRAINT "WorkspaceOperationsState_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationsFollowup" ADD CONSTRAINT "OperationsFollowup_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
