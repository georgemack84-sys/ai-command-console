CREATE TABLE "NuruPersonalEditionFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reasonCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruPersonalEditionFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NuruPersonalEditionFeedback_userId_createdAt_idx" ON "NuruPersonalEditionFeedback"("userId", "createdAt");
CREATE INDEX "NuruPersonalEditionFeedback_userId_candidateId_createdAt_idx" ON "NuruPersonalEditionFeedback"("userId", "candidateId", "createdAt");
ALTER TABLE "NuruPersonalEditionFeedback" ADD CONSTRAINT "NuruPersonalEditionFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruPersonalEditionFeedback" ADD CONSTRAINT "NuruPersonalEditionFeedback_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "NuruDiscoveryCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
