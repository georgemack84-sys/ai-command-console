import type { BackupIntegrityReport, BackupStatus, RestoreStatus } from "./backupTypes";

type ScopedTelemetry = {
  latestBackup?: BackupStatus | null;
  latestIntegrity?: (BackupIntegrityReport & { generatedAt: string }) | null;
  latestRestore?: RestoreStatus | null;
};

const continuityTelemetry = new Map<string, ScopedTelemetry>();

function scopeKey(tenantId: string, workspaceId: string) {
  return `${tenantId}::${workspaceId}`;
}

function readScope(tenantId: string, workspaceId: string) {
  const key = scopeKey(tenantId, workspaceId);
  if (!continuityTelemetry.has(key)) {
    continuityTelemetry.set(key, {});
  }
  return continuityTelemetry.get(key)!;
}

export function resetContinuityTelemetry() {
  continuityTelemetry.clear();
}

export function recordBackupStatus(status: BackupStatus) {
  if (!status.tenantId || !status.workspaceId) {
    return;
  }
  readScope(status.tenantId, status.workspaceId).latestBackup = status;
}

export function recordIntegrityReport(report: BackupIntegrityReport, generatedAt: string) {
  readScope(report.manifest.tenantId, report.manifest.workspaceId).latestIntegrity = {
    ...report,
    generatedAt,
  };
}

export function recordRestoreStatus(status: RestoreStatus) {
  if (!status.tenantId || !status.workspaceId) {
    return;
  }
  readScope(status.tenantId, status.workspaceId).latestRestore = status;
}

export function getContinuityTelemetry(tenantId: string, workspaceId: string) {
  return readScope(tenantId, workspaceId);
}
