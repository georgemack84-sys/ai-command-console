CREATE TABLE "NuruHumanFeedback" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "agentRecommendation" TEXT NOT NULL,
  "humanDecision" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "scope" TEXT,
  "reviewer" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "evaluationStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruHumanFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NuruHumanFeedback_proposalId_createdAt_idx" ON "NuruHumanFeedback"("proposalId", "createdAt");
CREATE INDEX "NuruHumanFeedback_evaluationStatus_createdAt_idx" ON "NuruHumanFeedback"("evaluationStatus", "createdAt");
