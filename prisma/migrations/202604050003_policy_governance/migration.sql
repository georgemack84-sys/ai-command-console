CREATE TABLE "PlatformGovernanceSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "currentEnvironment" TEXT NOT NULL DEFAULT 'development',
    "sensitiveActionsRequireApproval" BOOLEAN NOT NULL DEFAULT true,
    "demoScenarioId" TEXT,
    "demoScenarioName" TEXT,
    "demoScenarioDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformGovernanceSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EnvironmentPolicy" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "minimumRoleForCommands" TEXT NOT NULL,
    "minimumRoleForApprovals" TEXT NOT NULL,
    "minimumRoleForGovernance" TEXT NOT NULL,
    "requireChecklistForResolved" BOOLEAN NOT NULL DEFAULT false,
    "requiredChecklistForResolved" TEXT[],
    "requireSummaryShareBeforeArchived" BOOLEAN NOT NULL DEFAULT false,
    "requireApprovalForResolved" BOOLEAN NOT NULL DEFAULT false,
    "requireApprovalForArchived" BOOLEAN NOT NULL DEFAULT false,
    "incidentApprovalReminderMinutes" INTEGER NOT NULL DEFAULT 30,
    "incidentApprovalEscalationMinutes" INTEGER NOT NULL DEFAULT 60,
    "incidentApprovalEscalationTarget" TEXT NOT NULL DEFAULT 'team',
    "incidentApprovalFinalEscalationMinutes" INTEGER NOT NULL DEFAULT 120,
    "incidentApprovalFinalEscalationTarget" TEXT NOT NULL DEFAULT 'role:admin',
    "incidentApprovalCapacityLimit" INTEGER NOT NULL DEFAULT 3,
    "autoPromoteApprovalRecommendations" BOOLEAN NOT NULL DEFAULT false,
    "autoPromoteRecommendationConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "autoPromoteObservationHours" INTEGER NOT NULL DEFAULT 24,
    "autoPromoteCooldownHours" INTEGER NOT NULL DEFAULT 72,
    "trustDropAction" TEXT NOT NULL DEFAULT 'notify',
    "trustDropFollowupOwner" TEXT,
    "promoteTrustDropToIncident" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvironmentPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspacePolicyOverride" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "environment" TEXT,
    "incidentApprovalCapacityLimit" INTEGER,
    "incidentApprovalReminderMinutes" INTEGER,
    "trustDropAction" TEXT,
    "trustDropFollowupOwner" TEXT,
    "requireApprovalForResolved" BOOLEAN,
    "requireApprovalForArchived" BOOLEAN,
    "promoteTrustDropToIncident" BOOLEAN,
    "sourceType" TEXT,
    "sourcePlaybookId" TEXT,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspacePolicyOverride_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PolicyPlaybook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "incidentApprovalCapacityLimit" INTEGER NOT NULL,
    "trustDropAction" TEXT NOT NULL,
    "requireApprovalForResolved" BOOLEAN NOT NULL DEFAULT false,
    "promoteTrustDropToIncident" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyPlaybook_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PolicyPlaybookRollout" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "workspaceCount" INTEGER NOT NULL DEFAULT 0,
    "appliedById" TEXT,
    "appliedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rolledBackAt" TIMESTAMP(3),

    CONSTRAINT "PolicyPlaybookRollout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PolicyPlaybookRolloutWorkspace" (
    "id" TEXT NOT NULL,
    "rolloutId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "workspaceName" TEXT NOT NULL,
    "beforeOverride" JSONB,
    "afterOverride" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyPlaybookRolloutWorkspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EnvironmentPolicy_environment_key" ON "EnvironmentPolicy"("environment");
CREATE UNIQUE INDEX "WorkspacePolicyOverride_workspaceId_key" ON "WorkspacePolicyOverride"("workspaceId");
CREATE INDEX "WorkspacePolicyOverride_sourcePlaybookId_idx" ON "WorkspacePolicyOverride"("sourcePlaybookId");
CREATE INDEX "PolicyPlaybookRollout_playbookId_createdAt_idx" ON "PolicyPlaybookRollout"("playbookId", "createdAt");
CREATE UNIQUE INDEX "PolicyPlaybookRolloutWorkspace_rolloutId_workspaceId_key" ON "PolicyPlaybookRolloutWorkspace"("rolloutId", "workspaceId");
CREATE INDEX "PolicyPlaybookRolloutWorkspace_workspaceId_createdAt_idx" ON "PolicyPlaybookRolloutWorkspace"("workspaceId", "createdAt");

ALTER TABLE "WorkspacePolicyOverride" ADD CONSTRAINT "WorkspacePolicyOverride_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspacePolicyOverride" ADD CONSTRAINT "WorkspacePolicyOverride_sourcePlaybookId_fkey" FOREIGN KEY ("sourcePlaybookId") REFERENCES "PolicyPlaybook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PolicyPlaybookRollout" ADD CONSTRAINT "PolicyPlaybookRollout_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "PolicyPlaybook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyPlaybookRolloutWorkspace" ADD CONSTRAINT "PolicyPlaybookRolloutWorkspace_rolloutId_fkey" FOREIGN KEY ("rolloutId") REFERENCES "PolicyPlaybookRollout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyPlaybookRolloutWorkspace" ADD CONSTRAINT "PolicyPlaybookRolloutWorkspace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
