import type { TenantContext } from "../tenancy/tenantTypes";

export type BackupCompleteness = "complete" | "partial" | "corrupted";

export type BackupManifest = {
  snapshotId: string;
  tenantId: string;
  workspaceId: string;
  generatedAt: string;
  snapshotHash: string;
  sectionHashes: Record<string, string>;
  recordCounts: Record<string, number>;
  lineage: {
    executionIds: string[];
    recoveryRequestIds: string[];
  };
  completeness: BackupCompleteness;
};

export type BackupSnapshot = {
  tenantId: string;
  workspaceId: string;
  generatedAt: string;
  executionState: {
    executions: Record<string, unknown>[];
    locks: Record<string, unknown>[];
    attempts: Record<string, unknown>[];
    recoveryQueue: Record<string, unknown>[];
    ledger: Record<string, unknown>[];
    auditEvents: Record<string, unknown>[];
  };
  recovery: {
    requests: Record<string, unknown>[];
    verificationEvents: Record<string, unknown>[];
    executionEvents: Record<string, unknown>[];
  };
  sam: {
    idempotency: Record<string, unknown>[];
    auditEvents: Record<string, unknown>[];
  };
};

export type BackupBundle = {
  manifest: BackupManifest;
  snapshot: BackupSnapshot;
  persistedAt?: string;
  snapshotPath?: string;
  manifestPath?: string;
};

export type BackupStatus = {
  snapshotId: string;
  status: "ready" | "partial" | "corrupted" | "missing";
  generatedAt?: string;
  tenantId?: string;
  workspaceId?: string;
};

export type BackupIntegrityReport = {
  ready: boolean;
  issues: string[];
  continuity: {
    ledgerOrdered: boolean;
    orphanFree: boolean;
    replayConsistent: boolean;
  };
  manifest: BackupManifest;
};

export type RestoreSimulationResult = {
  dryRun: true;
  executed: false;
  readiness: "verified" | "blocked";
  reconstructed: {
    executionCount: number;
    ledgerEventCount: number;
    recoveryRequestCount: number;
  };
  issues: string[];
};

export type RestoreStatus = {
  status: "idle" | "verified" | "blocked";
  dryRun: true;
  executed: false;
  generatedAt?: string;
  tenantId?: string;
  workspaceId?: string;
  issues?: string[];
};

export type ContinuityOperationScope = {
  tenantContext: TenantContext;
  generatedAt?: string;
  snapshotId?: string;
};
