const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
const diagnosticsLogFile = path.join(logDir, "diagnostics.log");
const throttleState = new Map();

function ensureDiagnosticsLog() {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  if (!fs.existsSync(diagnosticsLogFile)) {
    fs.writeFileSync(diagnosticsLogFile, "", "utf8");
  }
}

function shouldSkipEvent(key, cooldownMs) {
  if (!key || !cooldownMs || cooldownMs < 1) {
    return false;
  }

  const now = Date.now();
  const lastSeenAt = throttleState.get(key) || 0;
  if (now - lastSeenAt < cooldownMs) {
    return true;
  }

  throttleState.set(key, now);
  return false;
}

function recordDiagnosticEvent(entry, options = {}) {
  const cooldownMs = Number(options.cooldownMs || 0);
  const dedupeKey = options.dedupeKey ? String(options.dedupeKey) : "";

  if (shouldSkipEvent(dedupeKey, cooldownMs)) {
    return null;
  }

  ensureDiagnosticsLog();
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    level: "info",
    scope: "platform",
    ...entry,
  };

  fs.appendFileSync(diagnosticsLogFile, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

function recordHandledError(scope, error, context = {}, options = {}) {
  const message = error instanceof Error ? error.message : String(error);
  return recordDiagnosticEvent(
    {
      level: "error",
      scope,
      message,
      context,
    },
    options,
  );
}

function listRecentDiagnostics(limit = 30) {
  ensureDiagnosticsLog();
  const lines = fs
    .readFileSync(diagnosticsLogFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .slice(-Math.max(1, limit))
    .reverse()
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return {
          id: `invalid-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          level: "warning",
          scope: "diagnostics",
          message: "Encountered an unreadable diagnostics entry.",
          raw: line,
        };
      }
    });
}

function summarizeDiagnostics(limit = 100) {
  const entries = listRecentDiagnostics(limit);
  const summary = {
    total: entries.length,
    errors: 0,
    warnings: 0,
    byScope: {},
    latestAt: entries[0]?.timestamp || null,
  };

  for (const entry of entries) {
    const level = String(entry.level || "info").toLowerCase();
    const scope = String(entry.scope || "platform");
    if (level === "error") {
      summary.errors += 1;
    }
    if (level === "warning") {
      summary.warnings += 1;
    }
    summary.byScope[scope] = (summary.byScope[scope] || 0) + 1;
  }

  return summary;
}

module.exports = {
  recordDiagnosticEvent,
  recordHandledError,
  listRecentDiagnostics,
  summarizeDiagnostics,
};
