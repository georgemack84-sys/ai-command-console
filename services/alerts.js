const fs = require("fs");
const path = require("path");
const { listTasks } = require("./taskQueue");
const { listReviewItems } = require("./reviewQueue");
const { listSchedules } = require("./scheduler");
const { getWatcherStatus } = require("./watcher");
const { listAgentProfiles } = require("./agentRuntime");
const { loadAgentState } = require("./agentMemory");
const { loadDocument, saveDocument } = require("./stateDatabase");
const { getThrottleMs, shouldNotify, sendAlertNotification } = require("./alertNotifications");
const { getAgentsDataPath } = require("./runtimePaths");

const ALERTS_PATH = getAgentsDataPath("alerts.json");
const AGENT_LOG_DIR = path.join(process.cwd(), "logs", "agents");
const ALERTS_KEY = "alerts";

function ensureAlertsDir() {
  fs.mkdirSync(path.dirname(ALERTS_PATH), { recursive: true });
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function defaultAlertsState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thresholds: {
      queuedTasksHigh: 6,
      pendingReviewsHigh: 4,
      inactiveAgentsHigh: 2
    },
    lastRunAt: null,
    lastResult: null,
    alerts: []
  };
}

function loadAlertsState() {
  ensureAlertsDir();

  try {
    const parsed = loadDocument(ALERTS_KEY, defaultAlertsState, { legacyPath: ALERTS_PATH });
    parsed.thresholds =
      parsed.thresholds && typeof parsed.thresholds === "object"
        ? parsed.thresholds
        : defaultAlertsState().thresholds;
    parsed.alerts = Array.isArray(parsed.alerts) ? parsed.alerts : [];
    return parsed;
  } catch (error) {
    return {
      createdAt: null,
      updatedAt: new Date().toISOString(),
      thresholds: defaultAlertsState().thresholds,
      lastRunAt: null,
      lastResult: {
        ok: false,
        error: `Failed to parse alerts file: ${error.message}`
      },
      alerts: []
    };
  }
}

function saveAlertsState(state) {
  ensureAlertsDir();
  return saveDocument(
    ALERTS_KEY,
    {
      createdAt: state.createdAt || new Date().toISOString(),
      thresholds:
        state.thresholds && typeof state.thresholds === "object"
          ? state.thresholds
          : defaultAlertsState().thresholds,
      lastRunAt: state.lastRunAt || null,
      lastResult: state.lastResult || null,
      alerts: Array.isArray(state.alerts) ? state.alerts : [],
    },
    { legacyPath: ALERTS_PATH }
  );
}

function logAlertEvent(payload) {
  ensureAlertsDir();
  const logPath = path.join(AGENT_LOG_DIR, "manager.log");
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    alertEvent: true,
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function defaultAlertWorkflow() {
  return {
    acknowledged: false,
    acknowledgedAt: null,
    owner: null,
    resolved: false,
    resolvedAt: null,
    resolutionNote: null,
    notes: [],
    externalNotification: {
      lastSentAt: null,
      lastStatus: null,
      lastError: null,
    }
  };
}

function makeAlert(type, severity, title, details = {}) {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    severity,
    status: "active",
    title,
    details,
    workflow: defaultAlertWorkflow(),
    createdAt: new Date().toISOString(),
    clearedAt: null
  };
}

function detectQueuePressure(thresholds) {
  const tasks = listTasks();
  const queuedTasks = tasks.filter((task) => task.status === "queued").length;

  if (queuedTasks >= Number(thresholds.queuedTasksHigh || 6)) {
    return makeAlert(
      "queue_pressure",
      queuedTasks >= Number(thresholds.queuedTasksHigh || 6) + 3 ? "high" : "moderate",
      "Queued task pressure is elevated.",
      { queuedTasks }
    );
  }

  return null;
}

function detectReviewBacklog(thresholds) {
  const reviews = listReviewItems();
  const pendingReviews = reviews.filter((item) => item.status === "pending").length;

  if (pendingReviews >= Number(thresholds.pendingReviewsHigh || 4)) {
    return makeAlert(
      "review_backlog",
      pendingReviews >= Number(thresholds.pendingReviewsHigh || 4) + 2 ? "high" : "moderate",
      "Pending manager review backlog is elevated.",
      { pendingReviews }
    );
  }

  return null;
}

