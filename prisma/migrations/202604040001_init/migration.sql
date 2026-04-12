CREATE TYPE "UserRole" AS ENUM ('viewer', 'operator', 'approver', 'admin');
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');
CREATE TYPE "WorkspaceMemberRole" AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE "SourceType" AS ENUM ('website', 'repository', 'integration', 'feed', 'document');
CREATE TYPE "SourceStatus" AS ENUM ('healthy', 'degraded', 'paused');
CREATE TYPE "UpdateSeverity" AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "InsightType" AS ENUM ('summary', 'insight', 'recommendation', 'classification');
CREATE TYPE "InsightStatus" AS ENUM ('ready', 'draft', 'archived');
CREATE TYPE "BriefStatus" AS ENUM ('draft', 'queued', 'in_progress', 'in_review', 'complete');
CREATE TYPE "BriefPriority" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "ReportFormat" AS ENUM ('memo', 'briefing', 'comparison', 'outline');
CREATE TYPE "ReportStatus" AS ENUM ('draft', 'ready', 'published');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'operator',
  "status" "UserStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Workspace" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'scale',
  "statusTone" TEXT NOT NULL DEFAULT 'healthy',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceMember" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "role" "WorkspaceMemberRole" NOT NULL DEFAULT 'member',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgent" TEXT,
  "ipHash" TEXT,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Source" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "SourceType" NOT NULL,
  "status" "SourceStatus" NOT NULL DEFAULT 'healthy',
  "url" TEXT,
  "updateCadence" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MonitoredUpdate" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "severity" "UpdateSeverity" NOT NULL DEFAULT 'medium',
  "category" TEXT NOT NULL,
  "happenedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "MonitoredUpdate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Insight" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "type" "InsightType" NOT NULL,
  "status" "InsightStatus" NOT NULL DEFAULT 'ready',
  "confidence" INTEGER NOT NULL,
  "sourceIds" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,
  CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityEvent" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedView" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "filters" JSONB NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResearchBrief" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "ownerId" TEXT,
  "title" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "status" "BriefStatus" NOT NULL DEFAULT 'draft',
  "priority" "BriefPriority" NOT NULL DEFAULT 'medium',
  "assignedAgent" TEXT NOT NULL,
  "tags" TEXT[],
  "summary" TEXT NOT NULL,
  "linkedTaskId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResearchBrief_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResearchReport" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "briefId" TEXT NOT NULL,
  "ownerId" TEXT,
  "title" TEXT NOT NULL,
  "format" "ReportFormat" NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'draft',
  "excerpt" TEXT NOT NULL,
  "keyFindings" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResearchReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
CREATE INDEX "ActivityEvent_workspaceId_createdAt_idx" ON "ActivityEvent"("workspaceId", "createdAt");

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Source" ADD CONSTRAINT "Source_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MonitoredUpdate" ADD CONSTRAINT "MonitoredUpdate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MonitoredUpdate" ADD CONSTRAINT "MonitoredUpdate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResearchBrief" ADD CONSTRAINT "ResearchBrief_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearchBrief" ADD CONSTRAINT "ResearchBrief_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResearchReport" ADD CONSTRAINT "ResearchReport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearchReport" ADD CONSTRAINT "ResearchReport_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "ResearchBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearchReport" ADD CONSTRAINT "ResearchReport_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
