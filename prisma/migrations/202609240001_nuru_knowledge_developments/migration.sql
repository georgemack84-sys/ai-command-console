-- NURU-HF01/02: durable, append-only developments are evidence for review,
-- never a direct route into canonical knowledge.
CREATE TABLE "NuruKnowledgeDevelopment" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "eventTime" TIMESTAMP(3) NOT NULL,
  "publicationTime" TIMESTAMP(3),
  "discoveryTime" TIMESTAMP(3) NOT NULL,
  "summary" TEXT NOT NULL,
  "claims" JSONB NOT NULL,
  "evidence" JSONB NOT NULL,
  "entities" JSONB NOT NULL,
  "sourceAuthority" TEXT NOT NULL,
  "verificationState" TEXT NOT NULL,
  "provenance" JSONB NOT NULL,
  "createdBy" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruKnowledgeDevelopment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NuruKnowledgeDevelopment_workspaceId_subjectId_eventTime_idx"
  ON "NuruKnowledgeDevelopment"("workspaceId", "subjectId", "eventTime");
CREATE INDEX "NuruKnowledgeDevelopment_workspaceId_verificationState_createdAt_idx"
  ON "NuruKnowledgeDevelopment"("workspaceId", "verificationState", "createdAt");
CREATE INDEX "NuruKnowledgeDevelopment_correlationId_idx"
  ON "NuruKnowledgeDevelopment"("correlationId");

CREATE OR REPLACE FUNCTION "nuru_knowledge_development_block_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'NuruKnowledgeDevelopment records are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "NuruKnowledgeDevelopment_block_update"
  BEFORE UPDATE ON "NuruKnowledgeDevelopment"
  FOR EACH ROW EXECUTE FUNCTION "nuru_knowledge_development_block_mutation"();
CREATE TRIGGER "NuruKnowledgeDevelopment_block_delete"
  BEFORE DELETE ON "NuruKnowledgeDevelopment"
  FOR EACH ROW EXECUTE FUNCTION "nuru_knowledge_development_block_mutation"();
