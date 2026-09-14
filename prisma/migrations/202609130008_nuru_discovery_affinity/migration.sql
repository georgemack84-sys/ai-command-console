ALTER TABLE "NuruUserDiscoveryPreference" ADD COLUMN "affinity" TEXT;

CREATE INDEX "NuruUserDiscoveryPreference_userId_affinity_idx" ON "NuruUserDiscoveryPreference"("userId", "affinity");
