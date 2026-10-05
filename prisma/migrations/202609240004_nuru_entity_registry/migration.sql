-- TD-N05: explicit curator-approved entity identities and aliases for Tandem.
CREATE TABLE "NuruEntity" (
  "id" TEXT NOT NULL,
  "canonicalName" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'APPROVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruEntity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NuruEntity_status_canonicalName_idx" ON "NuruEntity"("status", "canonicalName");

CREATE TABLE "NuruEntityAlias" (
  "id" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "alias" TEXT NOT NULL,
  "normalizedAlias" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruEntityAlias_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NuruEntityAlias_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "NuruEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NuruEntityAlias_normalizedAlias_key" ON "NuruEntityAlias"("normalizedAlias");
CREATE INDEX "NuruEntityAlias_entityId_idx" ON "NuruEntityAlias"("entityId");
