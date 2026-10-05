CREATE TABLE "NuruPersonalEdition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "editionDate" TIMESTAMP(3) NOT NULL,
    "rankingVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NuruPersonalEdition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NuruPersonalEditionItem" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "lane" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "shownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NuruPersonalEditionItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NuruPersonalEdition_userId_editionDate_key" ON "NuruPersonalEdition"("userId", "editionDate");
CREATE INDEX "NuruPersonalEdition_userId_createdAt_idx" ON "NuruPersonalEdition"("userId", "createdAt");
CREATE UNIQUE INDEX "NuruPersonalEditionItem_editionId_position_key" ON "NuruPersonalEditionItem"("editionId", "position");
CREATE UNIQUE INDEX "NuruPersonalEditionItem_editionId_candidateId_key" ON "NuruPersonalEditionItem"("editionId", "candidateId");
CREATE INDEX "NuruPersonalEditionItem_candidateId_shownAt_idx" ON "NuruPersonalEditionItem"("candidateId", "shownAt");
ALTER TABLE "NuruPersonalEdition" ADD CONSTRAINT "NuruPersonalEdition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruPersonalEditionItem" ADD CONSTRAINT "NuruPersonalEditionItem_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "NuruPersonalEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruPersonalEditionItem" ADD CONSTRAINT "NuruPersonalEditionItem_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "NuruDiscoveryCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
