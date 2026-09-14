CREATE TYPE "NuruDiscoveryCategory" AS ENUM ('near_certain', 'adjacent', 'serendipity', 'wildcard', 'featured');

CREATE TABLE "NuruDiscovery" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "meta" TEXT NOT NULL,
  "category" "NuruDiscoveryCategory" NOT NULL,
  "matchScore" INTEGER NOT NULL,
  "imageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruDiscovery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NuruUserDiscoveryPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "discoveryId" TEXT NOT NULL,
  "savedAt" TIMESTAMP(3),
  "dismissedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruUserDiscoveryPreference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NuruUserDiscoveryPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NuruUserDiscoveryPreference_discoveryId_fkey" FOREIGN KEY ("discoveryId") REFERENCES "NuruDiscovery"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "NuruInsightFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruInsightFeedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NuruInsightFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NuruUserDiscoveryPreference_userId_discoveryId_key" ON "NuruUserDiscoveryPreference"("userId", "discoveryId");
CREATE INDEX "NuruUserDiscoveryPreference_userId_savedAt_idx" ON "NuruUserDiscoveryPreference"("userId", "savedAt");
CREATE INDEX "NuruUserDiscoveryPreference_userId_dismissedAt_idx" ON "NuruUserDiscoveryPreference"("userId", "dismissedAt");
CREATE UNIQUE INDEX "NuruInsightFeedback_userId_key" ON "NuruInsightFeedback"("userId");
