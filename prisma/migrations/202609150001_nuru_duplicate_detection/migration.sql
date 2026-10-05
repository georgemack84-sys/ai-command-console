CREATE TABLE "NuruDuplicateAssessment" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "matchedItemId" TEXT,
  "result" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "metadataScore" DOUBLE PRECISION NOT NULL,
  "semanticScore" DOUBLE PRECISION NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "evidence" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruDuplicateAssessment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NuruDuplicateAssessment_itemId_createdAt_idx" ON "NuruDuplicateAssessment"("itemId", "createdAt");
CREATE INDEX "NuruDuplicateAssessment_contentHash_idx" ON "NuruDuplicateAssessment"("contentHash");
