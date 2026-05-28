const { randomUUID } = require("crypto");
const { readDatabaseNow, runInTransaction, withDatabase } = require("./stateDatabase");
const { withTransaction } = require("./transaction");

const LEASE_DURATION_MS = 30000;
const HEARTBEAT_INTERVAL_MS = 10000;
const EXECUTION_STATE_SCHEMA_VERSION = 1;
const LEDGER_EVENT_VERSION = 1;
const OPERATOR_RECOVERY_TTL_MS = 86400000;

const SIDE_EFFECT_CLASSES = new Set([
  "pure_read",
  "local_write",
  "external_write",
  "destructive",
  "network_call",
  "human_review",
  "unknown",
]);

const ATTEMPT_STATUSES = new Set(["pending", "running", "completed", "failed", "cancelled", "abandoned"]);
const workerId = randomUUID();

function success(data) {
  return { ok: true, data };
}

function failure(code, message) {
  return { ok: false, code, message };
}

function normalizeSideEffectClass(value) {
  const normalized = String(value || "unknown").trim().toLowerCase();
  return SIDE_EFFECT_CLASSES.has(normalized) ? normalized : "unknown";
}

function normalizeAttemptStatus(value) {
  const normalized = String(value || "pending").trim().toLowerCase();
  return ATTEMPT_STATUSES.has(normalized) ? normalized : "pending";
}

function stringifyJson(value) {
  return JSON.stringify(value == null ? null : value);
}

function parseJson(value, fallback) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function currentDbTime(db) {
  return readDatabaseNow(db);
}

function normalizeTenantScope(scope = null) {
  if (!scope || typeof scope !== "object") {
    return { tenantId: null, workspaceId: null };
  }
  return {
    tenantId: scope.tenantId == null ? null : String(scope.tenantId),
    workspaceId: scope.workspaceId == null ? null : String(scope.workspaceId),
  };
}

function syncExecutionLeaseTx(db, executionId, leaseOwner, leaseExpiresAt) {
  if (!String(executionId || "").trim()) {
    return;
  }
  db.prepare(`
    UPDATE executions
    SET lease_owner = ?,
        lease_expires_at = ?,
        last_updated_at = COALESCE(last_updated_at, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    WHERE id = ?
  `).run(
    leaseOwner == null ? null : String(leaseOwner),
    leaseExpiresAt == null ? null : Number(leaseExpiresAt),
    String(executionId),
  );
}

function touchExecutionAttemptMetricsTx(db, executionId, updates = {}) {
  if (!String(executionId || "").trim()) {
    return;
  }
  const row = db.prepare(`
    SELECT
      total_attempts AS totalAttempts,
      consecutive_failures AS consecutiveFailures,
      no_progress_attempts AS noProgressAttempts,
      last_progress_at AS lastProgressAt
    FROM executions
    WHERE id = ?
  `).get(String(executionId));
  if (!row) {
    return;
  }

  const next = {
    totalAttempts: Object.prototype.hasOwnProperty.call(updates, "totalAttempts")
      ? Number(updates.totalAttempts)
      : Number(row.totalAttempts || 0),
    consecutiveFailures: Object.prototype.hasOwnProperty.call(updates, "consecutiveFailures")
      ? Number(updates.consecutiveFailures)
      : Number(row.consecutiveFailures || 0),
    noProgressAttempts: Object.prototype.hasOwnProperty.call(updates, "noProgressAttempts")
      ? Number(updates.noProgressAttempts)
      : Number(row.noProgressAttempts || 0),
    lastProgressAt: Object.prototype.hasOwnProperty.call(updates, "lastProgressAt")
      ? updates.lastProgressAt
      : row.lastProgressAt,
  };

  db.prepare(`
    UPDATE executions
    SET total_attempts = ?,
        consecutive_failures = ?,
        no_progress_attempts = ?,
        last_progress_at = ?,
        last_updated_at = COALESCE(last_updated_at, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    WHERE id = ?
  `).run(
    Math.max(0, next.totalAttempts),
    Math.max(0, next.consecutiveFailures),
    Math.max(0, next.noProgressAttempts),
    next.lastProgressAt == null ? null : String(next.lastProgressAt),
    String(executionId),
  );
}

function executeWrite(tx, work) {
  if (tx) {
    return work(tx);
  }
  return withTransaction((db) => work(db));
}

function ensureIdentity(planId, executionId) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required.");
  }
  if (!String(executionId || "").trim()) {
    return failure("INVALID_STATE", "executionId is required.");
  }
  return null;
}

