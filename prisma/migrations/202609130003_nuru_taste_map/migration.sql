CREATE TABLE "NuruTasteSignal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "cluster" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "confirmedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruTasteSignal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NuruTasteSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NuruTasteSignal_userId_nodeId_key" ON "NuruTasteSignal"("userId", "nodeId");
CREATE INDEX "NuruTasteSignal_userId_isActive_score_idx" ON "NuruTasteSignal"("userId", "isActive", "score");
