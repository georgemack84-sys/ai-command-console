ALTER TABLE "KnowledgePromotion"
  ADD COLUMN "provenance_record_id" TEXT;

CREATE INDEX "KnowledgePromotion_workspaceId_provenance_record_id_idx"
  ON "KnowledgePromotion"("workspaceId", "provenance_record_id");
