ALTER TABLE "NuruDiscovery"
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "eyebrow" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "summary" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "rationale" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "connection" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "paths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "NuruDiscovery_isPublished_updatedAt_idx" ON "NuruDiscovery"("isPublished", "updatedAt");
