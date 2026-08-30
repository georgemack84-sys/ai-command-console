ALTER TABLE "headline_flow_event_evidence"
  ADD COLUMN "articleId" TEXT,
  ADD COLUMN "providerId" TEXT,
  ADD COLUMN "providerArticleId" TEXT,
  ADD COLUMN "articleFingerprint" TEXT,
  ADD COLUMN "author" TEXT,
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "retrievedAt" TIMESTAMP(3),
  ADD COLUMN "updateReason" TEXT NOT NULL DEFAULT 'new_evidence';

CREATE INDEX "headline_flow_event_evidence_providerId_providerArticleId_idx"
  ON "headline_flow_event_evidence"("providerId", "providerArticleId");

CREATE INDEX "headline_flow_event_evidence_articleFingerprint_idx"
  ON "headline_flow_event_evidence"("articleFingerprint");
