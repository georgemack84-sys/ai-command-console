CREATE TABLE "ScopeMonitoringState" (
  "id" TEXT NOT NULL,
  "lastStartedAt" TIMESTAMP(3),
  "lastCompletedAt" TIMESTAMP(3),
  "lastFailureAt" TIMESTAMP(3),
  "lastFailureMessage" TEXT,
  "lastWorkspaceCount" INTEGER NOT NULL DEFAULT 0,
  "lastAlertsCreated" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScopeMonitoringState_pkey" PRIMARY KEY ("id")
);
