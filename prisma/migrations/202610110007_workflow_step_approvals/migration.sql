CREATE TYPE "WorkflowStepApprovalStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "WorkflowStepApproval" (
  "id" TEXT NOT NULL,
  "workflowRunId" TEXT NOT NULL,
  "stepKey" TEXT NOT NULL,
  "status" "WorkflowStepApprovalStatus" NOT NULL DEFAULT 'REQUESTED',
  "reason" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectedById" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectionNote" TEXT,
  CONSTRAINT "WorkflowStepApproval_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowStepApproval_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "WorkflowStepApproval_workflowRunId_stepKey_status_requestedAt_idx"
  ON "WorkflowStepApproval"("workflowRunId", "stepKey", "status", "requestedAt");
