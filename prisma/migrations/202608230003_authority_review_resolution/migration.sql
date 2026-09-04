ALTER TABLE "authority_review_requests"
  ADD COLUMN "knowledge_submission" JSONB,
  ADD COLUMN "rejection_reason" TEXT;
