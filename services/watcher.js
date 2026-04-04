const fs = require("fs");
const path = require("path");
const { listTasks } = require("./taskQueue");
const { getSchedule, startSchedule } = require("./scheduler");
const { loadDocument, saveDocument } = require("./stateDatabase");
const { recordTelemetry } = require("./telemetry");

const WATCHER_PATH = path.join(process.cwd(), "data", "agents", "watcher.json");
const AGENT_LOG_DIR = path.join(process.cwd(), "logs", "agents");
const WATCHER_KEY = "watcher";

let watcherTimer = null;

function ensureWatcherDir() {
  fs.mkdirSync(path.dirname(WATCHER_PATH), { recursive: true });
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function defaultWatcherState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    enabled: false,
    intervalSeconds: 5,
    lastRunAt: null,
    lastResult: null,
    lastError: null,
    rules: [
      {
        name: "planner_queue_rule",
        agentName: "planner",
        minQueuedTasks: 1,
        scheduleIntervalSeconds: 3,
        scheduleMaxCycles: 3,
        enabled: true
      },
      {
        name: "builder_queue_rule",
        agentName: "builder",
        minQueuedTasks: 1,
        scheduleIntervalSeconds: 3,
        scheduleMaxCycles: 3,
        enabled: true
      },
      {
        name: "researcher_queue_rule",
        agentName: "researcher",
        minQueuedTasks: 1,
        scheduleIntervalSeconds: 4,
        scheduleMaxCycles: 3,
        enabled: true
      }
    ],
    history: []
  };
}

function loadWatcherState() {
  ensureWatcherDir();

  try {
    const parsed = loadDocument(WATCHER_KEY, defaultWatcherState, { legacyPath: WATCHER_PATH });
    parsed.rules = Array.isArray(parsed.rules) ? parsed.rules : [];
    parsed.history = Array.isArray(parsed.history) ? parsed.history : [];
    return parsed;
  } catch (error) {
    return {
      createdAt: null,
      updatedAt: new Date().toISOString(),
      enabled: false,
      intervalSeconds: 5,
      lastRunAt: null,
      lastResult: null,
      lastError: `Failed to parse watcher file: ${error.message}`,
      rules: [],
      history: []
    };
  }
}

function saveWatcherState(state) {
  ensureWatcherDir();
  return saveDocument(
    WATCHER_KEY,
    {
      createdAt: state.createdAt || new Date().toISOString(),
      enabled: Boolean(state.enabled),
      intervalSeconds: Math.max(1, Number(state.intervalSeconds || 5)),
      lastRunAt: state.lastRunAt || null,
      lastResult: state.lastResult || null,
      lastError: state.lastError || null,
      rules: Array.isArray(state.rules) ? state.rules : [],
      history: Array.isArray(state.history) ? state.history.slice(-100) : [],
    },
    { legacyPath: WATCHER_PATH }
  );
}

