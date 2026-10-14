CREATE TABLE "ApplicationCapability" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "capabilityKey" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "inputSchema" JSONB NOT NULL,
  "requiredPermissions" TEXT[] NOT NULL,
  "constraints" TEXT[] NOT NULL,
  "declaredById" TEXT NOT NULL,
  "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationCapability_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApplicationCapability_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RegisteredApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ApplicationCapability_applicationId_capabilityKey_version_key" ON "ApplicationCapability"("applicationId", "capabilityKey", "version");
CREATE INDEX "ApplicationCapability_applicationId_capabilityKey_idx" ON "ApplicationCapability"("applicationId", "capabilityKey");
