CREATE TABLE "NuruDiscoveryRetrievalRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "candidateCount" INTEGER NOT NULL DEFAULT 0,
    "failureReason" TEXT,
    "policyVersion" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "NuruDiscoveryRetrievalRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NuruDiscoveryRetrievalRun_sourceId_startedAt_idx" ON "NuruDiscoveryRetrievalRun"("sourceId", "startedAt");
CREATE INDEX "NuruDiscoveryRetrievalRun_status_startedAt_idx" ON "NuruDiscoveryRetrievalRun"("status", "startedAt");
