import { getScopeAlertScanIntervalMs, scopeAlertScanningEnabled } from "@/src/config/env";
import { prisma } from "@/src/server/db/prisma";

const STATE_ID = "scope-monitoring";

type ScopeMonitoringStateRow = {
  lastStartedAt: Date | null;
  lastCompletedAt: Date | null;
  lastFailureAt: Date | null;
  lastFailureMessage: string | null;
  lastWorkspaceCount: number;
  lastAlertsCreated: number;
  isStale: boolean;
  isFailing: boolean;
};

export async function recordScopeMonitoringScanStarted(now = new Date()) {
  await prisma.$executeRaw`
    INSERT INTO "ScopeMonitoringState" ("id", "lastStartedAt", "updatedAt")
    VALUES (${STATE_ID}, ${now}, ${now})
    ON CONFLICT ("id") DO UPDATE SET "lastStartedAt" = EXCLUDED."lastStartedAt", "updatedAt" = EXCLUDED."updatedAt"
  `;
}

export async function recordScopeMonitoringScanCompleted(input: { workspaceCount: number; alertsCreated: number; completedAt?: Date }) {
  const completedAt = input.completedAt ?? new Date();
  await prisma.$executeRaw`
    INSERT INTO "ScopeMonitoringState" ("id", "lastCompletedAt", "lastWorkspaceCount", "lastAlertsCreated", "updatedAt")
    VALUES (${STATE_ID}, ${completedAt}, ${input.workspaceCount}, ${input.alertsCreated}, ${completedAt})
    ON CONFLICT ("id") DO UPDATE SET
      "lastCompletedAt" = EXCLUDED."lastCompletedAt",
      "lastWorkspaceCount" = EXCLUDED."lastWorkspaceCount",
      "lastAlertsCreated" = EXCLUDED."lastAlertsCreated",
      "updatedAt" = EXCLUDED."updatedAt"
  `;
}

export async function recordScopeMonitoringScanFailure(error: unknown, failedAt = new Date()) {
  const message = error instanceof Error ? error.message : String(error);
  await prisma.$executeRaw`
    INSERT INTO "ScopeMonitoringState" ("id", "lastFailureAt", "lastFailureMessage", "updatedAt")
    VALUES (${STATE_ID}, ${failedAt}, ${message.slice(0, 1000)}, ${failedAt})
    ON CONFLICT ("id") DO UPDATE SET
      "lastFailureAt" = EXCLUDED."lastFailureAt",
      "lastFailureMessage" = EXCLUDED."lastFailureMessage",
      "updatedAt" = EXCLUDED."updatedAt"
  `;
}

export async function getScopeMonitoringHealth(now = new Date()) {
  if (!scopeAlertScanningEnabled()) return { enabled: false, status: "disabled" as const, state: null };
  const staleBefore = new Date(now.getTime() - (getScopeAlertScanIntervalMs() * 2 + 60_000));
  const rows = await prisma.$queryRaw<ScopeMonitoringStateRow[]>`
    SELECT "lastStartedAt", "lastCompletedAt", "lastFailureAt", "lastFailureMessage", "lastWorkspaceCount", "lastAlertsCreated",
      ("lastCompletedAt" IS NOT NULL AND "lastCompletedAt" < ${staleBefore}) AS "isStale",
      ("lastFailureAt" IS NOT NULL AND ("lastCompletedAt" IS NULL OR "lastFailureAt" >= "lastCompletedAt")) AS "isFailing"
    FROM "ScopeMonitoringState" WHERE "id" = ${STATE_ID}
  `;
  const state = rows[0] ?? null;
  if (!state?.lastCompletedAt) return { enabled: true, status: "not_started" as const, state };
  if (state.isFailing) return { enabled: true, status: "failing" as const, state };
  if (state.isStale) return { enabled: true, status: "stale" as const, state };
  return { enabled: true, status: "healthy" as const, state };
}
