const db = require("./db");

function getConnection(tx) {
  return tx || db;
}

function ensureLedgerTable(conn) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS execution_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_version INTEGER NOT NULL DEFAULT 1,
      plan_id TEXT NOT NULL,
      execution_id TEXT,
      step_id TEXT,
      attempt_number INTEGER,
      event_type TEXT NOT NULL,
      event_payload TEXT,
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
  const row = conn.prepare(`
    SELECT plan_id AS planId
    FROM executions
    WHERE id = ?
  `).get(String(executionId));

  return row?.planId ? String(row.planId) : String(executionId);
}

function mapLedgerRow(row) {
  return {
    id: Number(row.id),
    executionId: row.execution_id == null ? null : String(row.execution_id),
    stepId: row.step_id == null ? null : String(row.step_id),
    eventType: String(row.event_type),
    event: typeof row.event_payload === "string" && row.event_payload.length
      ? JSON.parse(row.event_payload)
      : {},
    createdAt: String(row.created_at_iso || ""),
  };
}

function appendLedgerEvent({ executionId, stepId = null, eventType, event = {} }, tx) {
  const conn = getConnection(tx);
  ensureLedgerTable(conn);

  if (!String(executionId || "").trim()) {
    throw new Error("EXECUTION_ID_REQUIRED");
  }
  if (!String(eventType || "").trim()) {
    throw new Error("EVENT_TYPE_REQUIRED");
  }

  const now = readDbNow(conn);
  conn.prepare(`
    INSERT INTO execution_ledger (
      event_version,
      plan_id,
      execution_id,
      step_id,
      attempt_number,
      event_type,
      event_payload,
      created_at
    )
    VALUES (?, ?, ?, ?, NULL, ?, ?, ?)
  `).run(
    1,
    resolvePlanId(conn, executionId),
    String(executionId),
    stepId == null ? null : String(stepId),
    String(eventType),
    JSON.stringify(event == null ? null : event),
    now.nowMs
  );

  return {
    executionId: String(executionId),
    stepId: stepId == null ? null : String(stepId),
    eventType: String(eventType),
    event,
    createdAt: now.nowIso,
  };
}

function getLedgerByExecutionId(executionId, tx) {
  const conn = getConnection(tx);
  ensureLedgerTable(conn);

  if (!String(executionId || "").trim()) {
    return [];
  }

  const rows = conn.prepare(`
    SELECT
      id,
      execution_id,
      step_id,
      event_type,
      event_payload,
      strftime('%Y-%m-%dT%H:%M:%fZ', created_at / 1000.0, 'unixepoch') AS created_at_iso
    FROM execution_ledger
    WHERE execution_id = ?
    ORDER BY id ASC
  `).all(String(executionId));

  return rows.map(mapLedgerRow);
}

module.exports = {
  appendLedgerEvent,
  getLedgerByExecutionId,
};
