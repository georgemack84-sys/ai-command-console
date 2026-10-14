CREATE TYPE "ApplicationPrincipalStatus" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "ApplicationCredentialStatus" AS ENUM ('ACTIVE', 'ROTATED', 'REVOKED');

CREATE TABLE "ApplicationServicePrincipal" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" "ApplicationPrincipalStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "ApplicationServicePrincipal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApplicationServicePrincipal_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RegisteredApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ApplicationServicePrincipal_applicationId_displayName_key" ON "ApplicationServicePrincipal"("applicationId", "displayName");
CREATE INDEX "ApplicationServicePrincipal_applicationId_status_idx" ON "ApplicationServicePrincipal"("applicationId", "status");

CREATE TABLE "ApplicationCredential" (
  "id" TEXT NOT NULL,
  "principalId" TEXT NOT NULL,
  "secretHash" TEXT NOT NULL,
  "secretHint" TEXT NOT NULL,
  "status" "ApplicationCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
  "issuedById" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rotatedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "ApplicationCredential_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApplicationCredential_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "ApplicationServicePrincipal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ApplicationCredential_secretHash_key" ON "ApplicationCredential"("secretHash");
CREATE INDEX "ApplicationCredential_principalId_status_idx" ON "ApplicationCredential"("principalId", "status");
