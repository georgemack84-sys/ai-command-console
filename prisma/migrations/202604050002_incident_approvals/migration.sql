-- CreateTable
CREATE TABLE "IncidentApprovalRequest" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "requestedStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approverTarget" TEXT,
    "routingMode" TEXT,
    "routingReason" TEXT,
    "routedFromTarget" TEXT,
    "requestedById" TEXT,
    "requestedByName" TEXT,
    "approvedById" TEXT,
    "approvedByName" TEXT,
    "rejectedById" TEXT,
    "rejectedByName" TEXT,
    "rejectionNote" TEXT,
    "archiveRationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncidentApprovalRequest_workspaceId_status_idx" ON "IncidentApprovalRequest"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "IncidentApprovalRequest_approverTarget_status_idx" ON "IncidentApprovalRequest"("approverTarget", "status");

-- AddForeignKey
ALTER TABLE "IncidentApprovalRequest" ADD CONSTRAINT "IncidentApprovalRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
