CREATE TABLE "NuruSourceClassification" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "claimCandidateId" TEXT NOT NULL,
  "sourceRegistryId" TEXT NOT NULL,
  "sourceClass" TEXT NOT NULL,
  "context" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "classifiedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruSourceClassification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NuruSourceClassification_claimCandidateId_sourceRegistryId_key" ON "NuruSourceClassification"("claimCandidateId", "sourceRegistryId");
CREATE INDEX "NuruSourceClassification_workspaceId_sourceRegistryId_createdAt_idx" ON "NuruSourceClassification"("workspaceId", "sourceRegistryId", "createdAt");
CREATE INDEX "NuruSourceClassification_claimCandidateId_idx" ON "NuruSourceClassification"("claimCandidateId");
