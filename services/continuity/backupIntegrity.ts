import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import { TENANT_ERROR_CODES } from "../tenancy/tenantErrors";
import type { BackupBundle, BackupIntegrityReport } from "./backupTypes";
import { getContinuityTelemetry, recordIntegrityReport } from "./continuityTelemetry";
import { loadPersistedSnapshot } from "./snapshotCoordinator";

function buildFailure(code: string, message: string, details?: Record<string, unknown>) {
  return {
    ok: false as const,
    error: {
      code,
      message,
      details,
    },
  };
}

function verifyContinuity(backup: BackupBundle) {
  const issues: string[] = [];
  const executionIds = new Set(backup.snapshot.executionState.executions.map((entry) => String(entry.id || "")));
  const lockRefs = backup.snapshot.executionState.locks.map((entry) => String(entry.executionId || ""));
  const attemptRefs = backup.snapshot.executionState.attempts.map((entry) => String(entry.executionId || ""));
  const recoveryQueueRefs = backup.snapshot.executionState.recoveryQueue.map((entry) => String(entry.executionId || ""));
  const ledgerRefs = backup.snapshot.executionState.ledger.map((entry) => String(entry.executionId || ""));
  const orphanLocks = lockRefs.some((executionId) => executionId && !executionIds.has(executionId));
  const orphanAttempts = attemptRefs.some((executionId) => executionId && !executionIds.has(executionId));
  const orphanRecoveryQueue = recoveryQueueRefs.some((executionId) => executionId && !executionIds.has(executionId));
  const orphanLedger = ledgerRefs.some((executionId) => executionId && !executionIds.has(executionId));
  const orderedLedger = backup.snapshot.executionState.ledger.every((entry, index, source) => {
    if (index === 0) {
      return true;
    }
    const previous = Number(source[index - 1].createdAt || 0);
    const current = Number(entry.createdAt || 0);
    return current >= previous;
  });

  if (orphanLocks) {
    issues.push("orphan_execution_locks");
  }
  if (orphanAttempts) {
    issues.push("orphan_execution_attempts");
  }
  if (orphanRecoveryQueue) {
    issues.push("orphan_recovery_queue");
  }
  if (orphanLedger) {
    issues.push("orphan_ledger_events");
  }
  if (!orderedLedger) {
    issues.push("execution_ledger_out_of_order");
  }

  return {
    issues,
    continuity: {
      ledgerOrdered: orderedLedger,
      orphanFree: !orphanLocks && !orphanAttempts && !orphanRecoveryQueue && !orphanLedger,
      replayConsistent: true,
    },
  };
}

export async function verifyBackupIntegrity({
  tenantContext,
  backup,
  skipHashValidation = false,
}: {
  tenantContext: { tenantId: string; workspaceId: string };
  backup: BackupBundle;
  skipHashValidation?: boolean;
}): Promise<{ ok: true; data: BackupIntegrityReport } | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } }> {
  if (
    backup.manifest.tenantId !== tenantContext.tenantId
    || backup.manifest.workspaceId !== tenantContext.workspaceId
    || backup.snapshot.tenantId !== tenantContext.tenantId
    || backup.snapshot.workspaceId !== tenantContext.workspaceId
  ) {
    return buildFailure(TENANT_ERROR_CODES.TENANT_SCOPE_MISMATCH, "Backup ownership does not match tenant scope.");
  }

  if (backup.manifest.completeness !== "complete") {
    return buildFailure("BACKUP_INTEGRITY_FAILED", "Snapshot completeness is not sufficient for restore.", {
      issues: ["snapshot_incomplete"],
    });
  }

  if (!skipHashValidation) {
    const computedHash = hashPayloadDeterministically(backup.snapshot);
    if (computedHash !== backup.manifest.snapshotHash) {
      return buildFailure("BACKUP_INTEGRITY_FAILED", "Snapshot hash mismatch detected.", {
        issues: ["snapshot_hash_mismatch"],
      });
    }
  }

  const report = verifyContinuity(backup);
  if (report.issues.length > 0) {
    return buildFailure("BACKUP_INTEGRITY_FAILED", "Continuity verification failed.", {
      issues: report.issues,
    });
  }

  const result: BackupIntegrityReport = {
    ready: true,
    issues: [],
    continuity: report.continuity,
    manifest: backup.manifest,
  };
  recordIntegrityReport(result, new Date().toISOString());
  return { ok: true, data: result };
}

export async function verifyPersistedBackupIntegrity({
  tenantContext,
  snapshotId,
}: {
  tenantContext: { tenantId: string; workspaceId: string };
  snapshotId?: string;
}) {
  const backup = loadPersistedSnapshot({ tenantContext: tenantContext as any, snapshotId });
  if (!backup) {
    return buildFailure("BACKUP_NOT_FOUND", "No backup snapshot is available for this tenant.");
  }
  return verifyBackupIntegrity({ tenantContext, backup });
}

export function getLatestIntegrityReport(tenantContext: { tenantId: string; workspaceId: string }) {
  const latest = getContinuityTelemetry(tenantContext.tenantId, tenantContext.workspaceId).latestIntegrity;
  return {
    ready: latest?.ready || false,
    issues: latest?.issues || ["backup_not_verified"],
    contractVersion: "v1" as const,
    contractHash: "continuity.integrity.report.v1",
  };
}