function mapLockRow(row) {
  if (!row) {
    return null;
  }
  return {
    tenantId: row.tenant_id == null ? null : String(row.tenant_id),
    workspaceId: row.workspace_id == null ? null : String(row.workspace_id),
    planId: String(row.plan_id),
    executionId: String(row.execution_id),
    workerId: String(row.worker_id),
    lockAcquiredAt: Number(row.lock_acquired_at),
    heartbeatAt: row.heartbeat_at == null ? null : Number(row.heartbeat_at),
    leaseExpiresAt: row.lease_expires_at == null ? null : Number(row.lease_expires_at),
    lockReleasedAt: row.lock_released_at == null ? null : Number(row.lock_released_at),
    createdAt: Number(row.created_at),
  };
}

function mapAttemptRow(row) {
  if (!row) {
    return null;
  }
  return {
    tenantId: row.tenant_id == null ? null : String(row.tenant_id),
    workspaceId: row.workspace_id == null ? null : String(row.workspace_id),
    id: Number(row.id),
    planId: String(row.plan_id),
    executionId: String(row.execution_id),
    stepId: String(row.step_id),
    attemptNumber: Number(row.attempt_number),
    status: String(row.status),
    sideEffectClass: String(row.side_effect_class),
    idempotencyKey: row.idempotency_key == null ? null : String(row.idempotency_key),
    workerId: row.worker_id == null ? null : String(row.worker_id),
    heartbeatAt: row.heartbeat_at == null ? null : Number(row.heartbeat_at),
    leaseExpiresAt: row.lease_expires_at == null ? null : Number(row.lease_expires_at),
    resultPayload: parseJson(row.result_payload, null),
    errorPayload: parseJson(row.error_payload, null),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    completedAt: row.completed_at == null ? null : Number(row.completed_at),
  };
}

function mapLedgerRow(row) {
  if (!row) {
    return null;
  }
  return {
    tenantId: row.tenant_id == null ? null : String(row.tenant_id),
    workspaceId: row.workspace_id == null ? null : String(row.workspace_id),
    id: Number(row.id),
    eventVersion: Number(row.event_version),
    planId: String(row.plan_id),
    executionId: row.execution_id == null ? null : String(row.execution_id),
    stepId: row.step_id == null ? null : String(row.step_id),
    attemptNumber: row.attempt_number == null ? null : Number(row.attempt_number),
    eventType: String(row.event_type),
    eventPayload: parseJson(row.event_payload, {}),
    createdAt: Number(row.created_at),
  };
}

function mapRecoveryRow(row) {
  if (!row) {
    return null;
  }
  return {
    tenantId: row.tenant_id == null ? null : String(row.tenant_id),
    workspaceId: row.workspace_id == null ? null : String(row.workspace_id),
    id: Number(row.id),
    planId: String(row.plan_id),
    executionId: String(row.execution_id),
    stepId: row.step_id == null ? null : String(row.step_id),
    reason: String(row.reason),
    lastState: String(row.last_state),
    safeOptions: parseJson(row.safe_options, []),
    recommended: row.recommended == null ? null : String(row.recommended),
    createdAt: Number(row.created_at),
    expiresAtMs: Number(row.expires_at_ms),
    resolvedAt: row.resolved_at == null ? null : Number(row.resolved_at),
  };
}

