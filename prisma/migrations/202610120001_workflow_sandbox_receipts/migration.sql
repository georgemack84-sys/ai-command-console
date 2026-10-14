CREATE TABLE "WorkflowSandboxReceipt" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "applicationSlug" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "inputFingerprint" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "responseSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowSandboxReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowSandboxReceipt_workspaceId_applicationSlug_operation_idempotencyKey_key"
  ON "WorkflowSandboxReceipt"("workspaceId", "applicationSlug", "operation", "idempotencyKey");
CREATE INDEX "WorkflowSandboxReceipt_workspaceId_correlationId_createdAt_idx"
  ON "WorkflowSandboxReceipt"("workspaceId", "correlationId", "createdAt");
