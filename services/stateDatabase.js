const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { getAgentsDataPath } = require("./runtimePaths");

let database = null;
let bootstrappedLegacyDocuments = null;
const DOCUMENT_SCHEMA_VERSION = 1;

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function getDatabasePath() {
  return readEnv("AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH") || getAgentsDataPath("console.sqlite");
}

function getDataDir() {
  return path.dirname(getDatabasePath());
}

function writeLegacyJsonMirrorsEnabled() {
  const configured = String(process.env.AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS || "").trim().toLowerCase();
  if (configured === "true" || configured === "1" || configured === "yes") {
    return true;
  }
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }
  return String(process.env.NODE_ENV || "").toLowerCase() === "test";
}

function isMalformedDatabaseError(error) {
  return /(database disk image is malformed|file is not a database|disk i\/o error)/i.test(
    String(error?.message || error || "")
  );
}

function removeDatabaseFiles() {
  closeDatabase();
  const databasePath = getDatabasePath();
  for (const filePath of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }
}

function ensureDataDir() {
  fs.mkdirSync(getDataDir(), { recursive: true });
}

function extractLegacyDocuments() {
  const databasePath = getDatabasePath();
  if (!fs.existsSync(databasePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(databasePath, "utf8");
    const parsed = JSON.parse(raw);
    const documents = parsed && typeof parsed === "object" && parsed.documents && typeof parsed.documents === "object"
      ? parsed.documents
      : null;

    if (!documents) {
      return null;
    }

    fs.unlinkSync(databasePath);
    return documents;
  } catch {
    return null;
  }
}

function openDatabase() {
  if (database) {
    return database;
  }

  try {
    ensureDataDir();
    bootstrappedLegacyDocuments = extractLegacyDocuments();
    database = new Database(getDatabasePath());
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");
    database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS schema_metadata (
        name TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS documents (
        key TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        plan_id TEXT,
        status TEXT NOT NULL,
        trigger_source TEXT NOT NULL,
        requires_review INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        started_at TEXT,
        finished_at TEXT,
        cancelled_at TEXT,
        last_updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS execution_state (
        planId TEXT PRIMARY KEY,
        planVersion TEXT NULL,
        currentStep INTEGER NOT NULL,
        status TEXT NOT NULL,
        lastCompletedStepIndex INTEGER NOT NULL DEFAULT -1,
        cancellationRequested INTEGER NOT NULL DEFAULT 0,
        updatedAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS execution_locks (
        plan_id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        lock_acquired_at INTEGER NOT NULL,
        heartbeat_at INTEGER,
        lease_expires_at INTEGER,
        lock_released_at INTEGER,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS execution_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id TEXT NOT NULL,
        execution_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        attempt_number INTEGER NOT NULL,
        status TEXT NOT NULL,
        side_effect_class TEXT NOT NULL DEFAULT 'unknown',
        idempotency_key TEXT,
        worker_id TEXT,
        heartbeat_at INTEGER,
        lease_expires_at INTEGER,
        result_payload TEXT,
        error_payload TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER,
        UNIQUE (plan_id, execution_id, step_id, attempt_number),
        UNIQUE (idempotency_key)
      );
      CREATE TABLE IF NOT EXISTS execution_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_version INTEGER NOT NULL,
        plan_id TEXT NOT NULL,
        execution_id TEXT,
        step_id TEXT,
        attempt_number INTEGER,
        event_type TEXT NOT NULL,
        event_payload TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS execution_recovery_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id TEXT NOT NULL,
        execution_id TEXT NOT NULL,
        step_id TEXT,
        reason TEXT NOT NULL,
        last_state TEXT NOT NULL,
        safe_options TEXT NOT NULL,
        recommended TEXT,
        created_at INTEGER NOT NULL,
        expires_at_ms INTEGER NOT NULL,
        resolved_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS operator_action_idempotency (
        idempotency_key TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        execution_id TEXT,
        action_type TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        request_fingerprint TEXT NOT NULL,
        response_payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at_ms INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS execution_steps (
        id TEXT NOT NULL,
        execution_id TEXT NOT NULL,
        stage_id TEXT,
        parent_step_id TEXT,
        sequence INTEGER NOT NULL,
        status TEXT NOT NULL,
        kind TEXT,
        original_text TEXT,
        original_input TEXT,
        normalized_input TEXT,
        resolved_command TEXT,
        depends_on_step_ids TEXT NOT NULL DEFAULT '[]',
        blocking INTEGER NOT NULL DEFAULT 0,
        can_run_if_prior_failed INTEGER NOT NULL DEFAULT 0,
        can_run_if_prior_deferred INTEGER NOT NULL DEFAULT 0,
        risk_level TEXT,
        policy_result TEXT,
        pause_reason TEXT,
        rewrite_reason TEXT,
        deferred INTEGER NOT NULL DEFAULT 0,
        block_reason TEXT,
        normalization_note TEXT,
        review_acknowledged INTEGER NOT NULL DEFAULT 0,
        idempotency_class TEXT NOT NULL DEFAULT 'unknown',
        created_at TEXT NOT NULL,
        started_at TEXT,
        finished_at TEXT,
        error_code TEXT,
        error_message TEXT,
        PRIMARY KEY (execution_id, id),
        UNIQUE (execution_id, sequence),
        FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS execution_stages (
        id TEXT NOT NULL,
        execution_id TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        name TEXT,
        status TEXT NOT NULL,
        requires_review INTEGER NOT NULL DEFAULT 0,
        pause_reason TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        finished_at TEXT,
        last_updated_at TEXT NOT NULL,
        PRIMARY KEY (execution_id, id),
        UNIQUE (execution_id, sequence),
        FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS review_records (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        step_id TEXT,
        review_action TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        proposal_type TEXT,
        operator_modified INTEGER NOT NULL DEFAULT 0,
        final_text TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        execution_id TEXT,
        step_id TEXT,
        event_type TEXT NOT NULL,
        event_payload TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS learning_patterns (
        id TEXT PRIMARY KEY,
        signature TEXT NOT NULL UNIQUE,
        scope TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'shadow',
        validation_status TEXT NOT NULL DEFAULT 'pending',
        confidence REAL NOT NULL DEFAULT 0,
        decay_rate REAL NOT NULL DEFAULT 0.1,
        evidence_count INTEGER NOT NULL DEFAULT 0,
        contradiction_count INTEGER NOT NULL DEFAULT 0,
        hint_payload TEXT,
        shadow_payload TEXT,
        last_seen_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pattern_approvals (
        id TEXT PRIMARY KEY,
        pattern_id TEXT NOT NULL,
        approved_by TEXT NOT NULL,
        approved_at TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (pattern_id) REFERENCES learning_patterns(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_executions_status_updated
        ON executions(status, last_updated_at);
      CREATE INDEX IF NOT EXISTS idx_execution_locks_plan
        ON execution_locks(plan_id);
      CREATE INDEX IF NOT EXISTS idx_execution_attempts_lookup
        ON execution_attempts(plan_id, execution_id, step_id, attempt_number);
      CREATE INDEX IF NOT EXISTS idx_execution_attempts_status
        ON execution_attempts(status);
      CREATE INDEX IF NOT EXISTS idx_execution_attempts_lease
        ON execution_attempts(lease_expires_at);
      CREATE INDEX IF NOT EXISTS idx_execution_ledger_plan_execution
        ON execution_ledger(plan_id, execution_id);
      CREATE INDEX IF NOT EXISTS idx_execution_ledger_step_attempt
        ON execution_ledger(step_id, attempt_number);
      CREATE INDEX IF NOT EXISTS idx_execution_recovery_queue_plan
        ON execution_recovery_queue(plan_id);
      CREATE INDEX IF NOT EXISTS idx_execution_recovery_queue_expiry
        ON execution_recovery_queue(expires_at_ms);
      CREATE INDEX IF NOT EXISTS idx_operator_action_idempotency_plan
        ON operator_action_idempotency(plan_id);
      CREATE INDEX IF NOT EXISTS idx_operator_action_idempotency_expiry
        ON operator_action_idempotency(expires_at_ms);
      CREATE INDEX IF NOT EXISTS idx_execution_steps_execution_sequence
        ON execution_steps(execution_id, sequence);
      CREATE INDEX IF NOT EXISTS idx_execution_steps_status
        ON execution_steps(status);
      CREATE INDEX IF NOT EXISTS idx_execution_stages_execution_sequence
        ON execution_stages(execution_id, sequence);
      CREATE INDEX IF NOT EXISTS idx_review_records_execution_step
        ON review_records(execution_id, step_id);
      CREATE INDEX IF NOT EXISTS idx_review_records_pending
        ON review_records(execution_id, review_action);
      CREATE INDEX IF NOT EXISTS idx_audit_events_execution_created
        ON audit_events(execution_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_learning_patterns_mode_updated
        ON learning_patterns(mode, updated_at);
      CREATE INDEX IF NOT EXISTS idx_learning_patterns_signature
        ON learning_patterns(signature);
      CREATE INDEX IF NOT EXISTS idx_pattern_approvals_pattern
        ON pattern_approvals(pattern_id, approved_at);
      CREATE TRIGGER IF NOT EXISTS trg_execution_ledger_no_update
      BEFORE UPDATE ON execution_ledger
      BEGIN
        SELECT RAISE(ABORT, 'execution_ledger is immutable');
      END;
      CREATE TRIGGER IF NOT EXISTS trg_execution_ledger_no_delete
      BEFORE DELETE ON execution_ledger
      BEGIN
        SELECT RAISE(ABORT, 'execution_ledger is immutable');
      END;
    `);
    ensureExecutionSchemaColumns(database);
    ensureSchemaMetadata(database);
    migrateLegacyJsonDatabase(database);
    return database;
  } catch (error) {
    if (isMalformedDatabaseError(error)) {
      removeDatabaseFiles();
      ensureDataDir();
      database = new Database(getDatabasePath());
      database.pragma("journal_mode = WAL");
      database.pragma("foreign_keys = ON");
      database.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS schema_metadata (
          name TEXT PRIMARY KEY,
          version INTEGER NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS documents (
          key TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS executions (
          id TEXT PRIMARY KEY,
          plan_id TEXT,
          status TEXT NOT NULL,
          trigger_source TEXT NOT NULL,
          requires_review INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          started_at TEXT,
          finished_at TEXT,
          cancelled_at TEXT,
          last_updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS execution_state (
          planId TEXT PRIMARY KEY,
          planVersion TEXT NULL,
          currentStep INTEGER NOT NULL,
          status TEXT NOT NULL,
          lastCompletedStepIndex INTEGER NOT NULL DEFAULT -1,
          cancellationRequested INTEGER NOT NULL DEFAULT 0,
          updatedAt INTEGER NOT NULL
        );
      CREATE TABLE IF NOT EXISTS execution_locks (
        plan_id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        lock_acquired_at INTEGER NOT NULL,
        heartbeat_at INTEGER,
        lease_expires_at INTEGER,
        lock_released_at INTEGER,
        created_at INTEGER NOT NULL
      );
        CREATE TABLE IF NOT EXISTS execution_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plan_id TEXT NOT NULL,
          execution_id TEXT NOT NULL,
          step_id TEXT NOT NULL,
          attempt_number INTEGER NOT NULL,
          status TEXT NOT NULL,
          side_effect_class TEXT NOT NULL DEFAULT 'unknown',
          idempotency_key TEXT,
          worker_id TEXT,
          heartbeat_at INTEGER,
          lease_expires_at INTEGER,
          result_payload TEXT,
          error_payload TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          completed_at INTEGER,
          UNIQUE (plan_id, execution_id, step_id, attempt_number),
          UNIQUE (idempotency_key)
        );
        CREATE TABLE IF NOT EXISTS execution_ledger (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_version INTEGER NOT NULL,
          plan_id TEXT NOT NULL,
          execution_id TEXT,
          step_id TEXT,
          attempt_number INTEGER,
          event_type TEXT NOT NULL,
          event_payload TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS execution_recovery_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plan_id TEXT NOT NULL,
          execution_id TEXT NOT NULL,
          step_id TEXT,
          reason TEXT NOT NULL,
          last_state TEXT NOT NULL,
          safe_options TEXT NOT NULL,
          recommended TEXT,
          created_at INTEGER NOT NULL,
          expires_at_ms INTEGER NOT NULL,
          resolved_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS operator_action_idempotency (
          idempotency_key TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL,
          execution_id TEXT,
          action_type TEXT NOT NULL,
          actor_id TEXT NOT NULL,
          request_fingerprint TEXT NOT NULL,
          response_payload TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at_ms INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS execution_steps (
          id TEXT NOT NULL,
          execution_id TEXT NOT NULL,
          stage_id TEXT,
          parent_step_id TEXT,
          sequence INTEGER NOT NULL,
          status TEXT NOT NULL,
          kind TEXT,
          original_text TEXT,
          original_input TEXT,
          normalized_input TEXT,
          resolved_command TEXT,
          depends_on_step_ids TEXT NOT NULL DEFAULT '[]',
          blocking INTEGER NOT NULL DEFAULT 0,
          can_run_if_prior_failed INTEGER NOT NULL DEFAULT 0,
          can_run_if_prior_deferred INTEGER NOT NULL DEFAULT 0,
          risk_level TEXT,
          policy_result TEXT,
          pause_reason TEXT,
          rewrite_reason TEXT,
          deferred INTEGER NOT NULL DEFAULT 0,
          block_reason TEXT,
          normalization_note TEXT,
          review_acknowledged INTEGER NOT NULL DEFAULT 0,
          idempotency_class TEXT NOT NULL DEFAULT 'unknown',
          created_at TEXT NOT NULL,
          started_at TEXT,
          finished_at TEXT,
          error_code TEXT,
          error_message TEXT,
          PRIMARY KEY (execution_id, id),
          UNIQUE (execution_id, sequence),
          FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS execution_stages (
          id TEXT NOT NULL,
          execution_id TEXT NOT NULL,
          sequence INTEGER NOT NULL,
          name TEXT,
          status TEXT NOT NULL,
          requires_review INTEGER NOT NULL DEFAULT 0,
          pause_reason TEXT,
          created_at TEXT NOT NULL,
          started_at TEXT,
          finished_at TEXT,
          last_updated_at TEXT NOT NULL,
          PRIMARY KEY (execution_id, id),
          UNIQUE (execution_id, sequence),
          FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS review_records (
          id TEXT PRIMARY KEY,
          execution_id TEXT NOT NULL,
          step_id TEXT,
          review_action TEXT,
          reviewed_by TEXT,
          reviewed_at TEXT,
          proposal_type TEXT,
          operator_modified INTEGER NOT NULL DEFAULT 0,
          final_text TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS audit_events (
          id TEXT PRIMARY KEY,
          execution_id TEXT,
          step_id TEXT,
          event_type TEXT NOT NULL,
          event_payload TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS learning_patterns (
          id TEXT PRIMARY KEY,
          signature TEXT NOT NULL UNIQUE,
          scope TEXT NOT NULL,
          mode TEXT NOT NULL DEFAULT 'shadow',
          validation_status TEXT NOT NULL DEFAULT 'pending',
          confidence REAL NOT NULL DEFAULT 0,
          decay_rate REAL NOT NULL DEFAULT 0.1,
          evidence_count INTEGER NOT NULL DEFAULT 0,
          contradiction_count INTEGER NOT NULL DEFAULT 0,
          hint_payload TEXT,
          shadow_payload TEXT,
          last_seen_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pattern_approvals (
          id TEXT PRIMARY KEY,
          pattern_id TEXT NOT NULL,
          approved_by TEXT NOT NULL,
          approved_at TEXT NOT NULL,
          notes TEXT,
          FOREIGN KEY (pattern_id) REFERENCES learning_patterns(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_executions_status_updated
          ON executions(status, last_updated_at);
        CREATE INDEX IF NOT EXISTS idx_execution_locks_plan
          ON execution_locks(plan_id);
        CREATE INDEX IF NOT EXISTS idx_execution_attempts_lookup
          ON execution_attempts(plan_id, execution_id, step_id, attempt_number);
        CREATE INDEX IF NOT EXISTS idx_execution_attempts_status
          ON execution_attempts(status);
        CREATE INDEX IF NOT EXISTS idx_execution_attempts_lease
          ON execution_attempts(lease_expires_at);
        CREATE INDEX IF NOT EXISTS idx_execution_ledger_plan_execution
          ON execution_ledger(plan_id, execution_id);
        CREATE INDEX IF NOT EXISTS idx_execution_ledger_step_attempt
          ON execution_ledger(step_id, attempt_number);
        CREATE INDEX IF NOT EXISTS idx_execution_recovery_queue_plan
          ON execution_recovery_queue(plan_id);
        CREATE INDEX IF NOT EXISTS idx_execution_recovery_queue_expiry
          ON execution_recovery_queue(expires_at_ms);
        CREATE INDEX IF NOT EXISTS idx_operator_action_idempotency_plan
          ON operator_action_idempotency(plan_id);
        CREATE INDEX IF NOT EXISTS idx_operator_action_idempotency_expiry
          ON operator_action_idempotency(expires_at_ms);
        CREATE INDEX IF NOT EXISTS idx_execution_steps_execution_sequence
          ON execution_steps(execution_id, sequence);
        CREATE INDEX IF NOT EXISTS idx_execution_steps_status
          ON execution_steps(status);
        CREATE INDEX IF NOT EXISTS idx_execution_stages_execution_sequence
          ON execution_stages(execution_id, sequence);
        CREATE INDEX IF NOT EXISTS idx_review_records_execution_step
          ON review_records(execution_id, step_id);
        CREATE INDEX IF NOT EXISTS idx_review_records_pending
          ON review_records(execution_id, review_action);
        CREATE INDEX IF NOT EXISTS idx_audit_events_execution_created
          ON audit_events(execution_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_learning_patterns_mode_updated
          ON learning_patterns(mode, updated_at);
        CREATE INDEX IF NOT EXISTS idx_learning_patterns_signature
          ON learning_patterns(signature);
        CREATE INDEX IF NOT EXISTS idx_pattern_approvals_pattern
          ON pattern_approvals(pattern_id, approved_at);
        CREATE TRIGGER IF NOT EXISTS trg_execution_ledger_no_update
        BEFORE UPDATE ON execution_ledger
        BEGIN
          SELECT RAISE(ABORT, 'execution_ledger is immutable');
        END;
        CREATE TRIGGER IF NOT EXISTS trg_execution_ledger_no_delete
        BEFORE DELETE ON execution_ledger
        BEGIN
          SELECT RAISE(ABORT, 'execution_ledger is immutable');
        END;
      `);
      ensureExecutionSchemaColumns(database);
      ensureSchemaMetadata(database);
      return database;
    }
    throw error;
  }
}

function ensureSchemaMetadata(db) {
  const now = readDatabaseNow(db).nowIso;
  db.prepare(`
    INSERT INTO schema_metadata (name, version, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      version = excluded.version,
      updated_at = excluded.updated_at
  `).run("documents", DOCUMENT_SCHEMA_VERSION, now);
  db.prepare(`
    INSERT INTO schema_metadata (name, version, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      version = excluded.version,
      updated_at = excluded.updated_at
  `).run("execution_state", 1, now);
  db.prepare(`
    INSERT INTO schema_metadata (name, version, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      version = excluded.version,
      updated_at = excluded.updated_at
  `).run("execution_integrity", 1, now);
}

function migrateLegacyJsonDatabase(db) {
  const documents = bootstrappedLegacyDocuments;
  bootstrappedLegacyDocuments = null;

  if (!documents) {
    return;
  }

  try {
    const insert = db.prepare(`
      INSERT INTO documents (key, payload, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        payload = excluded.payload,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `);

    for (const [key, record] of Object.entries(documents)) {
      if (!record || typeof record !== "object" || !record.payload) {
        continue;
      }

      insert.run(
        String(key),
        String(record.payload),
        record.created_at || new Date().toISOString(),
        record.updated_at || new Date().toISOString(),
      );
    }
  } catch {
    return;
  }
}

function ensureExecutionSchemaColumns(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      plan_id TEXT,
      status TEXT NOT NULL,
      trigger_source TEXT NOT NULL,
      requires_review INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT,
      cancelled_at TEXT,
      last_updated_at TEXT NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS execution_state (
      planId TEXT PRIMARY KEY,
      planVersion TEXT NULL,
      currentStep INTEGER NOT NULL,
      status TEXT NOT NULL,
      lastCompletedStepIndex INTEGER NOT NULL DEFAULT -1,
      cancellationRequested INTEGER NOT NULL DEFAULT 0,
      updatedAt INTEGER NOT NULL
    )
  `);

  const checkpointColumns = new Set(
    db.prepare("PRAGMA table_info(execution_state)").all().map((column) => String(column.name))
  );
  if (!checkpointColumns.has("cancellationRequested")) {
    db.exec(`
      ALTER TABLE execution_state
      ADD COLUMN cancellationRequested INTEGER NOT NULL DEFAULT 0
    `);
  }

  const executionColumns = new Set(
    db.prepare("PRAGMA table_info(executions)").all().map((column) => String(column.name))
  );

  const lockColumns = new Set(
    db.prepare("PRAGMA table_info(execution_locks)").all().map((column) => String(column.name))
  );

  const requiredLockColumns = [
    ["tenant_id", "TEXT"],
    ["workspace_id", "TEXT"],
    ["heartbeat_at", "INTEGER"],
    ["lease_expires_at", "INTEGER"],
  ];

  for (const [name, definition] of requiredLockColumns) {
    if (!lockColumns.has(name)) {
      db.exec(`
        ALTER TABLE execution_locks
        ADD COLUMN ${name} ${definition}
      `);
    }
  }

  const requiredExecutionColumns = [
    ["tenant_id", "TEXT"],
    ["workspace_id", "TEXT"],
    ["lease_owner", "TEXT"],
    ["lease_expires_at", "INTEGER"],
    ["total_attempts", "INTEGER NOT NULL DEFAULT 0"],
    ["consecutive_failures", "INTEGER NOT NULL DEFAULT 0"],
    ["no_progress_attempts", "INTEGER NOT NULL DEFAULT 0"],
    ["last_progress_at", "TEXT"],
  ];

  for (const [name, definition] of requiredExecutionColumns) {
    if (!executionColumns.has(name)) {
      db.exec(`
        ALTER TABLE executions
        ADD COLUMN ${name} ${definition}
      `);
    }
  }

  const stepColumns = new Set(
    db.prepare("PRAGMA table_info(execution_steps)").all().map((column) => String(column.name))
  );

  const requiredStepColumns = [
    ["stage_id", "TEXT"],
    ["original_input", "TEXT"],
    ["normalized_input", "TEXT"],
    ["rewrite_reason", "TEXT"],
    ["deferred", "INTEGER NOT NULL DEFAULT 0"],
    ["block_reason", "TEXT"],
    ["normalization_note", "TEXT"],
    ["review_acknowledged", "INTEGER NOT NULL DEFAULT 0"],
    ["attempt_number", "INTEGER NOT NULL DEFAULT 0"],
    ["attempts", "INTEGER NOT NULL DEFAULT 0"],
    ["idempotency_key", "TEXT"],
    ["is_idempotent", "INTEGER NOT NULL DEFAULT 0"],
    ["side_effects", "TEXT NOT NULL DEFAULT '[]'"],
    ["failed_at", "TEXT"],
    ["last_output_hash", "TEXT"],
    ["error_type", "TEXT"],
    ["reason", "TEXT"],
  ];

  for (const [name, definition] of requiredStepColumns) {
    if (!stepColumns.has(name)) {
      db.exec(`
        ALTER TABLE execution_steps
        ADD COLUMN ${name} ${definition}
      `);
    }
  }

  const attemptColumns = new Set(
    db.prepare("PRAGMA table_info(execution_attempts)").all().map((column) => String(column.name))
  );
  for (const [name, definition] of [["tenant_id", "TEXT"], ["workspace_id", "TEXT"]]) {
    if (!attemptColumns.has(name)) {
      db.exec(`
        ALTER TABLE execution_attempts
        ADD COLUMN ${name} ${definition}
      `);
    }
  }

  const ledgerColumns = new Set(
    db.prepare("PRAGMA table_info(execution_ledger)").all().map((column) => String(column.name))
  );
  for (const [name, definition] of [["tenant_id", "TEXT"], ["workspace_id", "TEXT"]]) {
    if (!ledgerColumns.has(name)) {
      db.exec(`
        ALTER TABLE execution_ledger
        ADD COLUMN ${name} ${definition}
      `);
    }
  }

  const recoveryQueueColumns = new Set(
    db.prepare("PRAGMA table_info(execution_recovery_queue)").all().map((column) => String(column.name))
  );
  for (const [name, definition] of [["tenant_id", "TEXT"], ["workspace_id", "TEXT"]]) {
    if (!recoveryQueueColumns.has(name)) {
      db.exec(`
        ALTER TABLE execution_recovery_queue
        ADD COLUMN ${name} ${definition}
      `);
    }
  }

  const operatorIdempotencyColumns = new Set(
    db.prepare("PRAGMA table_info(operator_action_idempotency)").all().map((column) => String(column.name))
  );
  for (const [name, definition] of [["tenant_id", "TEXT"], ["workspace_id", "TEXT"]]) {
    if (!operatorIdempotencyColumns.has(name)) {
      db.exec(`
        ALTER TABLE operator_action_idempotency
        ADD COLUMN ${name} ${definition}
      `);
    }
  }

  const auditColumns = new Set(
    db.prepare("PRAGMA table_info(audit_events)").all().map((column) => String(column.name))
  );
  for (const [name, definition] of [["tenant_id", "TEXT"], ["workspace_id", "TEXT"]]) {
    if (!auditColumns.has(name)) {
      db.exec(`
        ALTER TABLE audit_events
        ADD COLUMN ${name} ${definition}
      `);
    }
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_executions_tenant_execution
      ON executions(tenant_id, id);
    CREATE INDEX IF NOT EXISTS idx_execution_locks_tenant_execution
      ON execution_locks(tenant_id, execution_id);
    CREATE INDEX IF NOT EXISTS idx_execution_attempts_tenant_execution
      ON execution_attempts(tenant_id, execution_id);
    CREATE INDEX IF NOT EXISTS idx_execution_ledger_tenant_execution
      ON execution_ledger(tenant_id, execution_id);
    CREATE INDEX IF NOT EXISTS idx_execution_recovery_queue_tenant_execution
      ON execution_recovery_queue(tenant_id, execution_id);
    CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_execution
      ON audit_events(tenant_id, execution_id);
  `);
}

function readRecord(key) {
  let row;
  try {
    row = openDatabase()
      .prepare("SELECT payload, created_at, updated_at FROM documents WHERE key = ?")
      .get(String(key));
  } catch (error) {
    if (isMalformedDatabaseError(error)) {
      removeDatabaseFiles();
      row = openDatabase()
        .prepare("SELECT payload, created_at, updated_at FROM documents WHERE key = ?")
        .get(String(key));
    } else {
      throw error;
    }
  }

  if (!row || !row.payload) {
    return null;
  }

  return row;
}

function writeRecord(key, payload, createdAt, updatedAt) {
  try {
    openDatabase()
      .prepare(`
        INSERT INTO documents (key, payload, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          payload = excluded.payload,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `)
      .run(String(key), String(payload), createdAt, updatedAt);
  } catch (error) {
    if (isMalformedDatabaseError(error)) {
      removeDatabaseFiles();
      openDatabase()
        .prepare(`
          INSERT INTO documents (key, payload, created_at, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            payload = excluded.payload,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at
        `)
        .run(String(key), String(payload), createdAt, updatedAt);
      return;
    }
    throw error;
  }
}

function parseRecordPayload(record, fallback = null) {
  if (!record || !record.payload) {
    return fallback;
  }
  try {
    return JSON.parse(record.payload);
  } catch {
    return fallback;
  }
}

function writeLegacyJson(filePath, value) {
  if (!filePath) {
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function readLegacyJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadDocument(key, createDefault, options = {}) {
  const record = readRecord(key);

  if (record && record.payload) {
    return JSON.parse(record.payload);
  }

  let initial = null;
  try {
    initial = readLegacyJson(options.legacyPath);
  } catch {}

  if (!initial) {
    initial = typeof createDefault === "function" ? createDefault() : createDefault;
  }

  return saveDocument(key, initial, options);
}

function saveDocument(key, value, options = {}) {
  const existing = readRecord(key);

  const now = new Date().toISOString();
  const normalized = {
    ...(value || {}),
    createdAt: value?.createdAt || existing?.created_at || now,
    updatedAt: now,
  };

  writeRecord(key, JSON.stringify(normalized), normalized.createdAt, normalized.updatedAt);
  if (writeLegacyJsonMirrorsEnabled()) {
    writeLegacyJson(options.legacyPath, normalized);
  }
  return normalized;
}

function transactDocuments(work) {
  const db = openDatabase();
  const execute = db.transaction(() =>
    work({
      read(key, fallback = null) {
        return parseRecordPayload(readRecord(key), fallback);
      },
      write(key, value, options = {}) {
        const existing = readRecord(key);
        const now = new Date().toISOString();
        const normalized = {
          ...(value || {}),
          createdAt: value?.createdAt || existing?.created_at || now,
          updatedAt: now,
        };
        writeRecord(key, JSON.stringify(normalized), normalized.createdAt, normalized.updatedAt);
        if (writeLegacyJsonMirrorsEnabled()) {
          writeLegacyJson(options.legacyPath, normalized);
        }
        return normalized;
      },
    })
  );

  try {
    return execute();
  } catch (error) {
    if (isMalformedDatabaseError(error)) {
      removeDatabaseFiles();
      return transactDocuments(work);
    }
    throw error;
  }
}

function withDatabase(work) {
  try {
    return work(openDatabase());
  } catch (error) {
    if (isMalformedDatabaseError(error)) {
      removeDatabaseFiles();
      return work(openDatabase());
    }
    throw error;
  }
}

function readDatabaseNow(db) {
  const row = db.prepare(`
    SELECT
      CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER) AS nowMs,
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AS nowIso
  `).get();

  return {
    nowMs: Number(row?.nowMs || 0),
    nowIso: String(row?.nowIso || new Date(0).toISOString()),
  };
}

function getDatabaseNow() {
  return withDatabase((db) => readDatabaseNow(db));
}

function getDatabaseNowMs() {
  return getDatabaseNow().nowMs;
}

function getDatabaseNowIso() {
  return getDatabaseNow().nowIso;
}

function runInTransaction(work) {
  return withDatabase((db) => {
    if (db.inTransaction) {
      return work(db);
    }
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = work(db);
      db.exec("COMMIT");
      return result;
    } catch (error) {
      try {
        if (db.inTransaction) {
          db.exec("ROLLBACK");
        }
      } catch {}
      throw error;
    }
  });
}

function closeDatabase() {
  if (database) {
    database.close();
    database = null;
  }
  bootstrappedLegacyDocuments = null;
}

module.exports = {
  loadDocument,
  saveDocument,
  transactDocuments,
  withDatabase,
  readDatabaseNow,
  getDatabaseNow,
  getDatabaseNowMs,
  getDatabaseNowIso,
  runInTransaction,
  getDatabasePath,
  closeDatabase,
};
