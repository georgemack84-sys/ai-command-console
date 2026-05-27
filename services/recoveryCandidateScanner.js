"use strict";

const { withDatabase, readDatabaseNow } = require("./stateDatabase");

const TERMINAL_LEDGER_EVENTS = new Set([
  "execution.completed",
  "execution.failed",
  "execution.cancelled",
  "execution.abandoned",
  "execution.corrupted",
]);

function success(data) {
  return { ok: true, data };
}

function reader(tx, work) {
  if (tx) {
    return work(tx);
  }
  return withDatabase((db) => work(db));
}

function normalizeLimit(limit) {
  const value = Number(limit);
  if (!Number.isFinite(value) || value <= 0) {
    return 25;
  }
  return Math.max(1, Math.min(200, Math.trunc(value)));
}

function detectSignal({ row, attempt, latestLedgerEvent, terminalLedgerEvent, nowMs }) {
  const executionStatus = String(row.executionStatus || "").trim().toLowerCase();
  const checkpointStatus = String(row.checkpointStatus || "").trim().toLowerCase();
  const leaseExpiresAt = row.leaseExpiresAt == null ? null : Number(row.leaseExpiresAt);
  const hasExpiredLease = leaseExpiresAt != null && leaseExpiresAt <= nowMs;

  if (executionStatus === "failed" || checkpointStatus === "failed") {
    return "FAILED_EXECUTION";
  }

  if (
    executionStatus === "paused_for_review"
    || checkpointStatus === "awaiting_review"
    || checkpointStatus === "pause_for_operator_recovery"
  ) {
    return "OPERATOR_PAUSED";
  }

  if (executionStatus === "running" && hasExpiredLease) {
    return "EXPIRED_LEASE";
  }

  if (
    attempt
    && String(attempt.status || "").trim().toLowerCase() === "running"
    && attempt.leaseExpiresAt != null
    && Number(attempt.leaseExpiresAt) <= nowMs
  ) {
    return "INTERRUPTED_ATTEMPT";
  }

  if (
    latestLedgerEvent
    && String(latestLedgerEvent.eventType || "") === "execution.started"
    && executionStatus !== "running"
    && !terminalLedgerEvent
  ) {
    return "MISSING_TERMINAL_EVENT";
  }

  if (
    row.lockWorkerId
    && row.lockReleasedAt == null
    && executionStatus !== "running"
    && executionStatus !== "paused_for_review"
  ) {
    return "STALE_LOCK";
  }

  return null;
}

function scanRecoveryCandidates({ db = null, modes = {}, limit = 25 } = {}) {
  void modes;
  const normalizedLimit = normalizeLimit(limit);
  return reader(db, (conn) => {
    const nowMs = readDatabaseNow(conn).nowMs;
    const rows = conn.prepare(`
      SELECT
        e.id AS executionId,
        e.plan_id AS planId,
        e.status AS executionStatus,
        e.lease_owner AS leaseOwner,
        e.lease_expires_at AS leaseExpiresAt,
        e.requires_review AS requiresReview,
        s.status AS checkpointStatus,
        s.currentStep AS currentStep,
        l.worker_id AS lockWorkerId,
        l.lease_expires_at AS lockLeaseExpiresAt,
        l.lock_released_at AS lockReleasedAt
      FROM executions e
      LEFT JOIN execution_state s
        ON s.planId = e.plan_id
      LEFT JOIN execution_locks l
        ON l.plan_id = e.plan_id AND l.execution_id = e.id
      ORDER BY COALESCE(e.last_updated_at, e.created_at) DESC, e.id ASC
      LIMIT ?
    `).all(normalizedLimit * 4);

    const candidates = [];
    for (const row of rows) {
      if (candidates.length >= normalizedLimit) {
        break;
      }

      const attempt = conn.prepare(`
        SELECT
          status,
          lease_expires_at AS leaseExpiresAt
        FROM execution_attempts
        WHERE plan_id = ? AND execution_id = ?
        ORDER BY id DESC
        LIMIT 1
      `).get(String(row.planId), String(row.executionId)) || null;

      const latestLedgerEvent = conn.prepare(`
        SELECT event_type AS eventType, created_at AS createdAt
        FROM execution_ledger
        WHERE plan_id = ? AND execution_id = ?
        ORDER BY id DESC
        LIMIT 1
      `).get(String(row.planId), String(row.executionId)) || null;

      const terminalLedgerEvent = conn.prepare(`
        SELECT event_type AS eventType
        FROM execution_ledger
        WHERE plan_id = ? AND execution_id = ?
          AND event_type IN ('execution.completed', 'execution.failed', 'execution.cancelled', 'execution.abandoned', 'execution.corrupted')
        ORDER BY id DESC
        LIMIT 1
      `).get(String(row.planId), String(row.executionId)) || null;

      const signalType = detectSignal({
        row,
        attempt,
        latestLedgerEvent,
        terminalLedgerEvent,
        nowMs,
      });

      if (!signalType) {
        continue;
      }

      candidates.push({
        executionId: String(row.executionId),
        planId: String(row.planId),
        signalType,
        detectedAt: new Date(nowMs).toISOString(),
        evidence: {
          executionStatus: row.executionStatus == null ? null : String(row.executionStatus),
          checkpointStatus: row.checkpointStatus == null ? null : String(row.checkpointStatus),
          leaseOwner: row.leaseOwner == null ? null : String(row.leaseOwner),
          leaseExpiresAt: row.leaseExpiresAt == null ? null : Number(row.leaseExpiresAt),
          requiresReview: Boolean(row.requiresReview),
          currentStep: row.currentStep == null ? null : Number(row.currentStep),
          latestLedgerEvent: latestLedgerEvent?.eventType || null,
          hasTerminalLedgerEvent: terminalLedgerEvent != null && TERMINAL_LEDGER_EVENTS.has(String(terminalLedgerEvent.eventType || "")),
          attemptStatus: attempt?.status || null,
          attemptLeaseExpiresAt: attempt?.leaseExpiresAt == null ? null : Number(attempt.leaseExpiresAt),
        },
      });
    }

    return success({ candidates });
  });
}

module.exports = {
  scanRecoveryCandidates,
};
