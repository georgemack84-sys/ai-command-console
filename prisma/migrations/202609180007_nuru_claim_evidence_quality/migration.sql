CREATE TABLE "NuruClaimEvidenceQuality" (
  "id" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "claimCandidateId" TEXT NOT NULL, "status" TEXT NOT NULL, "confidence" DOUBLE PRECISION NOT NULL, "sourceAuthority" TEXT NOT NULL, "freshness" TEXT NOT NULL, "independence" TEXT NOT NULL, "corroboration" TEXT NOT NULL, "conflicts" TEXT NOT NULL, "missingEvidence" TEXT[] NOT NULL, "warnings" TEXT[] NOT NULL, "qualityRunId" TEXT, "assessedBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruClaimEvidenceQuality_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NuruClaimEvidenceQuality_workspaceId_claimCandidateId_createdAt_idx" ON "NuruClaimEvidenceQuality"("workspaceId", "claimCandidateId", "createdAt");
