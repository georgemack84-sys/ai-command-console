CREATE TYPE "WorkflowDefinitionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED', 'RETIRED');
CREATE TYPE "WorkflowRunStatus" AS ENUM ('CREATED', 'VALIDATING', 'READY', 'RUNNING', 'WAITING_APPROVAL', 'RETRY_WAIT', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "WorkflowStepRunStatus" AS ENUM ('PENDING', 'RUNNING', 'WAITING_APPROVAL', 'RETRY_WAIT', 'COMPLETED', 'FAILED', 'SKIPPED', 'CANCELLED');

CREATE TABLE "WorkflowDefinition" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "WorkflowDefinitionStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowDefinition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowDefinition_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WorkflowDefinition_workspaceId_slug_key" ON "WorkflowDefinition"("workspaceId", "slug");
CREATE INDEX "WorkflowDefinition_workspaceId_status_idx" ON "WorkflowDefinition"("workspaceId", "status");

CREATE TABLE "WorkflowVersion" (
  "id" TEXT NOT NULL,
  "workflowDefinitionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "definitionSnapshot" JSONB NOT NULL,
  "definitionHash" TEXT NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "publishedById" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowVersion_workflowDefinitionId_fkey" FOREIGN KEY ("workflowDefinitionId") REFERENCES "WorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WorkflowVersion_workflowDefinitionId_version_key" ON "WorkflowVersion"("workflowDefinitionId", "version");
CREATE UNIQUE INDEX "WorkflowVersion_workflowDefinitionId_definitionHash_key" ON "WorkflowVersion"("workflowDefinitionId", "definitionHash");
CREATE INDEX "WorkflowVersion_workflowDefinitionId_publishedAt_idx" ON "WorkflowVersion"("workflowDefinitionId", "publishedAt");

CREATE TABLE "WorkflowRun" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "workflowVersionId" TEXT NOT NULL,
  "status" "WorkflowRunStatus" NOT NULL DEFAULT 'CREATED',
  "correlationId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "inputSnapshot" JSONB NOT NULL,
  "versionSnapshot" JSONB NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WorkflowRun_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WorkflowRun_workspaceId_idempotencyKey_key" ON "WorkflowRun"("workspaceId", "idempotencyKey");
CREATE INDEX "WorkflowRun_workspaceId_status_createdAt_idx" ON "WorkflowRun"("workspaceId", "status", "createdAt");
CREATE INDEX "WorkflowRun_workflowVersionId_createdAt_idx" ON "WorkflowRun"("workflowVersionId", "createdAt");
CREATE INDEX "WorkflowRun_workspaceId_correlationId_idx" ON "WorkflowRun"("workspaceId", "correlationId");

CREATE TABLE "WorkflowStepRun" (
  "id" TEXT NOT NULL,
  "workflowRunId" TEXT NOT NULL,
  "stepKey" TEXT NOT NULL,
  "attempt" INTEGER NOT NULL,
  "status" "WorkflowStepRunStatus" NOT NULL DEFAULT 'PENDING',
  "inputSnapshot" JSONB NOT NULL,
  "outputSnapshot" JSONB,
  "authorizationSnapshot" JSONB,
  "idempotencyKey" TEXT NOT NULL,
  "failureCode" TEXT,
  "failureDetail" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowStepRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowStepRun_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WorkflowStepRun_workflowRunId_stepKey_attempt_key" ON "WorkflowStepRun"("workflowRunId", "stepKey", "attempt");
CREATE UNIQUE INDEX "WorkflowStepRun_workflowRunId_idempotencyKey_key" ON "WorkflowStepRun"("workflowRunId", "idempotencyKey");
CREATE INDEX "WorkflowStepRun_workflowRunId_status_createdAt_idx" ON "WorkflowStepRun"("workflowRunId", "status", "createdAt");
