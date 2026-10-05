-- NSI-02: identity and admission policy are separate from source monitoring
-- and artifact-level provenance.
CREATE TABLE "NuruSourceRegistry" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "baseUrl" TEXT,
    "category" TEXT NOT NULL,
    "topics" TEXT[] NOT NULL,
    "authorityClass" TEXT NOT NULL,
    "ingestionMethods" TEXT[] NOT NULL,
    "refreshPolicy" TEXT NOT NULL,
    "admissionState" TEXT NOT NULL,
    "operationalState" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "requiresReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessfulFetch" TIMESTAMP(3),
    CONSTRAINT "NuruSourceRegistry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NuruSourceRegistry_workspaceId_admissionState_idx" ON "NuruSourceRegistry"("workspaceId", "admissionState");
CREATE INDEX "NuruSourceRegistry_workspaceId_domain_idx" ON "NuruSourceRegistry"("workspaceId", "domain");
