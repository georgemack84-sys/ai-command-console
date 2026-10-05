-- NSI-03: append-only raw bytes, preserved before any source processing.
CREATE TABLE "NuruRawArtifact" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceRegistryId" TEXT NOT NULL,
    "originUrl" TEXT,
    "contentType" TEXT NOT NULL,
    "body" BYTEA NOT NULL,
    "contentHash" TEXT NOT NULL,
    "byteLength" INTEGER NOT NULL,
    "originalFilename" TEXT,
    "submittedBy" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NuruRawArtifact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NuruRawArtifact_workspaceId_sourceRegistryId_retrievedAt_idx" ON "NuruRawArtifact"("workspaceId", "sourceRegistryId", "retrievedAt");
CREATE INDEX "NuruRawArtifact_contentHash_idx" ON "NuruRawArtifact"("contentHash");
