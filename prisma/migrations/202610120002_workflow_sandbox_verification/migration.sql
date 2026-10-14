-- A sandbox endpoint must be verified and then explicitly approved by the
-- workspace owner before it can be used for any workflow dispatch.
CREATE TABLE "WorkflowSandboxVerification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sandboxUrl" TEXT NOT NULL,
    "verificationProof" JSONB NOT NULL,
    "verifiedById" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowSandboxVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowSandboxVerification_workspaceId_sandboxUrl_key"
ON "WorkflowSandboxVerification"("workspaceId", "sandboxUrl");

CREATE INDEX "WorkflowSandboxVerification_workspaceId_approvedAt_idx"
ON "WorkflowSandboxVerification"("workspaceId", "approvedAt");
