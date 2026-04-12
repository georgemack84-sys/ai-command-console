const { loadDocument, saveDocument } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");

const LEGACY_USAGE_KEY = "legacy.console.usage";
const LEGACY_USAGE_PATH = getAgentsDataPath("legacy-console-usage.json");

function defaultUsageState() {
  return {
    updatedAt: null,
    entries: [],
  };
}

function loadLegacyConsoleUsageState() {
  const state = loadDocument(LEGACY_USAGE_KEY, defaultUsageState, { legacyPath: LEGACY_USAGE_PATH });
  return {
    ...defaultUsageState(),
    ...state,
    entries: Array.isArray(state.entries) ? state.entries.slice(-100) : [],
  };
}

function saveLegacyConsoleUsageState(state) {
  return saveDocument(
    LEGACY_USAGE_KEY,
    {
      updatedAt: state.updatedAt || new Date().toISOString(),
      entries: Array.isArray(state.entries) ? state.entries.slice(-100) : [],
    },
    { legacyPath: LEGACY_USAGE_PATH },
  );
}

function recordLegacyConsoleUsage(input = {}) {
  const state = loadLegacyConsoleUsageState();
  const entry = {
    id: `legacy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    surface: String(input.surface || "unknown"),
    action: String(input.action || "unknown"),
    traceId: input.traceId || null,
    context: input.context && typeof input.context === "object" ? input.context : {},
  };
  state.updatedAt = entry.timestamp;
  state.entries.push(entry);
  saveLegacyConsoleUsageState(state);
  return entry;
}

function getLegacyConsoleUsageSummary(limit = 20) {
  const state = loadLegacyConsoleUsageState();
  const entries = state.entries.slice(-Math.max(1, Number(limit || 20))).reverse();
  const byAction = {};
  const bySurface = {};
  for (const entry of entries) {
    byAction[entry.action] = (byAction[entry.action] || 0) + 1;
    bySurface[entry.surface] = (bySurface[entry.surface] || 0) + 1;
  }

  return {
    total: entries.length,
    updatedAt: state.updatedAt || null,
    byAction,
    bySurface,
    recent: entries,
  };
}

module.exports = {
  recordLegacyConsoleUsage,
  getLegacyConsoleUsageSummary,
};
