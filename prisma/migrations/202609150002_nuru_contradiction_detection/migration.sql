CREATE TABLE "NuruContradictionAssessment" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "relatedItemId" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "evidence" JSONB NOT NULL,
  "investigation" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruContradictionAssessment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NuruContradictionAssessment_itemId_createdAt_idx" ON "NuruContradictionAssessment"("itemId", "createdAt");
CREATE INDEX "NuruContradictionAssessment_relatedItemId_idx" ON "NuruContradictionAssessment"("relatedItemId");
