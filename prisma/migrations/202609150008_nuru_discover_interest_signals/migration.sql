CREATE TABLE "NuruDiscoverInterestSignal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "knowledgeItemId" TEXT NOT NULL,
  "signalType" TEXT NOT NULL,
  "weight" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruDiscoverInterestSignal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NuruDiscoverInterestSignal_userId_createdAt_idx" ON "NuruDiscoverInterestSignal"("userId", "createdAt");
CREATE INDEX "NuruDiscoverInterestSignal_userId_knowledgeItemId_createdAt_idx" ON "NuruDiscoverInterestSignal"("userId", "knowledgeItemId", "createdAt");
CREATE INDEX "NuruDiscoverInterestSignal_knowledgeItemId_createdAt_idx" ON "NuruDiscoverInterestSignal"("knowledgeItemId", "createdAt");

ALTER TABLE "NuruDiscoverInterestSignal" ADD CONSTRAINT "NuruDiscoverInterestSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruDiscoverInterestSignal" ADD CONSTRAINT "NuruDiscoverInterestSignal_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "NuruKnowledgeItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
