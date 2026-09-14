ALTER TABLE "NuruDiscovery"
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3);

UPDATE "NuruDiscovery" SET "publishedAt" = "updatedAt" WHERE "isPublished" = true;

CREATE INDEX "NuruDiscovery_archivedAt_isPublished_updatedAt_idx" ON "NuruDiscovery"("archivedAt", "isPublished", "updatedAt");
