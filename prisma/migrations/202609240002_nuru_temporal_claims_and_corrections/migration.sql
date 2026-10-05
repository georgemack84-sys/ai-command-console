-- NURU-HF03/05/08: temporal claim assertions and correction decisions retain
-- prior understanding. Neither table grants canonical-admission authority.
CREATE TABLE "NuruTemporalClaim" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "predicate" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "normalizedValue" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "assertedAt" TIMESTAMP(3) NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "developmentId" TEXT,
  "evidence" JSONB NOT NULL,
  "provenance" JSONB NOT NULL,
  "createdBy" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  CONSTRAINT "NuruTemporalClaim_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NuruTemporalClaim_workspaceId_subjectId_predicate_effectiveFrom_idx" ON "NuruTemporalClaim"("workspaceId", "subjectId", "predicate", "effectiveFrom");
CREATE INDEX "NuruTemporalClaim_workspaceId_state_recordedAt_idx" ON "NuruTemporalClaim"("workspaceId", "state", "recordedAt");
CREATE INDEX "NuruTemporalClaim_developmentId_idx" ON "NuruTemporalClaim"("developmentId");

CREATE TABLE "NuruKnowledgeCorrection" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "previousClaimId" TEXT NOT NULL,
  "correctedClaimId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "requestedBy" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruKnowledgeCorrection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NuruKnowledgeCorrection_workspaceId_subjectId_createdAt_idx" ON "NuruKnowledgeCorrection"("workspaceId", "subjectId", "createdAt");
CREATE INDEX "NuruKnowledgeCorrection_previousClaimId_idx" ON "NuruKnowledgeCorrection"("previousClaimId");
CREATE INDEX "NuruKnowledgeCorrection_correctedClaimId_idx" ON "NuruKnowledgeCorrection"("correctedClaimId");

CREATE TABLE "NuruKnowledgeCorrectionDecision" (
  "id" TEXT NOT NULL,
  "correctionId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "decidedBy" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruKnowledgeCorrectionDecision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NuruKnowledgeCorrectionDecision_correctionId_key" ON "NuruKnowledgeCorrectionDecision"("correctionId");
CREATE INDEX "NuruKnowledgeCorrectionDecision_correctionId_createdAt_idx" ON "NuruKnowledgeCorrectionDecision"("correctionId", "createdAt");

CREATE OR REPLACE FUNCTION "nuru_temporal_knowledge_block_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Temporal knowledge history is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "NuruTemporalClaim_block_update" BEFORE UPDATE ON "NuruTemporalClaim" FOR EACH ROW EXECUTE FUNCTION "nuru_temporal_knowledge_block_mutation"();
CREATE TRIGGER "NuruTemporalClaim_block_delete" BEFORE DELETE ON "NuruTemporalClaim" FOR EACH ROW EXECUTE FUNCTION "nuru_temporal_knowledge_block_mutation"();
CREATE TRIGGER "NuruKnowledgeCorrection_block_update" BEFORE UPDATE ON "NuruKnowledgeCorrection" FOR EACH ROW EXECUTE FUNCTION "nuru_temporal_knowledge_block_mutation"();
CREATE TRIGGER "NuruKnowledgeCorrection_block_delete" BEFORE DELETE ON "NuruKnowledgeCorrection" FOR EACH ROW EXECUTE FUNCTION "nuru_temporal_knowledge_block_mutation"();
CREATE TRIGGER "NuruKnowledgeCorrectionDecision_block_update" BEFORE UPDATE ON "NuruKnowledgeCorrectionDecision" FOR EACH ROW EXECUTE FUNCTION "nuru_temporal_knowledge_block_mutation"();
CREATE TRIGGER "NuruKnowledgeCorrectionDecision_block_delete" BEFORE DELETE ON "NuruKnowledgeCorrectionDecision" FOR EACH ROW EXECUTE FUNCTION "nuru_temporal_knowledge_block_mutation"();
