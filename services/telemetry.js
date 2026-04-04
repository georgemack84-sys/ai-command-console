const path = require("path");
const { loadDocument, saveDocument } = require("./stateDatabase");

const TELEMETRY_PATH = path.join(process.cwd(), "data", "agents", "telemetry.json");
const TELEMETRY_KEY = "telemetry";

function defaultTelemetryState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    events: [],
  };
}

function loadTelemetryState() {
  const parsed = loadDocument(TELEMETRY_KEY, defaultTelemetryState, { legacyPath: TELEMETRY_PATH });
  return {
    ...defaultTelemetryState(),
    ...parsed,
    events: Array.isArray(parsed.events) ? parsed.events : [],
  };
}

function saveTelemetryState(state) {
  return saveDocument(
    TELEMETRY_KEY,
    {
      createdAt: state.createdAt || new Date().toISOString(),
      events: Array.isArray(state.events) ? state.events.slice(-400) : [],
    },
    { legacyPath: TELEMETRY_PATH }
  );
}

function recordTelemetry(event) {
  const state = loadTelemetryState();
  const entry = {
    id: `telemetry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type: String(event.type || "unknown"),
    status: String(event.status || "ok"),
    durationMs: Number.isFinite(Number(event.durationMs)) ? Math.max(0, Number(event.durationMs)) : 0,
    actorId: event.actorId || null,
    meta: event.meta && typeof event.meta === "object" ? event.meta : {},
  };
  state.events.push(entry);
  saveTelemetryState(state);
  return entry;
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildTelemetrySummary(limit = 40) {
  const events = loadTelemetryState().events.slice(-Math.max(1, Number(limit || 40)));
  const reversed = [...events].reverse();
  const errors = events.filter((event) => event.status === "error");
  const approvals = events.filter((event) => event.type.startsWith("approval:"));
  const commands = events.filter((event) => event.type === "command");
  const watcherRuns = events.filter((event) => event.type.startsWith("watcher:"));
  const schedulerRuns = events.filter((event) => event.type.startsWith("scheduler:"));

  return {
    totals: {
      events: events.length,
      errors: errors.length,
      approvals: approvals.length,
      avgCommandLatencyMs: average(commands.map((event) => event.durationMs || 0)),
      avgWatcherLatencyMs: average(watcherRuns.map((event) => event.durationMs || 0)),
      avgSchedulerLatencyMs: average(schedulerRuns.map((event) => event.durationMs || 0)),
    },
    recent: reversed.slice(0, 12),
    byType: Object.entries(
      events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}

function clearTelemetry() {
  saveTelemetryState(defaultTelemetryState());
}

module.exports = {
  loadTelemetryState,
  saveTelemetryState,
  recordTelemetry,
  buildTelemetrySummary,
  clearTelemetry,
};
