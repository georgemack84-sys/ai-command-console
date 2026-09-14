CREATE TABLE "NuruDailyEditionCandidate" (
  "id" TEXT NOT NULL,
  "editionAt" TIMESTAMP(3) NOT NULL,
  "discoveryIds" TEXT[] NOT NULL,
  "featuredId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'prepared',
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "NuruDailyEditionCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NuruDailyEditionCandidate_editionAt_key" ON "NuruDailyEditionCandidate"("editionAt");
