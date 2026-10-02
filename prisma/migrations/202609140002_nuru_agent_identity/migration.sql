-- Agent identity snapshots make every automated judgment attributable to its exact capability profile.
ALTER TABLE "NuruAgentRun" ADD COLUMN "identitySnapshot" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "NuruAgentIdentity" (
  "agentId" TEXT NOT NULL,
  "agentType" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "permissions" JSONB NOT NULL,
  "tools" JSONB NOT NULL,
  "policyProfile" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruAgentIdentity_pkey" PRIMARY KEY ("agentId")
);

CREATE INDEX "NuruAgentIdentity_status_agentType_idx" ON "NuruAgentIdentity"("status", "agentType");