function logWatcherEvent(payload) {
  ensureWatcherDir();
  const logPath = path.join(AGENT_LOG_DIR, `manager.log`);
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    watcherEvent: true,
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function appendWatcherHistory(entry) {
  const state = loadWatcherState();
  state.history.push({
    timestamp: new Date().toISOString(),
    ...entry
  });
  saveWatcherState(state);
  return state;
}

function getQueuedCountForAgent(agentName) {
  return listTasks().filter(
    (task) =>
      String(task.agentName).toLowerCase() === String(agentName).toLowerCase() &&
      task.status === "queued"
  ).length;
}

function shouldStartSchedule(agentName, desiredInterval, desiredMaxCycles) {
  const schedule = getSchedule(agentName);

  if (!schedule) {
    return true;
  }

  if (!schedule.enabled) {
    return true;
  }

  if (Number(schedule.cycleCount || 0) >= Number(schedule.maxCycles || desiredMaxCycles)) {
    return true;
  }

  return false;
}

function evaluateRules() {
  const startedAt = Date.now();
  const state = loadWatcherState();
  const decisions = [];

  for (const rule of state.rules) {
    if (!rule || !rule.enabled) {
      continue;
    }

    const queuedCount = getQueuedCountForAgent(rule.agentName);
    const matched = queuedCount >= Number(rule.minQueuedTasks || 1);

    const decision = {
      ruleName: rule.name,
      agentName: rule.agentName,
      queuedCount,
      minQueuedTasks: Number(rule.minQueuedTasks || 1),
      matched,
      action: "none"
    };

    if (matched) {
      const canStart = shouldStartSchedule(
        rule.agentName,
        rule.scheduleIntervalSeconds,
        rule.scheduleMaxCycles
      );

      if (canStart) {
        const schedule = startSchedule(
          rule.agentName,
          rule.scheduleIntervalSeconds || 3,
          rule.scheduleMaxCycles || 3
        );

        decision.action = "schedule_started";
        decision.schedule = {
          enabled: schedule.enabled,
          intervalSeconds: schedule.intervalSeconds,
          maxCycles: schedule.maxCycles,
          cycleCount: schedule.cycleCount
        };

        logWatcherEvent({
          event: "watcher_triggered_schedule",
          ruleName: rule.name,
          agentName: rule.agentName,
          queuedCount,
          minQueuedTasks: rule.minQueuedTasks,
          scheduleIntervalSeconds: rule.scheduleIntervalSeconds,
          scheduleMaxCycles: rule.scheduleMaxCycles
        });
      } else {
        decision.action = "schedule_already_active_or_valid";
      }
    }

    decisions.push(decision);
  }

  state.lastRunAt = new Date().toISOString();
  state.lastError = null;
  state.lastResult = {
    ok: true,
    decisions
  };
  state.history.push({
    timestamp: new Date().toISOString(),
    type: "watcher_run",
    decisions
  });

  saveWatcherState(state);
  recordTelemetry({
    type: "watcher:evaluate",
    status: "ok",
    durationMs: Date.now() - startedAt,
    meta: {
      matchedRules: decisions.filter((item) => item.matched).length,
      startedSchedules: decisions.filter((item) => item.action === "schedule_started").length,
    },
  });

  return {
    ok: true,
    decisions,
    state
  };
}

function attachWatcherInterval() {
  clearWatcherTimer();

  const state = loadWatcherState();
  if (!state.enabled) {
    return null;
  }

  watcherTimer = setInterval(() => {
    try {
      const latest = loadWatcherState();
      if (!latest.enabled) {
        clearWatcherTimer();
        return;
      }

      evaluateRules();
    } catch (error) {
      const current = loadWatcherState();
      current.lastError = error.message;
      current.lastRunAt = new Date().toISOString();
      current.history.push({
        timestamp: new Date().toISOString(),
        type: "watcher_error",
        error: error.message
      });
      saveWatcherState(current);
      recordTelemetry({
        type: "watcher:evaluate",
        status: "error",
        durationMs: 0,
        meta: {
          error: error.message,
        },
      });

      logWatcherEvent({
        event: "watcher_error",
        error: error.message
      });
    }
  }, state.intervalSeconds * 1000);

  return watcherTimer;
}

function clearWatcherTimer() {
  if (watcherTimer) {
    clearInterval(watcherTimer);
    watcherTimer = null;
  }
}

function startWatcher(intervalSeconds = 5) {
  const startedAt = Date.now();
  const state = loadWatcherState();
  state.enabled = true;
  state.intervalSeconds = Math.max(1, Number(intervalSeconds || state.intervalSeconds || 5));
  state.updatedAt = new Date().toISOString();
  state.lastError = null;

  saveWatcherState(state);
  attachWatcherInterval();

  logWatcherEvent({
    event: "watcher_started",
    intervalSeconds: state.intervalSeconds
  });

  appendWatcherHistory({
    type: "watcher_started",
    intervalSeconds: state.intervalSeconds
  });
  recordTelemetry({
    type: "watcher:start",
    status: "ok",
    durationMs: Date.now() - startedAt,
    meta: {
      intervalSeconds: state.intervalSeconds,
    },
  });

  return loadWatcherState();
}

function stopWatcher(reason = "stopped_by_user") {
  const startedAt = Date.now();
  clearWatcherTimer();

  const state = loadWatcherState();
  state.enabled = false;
  state.updatedAt = new Date().toISOString();
  state.lastResult = state.lastResult || null;
  state.history.push({
    timestamp: new Date().toISOString(),
    type: "watcher_stopped",
    reason
  });

  saveWatcherState(state);

  logWatcherEvent({
    event: "watcher_stopped",
    reason
  });
  recordTelemetry({
    type: "watcher:stop",
    status: "ok",
    durationMs: Date.now() - startedAt,
    meta: {
      reason,
    },
  });

  return state;
}

function getWatcherStatus() {
  return loadWatcherState();
}

function updateWatcherRule(ruleName, updates = {}) {
  const state = loadWatcherState();
  const index = state.rules.findIndex((rule) => rule.name === ruleName);

  if (index === -1) {
    return null;
  }

  state.rules[index] = {
    ...state.rules[index],
    ...(typeof updates.agentName === "string" ? { agentName: updates.agentName.trim() } : {}),
    ...(Number.isFinite(Number(updates.minQueuedTasks)) ? { minQueuedTasks: Number(updates.minQueuedTasks) } : {}),
    ...(Number.isFinite(Number(updates.scheduleIntervalSeconds))
      ? { scheduleIntervalSeconds: Number(updates.scheduleIntervalSeconds) }
      : {}),
    ...(Number.isFinite(Number(updates.scheduleMaxCycles))
      ? { scheduleMaxCycles: Number(updates.scheduleMaxCycles) }
      : {}),
    ...(typeof updates.enabled === "boolean" ? { enabled: updates.enabled } : {}),
  };
  state.updatedAt = new Date().toISOString();
  saveWatcherState(state);
  return state.rules[index];
}

function addWatcherRule(rule = {}) {
  const state = loadWatcherState();
  const newRule = {
    name: String(rule.name || `rule_${Date.now()}`),
    agentName: String(rule.agentName || "researcher").trim(),
    minQueuedTasks: Math.max(1, Number(rule.minQueuedTasks || 1)),
    scheduleIntervalSeconds: Math.max(1, Number(rule.scheduleIntervalSeconds || 3)),
    scheduleMaxCycles: Math.max(1, Number(rule.scheduleMaxCycles || 3)),
    enabled: rule.enabled !== false,
  };

  state.rules = [...state.rules.filter((item) => item.name !== newRule.name), newRule];
  state.updatedAt = new Date().toISOString();
  saveWatcherState(state);
  return newRule;
}

function removeWatcherRule(ruleName) {
  const state = loadWatcherState();
  const beforeCount = state.rules.length;
  state.rules = state.rules.filter((rule) => rule.name !== ruleName);
  state.updatedAt = new Date().toISOString();
  saveWatcherState(state);
  return beforeCount !== state.rules.length;
}

module.exports = {
  loadWatcherState,
  saveWatcherState,
  startWatcher,
  stopWatcher,
  getWatcherStatus,
  evaluateRules,
  updateWatcherRule,
  addWatcherRule,
  removeWatcherRule,
};
