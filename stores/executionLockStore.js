const db = require("./db");
const ledgerStore = require("./executionLedgerStore");

const DEFAULT_LOCK_LEASE_MS = 30000;

function getConnection(tx) {
  return tx || db;
}

function ensureLocksTable(conn) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS execution_locks (
      plan_id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      worker_id TEXT NOT NULL,
      lock_acquired_at INTEGER NOT NULL,
      lock_released_at INTEGER,
      created_at INTEGER NOT NULL
    );
  `);
}

function readDbNow(conn) {
  const row = conn.prepare(`
    SELECT
      CAST(strftime('%s','now') AS INTEGER) * 1000 AS nowMs,
      strftime('%Y-%m-%dT%H:%M:%fZ','now') AS nowIso
  `).get();

  return {
    nowMs: Number(row?.nowMs || 0),
    nowIso: String(row?.nowIso || new Date(0).toISOString()),
  };
}

function resolvePlanId(conn, executionId) {
  const execution = conn.prepare(`
    SELECT plan_id AS planId
    FROM executions
    WHERE id = ?
  `).get(String(executionId));

  if (execution?.planId) {
    return String(execution.planId);
  }

  const existingByExecution = conn.prepare(`
    SELECT plan_id AS planId
    FROM execution_locks
    WHERE execution_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(String(executionId));

  if (existingByExecution?.planId) {
    return String(existingByExecution.planId);
  }

  return String(executionId);
}

function mapLockRow(row) {
  if (!row) {
    return null;
  }

  return {
    executionId: String(row.execution_id),
    ownerId: String(row.worker_id),
    planId: String(row.plan_id),
    acquiredAt: String(row.acquired_at_iso || ""),
    releasedAt: row.released_at_iso == null ? null : String(row.released_at_iso),
    leaseExpiresAt: row.lease_expires_at_iso == null ? null : String(row.lease_expires_at_iso),
  };
}

function getLock(executionId, tx) {
  const conn = getConnection(tx);
  ensureLocksTable(conn);

  if (!String(executionId || "").trim()) {
    return null;
  }

  const planId = resolvePlanId(conn, executionId);
  const row = conn.prepare(`
    SELECT
      plan_id,
      execution_id,
      worker_id,
      strftime('%Y-%m-%dT%H:%M:%fZ', lock_acquired_at / 1000.0, 'unixepoch') AS acquired_at_iso,
      CASE
        WHEN lock_released_at IS NULL THEN NULL
        ELSE strftime('%Y-%m-%dT%H:%M:%fZ', lock_released_at / 1000.0, 'unixepoch')
      END AS released_at_iso,
      strftime('%Y-%m-%dT%H:%M:%fZ', (lock_acquired_at + ?) / 1000.0, 'unixepoch') AS lease_expires_at_iso
    FROM execution_locks
    WHERE plan_id = ? AND execution_id = ?
  `).get(DEFAULT_LOCK_LEASE_MS, planId, String(executionId));

  return mapLockRow(row);
}

function isLeaseExpired(lock) {
  if (!lock?.leaseExpiresAt) {
    return false;
  }

  return Date.parse(String(lock.leaseExpiresAt)) <= Date.now();
}

