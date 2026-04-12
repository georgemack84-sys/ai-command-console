const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { loadDocument, getDatabasePath, closeDatabase } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");

const JOBS_KEY = "jobs";
const JOBS_PATH = getAgentsDataPath("jobs.json");
const MAX_EVENT_HISTORY = 200;
const TERMINAL_JOB_RETENTION = 500;

let database = null;
let statements = null;

function isMalformedDatabaseError(error) {
  return /(database disk image is malformed|file is not a database|disk i\/o error)/i.test(
    String(error?.message || error || "")
  );
}

function safeJsonParse(value, fallback) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeEvents(events) {
  return Array.isArray(events) ? events.slice(-MAX_EVENT_HISTORY) : [];
}

function removeStoreFiles() {
  closeJobStore();
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

function initializeJobStore() {
  const databasePath = getDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
  database.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      trace_id TEXT,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL,
      actor_id TEXT,
      actor_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      worker_id TEXT,
      last_heartbeat_at TEXT,
      lease_expires_at TEXT,
      result_json TEXT,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      retry_count INTEGER NOT NULL DEFAULT 0,
      retry_delay_ms INTEGER NOT NULL DEFAULT 5000,
      runtime_limit_ms INTEGER NOT NULL DEFAULT 60000,
      next_retry_at TEXT,
      canceled_at TEXT,
      event_count INTEGER NOT NULL DEFAULT 0,
      latest_event_json TEXT,
      events_json TEXT NOT NULL DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON jobs(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_jobs_next_retry_at ON jobs(next_retry_at);
    CREATE INDEX IF NOT EXISTS idx_jobs_lease_expires_at ON jobs(lease_expires_at);
  `);

  statements = {
    countJobs: database.prepare("SELECT COUNT(*) AS count FROM jobs"),
    getJob: database.prepare("SELECT * FROM jobs WHERE id = ? LIMIT 1"),
    listJobs: database.prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?"),
    recentJobs: database.prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?"),
    listJobSummaries: database.prepare(`
      SELECT
        id, trace_id, type, status, actor_id, actor_name, created_at, updated_at, started_at, completed_at,
        worker_id, last_heartbeat_at, lease_expires_at, error, attempts, max_attempts, retry_count,
        retry_delay_ms, runtime_limit_ms, next_retry_at, canceled_at, event_count, latest_event_json, events_json
      FROM jobs
      ORDER BY created_at DESC
      LIMIT ?
    `),
    recentJobSummaries: database.prepare(`
      SELECT
        id, trace_id, type, status, actor_id, actor_name, created_at, updated_at, started_at, completed_at,
        worker_id, last_heartbeat_at, lease_expires_at, error, attempts, max_attempts, retry_count,
        retry_delay_ms, runtime_limit_ms, next_retry_at, canceled_at, event_count, latest_event_json, events_json
      FROM jobs
      ORDER BY created_at DESC
      LIMIT ?
    `),
    latestFailures: database.prepare(`
      SELECT id, trace_id, type, status, error, next_retry_at, latest_event_json
      FROM jobs
      WHERE status = 'failed' OR error IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT ?
    `),
    eligibleJobs: database.prepare(`
      SELECT * FROM jobs
      WHERE status = 'queued'
         OR (status = 'scheduled_retry' AND (next_retry_at IS NULL OR next_retry_at <= ?))
      ORDER BY created_at ASC
      LIMIT ?
    `),
    queueCounts: database.prepare(`
      SELECT
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued,
        SUM(CASE WHEN status = 'scheduled_retry' THEN 1 ELSE 0 END) AS scheduled_retries,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS running
      FROM jobs
    `),
    queueHealth: database.prepare(`
      SELECT
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS running,
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued,
        SUM(CASE WHEN status = 'scheduled_retry' THEN 1 ELSE 0 END) AS scheduled_retries,
        SUM(CASE
          WHEN status = 'running' AND (
            (lease_expires_at IS NOT NULL AND lease_expires_at <= @nowIso)
            OR started_at IS NULL
            OR started_at <= @staleIso
          ) THEN 1 ELSE 0 END
        ) AS stale_running
      FROM jobs
    `),
    activeWorkers: database.prepare(`
      SELECT COUNT(DISTINCT worker_id) AS count
      FROM jobs
      WHERE status = 'running' AND worker_id IS NOT NULL AND worker_id != ''
    `),
    nextRetry: database.prepare(`
      SELECT next_retry_at
      FROM jobs
      WHERE status = 'scheduled_retry' AND next_retry_at IS NOT NULL
      ORDER BY next_retry_at ASC
      LIMIT 1
    `),
    queuedCount: database.prepare("SELECT COUNT(*) AS count FROM jobs WHERE status = 'queued'"),
    deleteAllJobs: database.prepare("DELETE FROM jobs"),
    pruneTerminalJobs: database.prepare(`
      DELETE FROM jobs
      WHERE id IN (
        SELECT id
        FROM jobs
        WHERE status IN ('completed', 'failed', 'canceled')
        ORDER BY created_at DESC
        LIMIT -1 OFFSET ?
      )
    `),
    upsertJob: database.prepare(`
      INSERT INTO jobs (
        id, trace_id, type, payload_json, status, actor_id, actor_name, created_at, updated_at,
        started_at, completed_at, worker_id, last_heartbeat_at, lease_expires_at, result_json,
        error, attempts, max_attempts, retry_count, retry_delay_ms, runtime_limit_ms,
        next_retry_at, canceled_at, event_count, latest_event_json, events_json
      ) VALUES (
        @id, @traceId, @type, @payloadJson, @status, @actorId, @actorName, @createdAt, @updatedAt,
        @startedAt, @completedAt, @workerId, @lastHeartbeatAt, @leaseExpiresAt, @resultJson,
        @error, @attempts, @maxAttempts, @retryCount, @retryDelayMs, @runtimeLimitMs,
        @nextRetryAt, @canceledAt, @eventCount, @latestEventJson, @eventsJson
      )
      ON CONFLICT(id) DO UPDATE SET
        trace_id = excluded.trace_id,
        type = excluded.type,
        payload_json = excluded.payload_json,
        status = excluded.status,
        actor_id = excluded.actor_id,
        actor_name = excluded.actor_name,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at,
        worker_id = excluded.worker_id,
        last_heartbeat_at = excluded.last_heartbeat_at,
        lease_expires_at = excluded.lease_expires_at,
        result_json = excluded.result_json,
        error = excluded.error,
        attempts = excluded.attempts,
        max_attempts = excluded.max_attempts,
        retry_count = excluded.retry_count,
        retry_delay_ms = excluded.retry_delay_ms,
        runtime_limit_ms = excluded.runtime_limit_ms,
        next_retry_at = excluded.next_retry_at,
        canceled_at = excluded.canceled_at,
        event_count = excluded.event_count,
        latest_event_json = excluded.latest_event_json,
        events_json = excluded.events_json
    `),
  };
}

function openJobStore() {
  if (database) {
    return database;
  }
  try {
    initializeJobStore();
    migrateLegacyJobs();
    return database;
  } catch (error) {
    if (isMalformedDatabaseError(error)) {
      removeStoreFiles();
      initializeJobStore();
      return database;
    }
    throw error;
  }
}

function mapJobToRecord(job) {
  const events = normalizeEvents(job.events);
  const latestEvent = events.length ? events[events.length - 1] : null;

  return {
    id: String(job.id),
    traceId: job.traceId || null,
    type: String(job.type || "unknown"),
    payloadJson: JSON.stringify(job.payload && typeof job.payload === "object" ? job.payload : {}),
    status: String(job.status || "queued"),
    actorId: job.actorId || null,
    actorName: job.actorName || null,
    createdAt: job.createdAt || new Date().toISOString(),
    updatedAt: job.updatedAt || new Date().toISOString(),
    startedAt: job.startedAt || null,
    completedAt: job.completedAt || null,
    workerId: job.workerId || null,
    lastHeartbeatAt: job.lastHeartbeatAt || null,
    leaseExpiresAt: job.leaseExpiresAt || null,
    resultJson: job.result === null || typeof job.result === "undefined" ? null : JSON.stringify(job.result),
    error: job.error || null,
    attempts: Number(job.attempts || 0),
    maxAttempts: Number(job.maxAttempts || 1),
    retryCount: Number(job.retryCount || 0),
    retryDelayMs: Number(job.retryDelayMs || 5000),
    runtimeLimitMs: Number(job.runtimeLimitMs || 60000),
    nextRetryAt: job.nextRetryAt || null,
    canceledAt: job.canceledAt || null,
    eventCount: events.length,
    latestEventJson: latestEvent ? JSON.stringify(latestEvent) : null,
    eventsJson: JSON.stringify(events),
  };
}

function mapRowToJob(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    traceId: row.trace_id || null,
    type: row.type,
    payload: safeJsonParse(row.payload_json, {}),
    status: row.status,
    actorId: row.actor_id || null,
    actorName: row.actor_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at || null,
    completedAt: row.completed_at || null,
    workerId: row.worker_id || null,
    lastHeartbeatAt: row.last_heartbeat_at || null,
    leaseExpiresAt: row.lease_expires_at || null,
    result: row.result_json ? safeJsonParse(row.result_json, null) : null,
    error: row.error || null,
    attempts: Number(row.attempts || 0),
    maxAttempts: Number(row.max_attempts || 1),
    retryCount: Number(row.retry_count || 0),
    retryDelayMs: Number(row.retry_delay_ms || 5000),
    runtimeLimitMs: Number(row.runtime_limit_ms || 60000),
    nextRetryAt: row.next_retry_at || null,
    canceledAt: row.canceled_at || null,
    events: safeJsonParse(row.events_json, []),
  };
}

function mapSummaryRowToJob(row) {
  if (!row) {
    return null;
  }

  const events = safeJsonParse(row.events_json, []);

  return {
    id: row.id,
    traceId: row.trace_id || null,
    type: row.type,
    payload: {},
    status: row.status,
    actorId: row.actor_id || null,
    actorName: row.actor_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at || null,
    completedAt: row.completed_at || null,
    workerId: row.worker_id || null,
    lastHeartbeatAt: row.last_heartbeat_at || null,
    leaseExpiresAt: row.lease_expires_at || null,
    result: null,
    error: row.error || null,
    attempts: Number(row.attempts || 0),
    maxAttempts: Number(row.max_attempts || 1),
    retryCount: Number(row.retry_count || 0),
    retryDelayMs: Number(row.retry_delay_ms || 5000),
    runtimeLimitMs: Number(row.runtime_limit_ms || 60000),
    nextRetryAt: row.next_retry_at || null,
    canceledAt: row.canceled_at || null,
    eventCount: Number(row.event_count || 0),
    latestEvent: row.latest_event_json ? safeJsonParse(row.latest_event_json, null) : null,
    events,
  };
}

function migrateLegacyJobs() {
  const existingCount = Number(statements.countJobs.get().count || 0);
  if (existingCount > 0) {
    return;
  }

  const legacy = loadDocument(JOBS_KEY, () => ({ jobs: [] }), { legacyPath: JOBS_PATH });
  const jobs = Array.isArray(legacy?.jobs) ? legacy.jobs : [];
  if (!jobs.length) {
    return;
  }

  const insertMany = database.transaction((items) => {
    for (const item of items) {
      statements.upsertJob.run(mapJobToRecord(item));
    }
  });

  insertMany(jobs);
}

function upsertJob(job) {
  openJobStore();
  statements.upsertJob.run(mapJobToRecord(job));
  statements.pruneTerminalJobs.run(TERMINAL_JOB_RETENTION);
  return mapRowToJob(statements.getJob.get(String(job.id)));
}

function getJob(jobId) {
  openJobStore();
  return mapRowToJob(statements.getJob.get(String(jobId || "")));
}

function listJobs(limit = 30) {
  openJobStore();
  const normalizedLimit = Math.max(1, Math.min(200, Number(limit || 30)));
  return statements.listJobSummaries.all(normalizedLimit).map(mapSummaryRowToJob);
}

function listRecentJobs(limit = 60) {
  openJobStore();
  const normalizedLimit = Math.max(1, Math.min(200, Number(limit || 60)));
  return statements.recentJobSummaries.all(normalizedLimit).map(mapSummaryRowToJob);
}

function listEligibleJobs(limit = 24) {
  openJobStore();
  return statements.eligibleJobs.all(new Date().toISOString(), Math.max(1, Math.min(100, Number(limit || 24)))).map(mapRowToJob);
}

function listLatestFailures(limit = 6) {
  openJobStore();
  return statements.latestFailures.all(Math.max(1, Math.min(50, Number(limit || 6)))).map((row) => ({
    id: row.id,
    traceId: row.trace_id || null,
    type: row.type,
    status: row.status,
    error: row.error || null,
    nextRetryAt: row.next_retry_at || null,
    latestEvent: row.latest_event_json ? safeJsonParse(row.latest_event_json, null) : null,
  }));
}

function getQueueCounts() {
  openJobStore();
  const counts = statements.queueCounts.get() || {};
  return {
    queued: Number(counts.queued || 0),
    scheduledRetries: Number(counts.scheduled_retries || 0),
    running: Number(counts.running || 0),
  };
}

function getQueueHealthCounts(staleThresholdMs) {
  openJobStore();
  const counts = statements.queueHealth.get({
    nowIso: new Date().toISOString(),
    staleIso: new Date(Date.now() - staleThresholdMs).toISOString(),
  }) || {};

  return {
    running: Number(counts.running || 0),
    queued: Number(counts.queued || 0),
    scheduledRetries: Number(counts.scheduled_retries || 0),
    staleRunning: Number(counts.stale_running || 0),
    activeWorkers: Number((statements.activeWorkers.get() || {}).count || 0),
  };
}

function getQueuedCount() {
  openJobStore();
  return Number((statements.queuedCount.get() || {}).count || 0);
}

function getNextRetryAt() {
  openJobStore();
  return statements.nextRetry.get()?.next_retry_at || null;
}

function closeJobStore() {
  if (database) {
    database.close();
    database = null;
    statements = null;
  }
}

function clearJobs() {
  openJobStore();
  statements.deleteAllJobs.run();
  try {
    fs.rmSync(JOBS_PATH, { force: true });
  } catch {}
}

module.exports = {
  openJobStore,
  upsertJob,
  getJob,
  listJobs,
  listRecentJobs,
  listEligibleJobs,
  listLatestFailures,
  getQueueCounts,
  getQueueHealthCounts,
  getQueuedCount,
  getNextRetryAt,
  closeJobStore,
  clearJobs,
  normalizeEvents,
};
