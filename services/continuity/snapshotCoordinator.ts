import fs from "node:fs";
import path from "node:path";

import * as auditTrail from "../auditTrail.js";
import * as recoveryAuditStore from "../recoveryAuditStore.js";
import * as recoveryExecutionStore from "../recoveryExecutionStore.js";
import * as recoveryVerificationStore from "../recoveryVerificationStore.js";
import * as runtimePaths from "../runtimePaths.js";
import * as stateDatabase from "../stateDatabase.js";
import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import { buildSnapshotManifest } from "./snapshotManifest";
import { serializeManifest, serializeSnapshot } from "./snapshotSerializer";
import { applySnapshotRetention } from "./snapshotRetention";
import { getContinuityTelemetry, recordBackupStatus } from "./continuityTelemetry";
import type { BackupBundle, BackupSnapshot, BackupStatus } from "./backupTypes";
import type { TenantContext } from "../tenancy/tenantTypes";

function continuityRoot(tenantContext: TenantContext) {
  return path.join(runtimePaths.getAgentsDataPath("continuity"), tenantContext.tenantId, tenantContext.workspaceId);
}

function normalizeRows(rows: Record<string, unknown>[]) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))));
}

function readExecutionState(tenantContext: TenantContext) {
  return stateDatabase.withDatabase((db: any) => {
    const executions = db.prepare(`
      SELECT
        id,
        tenant_id AS tenantId,
        workspace_id AS workspaceId,
        plan_id AS planId,
        status,
        trigger_source AS triggerSource,
        created_at AS createdAt,
        started_at AS startedAt,
        finished_at AS finishedAt,
        last_updated_at AS lastUpdatedAt
      FROM executions
      WHERE tenant_id = ? AND workspace_id = ?
      ORDER BY id ASC
    `).all(tenantContext.tenantId, tenantContext.workspaceId);

    const locks = db.prepare(`
      SELECT
        plan_id AS planId,
        execution_id AS executionId,
        worker_id AS workerId,
        lock_acquired_at AS lockAcquiredAt,
        heartbeat_at AS heartbeatAt,
        lease_expires_at AS leaseExpiresAt,
        lock_released_at AS lockReleasedAt,
        created_at AS createdAt,
        tenant_id AS tenantId,
        workspace_id AS workspaceId
      FROM execution_locks
      WHERE tenant_id = ? AND workspace_id = ?
      ORDER BY created_at ASC, execution_id ASC
    `).all(tenantContext.tenantId, tenantContext.workspaceId);

    const attempts = db.prepare(`
      SELECT
        id,
        plan_id AS planId,
        execution_id AS executionId,
        step_id AS stepId,
        attempt_number AS attemptNumber,
        status,
        idempotency_key AS idempotencyKey,
        created_at AS createdAt,
        updated_at AS updatedAt,
        tenant_id AS tenantId,
        workspace_id AS workspaceId
      FROM execution_attempts
      WHERE tenant_id = ? AND workspace_id = ?
      ORDER BY id ASC
    `).all(tenantContext.tenantId, tenantContext.workspaceId);

    const recoveryQueue = db.prepare(`
      SELECT
        id,
        plan_id AS planId,
        execution_id AS executionId,
        step_id AS stepId,
        reason,
        last_state AS lastState,
        safe_options AS safeOptions,
        recommended,
        created_at AS createdAt,
        expires_at_ms AS expiresAtMs,
        resolved_at AS resolvedAt,
        tenant_id AS tenantId,
        workspace_id AS workspaceId
      FROM execution_recovery_queue
      WHERE tenant_id = ? AND workspace_id = ?
      ORDER BY created_at ASC, id ASC
    `).all(tenantContext.tenantId, tenantContext.workspaceId);

    const ledger = db.prepare(`
      SELECT
        id,
        event_version AS eventVersion,
        plan_id AS planId,
        execution_id AS executionId,
        step_id AS stepId,
        attempt_number AS attemptNumber,
        event_type AS eventType,
        event_payload AS eventPayload,
        created_at AS createdAt,
        tenant_id AS tenantId,
        workspace_id AS workspaceId
      FROM execution_ledger
      WHERE tenant_id = ? AND workspace_id = ?
      ORDER BY created_at ASC, id ASC
    `).all(tenantContext.tenantId, tenantContext.workspaceId);

    const auditEvents = db.prepare(`
      SELECT
        id,
        execution_id AS executionId,
        step_id AS stepId,
        event_type AS eventType,
        event_payload AS eventPayload,
        created_at AS createdAt,
        tenant_id AS tenantId,
        workspace_id AS workspaceId
      FROM audit_events
      WHERE tenant_id = ? AND workspace_id = ?
      ORDER BY created_at ASC, id ASC
    `).all(tenantContext.tenantId, tenantContext.workspaceId);

    const idempotency = db.prepare(`
      SELECT
        idempotency_key AS idempotencyKey,
        plan_id AS planId,
        execution_id AS executionId,
        action_type AS actionType,
        actor_id AS actorId,
        request_fingerprint AS requestFingerprint,
        response_payload AS responsePayload,
        created_at AS createdAt,
        expires_at_ms AS expiresAtMs,
        tenant_id AS tenantId,
        workspace_id AS workspaceId
      FROM operator_action_idempotency
      WHERE tenant_id = ? AND workspace_id = ?
      ORDER BY created_at ASC, idempotency_key ASC
    `).all(tenantContext.tenantId, tenantContext.workspaceId);

    return {
      executions: normalizeRows(executions),
      locks: normalizeRows(locks),
      attempts: normalizeRows(attempts),
      recoveryQueue: normalizeRows(recoveryQueue),
      ledger: normalizeRows(ledger),
      auditEvents: normalizeRows(auditEvents),
      idempotency: normalizeRows(idempotency),
    };
  });
}

