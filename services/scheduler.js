const fs = require("fs");
const path = require("path");
const { tickAgent, startAgent } = require("./agentRuntime");
const { loadAgentState, saveAgentState, appendAgentHistory } = require("./agentMemory");
const { loadDocument, saveDocument } = require("./stateDatabase");
const { recordTelemetry } = require("./telemetry");

const SCHEDULER_PATH = path.join(process.cwd(), "data", "agents", "scheduler.json");
const AGENT_LOG_DIR = path.join(process.cwd(), "logs", "agents");
const SCHEDULER_KEY = "scheduler";

const activeTimers = new Map();

function ensureSchedulerDir() {
  fs.mkdirSync(path.dirname(SCHEDULER_PATH), { recursive: true });
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function defaultSchedulerState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schedules: {}
  };
}

function loadSchedulerState() {
  ensureSchedulerDir();

  try {
    const parsed = loadDocument(SCHEDULER_KEY, defaultSchedulerState, { legacyPath: SCHEDULER_PATH });
    parsed.schedules = parsed.schedules && typeof parsed.schedules === "object"
      ? parsed.schedules
      : {};
    return parsed;
  } catch (error) {
    return {
      createdAt: null,
      updatedAt: new Date().toISOString(),
      schedules: {},
      error: `Failed to parse scheduler file: ${error.message}`
    };
  }
}

function saveSchedulerState(state) {
  ensureSchedulerDir();
  return saveDocument(
    SCHEDULER_KEY,
    {
      createdAt: state.createdAt || new Date().toISOString(),
      schedules: state.schedules && typeof state.schedules === "object"
        ? state.schedules
        : {},
    },
    { legacyPath: SCHEDULER_PATH }
  );
}

