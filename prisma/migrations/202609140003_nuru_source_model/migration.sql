-- Preserve source location and derived-agent lineage as first-class provenance fields.
ALTER TABLE "NuruSource" ADD COLUMN "location" TEXT;
ALTER TABLE "NuruSource" ADD COLUMN "derivedFromSourceId" TEXT;
CREATE INDEX "NuruSource_derivedFromSourceId_idx" ON "NuruSource"("derivedFromSourceId");
