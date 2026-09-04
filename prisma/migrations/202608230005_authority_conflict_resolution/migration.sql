ALTER TABLE "KnowledgeEntry"
  ADD COLUMN "supersededAt" TIMESTAMP(3),
  ADD COLUMN "supersededById" TEXT;

ALTER TABLE "authority_review_requests"
  ADD COLUMN "resolution_action" TEXT;
