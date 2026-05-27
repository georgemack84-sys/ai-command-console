const db = require("./db");

const VALID_PHASES = new Set(["before", "after"]);

function getConnection(tx) {
  return tx || db;
}

function ensureCheckpointTable(conn) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS execution_checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_id TEXT NOT NULL,
      step_id TEXT,
      phase TEXT NOT NULL,
      state_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function readDbNowIso(conn) {
  const row = conn.prepare(`
    SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now') AS nowIso
  `).get();

  return String(row?.nowIso || new Date(0).toISOString());
}

function parseState(value) {
  if (typeof value !== "string" || !value.length) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapCheckpointRow(row) {
  if (!row) {
    return null;
  }

  return {
    executionId: String(row.execution_id),
    stepId: row.step_id == null ? null : String(row.step_id),
    phase: String(row.phase),
    state: parseState(row.state_json),
    createdAt: String(row.created_at),
  };
}

function writeCheckpoint({ executionId, stepId = null, phase, state }, tx) {
  const conn = getConnection(tx);
  ensureCheckpointTable(conn);

  if (!String(executionId || "").trim()) {
    throw new Error("EXECUTION_ID_REQUIRED");
  }
  if (!VALID_PHASES.has(String(phase || "").trim().toLowerCase())) {
    throw new Error("INVALID_PHASE");
  }

  const normalizedPhase = String(phase).trim().toLowerCase();
  const createdAt = readDbNowIso(conn);
  const serializedState = JSON.stringify(state == null ? null : state);

  conn.prepare(`
    INSERT INTO execution_checkpoints (
      execution_id,
      step_id,
      phase,
      state_json,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    String(executionId),
    stepId == null ? null : String(stepId),
    normalizedPhase,
    serializedState,
    createdAt
  );

  return {
    executionId: String(executionId),
    stepId: stepId == null ? null : String(stepId),
    phase: normalizedPhase,
    state: state == null ? null : state,
    createdAt,
  };
}

function getLatestCheckpoint(executionId, tx) {
  const conn = getConnection(tx);
  ensureCheckpointTable(conn);

  if (!String(executionId || "").trim()) {
    return null;
  }

  const row = conn.prepare(`
    SELECT execution_id, step_id, phase, state_json, created_at
    FROM execution_checkpoints
    WHERE execution_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(String(executionId));

  return mapCheckpointRow(row);
}

function getLatestCheckpointForStep({ executionId, stepId }, tx) {
  const conn = getConnection(tx);
  ensureCheckpointTable(conn);

  if (!String(executionId || "").trim() || !String(stepId || "").trim()) {
    return null;
  }

  const row = conn.prepare(`
    SELECT execution_id, step_id, phase, state_json, created_at
    FROM execution_checkpoints
    WHERE execution_id = ? AND step_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(String(executionId), String(stepId));

  return mapCheckpointRow(row);
}

module.exports = {
  getLatestCheckpoint,
  getLatestCheckpointForStep,
  writeCheckpoint,
};
