CREATE TABLE "NuruDailyEdition" (
  "id" TEXT NOT NULL,
  "editionAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruDailyEdition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NuruDailyEditionItem" (
  "id" TEXT NOT NULL,
  "editionId" TEXT NOT NULL,
  "discoveryId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "NuruDailyEditionItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NuruDailyEditionItem_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "NuruDailyEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NuruDailyEditionItem_discoveryId_fkey" FOREIGN KEY ("discoveryId") REFERENCES "NuruDiscovery"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NuruDailyEdition_editionAt_key" ON "NuruDailyEdition"("editionAt");
CREATE UNIQUE INDEX "NuruDailyEditionItem_editionId_discoveryId_key" ON "NuruDailyEditionItem"("editionId", "discoveryId");
CREATE UNIQUE INDEX "NuruDailyEditionItem_editionId_position_key" ON "NuruDailyEditionItem"("editionId", "position");
CREATE INDEX "NuruDailyEditionItem_editionId_isFeatured_idx" ON "NuruDailyEditionItem"("editionId", "isFeatured");