function readRecoveryState(tenantContext: TenantContext, executionIds: string[]) {
  const requests = executionIds.flatMap((executionId) => recoveryAuditStore.listRecoveryRequestsForExecution(executionId) || []);
  const verificationEvents = (recoveryVerificationStore.listVerificationEvents(5000) || []).filter((event: any) =>
    executionIds.includes(String(event?.payload?.executionId || "")),
  );
  const executionEvents = (recoveryExecutionStore.listExecutionEvents(5000) || []).filter((event: any) =>
    executionIds.includes(String(event?.payload?.executionId || "")),
  );
  const auditEvents = (auditTrail.listAuditEvents(5000) || []).filter((event: any) => {
    const tenantId = event?.tenantId == null ? null : String(event.tenantId);
    const workspaceId = event?.workspaceId == null ? null : String(event.workspaceId);
    return tenantId === tenantContext.tenantId
      && workspaceId === tenantContext.workspaceId
      && String(event?.type || "").toLowerCase().startsWith("sam.");
  });

  return {
    requests: normalizeRows(requests as Record<string, unknown>[]),
    verificationEvents: normalizeRows(verificationEvents as Record<string, unknown>[]),
    executionEvents: normalizeRows(executionEvents as Record<string, unknown>[]),
    samAuditEvents: normalizeRows(auditEvents as Record<string, unknown>[]),
  };
}

function writeBundle(bundle: BackupBundle, root: string) {
  const snapshotDir = path.join(root, bundle.manifest.snapshotId);
  fs.mkdirSync(snapshotDir, { recursive: true });
  const snapshotPath = path.join(snapshotDir, "snapshot.json");
  const manifestPath = path.join(snapshotDir, "manifest.json");
  fs.writeFileSync(snapshotPath, serializeSnapshot(bundle.snapshot), "utf8");
  fs.writeFileSync(manifestPath, serializeManifest(bundle.manifest), "utf8");
  return { snapshotPath, manifestPath };
}

export async function createBackupSnapshot({
  tenantContext,
  generatedAt,
  persist = true,
}: {
  tenantContext: TenantContext;
  generatedAt?: string;
  persist?: boolean;
}): Promise<{ ok: true; data: BackupBundle } | { ok: false; error: { code: string; message: string } }> {
  const now = generatedAt || new Date().toISOString();
  const executionState = readExecutionState(tenantContext);
  const executionIds = executionState.executions.map((entry: { id?: unknown }) => String(entry.id || ""));
  const recovery = readRecoveryState(tenantContext, executionIds);
  const snapshot: BackupSnapshot = {
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    generatedAt: now,
    executionState: {
      executions: executionState.executions,
      locks: executionState.locks,
      attempts: executionState.attempts,
      recoveryQueue: executionState.recoveryQueue,
      ledger: executionState.ledger,
      auditEvents: executionState.auditEvents,
    },
    recovery: {
      requests: recovery.requests,
      verificationEvents: recovery.verificationEvents,
      executionEvents: recovery.executionEvents,
    },
    sam: {
      idempotency: executionState.idempotency,
      auditEvents: recovery.samAuditEvents,
    },
  };

  const snapshotId = hashPayloadDeterministically({
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    generatedAt: now,
    executionIds,
  }).slice(0, 16);
  const manifest = buildSnapshotManifest({ snapshot, snapshotId });
  const bundle: BackupBundle = { manifest, snapshot };

  if (persist) {
    const root = continuityRoot(tenantContext);
    const { snapshotPath, manifestPath } = writeBundle(bundle, root);
    applySnapshotRetention({ root });
    bundle.snapshotPath = snapshotPath;
    bundle.manifestPath = manifestPath;
    bundle.persistedAt = now;
  }

  recordBackupStatus({
    snapshotId,
    status: manifest.completeness === "complete" ? "ready" : "partial",
    generatedAt: now,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
  });

  return { ok: true, data: bundle };
}

export function loadPersistedSnapshot({
  tenantContext,
  snapshotId,
}: {
  tenantContext: TenantContext;
  snapshotId?: string;
}) {
  const root = continuityRoot(tenantContext);
  if (!fs.existsSync(root)) {
    return null;
  }
  const targetId = snapshotId || fs.readdirSync(root).sort().at(-1);
  if (!targetId) {
    return null;
  }
  const snapshotPath = path.join(root, targetId, "snapshot.json");
  const manifestPath = path.join(root, targetId, "manifest.json");
  if (!fs.existsSync(snapshotPath) || !fs.existsSync(manifestPath)) {
    return null;
  }
  return {
    snapshot: JSON.parse(fs.readFileSync(snapshotPath, "utf8")),
    manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")),
    snapshotPath,
    manifestPath,
  } as BackupBundle;
}

export function getLatestBackupStatus(tenantContext: TenantContext): BackupStatus & { contractVersion: "v1"; contractHash: string } {
  const status = getContinuityTelemetry(tenantContext.tenantId, tenantContext.workspaceId).latestBackup;
  return {
    snapshotId: status?.snapshotId || "none",
    status: status?.status || "missing",
    generatedAt: status?.generatedAt,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    contractVersion: "v1",
    contractHash: "continuity.backup.status.v1",
  };
}
