ALTER TABLE "NuruDiscoveryCandidate" ADD COLUMN "externalKey" TEXT;
CREATE UNIQUE INDEX "NuruDiscoveryCandidate_externalKey_key" ON "NuruDiscoveryCandidate"("externalKey");
