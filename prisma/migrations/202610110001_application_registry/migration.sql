CREATE TYPE "ApplicationLifecycleState" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'SUSPENDED',
  'MAINTENANCE',
  'DEPRECATED',
  'RETIRED'
);

CREATE TABLE "RegisteredApplication" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ownerApplicationContact" TEXT NOT NULL,
  "lifecycleState" "ApplicationLifecycleState" NOT NULL DEFAULT 'DRAFT',
  "supportedContractVersions" TEXT[] NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegisteredApplication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RegisteredApplication_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RegisteredApplication_workspaceId_slug_key"
  ON "RegisteredApplication"("workspaceId", "slug");
CREATE INDEX "RegisteredApplication_workspaceId_lifecycleState_idx"
  ON "RegisteredApplication"("workspaceId", "lifecycleState");
