-- NSI-13: sentence-level candidates are provenance-bound evidence, not canonical knowledge.
CREATE TABLE "NuruClaimCandidate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "normalizedDocumentId" TEXT NOT NULL,
    "rawArtifactId" TEXT NOT NULL,
    "sourceRegistryId" TEXT NOT NULL,
    "claimText" TEXT NOT NULL,
    "claimType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "passageReference" TEXT NOT NULL,
    "passageText" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "extractionMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NuruClaimCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NuruClaimCandidate_normalizedDocumentId_fingerprint_key" ON "NuruClaimCandidate"("normalizedDocumentId", "fingerprint");
CREATE INDEX "NuruClaimCandidate_workspaceId_status_createdAt_idx" ON "NuruClaimCandidate"("workspaceId", "status", "createdAt");
CREATE INDEX "NuruClaimCandidate_rawArtifactId_passageReference_idx" ON "NuruClaimCandidate"("rawArtifactId", "passageReference");