function detectInactiveAgents(thresholds) {
  const agents = listAgentProfiles();
  const inactive = [];

  for (const agent of agents) {
    const state = loadAgentState(agent.name);
    if (!state || !state.active) {
      inactive.push(agent.name);
    }
  }

  if (inactive.length >= Number(thresholds.inactiveAgentsHigh || 2)) {
    return makeAlert(
      "inactive_agents",
      inactive.length >= Number(thresholds.inactiveAgentsHigh || 2) + 1 ? "high" : "moderate",
      "Multiple agents are currently inactive.",
      { inactiveAgents: inactive }
    );
  }

  return null;
}

function detectSchedulerAnomalies() {
  const schedules = listSchedules();
  const anomalous = schedules.filter((schedule) => {
    return (
      schedule.enabled &&
      Number(schedule.maxCycles || 0) > 0 &&
      Number(schedule.cycleCount || 0) >= Number(schedule.maxCycles || 0)
    );
  });

  if (anomalous.length) {
    return makeAlert(
      "scheduler_anomaly",
      "moderate",
      "One or more enabled schedules appear to be at or beyond max cycles.",
      {
        schedules: anomalous.map((item) => ({
          agentName: item.agentName,
          cycleCount: item.cycleCount,
          maxCycles: item.maxCycles
        }))
      }
    );
  }

  return null;
}

function detectWatcherStopped() {
  const watcher = getWatcherStatus();

  if (watcher && watcher.enabled === false) {
    return makeAlert(
      "watcher_stopped",
      "low",
      "Watcher is currently stopped.",
      {
        watcherEnabled: watcher.enabled,
        lastRunAt: watcher.lastRunAt || null
      }
    );
  }

  return null;
}

function preserveWorkflow(existingAlerts, newAlert) {
  const prior = existingAlerts.find((item) => item.type === newAlert.type);

  if (!prior) {
    return newAlert;
  }

  return {
    ...newAlert,
    id: prior.id,
    createdAt: prior.createdAt || newAlert.createdAt,
    workflow: prior.workflow || defaultAlertWorkflow(),
    status: prior.workflow?.resolved ? "resolved" : prior.status || "active",
    clearedAt: prior.clearedAt || null
  };
}

function upsertAlert(type, severity, title, details = {}) {
  const state = loadAlertsState();
  const existing = state.alerts.find((alert) => alert.type === type);

  const nextAlert = preserveWorkflow(
    state.alerts,
    makeAlert(type, severity, title, details)
  );

  nextAlert.status = "active";
  nextAlert.clearedAt = null;
  nextAlert.workflow = {
    ...defaultAlertWorkflow(),
    ...(nextAlert.workflow || {}),
    resolved: false,
    resolvedAt: null,
    resolutionNote: null,
  };

  if (existing) {
    state.alerts = state.alerts.map((alert) => (alert.type === type ? nextAlert : alert));
  } else {
    state.alerts.unshift(nextAlert);
  }

  state.lastRunAt = new Date().toISOString();
  state.lastResult = {
    ok: true,
    message: `Alert ${type} updated.`,
  };
  saveAlertsState(state);

  logAlertEvent({
    event: "alert_upserted",
    alertType: type,
    severity,
    title,
  });

  void maybeNotifyAlert(nextAlert, existing);

  return nextAlert;
}

