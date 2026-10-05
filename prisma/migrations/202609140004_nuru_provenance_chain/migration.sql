CREATE TABLE "NuruProvenanceLink" (
  "id" TEXT NOT NULL,
  "knowledgeItemId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "stage" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "actor" TEXT NOT NULL,
  "details" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruProvenanceLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NuruProvenanceLink_knowledgeItemId_sequence_key" ON "NuruProvenanceLink"("knowledgeItemId", "sequence");
CREATE INDEX "NuruProvenanceLink_referenceId_idx" ON "NuruProvenanceLink"("referenceId");
ALTER TABLE "NuruProvenanceLink" ADD CONSTRAINT "NuruProvenanceLink_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "NuruKnowledgeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
