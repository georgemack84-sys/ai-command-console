-- NSI-09/10: normalized content is a derived working record, never a replacement for raw bytes.
CREATE TABLE "NuruNormalizedDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "rawArtifactId" TEXT NOT NULL,
    "sourceRegistryId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "sections" JSONB NOT NULL,
    "language" TEXT,
    "extractionMethod" TEXT NOT NULL,
    "contentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NuruNormalizedDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NuruNormalizedDocument_rawArtifactId_key" ON "NuruNormalizedDocument"("rawArtifactId");
CREATE INDEX "NuruNormalizedDocument_workspaceId_sourceRegistryId_status_idx" ON "NuruNormalizedDocument"("workspaceId", "sourceRegistryId", "status");
