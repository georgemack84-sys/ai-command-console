CREATE TABLE "NuruCurationQueue" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT,
  "itemId" TEXT,
  "proposalId" TEXT,
  "status" TEXT NOT NULL,
  "lane" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 50,
  "reason" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruCurationQueue_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NuruCurationQueue_status_priority_createdAt_idx" ON "NuruCurationQueue"("status", "priority", "createdAt");
CREATE INDEX "NuruCurationQueue_candidateId_idx" ON "NuruCurationQueue"("candidateId");
CREATE INDEX "NuruCurationQueue_itemId_idx" ON "NuruCurationQueue"("itemId");
CREATE INDEX "NuruCurationQueue_proposalId_idx" ON "NuruCurationQueue"("proposalId");