function acquireLock({ executionId, ownerId }, tx) {
  const conn = getConnection(tx);
  ensureLocksTable(conn);

  if (!String(executionId || "").trim()) {
    throw new Error("EXECUTION_ID_REQUIRED");
  }
  if (!String(ownerId || "").trim()) {
    throw new Error("OWNER_ID_REQUIRED");
  }

  const now = readDbNow(conn);
  const planId = resolvePlanId(conn, executionId);
  const existing = conn.prepare(`
    SELECT plan_id, execution_id, worker_id, lock_acquired_at, lock_released_at, created_at
    FROM execution_locks
    WHERE plan_id = ?
  `).get(planId);

  if (existing && existing.lock_released_at == null) {
    if (String(existing.worker_id) === String(ownerId) && String(existing.execution_id) === String(executionId)) {
      conn.prepare(`
        UPDATE execution_locks
        SET lock_acquired_at = ?, lock_released_at = NULL
        WHERE plan_id = ?
      `).run(now.nowMs, planId);

      ledgerStore.appendLedgerEvent({
        executionId,
        stepId: null,
        eventType: "LOCK_RENEWED",
        event: { ownerId: String(ownerId) },
      }, conn);

      return { acquired: true, renewed: true, released: false };
    }

    if (isLeaseExpired(mapLockRow({
      ...existing,
      acquired_at_iso: new Date(Number(existing.lock_acquired_at)).toISOString(),
      released_at_iso: existing.lock_released_at == null ? null : new Date(Number(existing.lock_released_at)).toISOString(),
      lease_expires_at_iso: new Date(Number(existing.lock_acquired_at) + DEFAULT_LOCK_LEASE_MS).toISOString(),
    }))) {
      conn.prepare(`
        UPDATE execution_locks
        SET execution_id = ?, worker_id = ?, lock_acquired_at = ?, lock_released_at = NULL
        WHERE plan_id = ?
      `).run(String(executionId), String(ownerId), now.nowMs, planId);

      ledgerStore.appendLedgerEvent({
        executionId,
        stepId: null,
        eventType: "LOCK_STOLEN_AFTER_EXPIRY",
        event: {
          ownerId: String(ownerId),
          previousOwnerId: String(existing.worker_id),
        },
      }, conn);

      return { acquired: true, renewed: false, released: false };
    }

    ledgerStore.appendLedgerEvent({
      executionId,
      stepId: null,
      eventType: "LOCK_ACQUIRE_BLOCKED",
      event: {
        ownerId: String(ownerId),
        currentOwnerId: String(existing.worker_id),
      },
    }, conn);

    return { acquired: false, renewed: false, released: false };
  }

  conn.prepare(`
    INSERT INTO execution_locks (
      plan_id, execution_id, worker_id, lock_acquired_at, lock_released_at, created_at
    )
    VALUES (?, ?, ?, ?, NULL, ?)
    ON CONFLICT(plan_id) DO UPDATE SET
      execution_id = excluded.execution_id,
      worker_id = excluded.worker_id,
      lock_acquired_at = excluded.lock_acquired_at,
      lock_released_at = NULL
  `).run(planId, String(executionId), String(ownerId), now.nowMs, now.nowMs);

  ledgerStore.appendLedgerEvent({
    executionId,
    stepId: null,
    eventType: "LOCK_ACQUIRED",
    event: { ownerId: String(ownerId) },
  }, conn);

  return { acquired: true, renewed: false, released: false };
}

function renewLock({ executionId, ownerId }, tx) {
  const conn = getConnection(tx);
  ensureLocksTable(conn);

  const lock = getLock(executionId, conn);
  if (!lock || lock.releasedAt) {
    return { renewed: false };
  }
  if (String(lock.ownerId) !== String(ownerId)) {
    return { renewed: false };
  }

  const now = readDbNow(conn);
  conn.prepare(`
    UPDATE execution_locks
    SET lock_acquired_at = ?, lock_released_at = NULL
    WHERE plan_id = ? AND execution_id = ?
  `).run(now.nowMs, String(lock.planId), String(executionId));

  ledgerStore.appendLedgerEvent({
    executionId,
    stepId: null,
    eventType: "LOCK_RENEWED",
    event: { ownerId: String(ownerId) },
  }, conn);

  return { renewed: true };
}

function releaseLock({ executionId, ownerId }, tx) {
  const conn = getConnection(tx);
  ensureLocksTable(conn);

  const lock = getLock(executionId, conn);
  if (!lock || lock.releasedAt) {
    return { released: false };
  }
  if (String(lock.ownerId) !== String(ownerId)) {
    return { released: false };
  }

  const now = readDbNow(conn);
  conn.prepare(`
    UPDATE execution_locks
    SET lock_released_at = ?
    WHERE plan_id = ? AND execution_id = ?
  `).run(now.nowMs, String(lock.planId), String(executionId));

  ledgerStore.appendLedgerEvent({
    executionId,
    stepId: null,
    eventType: "LOCK_RELEASED",
    event: { ownerId: String(ownerId) },
  }, conn);

  return { released: true };
}

module.exports = {
  acquireLock,
  getLock,
  isLeaseExpired,
  releaseLock,
  renewLock,
};
