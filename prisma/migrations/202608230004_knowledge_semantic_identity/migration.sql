ALTER TABLE "KnowledgeEntry"
  ADD COLUMN "semanticKey" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "semanticValue" TEXT NOT NULL DEFAULT '';

UPDATE "KnowledgeEntry"
SET
  "semanticKey" = lower(regexp_replace(trim("title"), '\\s+', ' ', 'g')),
  "semanticValue" = lower(regexp_replace(trim("content"), '\\s+', ' ', 'g'));

CREATE INDEX "KnowledgeEntry_workspaceId_semanticKey_idx" ON "KnowledgeEntry"("workspaceId", "semanticKey");