async function maybeNotifyAlert(alert, previousAlert = null) {
  if (!shouldNotify(alert)) {
    return null;
  }

  const previousNotification = previousAlert?.workflow?.externalNotification || null;
  const lastSentAt = previousNotification?.lastSentAt ? Date.parse(previousNotification.lastSentAt) : 0;
  const throttleMs = getThrottleMs();
  const now = Date.now();

  if (lastSentAt && now - lastSentAt < throttleMs) {
    return null;
  }

  try {
    const result = await sendAlertNotification(alert);
    updateAlert(alert.id, (current) => ({
      ...current,
      workflow: {
        ...(current.workflow || defaultAlertWorkflow()),
        externalNotification: {
          lastSentAt: new Date().toISOString(),
          lastStatus: result?.status || "sent",
          lastError: null,
        },
      },
    }));
    logAlertEvent({
      event: "alert_notification_sent",
      alertId: alert.id,
      alertType: alert.type,
      severity: alert.severity,
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    updateAlert(alert.id, (current) => ({
      ...current,
      workflow: {
        ...(current.workflow || defaultAlertWorkflow()),
        externalNotification: {
          lastSentAt: current.workflow?.externalNotification?.lastSentAt || null,
          lastStatus: "failed",
          lastError: message,
        },
      },
    }));
    logAlertEvent({
      event: "alert_notification_failed",
      alertId: alert.id,
      alertType: alert.type,
      severity: alert.severity,
      error: message,
    });
    return null;
  }
}

function resolveAlertByType(type, resolutionNote = "Alert condition recovered automatically.") {
  const state = loadAlertsState();
  const existing = state.alerts.find((alert) => alert.type === type);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    status: "resolved",
    clearedAt: new Date().toISOString(),
    workflow: {
      ...(existing.workflow || defaultAlertWorkflow()),
      resolved: true,
      resolvedAt: new Date().toISOString(),
      resolutionNote,
      notes: [
        ...((existing.workflow && Array.isArray(existing.workflow.notes)) ? existing.workflow.notes : []),
        {
          timestamp: new Date().toISOString(),
          note: `Auto-resolution recorded: ${resolutionNote}`,
        },
      ],
    },
  };

  state.alerts = state.alerts.map((alert) => (alert.type === type ? updated : alert));
  saveAlertsState(state);

  logAlertEvent({
    event: "alert_auto_resolved",
    alertType: type,
    resolutionNote,
  });

  return updated;
}

function runAlertChecks() {
  const state = loadAlertsState();
  const thresholds = state.thresholds || defaultAlertsState().thresholds;

  const candidates = [
    detectQueuePressure(thresholds),
    detectReviewBacklog(thresholds),
    detectInactiveAgents(thresholds),
    detectSchedulerAnomalies(),
    detectWatcherStopped()
  ].filter(Boolean);

  const merged = candidates.map((candidate) => preserveWorkflow(state.alerts, candidate));

  state.alerts = merged;
  state.lastRunAt = new Date().toISOString();
  state.lastResult = {
    ok: true,
    activeAlertCount: merged.filter((item) => item.status === "active").length,
    alertTypes: merged.map((item) => item.type)
  };

  saveAlertsState(state);

  logAlertEvent({
    event: "alerts_run_completed",
    activeAlertCount: merged.filter((item) => item.status === "active").length,
    alertTypes: merged.map((item) => item.type)
  });

  return {
    ok: true,
    message: "Operational alert checks completed.",
    state
  };
}

function listAlerts() {
  return loadAlertsState().alerts;
}

function listActiveAlerts() {
  return loadAlertsState().alerts.filter((alert) => alert.status === "active");
}

function listOpenAlerts() {
  return loadAlertsState().alerts.filter(
    (alert) => alert.status === "active" && !(alert.workflow && alert.workflow.resolved)
  );
}

function getAlertById(alertId) {
  return loadAlertsState().alerts.find((alert) => alert.id === alertId) || null;
}

function updateAlert(alertId, updater) {
  const state = loadAlertsState();
  const index = state.alerts.findIndex((alert) => alert.id === alertId);

  if (index === -1) {
    return null;
  }

  const current = state.alerts[index];
  const normalizedCurrent = {
    ...current,
    workflow: current.workflow || defaultAlertWorkflow()
  };

  const updated = typeof updater === "function" ? updater(normalizedCurrent) : normalizedCurrent;
  state.alerts[index] = updated;
  saveAlertsState(state);
  return state.alerts[index];
}

function acknowledgeAlert(alertId, owner = null) {
  const alert = updateAlert(alertId, (current) => {
    const next = { ...current };
    next.workflow = next.workflow || defaultAlertWorkflow();
    next.workflow.acknowledged = true;
    next.workflow.acknowledgedAt = new Date().toISOString();
    next.workflow.owner = owner || next.workflow.owner || "manager";
    next.workflow.notes = Array.isArray(next.workflow.notes) ? next.workflow.notes : [];
    next.workflow.notes.push({
      timestamp: new Date().toISOString(),
      note: `Alert acknowledged by ${next.workflow.owner}.`
    });
    return next;
  });

  if (!alert) {
    return {
      ok: false,
      message: `Alert not found: ${alertId}`
    };
  }

  logAlertEvent({
    event: "alert_acknowledged",
    alertId,
    owner: alert.workflow?.owner || owner || "manager"
  });

  return {
    ok: true,
    message: `Alert "${alertId}" acknowledged.`,
    alert
  };
}

function addAlertNote(alertId, note) {
  const cleanNote = String(note || "").trim();

  if (!cleanNote) {
    return {
      ok: false,
      message: "Alert note cannot be empty."
    };
  }

  const alert = updateAlert(alertId, (current) => {
    const next = { ...current };
    next.workflow = next.workflow || defaultAlertWorkflow();
    next.workflow.notes = Array.isArray(next.workflow.notes) ? next.workflow.notes : [];
    next.workflow.notes.push({
      timestamp: new Date().toISOString(),
      note: cleanNote
    });
    return next;
  });

  if (!alert) {
    return {
      ok: false,
      message: `Alert not found: ${alertId}`
    };
  }

  logAlertEvent({
    event: "alert_note_added",
    alertId,
    note: cleanNote
  });

  return {
    ok: true,
    message: `Note added to alert "${alertId}".`,
    alert
  };
}

function resolveAlert(alertId, resolutionNote = "") {
  const cleanNote = String(resolutionNote || "").trim() || "Alert resolved manually.";

  const alert = updateAlert(alertId, (current) => {
    const next = { ...current };
    next.status = "resolved";
    next.clearedAt = new Date().toISOString();
    next.workflow = next.workflow || defaultAlertWorkflow();
    next.workflow.resolved = true;
    next.workflow.resolvedAt = new Date().toISOString();
    next.workflow.resolutionNote = cleanNote;
    next.workflow.notes = Array.isArray(next.workflow.notes) ? next.workflow.notes : [];
    next.workflow.notes.push({
      timestamp: new Date().toISOString(),
      note: `Resolution recorded: ${cleanNote}`
    });
    return next;
  });

  if (!alert) {
    return {
      ok: false,
      message: `Alert not found: ${alertId}`
    };
  }

  logAlertEvent({
    event: "alert_resolved",
    alertId,
    resolutionNote: cleanNote
  });

  return {
    ok: true,
    message: `Alert "${alertId}" resolved.`,
    alert
  };
}

function clearAlerts() {
  const state = loadAlertsState();
  state.alerts = state.alerts.map((alert) => ({
    ...alert,
    status: "cleared",
    clearedAt: new Date().toISOString(),
    workflow: {
      ...(alert.workflow || defaultAlertWorkflow())
    }
  }));
  state.lastResult = {
    ok: true,
    message: "All alerts cleared."
  };

  saveAlertsState(state);

  logAlertEvent({
    event: "alerts_cleared",
    clearedCount: state.alerts.length
  });

  return state;
}

function updateAlertThresholds(updates = {}) {
  const state = loadAlertsState();
  state.thresholds = {
    ...state.thresholds,
    ...(Number.isFinite(Number(updates.queuedTasksHigh)) ? { queuedTasksHigh: Number(updates.queuedTasksHigh) } : {}),
    ...(Number.isFinite(Number(updates.pendingReviewsHigh)) ? { pendingReviewsHigh: Number(updates.pendingReviewsHigh) } : {}),
    ...(Number.isFinite(Number(updates.inactiveAgentsHigh)) ? { inactiveAgentsHigh: Number(updates.inactiveAgentsHigh) } : {}),
  };
  saveAlertsState(state);
  return state.thresholds;
}

module.exports = {
  loadAlertsState,
  saveAlertsState,
  runAlertChecks,
  upsertAlert,
  resolveAlertByType,
  listAlerts,
  listActiveAlerts,
  listOpenAlerts,
  getAlertById,
  acknowledgeAlert,
  addAlertNote,
  resolveAlert,
  clearAlerts,
  updateAlertThresholds
};