function logSchedulerEvent(agentName, payload) {
  ensureSchedulerDir();
  const logPath = path.join(AGENT_LOG_DIR, `${agentName}.log`);
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    schedulerEvent: true,
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function normalizeSchedule(agentName, existing = {}, overrides = {}) {
  const intervalSeconds = Math.max(1, Number(overrides.intervalSeconds ?? existing.intervalSeconds ?? 5));
  const maxCycles = Math.max(1, Number(overrides.maxCycles ?? existing.maxCycles ?? 5));
  const cycleCount = Math.max(0, Number(overrides.cycleCount ?? existing.cycleCount ?? 0));

  return {
    agentName,
    enabled: Boolean(overrides.enabled ?? existing.enabled ?? false),
    intervalSeconds,
    maxCycles,
    cycleCount,
    lastRunAt: Object.prototype.hasOwnProperty.call(overrides, "lastRunAt")
      ? overrides.lastRunAt
      : (existing.lastRunAt || null),
    lastResult: Object.prototype.hasOwnProperty.call(overrides, "lastResult")
      ? overrides.lastResult
      : (existing.lastResult || null),
    lastError: Object.prototype.hasOwnProperty.call(overrides, "lastError")
      ? overrides.lastError
      : (existing.lastError || null),
    stopReason: Object.prototype.hasOwnProperty.call(overrides, "stopReason")
      ? overrides.stopReason
      : (existing.stopReason || null),
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function resumeAgentForScheduler(agentName) {
  const state = loadAgentState(agentName);

  if (state.active) {
    return {
      ok: true,
      action: "already_active",
      state
    };
  }

  if (state.currentTask) {
    const resumed = saveAgentState(agentName, {
      ...state,
      active: true,
      status: "running",
      lastResult: {
        ok: true,
        summary: "Agent resumed by scheduler."
      }
    });

    appendAgentHistory(agentName, {
      type: "agent_resumed",
      reason: "scheduler_tick"
    });

    logSchedulerEvent(agentName, {
      event: "agent_resumed_for_schedule",
      taskId: state.currentTask.id
    });

    return {
      ok: true,
      action: "resumed_existing_task",
      state: resumed
    };
  }

  return startAgent(agentName, state.goal || "");
}

function listSchedules() {
  const state = loadSchedulerState();
  return Object.values(state.schedules || {});
}

function getSchedule(agentName) {
  const state = loadSchedulerState();
  return state.schedules[agentName] || null;
}

function setSchedule(agentName, updates = {}) {
  const state = loadSchedulerState();
  const existing = state.schedules[agentName] || {};
  state.schedules[agentName] = normalizeSchedule(agentName, existing, updates);
  saveSchedulerState(state);
  return state.schedules[agentName];
}

function clearTimer(agentName) {
  const timer = activeTimers.get(agentName);
  if (timer) {
    clearInterval(timer);
    activeTimers.delete(agentName);
  }
}

function stopSchedule(agentName, reason = "stopped_by_user") {
  const startedAt = Date.now();
  clearTimer(agentName);

  const state = loadSchedulerState();
  const existing = state.schedules[agentName];

  if (!existing) {
    return null;
  }

  state.schedules[agentName] = normalizeSchedule(agentName, existing, {
    enabled: false
  });
  state.schedules[agentName].stopReason = reason;
  state.schedules[agentName].updatedAt = new Date().toISOString();

  saveSchedulerState(state);

  logSchedulerEvent(agentName, {
    event: "schedule_stopped",
    reason
  });
  recordTelemetry({
    type: "scheduler:stop",
    status: "ok",
    durationMs: Date.now() - startedAt,
    meta: {
      agentName,
      reason,
    },
  });

  return state.schedules[agentName];
}

async function runScheduledTick(agentName) {
  const startedAt = Date.now();
  const state = loadSchedulerState();
  const schedule = state.schedules[agentName];

  if (!schedule || !schedule.enabled) {
    recordTelemetry({
      type: "scheduler:tick",
      status: "error",
      durationMs: Date.now() - startedAt,
      meta: { agentName, reason: "missing_schedule" },
    });
    return {
      ok: false,
      message: `No enabled schedule for agent "${agentName}".`
    };
  }

  if (schedule.cycleCount >= schedule.maxCycles) {
    const stopped = stopSchedule(agentName, "max_cycles_reached");
    recordTelemetry({
      type: "scheduler:tick",
      status: "ok",
      durationMs: Date.now() - startedAt,
      meta: { agentName, reason: "max_cycles_reached" },
    });
    return {
      ok: true,
      message: `Schedule for "${agentName}" reached max cycles and stopped safely.`,
      schedule: stopped
    };
  }

  try {
    const activation = await resumeAgentForScheduler(agentName);
    if (!activation || !activation.ok) {
      throw new Error(activation?.message || `Unable to activate agent "${agentName}" for scheduled work.`);
    }

    const result = await tickAgent(agentName);

    if (!result.ok) {
      const refreshedState = loadSchedulerState();
      const refreshedSchedule = refreshedState.schedules[agentName] || schedule;

      refreshedSchedule.lastError = result.message;
      refreshedSchedule.updatedAt = new Date().toISOString();
      refreshedState.schedules[agentName] = refreshedSchedule;
      saveSchedulerState(refreshedState);

      logSchedulerEvent(agentName, {
        event: "schedule_tick_rejected",
        message: result.message
      });
      recordTelemetry({
        type: "scheduler:tick",
        status: "error",
        durationMs: Date.now() - startedAt,
        meta: { agentName, reason: "tick_rejected", message: result.message },
      });

      return {
        ok: false,
        message: `Scheduled tick rejected for "${agentName}": ${result.message}`,
        result,
        schedule: refreshedSchedule
      };
    }

    const refreshedState = loadSchedulerState();
    const refreshedSchedule = refreshedState.schedules[agentName] || schedule;

    refreshedSchedule.cycleCount = Number(refreshedSchedule.cycleCount || 0) + 1;
    refreshedSchedule.lastRunAt = new Date().toISOString();
    refreshedSchedule.lastResult = result.result || {
      ok: result.ok,
      message: result.message
    };
    refreshedSchedule.lastError = null;
    refreshedSchedule.updatedAt = new Date().toISOString();

    refreshedState.schedules[agentName] = refreshedSchedule;
    saveSchedulerState(refreshedState);

    logSchedulerEvent(agentName, {
      event: "schedule_tick",
      cycleCount: refreshedSchedule.cycleCount,
      maxCycles: refreshedSchedule.maxCycles,
      result: refreshedSchedule.lastResult
    });

    if (refreshedSchedule.cycleCount >= refreshedSchedule.maxCycles) {
      const stopped = stopSchedule(agentName, "max_cycles_reached");
      recordTelemetry({
        type: "scheduler:tick",
        status: "ok",
        durationMs: Date.now() - startedAt,
        meta: { agentName, cycleCount: refreshedSchedule.cycleCount, reason: "stopped_at_max_cycles" },
      });
      return {
        ok: true,
        message: `Scheduled tick executed and schedule for "${agentName}" stopped at max cycles.`,
        result,
        schedule: stopped
      };
    }

    recordTelemetry({
      type: "scheduler:tick",
      status: "ok",
      durationMs: Date.now() - startedAt,
      meta: { agentName, cycleCount: refreshedSchedule.cycleCount },
    });
    return {
      ok: true,
      message: `Scheduled tick executed for "${agentName}".`,
      result,
      schedule: refreshedSchedule
    };
  } catch (error) {
    const refreshedState = loadSchedulerState();
    const refreshedSchedule = refreshedState.schedules[agentName] || schedule;

    refreshedSchedule.lastError = error.message;
    refreshedSchedule.updatedAt = new Date().toISOString();
    refreshedState.schedules[agentName] = refreshedSchedule;
    saveSchedulerState(refreshedState);

    logSchedulerEvent(agentName, {
      event: "schedule_error",
      error: error.message
    });
    recordTelemetry({
      type: "scheduler:tick",
      status: "error",
      durationMs: Date.now() - startedAt,
      meta: { agentName, reason: "exception", error: error.message },
    });

    return {
      ok: false,
      message: `Scheduled tick failed for "${agentName}": ${error.message}`,
      schedule: refreshedSchedule
    };
  }
}

function attachInterval(agentName) {
  clearTimer(agentName);

  const schedule = getSchedule(agentName);
  if (!schedule || !schedule.enabled) {
    return null;
  }

  const timer = setInterval(async () => {
    const latest = getSchedule(agentName);

    if (!latest || !latest.enabled) {
      clearTimer(agentName);
      return;
    }

    await runScheduledTick(agentName);

    const afterRun = getSchedule(agentName);
    if (!afterRun || !afterRun.enabled) {
      clearTimer(agentName);
    }
  }, schedule.intervalSeconds * 1000);

  activeTimers.set(agentName, timer);
  return timer;
}

function startSchedule(agentName, intervalSeconds = 5, maxCycles = 5) {
  const startedAt = Date.now();
  const schedule = setSchedule(agentName, {
    enabled: true,
    intervalSeconds,
    maxCycles,
    cycleCount: 0,
    stopReason: null,
    lastError: null
  });

  attachInterval(agentName);

  logSchedulerEvent(agentName, {
    event: "schedule_started",
    intervalSeconds: schedule.intervalSeconds,
    maxCycles: schedule.maxCycles
  });
  recordTelemetry({
    type: "scheduler:start",
    status: "ok",
    durationMs: Date.now() - startedAt,
    meta: {
      agentName,
      intervalSeconds: schedule.intervalSeconds,
      maxCycles: schedule.maxCycles,
    },
  });

  return schedule;
}

module.exports = {
  loadSchedulerState,
  saveSchedulerState,
  listSchedules,
  getSchedule,
  setSchedule,
  startSchedule,
  stopSchedule,
  runScheduledTick
};
