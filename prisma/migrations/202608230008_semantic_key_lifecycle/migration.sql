ALTER TABLE "knowledge_semantic_key_change_requests"
  ADD COLUMN "operation" TEXT NOT NULL DEFAULT 'UPSERT';