function acquireExecutionLock(planId, executionId, tx = null, scope = null) {
  const identityError = ensureIdentity(planId, executionId);
  if (identityError) {
    return identityError;
  }

  try {
    return executeWrite(tx, (db) => {
      const tenantScope = normalizeTenantScope(scope);
      const now = currentDbTime(db).nowMs;
      const leaseExpiresAt = now + LEASE_DURATION_MS;
      const existing = mapLockRow(
        db.prepare(`
          SELECT tenant_id, workspace_id, plan_id, execution_id, worker_id, lock_acquired_at, heartbeat_at, lease_expires_at, lock_released_at, created_at
          FROM execution_locks
          WHERE plan_id = ?
        `).get(String(planId))
      );

      if (existing && existing.lockReleasedAt == null) {
        appendLedgerEventTx(db, {
          tenantId: tenantScope.tenantId,
          workspaceId: tenantScope.workspaceId,
          planId,
          executionId,
          eventType: "lease.conflict",
          payload: {
            workerId,
            existingExecutionId: existing.executionId,
            existingWorkerId: existing.workerId,
            leaseExpiresAt: existing.leaseExpiresAt,
          },
        });
        return failure(
          "LOCK_CONFLICT",
          `Execution lock already held for plan ${planId} by execution ${existing.executionId}.`
        );
      }

      db.prepare(`
        INSERT INTO execution_locks (
          tenant_id, workspace_id, plan_id, execution_id, worker_id, lock_acquired_at, heartbeat_at, lease_expires_at, lock_released_at, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
        ON CONFLICT(plan_id) DO UPDATE SET
          tenant_id = excluded.tenant_id,
          workspace_id = excluded.workspace_id,
          execution_id = excluded.execution_id,
          worker_id = excluded.worker_id,
          lock_acquired_at = excluded.lock_acquired_at,
          heartbeat_at = excluded.heartbeat_at,
          lease_expires_at = excluded.lease_expires_at,
          lock_released_at = NULL
      `).run(tenantScope.tenantId, tenantScope.workspaceId, String(planId), String(executionId), workerId, now, now, leaseExpiresAt, now);
      syncExecutionLeaseTx(db, executionId, workerId, leaseExpiresAt);
      appendLedgerEventTx(db, {
        tenantId: tenantScope.tenantId,
        workspaceId: tenantScope.workspaceId,
        planId,
        executionId,
        eventType: "lease.acquired",
        payload: {
          workerId,
          leaseExpiresAt,
        },
      });

      return success({
        tenantId: tenantScope.tenantId,
        workspaceId: tenantScope.workspaceId,
        planId: String(planId),
        executionId: String(executionId),
        workerId,
        lockAcquiredAt: now,
        heartbeatAt: now,
        leaseExpiresAt,
      });
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function acquireOrReuseExecutionLock(planId, executionId, tx = null, scope = null) {
  const identityError = ensureIdentity(planId, executionId);
  if (identityError) {
    return identityError;
  }

  try {
    return executeWrite(tx, (db) => {
      const tenantScope = normalizeTenantScope(scope);
      const now = currentDbTime(db).nowMs;
      const leaseExpiresAt = now + LEASE_DURATION_MS;
      const existing = mapLockRow(
        db.prepare(`
          SELECT tenant_id, workspace_id, plan_id, execution_id, worker_id, lock_acquired_at, heartbeat_at, lease_expires_at, lock_released_at, created_at
          FROM execution_locks
          WHERE plan_id = ?
        `).get(String(planId))
      );

      if (existing && existing.lockReleasedAt == null && existing.executionId !== String(executionId)) {
        appendLedgerEventTx(db, {
          tenantId: tenantScope.tenantId,
          workspaceId: tenantScope.workspaceId,
          planId,
          executionId,
          eventType: "lease.conflict",
          payload: {
            workerId,
            existingExecutionId: existing.executionId,
            existingWorkerId: existing.workerId,
            leaseExpiresAt: existing.leaseExpiresAt,
          },
        });
        return failure(
          "LOCK_CONFLICT",
          `Execution lock already held for plan ${planId} by execution ${existing.executionId}.`
        );
      }

      db.prepare(`
        INSERT INTO execution_locks (
          tenant_id, workspace_id, plan_id, execution_id, worker_id, lock_acquired_at, heartbeat_at, lease_expires_at, lock_released_at, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
        ON CONFLICT(plan_id) DO UPDATE SET
          tenant_id = excluded.tenant_id,
          workspace_id = excluded.workspace_id,
          execution_id = excluded.execution_id,
          worker_id = excluded.worker_id,
          lock_acquired_at = excluded.lock_acquired_at,
          heartbeat_at = excluded.heartbeat_at,
          lease_expires_at = excluded.lease_expires_at,
          lock_released_at = NULL
      `).run(tenantScope.tenantId, tenantScope.workspaceId, String(planId), String(executionId), workerId, now, now, leaseExpiresAt, existing?.createdAt ?? now);
      syncExecutionLeaseTx(db, executionId, workerId, leaseExpiresAt);
      appendLedgerEventTx(db, {
        tenantId: tenantScope.tenantId,
        workspaceId: tenantScope.workspaceId,
        planId,
        executionId,
        eventType: existing && existing.lockReleasedAt == null ? "lease.renewed" : "lease.acquired",
        payload: {
          workerId,
          leaseExpiresAt,
          reused: Boolean(existing && existing.lockReleasedAt == null),
        },
      });

      return success({
        tenantId: tenantScope.tenantId,
        workspaceId: tenantScope.workspaceId,
        planId: String(planId),
        executionId: String(executionId),
        workerId,
        lockAcquiredAt: now,
        heartbeatAt: now,
        leaseExpiresAt,
      });
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function renewExecutionLock(planId, executionId, tx = null, scope = null) {
  const identityError = ensureIdentity(planId, executionId);
  if (identityError) {
    return identityError;
  }

  try {
    return executeWrite(tx, (db) => renewExecutionLockTx(db, planId, executionId, scope));
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function releaseExecutionLock(planId, executionId, tx = null, scope = null) {
  const identityError = ensureIdentity(planId, executionId);
  if (identityError) {
    return identityError;
  }

  try {
    return executeWrite(tx, (db) => {
      return releaseExecutionLockTx(db, planId, executionId, scope);
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function renewExecutionLockTx(db, planId, executionId, scope = null) {
  const existing = mapLockRow(
    db.prepare(`
      SELECT tenant_id, workspace_id, plan_id, execution_id, worker_id, lock_acquired_at, heartbeat_at, lease_expires_at, lock_released_at, created_at
      FROM execution_locks
      WHERE plan_id = ?
    `).get(String(planId))
  );
  if (!existing) {
    return failure("NOT_FOUND", `Execution lock ${planId} was not found.`);
  }
  const tenantScope = normalizeTenantScope(scope);
  if (tenantScope.tenantId && existing.tenantId && existing.tenantId !== tenantScope.tenantId) {
    return failure("LOCK_CONFLICT", `Execution lock ${planId} is not owned by tenant ${tenantScope.tenantId}.`);
  }
  if (existing.executionId !== String(executionId)) {
    appendLedgerEventTx(db, {
      tenantId: existing.tenantId,
      workspaceId: existing.workspaceId,
      planId,
      executionId,
      eventType: "lease.conflict",
      payload: {
        workerId,
        existingExecutionId: existing.executionId,
        existingWorkerId: existing.workerId,
        leaseExpiresAt: existing.leaseExpiresAt,
      },
    });
    return failure(
      "LOCK_CONFLICT",
      `Execution lock for plan ${planId} belongs to execution ${existing.executionId}.`
    );
  }
  if (existing.lockReleasedAt != null) {
    return failure("LOCK_RELEASED", `Execution lock ${planId} has already been released.`);
  }
  if (existing.workerId !== workerId) {
    appendLedgerEventTx(db, {
      tenantId: existing.tenantId,
      workspaceId: existing.workspaceId,
      planId,
      executionId,
      eventType: "lease.conflict",
      payload: {
        workerId,
        existingExecutionId: existing.executionId,
        existingWorkerId: existing.workerId,
        leaseExpiresAt: existing.leaseExpiresAt,
      },
    });
    return failure("LOCK_CONFLICT", `Execution lock ${planId} is owned by a different worker.`);
  }

  const now = currentDbTime(db).nowMs;
  const leaseExpiresAt = now + LEASE_DURATION_MS;
  db.prepare(`
    UPDATE execution_locks
    SET heartbeat_at = ?, lease_expires_at = ?
    WHERE plan_id = ? AND execution_id = ?
  `).run(now, leaseExpiresAt, String(planId), String(executionId));
  syncExecutionLeaseTx(db, executionId, workerId, leaseExpiresAt);
  appendLedgerEventTx(db, {
    tenantId: existing.tenantId,
    workspaceId: existing.workspaceId,
    planId,
    executionId,
    eventType: "lease.renewed",
    payload: {
      workerId,
      heartbeatAt: now,
      leaseExpiresAt,
    },
  });

  return success({
    planId: String(planId),
    executionId: String(executionId),
    workerId,
    heartbeatAt: now,
    leaseExpiresAt,
  });
}

function releaseExecutionLockTx(db, planId, executionId, scope = null) {
  const existing = mapLockRow(
    db.prepare(`
      SELECT tenant_id, workspace_id, plan_id, execution_id, worker_id, lock_acquired_at, heartbeat_at, lease_expires_at, lock_released_at, created_at
      FROM execution_locks
      WHERE plan_id = ?
    `).get(String(planId))
  );
  if (!existing) {
    return failure("NOT_FOUND", `Execution lock ${planId} was not found.`);
  }
  const tenantScope = normalizeTenantScope(scope);
  if (tenantScope.tenantId && existing.tenantId && existing.tenantId !== tenantScope.tenantId) {
    return failure("LOCK_CONFLICT", `Execution lock ${planId} is not owned by tenant ${tenantScope.tenantId}.`);
  }
  if (existing.executionId !== String(executionId)) {
    return failure(
      "LOCK_CONFLICT",
      `Execution lock for plan ${planId} belongs to execution ${existing.executionId}.`
    );
  }

  const now = currentDbTime(db).nowMs;
  db.prepare(`
    UPDATE execution_locks
    SET heartbeat_at = ?, lease_expires_at = ?, lock_released_at = ?
    WHERE plan_id = ? AND execution_id = ?
  `).run(now, now, now, String(planId), String(executionId));
  syncExecutionLeaseTx(db, executionId, null, null);
  appendLedgerEventTx(db, {
    tenantId: existing.tenantId,
    workspaceId: existing.workspaceId,
    planId,
    executionId,
    eventType: "lease.released",
    payload: {
      workerId: existing.workerId,
      releasedByWorkerId: workerId,
      lockReleasedAt: now,
    },
  });

  return success({
    planId: String(planId),
    executionId: String(executionId),
    workerId: existing.workerId,
    heartbeatAt: now,
    leaseExpiresAt: now,
    lockReleasedAt: now,
  });
}

function listExecutionLocks(planId = null, scope = null) {
  try {
    return withDatabase((db) => {
      const tenantScope = normalizeTenantScope(scope);
      const rows = planId
        ? db.prepare(`
            SELECT tenant_id, workspace_id, plan_id, execution_id, worker_id, lock_acquired_at, heartbeat_at, lease_expires_at, lock_released_at, created_at
            FROM execution_locks
            WHERE plan_id = ?
          `).all(String(planId))
        : db.prepare(`
            SELECT tenant_id, workspace_id, plan_id, execution_id, worker_id, lock_acquired_at, heartbeat_at, lease_expires_at, lock_released_at, created_at
            FROM execution_locks
            ORDER BY created_at ASC, plan_id ASC
          `).all();
      const scopedRows = rows
        .map(mapLockRow)
        .filter((row) => !tenantScope.tenantId || row?.tenantId === tenantScope.tenantId);
      return success(scopedRows);
    });
  } catch (error) {
    return failure("DB_READ_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function getActiveExecutionLock(planId, scope = null) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required for lock reads.");
  }
  try {
    return withDatabase((db) => {
      const tenantScope = normalizeTenantScope(scope);
      const row = mapLockRow(
        db.prepare(`
          SELECT tenant_id, workspace_id, plan_id, execution_id, worker_id, lock_acquired_at, heartbeat_at, lease_expires_at, lock_released_at, created_at
          FROM execution_locks
          WHERE plan_id = ? AND lock_released_at IS NULL
          LIMIT 1
        `).get(String(planId))
      );
      if (tenantScope.tenantId && row && row.tenantId !== tenantScope.tenantId) {
        return success(null);
      }
      return success(row);
    });
  } catch (error) {
    return failure("DB_READ_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function appendLedgerEventTx(db, event = {}) {
  const now = currentDbTime(db).nowMs;
  db.prepare(`
    INSERT INTO execution_ledger (
      event_version, tenant_id, workspace_id, plan_id, execution_id, step_id, attempt_number, event_type, event_payload, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(event.eventVersion || LEDGER_EVENT_VERSION),
    event.tenantId == null ? null : String(event.tenantId),
    event.workspaceId == null ? null : String(event.workspaceId),
    String(event.planId),
    event.executionId == null ? null : String(event.executionId),
    event.stepId == null ? null : String(event.stepId),
    event.attemptNumber == null ? null : Number(event.attemptNumber),
    String(event.eventType),
    stringifyJson(event.payload || {}),
    now,
  );
  return now;
}

function appendLedgerEvent(event = {}, tx = null) {
  if (!String(event.planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required for execution ledger events.");
  }
  if (!String(event.eventType || "").trim()) {
    return failure("INVALID_STATE", "eventType is required for execution ledger events.");
  }
  try {
    return executeWrite(tx, (db) => {
      const createdAt = appendLedgerEventTx(db, event);
      return success({
        planId: String(event.planId),
        executionId: event.executionId == null ? null : String(event.executionId),
        eventType: String(event.eventType),
        createdAt,
      });
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function listLedgerEvents(planId, executionId = null, scope = null) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required for ledger reads.");
  }
  try {
    return withDatabase((db) => {
      const rows = executionId
        ? db.prepare(`
            SELECT id, event_version, tenant_id, workspace_id, plan_id, execution_id, step_id, attempt_number, event_type, event_payload, created_at
            FROM execution_ledger
            WHERE plan_id = ? AND execution_id = ?
            ORDER BY id ASC
          `).all(String(planId), String(executionId))
        : db.prepare(`
            SELECT id, event_version, tenant_id, workspace_id, plan_id, execution_id, step_id, attempt_number, event_type, event_payload, created_at
            FROM execution_ledger
            WHERE plan_id = ?
            ORDER BY id ASC
          `).all(String(planId));
      const tenantScope = normalizeTenantScope(scope);
      return success(
        rows
          .map(mapLedgerRow)
          .filter((row) => !tenantScope.tenantId || row?.tenantId === tenantScope.tenantId)
      );
    });
  } catch (error) {
    return failure("DB_READ_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function createExecutionAttempt({
  planId,
  executionId,
  stepId,
  tenantId = null,
  workspaceId = null,
  sideEffectClass = "unknown",
  idempotencyKey = null,
}, tx = null) {
  const identityError = ensureIdentity(planId, executionId);
  if (identityError) {
    return identityError;
  }
  if (!String(stepId || "").trim()) {
    return failure("INVALID_STATE", "stepId is required.");
  }

  try {
    return executeWrite(tx, (db) => {
      const now = currentDbTime(db).nowMs;
      const normalizedSideEffectClass = normalizeSideEffectClass(sideEffectClass);
      const current = db.prepare(`
        SELECT COALESCE(MAX(attempt_number), 0) AS maxAttempt
        FROM execution_attempts
        WHERE plan_id = ? AND execution_id = ? AND step_id = ?
      `).get(String(planId), String(executionId), String(stepId));
      const attemptNumber = Number(current?.maxAttempt || 0) + 1;
      const leaseExpiresAt = now + LEASE_DURATION_MS;
      const resolvedIdempotencyKey = idempotencyKey == null && normalizedSideEffectClass === "external_write"
        ? `${String(planId)}:${String(executionId)}:${String(stepId)}:${attemptNumber}`
        : idempotencyKey == null
          ? null
          : String(idempotencyKey);

      db.prepare(`
        INSERT INTO execution_attempts (
          tenant_id, workspace_id, plan_id, execution_id, step_id, attempt_number, status, side_effect_class, idempotency_key,
          worker_id, heartbeat_at, lease_expires_at, result_payload, error_payload, created_at, updated_at, completed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, NULL)
      `).run(
        tenantId == null ? null : String(tenantId),
        workspaceId == null ? null : String(workspaceId),
        String(planId),
        String(executionId),
        String(stepId),
        attemptNumber,
        "running",
        normalizedSideEffectClass,
        resolvedIdempotencyKey,
        workerId,
        now,
        leaseExpiresAt,
        now,
        now,
      );
      touchExecutionAttemptMetricsTx(db, executionId, {
        totalAttempts: (() => {
          const metrics = db.prepare(`
            SELECT total_attempts AS totalAttempts
            FROM executions
            WHERE id = ?
          `).get(String(executionId));
          return Number(metrics?.totalAttempts || 0) + 1;
        })(),
      });

      appendLedgerEventTx(db, {
        tenantId,
        workspaceId,
        planId,
        executionId,
        stepId,
        attemptNumber,
        eventType: "attempt.started",
        payload: {
          status: "running",
          sideEffectClass: normalizedSideEffectClass,
          workerId,
          idempotencyKey: resolvedIdempotencyKey,
          leaseExpiresAt,
        },
      });

      const row = db.prepare(`
        SELECT *
        FROM execution_attempts
        WHERE plan_id = ? AND execution_id = ? AND step_id = ? AND attempt_number = ?
      `).get(String(planId), String(executionId), String(stepId), attemptNumber);

      return success(mapAttemptRow(row));
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function heartbeatExecutionAttempt(planId, executionId, stepId, attemptNumber, tx = null) {
  const identityError = ensureIdentity(planId, executionId);
  if (identityError) {
    return identityError;
  }
  try {
    return executeWrite(tx, (db) => {
      const now = currentDbTime(db).nowMs;
      const leaseExpiresAt = now + LEASE_DURATION_MS;
      const result = db.prepare(`
        UPDATE execution_attempts
        SET heartbeat_at = ?, lease_expires_at = ?, updated_at = ?
        WHERE plan_id = ? AND execution_id = ? AND step_id = ? AND attempt_number = ? AND status = 'running'
      `).run(now, leaseExpiresAt, now, String(planId), String(executionId), String(stepId), Number(attemptNumber));

      if (result.changes === 0) {
        return failure("NOT_FOUND", "Running attempt not found.");
      }
      const lockRenewal = renewExecutionLockTx(db, planId, executionId);
      if (!lockRenewal.ok) {
        return lockRenewal;
      }

      appendLedgerEventTx(db, {
        planId,
        executionId,
        stepId,
        attemptNumber,
        eventType: "attempt.heartbeat",
        payload: {
          heartbeatAt: now,
          leaseExpiresAt,
        },
      });

      return success({
        planId: String(planId),
        executionId: String(executionId),
        stepId: String(stepId),
        attemptNumber: Number(attemptNumber),
        heartbeatAt: now,
        leaseExpiresAt,
      });
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function completeExecutionAttempt(planId, executionId, stepId, attemptNumber, payload = {}, tx = null) {
  return finalizeAttempt(planId, executionId, stepId, attemptNumber, "completed", payload, null, tx);
}

function failExecutionAttempt(planId, executionId, stepId, attemptNumber, errorPayload = {}, tx = null) {
  return finalizeAttempt(planId, executionId, stepId, attemptNumber, "failed", null, errorPayload, tx);
}

function cancelExecutionAttempt(planId, executionId, stepId, attemptNumber, payload = {}, tx = null) {
  return finalizeAttempt(planId, executionId, stepId, attemptNumber, "cancelled", payload, null, tx);
}

function finalizeAttempt(planId, executionId, stepId, attemptNumber, status, resultPayload, errorPayload, tx = null) {
  const identityError = ensureIdentity(planId, executionId);
  if (identityError) {
    return identityError;
  }

  try {
    return executeWrite(tx, (db) => {
      const now = currentDbTime(db).nowMs;
      const normalizedStatus = normalizeAttemptStatus(status);
      const result = db.prepare(`
        UPDATE execution_attempts
        SET status = ?, result_payload = ?, error_payload = ?, updated_at = ?, completed_at = ?, lease_expires_at = ?, heartbeat_at = ?
        WHERE plan_id = ? AND execution_id = ? AND step_id = ? AND attempt_number = ?
      `).run(
        normalizedStatus,
        stringifyJson(resultPayload),
        stringifyJson(errorPayload),
        now,
        now,
        now,
        now,
        String(planId),
        String(executionId),
        String(stepId),
        Number(attemptNumber),
      );

      if (result.changes === 0) {
        return failure("NOT_FOUND", "Execution attempt not found.");
      }
      if (normalizedStatus === "completed") {
        touchExecutionAttemptMetricsTx(db, executionId, {
          consecutiveFailures: 0,
          noProgressAttempts: 0,
          lastProgressAt: currentDbTime(db).nowIso,
        });
      } else if (normalizedStatus === "failed") {
        const metrics = db.prepare(`
          SELECT consecutive_failures AS consecutiveFailures, no_progress_attempts AS noProgressAttempts
          FROM executions
          WHERE id = ?
        `).get(String(executionId));
        touchExecutionAttemptMetricsTx(db, executionId, {
          consecutiveFailures: Number(metrics?.consecutiveFailures || 0) + 1,
          noProgressAttempts: Number(metrics?.noProgressAttempts || 0) + 1,
        });
      }

      appendLedgerEventTx(db, {
        planId,
        executionId,
        stepId,
        attemptNumber,
        eventType: `attempt.${normalizedStatus}`,
        payload: normalizedStatus === "completed"
          ? { result: resultPayload || null }
          : normalizedStatus === "cancelled"
            ? { result: resultPayload || null }
            : { error: errorPayload || null },
      });

      const row = db.prepare(`
        SELECT *
        FROM execution_attempts
        WHERE plan_id = ? AND execution_id = ? AND step_id = ? AND attempt_number = ?
      `).get(String(planId), String(executionId), String(stepId), Number(attemptNumber));

      return success(mapAttemptRow(row));
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function listExecutionAttempts(planId, executionId = null, stepId = null, scope = null) {
  if (!String(planId || "").trim()) {
    return failure("INVALID_STATE", "planId is required for attempt reads.");
  }
  try {
    return withDatabase((db) => {
      let query = `
        SELECT *
        FROM execution_attempts
        WHERE plan_id = ?
      `;
      const args = [String(planId)];
      if (executionId) {
        query += " AND execution_id = ?";
        args.push(String(executionId));
      }
      if (stepId) {
        query += " AND step_id = ?";
        args.push(String(stepId));
      }
      query += " ORDER BY created_at ASC, id ASC";
      const rows = db.prepare(query).all(...args);
      const tenantScope = normalizeTenantScope(scope);
      return success(
        rows
          .map(mapAttemptRow)
          .filter((row) => !tenantScope.tenantId || row?.tenantId === tenantScope.tenantId)
      );
    });
  } catch (error) {
    return failure("DB_READ_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function enqueueOperatorRecovery({
  planId,
  executionId,
  stepId = null,
  tenantId = null,
  workspaceId = null,
  reason,
  lastState,
  safeOptions = [],
  recommended = null,
  ttlMs = OPERATOR_RECOVERY_TTL_MS,
}, tx = null) {
  const identityError = ensureIdentity(planId, executionId);
  if (identityError) {
    return identityError;
  }
  if (!String(reason || "").trim()) {
    return failure("INVALID_STATE", "reason is required.");
  }
  if (!String(lastState || "").trim()) {
    return failure("INVALID_STATE", "lastState is required.");
  }

  try {
    return executeWrite(tx, (db) => {
      const now = currentDbTime(db).nowMs;
      const expiresAtMs = now + Math.max(1, Number(ttlMs || OPERATOR_RECOVERY_TTL_MS));
      const inserted = db.prepare(`
        INSERT INTO execution_recovery_queue (
          tenant_id, workspace_id, plan_id, execution_id, step_id, reason, last_state, safe_options, recommended, created_at, expires_at_ms, resolved_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `).run(
        tenantId == null ? null : String(tenantId),
        workspaceId == null ? null : String(workspaceId),
        String(planId),
        String(executionId),
        stepId == null ? null : String(stepId),
        String(reason),
        String(lastState),
        stringifyJson(Array.isArray(safeOptions) ? safeOptions : []),
        recommended == null ? null : String(recommended),
        now,
        expiresAtMs,
      );

      appendLedgerEventTx(db, {
        tenantId,
        workspaceId,
        planId,
        executionId,
        stepId,
        eventType: "recovery.enqueued",
        payload: {
          reason: String(reason),
          lastState: String(lastState),
          safeOptions: Array.isArray(safeOptions) ? safeOptions : [],
          recommended: recommended == null ? null : String(recommended),
          expiresAtMs,
        },
      });

      const row = db.prepare(`
        SELECT *
        FROM execution_recovery_queue
        WHERE id = ?
      `).get(Number(inserted.lastInsertRowid));

      return success(mapRecoveryRow(row));
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function expireOperatorRecoveryItems(planId = null) {
  try {
    return runInTransaction((db) => {
      const now = currentDbTime(db).nowMs;
      const rows = planId
        ? db.prepare(`
            SELECT *
            FROM execution_recovery_queue
            WHERE plan_id = ? AND resolved_at IS NULL AND expires_at_ms <= ?
            ORDER BY id ASC
          `).all(String(planId), now)
        : db.prepare(`
            SELECT *
            FROM execution_recovery_queue
            WHERE resolved_at IS NULL AND expires_at_ms <= ?
            ORDER BY id ASC
          `).all(now);

      for (const row of rows) {
        db.prepare(`
          UPDATE execution_recovery_queue
          SET resolved_at = ?
          WHERE id = ?
        `).run(now, Number(row.id));

        appendLedgerEventTx(db, {
          planId: String(row.plan_id),
          executionId: String(row.execution_id),
          stepId: row.step_id == null ? null : String(row.step_id),
          eventType: "recovery.expired",
          payload: {
            recoveryId: Number(row.id),
            expiresAtMs: Number(row.expires_at_ms),
          },
        });
      }

      return success(rows.map(mapRecoveryRow));
    });
  } catch (error) {
    return failure("DB_WRITE_FAILED", error instanceof Error ? error.message : String(error));
  }
}

function listRecoveryQueue(planId = null, scope = null) {
  try {
    return withDatabase((db) => {
      const rows = planId
        ? db.prepare(`
            SELECT *
            FROM execution_recovery_queue
            WHERE plan_id = ?
            ORDER BY created_at ASC, id ASC
          `).all(String(planId))
        : db.prepare(`
            SELECT *
            FROM execution_recovery_queue
            ORDER BY created_at ASC, id ASC
          `).all();
      const tenantScope = normalizeTenantScope(scope);
      return success(
        rows
          .map(mapRecoveryRow)
          .filter((row) => !tenantScope.tenantId || row?.tenantId === tenantScope.tenantId)
      );
    });
  } catch (error) {
    return failure("DB_READ_FAILED", error instanceof Error ? error.message : String(error));
  }
}

module.exports = {
  EXECUTION_STATE_SCHEMA_VERSION,
  HEARTBEAT_INTERVAL_MS,
  LEDGER_EVENT_VERSION,
  LEASE_DURATION_MS,
  OPERATOR_RECOVERY_TTL_MS,
  acquireExecutionLock,
  acquireOrReuseExecutionLock,
  appendLedgerEvent,
  appendLedgerEventTx,
  cancelExecutionAttempt,
  completeExecutionAttempt,
  createExecutionAttempt,
  expireOperatorRecoveryItems,
  failExecutionAttempt,
  heartbeatExecutionAttempt,
  getActiveExecutionLock,
  listExecutionAttempts,
  listExecutionLocks,
  listLedgerEvents,
  listRecoveryQueue,
  renewExecutionLock,
  renewExecutionLockTx,
  releaseExecutionLock,
  releaseExecutionLockTx,
  workerId,
  enqueueOperatorRecovery,
};
