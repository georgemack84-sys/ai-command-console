-- The original Knowledge foundation migration was omitted from the checked-in
-- migration history. Keep this immediately before the migrations that alter
-- KnowledgeEntry and KnowledgePromotion so a new PostgreSQL database can be
-- built from the complete history.

DO $$
BEGIN
  CREATE TYPE "KnowledgeScopeKind" AS ENUM ('global', 'program', 'project', 'component', 'task', 'session');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "KnowledgeInheritance" AS ENUM ('inheritable', 'local_only');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "KnowledgePromotionStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "KnowledgeScope" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "KnowledgeScopeKind" NOT NULL,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "KnowledgeScope_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgeEntry" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "scopeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "inheritance" "KnowledgeInheritance" NOT NULL DEFAULT 'local_only',
  "visibility" TEXT NOT NULL DEFAULT 'workspace',
  "sourceKnowledgeId" TEXT,
  "sourceScopeId" TEXT,
  "overrideOfId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgePromotion" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "sourceKnowledgeId" TEXT NOT NULL,
  "targetScopeId" TEXT NOT NULL,
  "promotedKnowledgeId" TEXT,
  "status" "KnowledgePromotionStatus" NOT NULL DEFAULT 'pending',
  "requestedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "rejectionReason" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),

  CONSTRAINT "KnowledgePromotion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "KnowledgeScope_workspaceId_kind_idx" ON "KnowledgeScope"("workspaceId", "kind");
CREATE INDEX IF NOT EXISTS "KnowledgeScope_workspaceId_parentId_idx" ON "KnowledgeScope"("workspaceId", "parentId");
CREATE INDEX IF NOT EXISTS "KnowledgeEntry_workspaceId_scopeId_updatedAt_idx" ON "KnowledgeEntry"("workspaceId", "scopeId", "updatedAt");
CREATE INDEX IF NOT EXISTS "KnowledgeEntry_scopeId_inheritance_idx" ON "KnowledgeEntry"("scopeId", "inheritance");
CREATE INDEX IF NOT EXISTS "KnowledgeEntry_overrideOfId_idx" ON "KnowledgeEntry"("overrideOfId");
CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgePromotion_promotedKnowledgeId_key" ON "KnowledgePromotion"("promotedKnowledgeId");
CREATE INDEX IF NOT EXISTS "KnowledgePromotion_workspaceId_status_requestedAt_idx" ON "KnowledgePromotion"("workspaceId", "status", "requestedAt");
CREATE INDEX IF NOT EXISTS "KnowledgePromotion_targetScopeId_status_idx" ON "KnowledgePromotion"("targetScopeId", "status");

DO $$
BEGIN
  ALTER TABLE "KnowledgeScope" ADD CONSTRAINT "KnowledgeScope_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgeScope" ADD CONSTRAINT "KnowledgeScope_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "KnowledgeScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_scopeId_fkey"
    FOREIGN KEY ("scopeId") REFERENCES "KnowledgeScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_sourceKnowledgeId_fkey"
    FOREIGN KEY ("sourceKnowledgeId") REFERENCES "KnowledgeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_overrideOfId_fkey"
    FOREIGN KEY ("overrideOfId") REFERENCES "KnowledgeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgePromotion" ADD CONSTRAINT "KnowledgePromotion_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgePromotion" ADD CONSTRAINT "KnowledgePromotion_sourceKnowledgeId_fkey"
    FOREIGN KEY ("sourceKnowledgeId") REFERENCES "KnowledgeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgePromotion" ADD CONSTRAINT "KnowledgePromotion_promotedKnowledgeId_fkey"
    FOREIGN KEY ("promotedKnowledgeId") REFERENCES "KnowledgeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgePromotion" ADD CONSTRAINT "KnowledgePromotion_targetScopeId_fkey"
    FOREIGN KEY ("targetScopeId") REFERENCES "KnowledgeScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgePromotion" ADD CONSTRAINT "KnowledgePromotion_requestedById_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "KnowledgePromotion" ADD CONSTRAINT "KnowledgePromotion_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
