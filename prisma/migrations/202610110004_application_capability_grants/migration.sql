CREATE TYPE "ApplicationCapabilityGrantStatus" AS ENUM ('REQUESTED', 'ACTIVE', 'DENIED', 'REVOKED');
CREATE TABLE "ApplicationCapabilityGrant" (
  "id" TEXT NOT NULL, "capabilityId" TEXT NOT NULL, "principalId" TEXT NOT NULL, "scope" JSONB NOT NULL,
  "status" "ApplicationCapabilityGrantStatus" NOT NULL DEFAULT 'REQUESTED', "requestedById" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "approvedById" TEXT, "approvedAt" TIMESTAMP(3),
  "revokedById" TEXT, "revokedAt" TIMESTAMP(3), "revokeReason" TEXT,
  CONSTRAINT "ApplicationCapabilityGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApplicationCapabilityGrant_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "ApplicationCapability"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ApplicationCapabilityGrant_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "ApplicationServicePrincipal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ApplicationCapabilityGrant_capabilityId_status_idx" ON "ApplicationCapabilityGrant"("capabilityId", "status");
CREATE INDEX "ApplicationCapabilityGrant_principalId_status_idx" ON "ApplicationCapabilityGrant"("principalId", "status");
