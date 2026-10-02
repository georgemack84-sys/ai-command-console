CREATE TABLE "NuruDiscoverCatalogEntry" (
  "id" TEXT NOT NULL,
  "knowledgeItemId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "reason" TEXT NOT NULL,
  "admittedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruDiscoverCatalogEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NuruDiscoverCatalogEntry_knowledgeItemId_key" ON "NuruDiscoverCatalogEntry"("knowledgeItemId");
CREATE INDEX "NuruDiscoverCatalogEntry_status_updatedAt_idx" ON "NuruDiscoverCatalogEntry"("status", "updatedAt");
ALTER TABLE "NuruDiscoverCatalogEntry" ADD CONSTRAINT "NuruDiscoverCatalogEntry_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "NuruKnowledgeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve prior explicit admissions that were stored in knowledge metadata
-- before the catalog boundary was introduced.
INSERT INTO "NuruDiscoverCatalogEntry" ("id", "knowledgeItemId", "status", "topics", "reason", "admittedBy", "createdAt", "updatedAt")
SELECT CONCAT('legacy-catalog-', "id"), "id", 'ACTIVE', ARRAY[]::TEXT[], 'Migrated existing Discover admission.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "NuruKnowledgeItem"
WHERE "status" = 'APPROVED' AND "metadata"->>'discoverability' = 'DISCOVERABLE';
