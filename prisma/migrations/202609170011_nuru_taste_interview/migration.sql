CREATE TABLE "NuruTasteInterviewResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NuruTasteInterviewResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NuruTasteProfileSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "polarity" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "source" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NuruTasteProfileSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NuruTasteEvidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NuruTasteEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NuruTasteInterviewResponse_userId_promptId_key" ON "NuruTasteInterviewResponse"("userId", "promptId");
CREATE INDEX "NuruTasteInterviewResponse_userId_updatedAt_idx" ON "NuruTasteInterviewResponse"("userId", "updatedAt");
CREATE UNIQUE INDEX "NuruTasteProfileSignal_userId_concept_dimension_source_key" ON "NuruTasteProfileSignal"("userId", "concept", "dimension", "source");
CREATE INDEX "NuruTasteProfileSignal_userId_isActive_updatedAt_idx" ON "NuruTasteProfileSignal"("userId", "isActive", "updatedAt");
CREATE INDEX "NuruTasteEvidence_userId_createdAt_idx" ON "NuruTasteEvidence"("userId", "createdAt");
CREATE INDEX "NuruTasteEvidence_signalId_createdAt_idx" ON "NuruTasteEvidence"("signalId", "createdAt");
ALTER TABLE "NuruTasteInterviewResponse" ADD CONSTRAINT "NuruTasteInterviewResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruTasteProfileSignal" ADD CONSTRAINT "NuruTasteProfileSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruTasteEvidence" ADD CONSTRAINT "NuruTasteEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruTasteEvidence" ADD CONSTRAINT "NuruTasteEvidence_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "NuruTasteProfileSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
