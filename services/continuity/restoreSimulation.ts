import { TENANT_ERROR_CODES } from "../tenancy/tenantErrors";
import type { BackupBundle, RestoreSimulationResult, RestoreStatus } from "./backupTypes";
import { getContinuityTelemetry, recordRestoreStatus } from "./continuityTelemetry";
import { verifyBackupIntegrity } from "./backupIntegrity";
import { loadPersistedSnapshot } from "./snapshotCoordinator";
import { evaluateRestoreReadiness } from "./restoreReadiness";

function fail(code: string, message: string, details?: Record<string, unknown>) {
  return {
    ok: false as const,
    error: {
      code,
      message,
      details,
    },
  };
}

export async function restoreSimulation({
  tenantContext,
  backup,
  skipHashValidation = false,
}: {
  tenantContext: { tenantId: string; workspaceId: string };
  backup: BackupBundle;
  skipHashValidation?: boolean;
}): Promise<{ ok: true; data: RestoreSimulationResult } | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } }> {
  if (
    backup.manifest.tenantId !== tenantContext.tenantId
    || backup.manifest.workspaceId !== tenantContext.workspaceId
  ) {
    return fail(TENANT_ERROR_CODES.TENANT_SCOPE_MISMATCH, "Restore scope does not match tenant ownership.");
  }

  const integrity = await verifyBackupIntegrity({ tenantContext, backup, skipHashValidation });
  const readiness = evaluateRestoreReadiness({ integrity, restore: null });
  if (!integrity.ok || !readiness.ok) {
    const issues = integrity.ok ? integrity.data.issues : (integrity.error.details?.issues as string[] | undefined) || [integrity.error.code];
    recordRestoreStatus({
      status: "blocked",
      dryRun: true,
      executed: false,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      generatedAt: backup.manifest.generatedAt,
      issues,
    });
    return fail("RESTORE_SIMULATION_FAILED", "Restore simulation is blocked.", {
      issues,
      freezeExecution: true,
    });
  }

  const result: RestoreSimulationResult = {
    dryRun: true,
    executed: false,
    readiness: "verified",
    reconstructed: {
      executionCount: backup.snapshot.executionState.executions.length,
      ledgerEventCount: backup.snapshot.executionState.ledger.length,
      recoveryRequestCount: backup.snapshot.recovery.requests.length,
    },
    issues: [],
  };

  recordRestoreStatus({
    status: "verified",
    dryRun: true,
    executed: false,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    generatedAt: backup.manifest.generatedAt,
    issues: [],
  });
  return { ok: true, data: result };
}

export async function restoreSimulationFromLatestSnapshot({
  tenantContext,
  snapshotId,
}: {
  tenantContext: { tenantId: string; workspaceId: string };
  snapshotId?: string;
}) {
  const backup = loadPersistedSnapshot({ tenantContext: tenantContext as any, snapshotId });
  if (!backup) {
    return fail("BACKUP_NOT_FOUND", "No persisted backup is available.");
  }
  return restoreSimulation({ tenantContext, backup });
}

export function getLatestRestoreStatus(tenantContext: { tenantId: string; workspaceId: string }): RestoreStatus & { contractVersion: "v1"; contractHash: string } {
  const latest = getContinuityTelemetry(tenantContext.tenantId, tenantContext.workspaceId).latestRestore;
  return {
    status: latest?.status || "idle",
    dryRun: true,
    executed: false,
    generatedAt: latest?.generatedAt,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    issues: latest?.issues || [],
    contractVersion: "v1",
    contractHash: "continuity.restore.status.v1",
  };
}
