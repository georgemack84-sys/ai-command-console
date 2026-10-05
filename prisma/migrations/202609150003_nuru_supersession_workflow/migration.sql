CREATE TABLE "NuruSupersessionReview" (
  "id" TEXT NOT NULL,
  "currentItemId" TEXT NOT NULL,
  "candidateItemId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "requestedBy" TEXT NOT NULL,
  "decidedBy" TEXT,
  "decisionReason" TEXT,
  "narrowedScope" TEXT,
  "correlationId" TEXT NOT NULL,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruSupersessionReview_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NuruSupersessionReview_status_createdAt_idx" ON "NuruSupersessionReview"("status", "createdAt");
CREATE INDEX "NuruSupersessionReview_currentItemId_idx" ON "NuruSupersessionReview"("currentItemId");
CREATE INDEX "NuruSupersessionReview_candidateItemId_idx" ON "NuruSupersessionReview"("candidateItemId");
